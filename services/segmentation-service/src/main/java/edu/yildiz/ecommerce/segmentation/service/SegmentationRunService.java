package edu.yildiz.ecommerce.segmentation.service;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.Executor;
import java.util.concurrent.RejectedExecutionException;

import edu.yildiz.ecommerce.segmentation.job.SegmentationJob;
import edu.yildiz.ecommerce.segmentation.model.PageResult;
import edu.yildiz.ecommerce.segmentation.model.RunDetail;
import edu.yildiz.ecommerce.segmentation.model.RunStatus;
import edu.yildiz.ecommerce.segmentation.model.SegmentationRun;
import edu.yildiz.ecommerce.segmentation.repository.SegmentationRunRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

/** Starts segmentation runs in the background and reports on them. Only one run can be active at a time. */
@Service
public class SegmentationRunService {

    private static final Logger log = LoggerFactory.getLogger(SegmentationRunService.class);
    private static final int MAX_PAGE_SIZE = 100;
    static final String NO_ETL_RUN_MESSAGE = "No successful ETL run yet";
    static final String NO_ORDERS_MESSAGE = "The warehouse holds no orders";

    private final SegmentationRunRepository runs;
    private final SegmentationJob job;
    private final Executor executor;
    private final Clock clock;

    public SegmentationRunService(SegmentationRunRepository runs, SegmentationJob job,
                                  @Qualifier("segmentationExecutor") Executor executor, Clock clock) {
        this.runs = runs;
        this.job = job;
        this.executor = executor;
        this.clock = clock;
    }

    /**
     * Registers a run on the newest successful ETL data and hands it to the background worker. When the warehouse
     * cannot be segmented (no ETL run yet, or no orders) the run is registered as failed right away.
     */
    public synchronized SegmentationRun start() {
        if (runs.hasRunningRun()) {
            throw new SegmentationAlreadyRunningException();
        }
        Optional<Long> etlRunId = runs.findLatestSuccessfulEtlRunId();
        if (etlRunId.isEmpty()) {
            return registerRejected(0L, NO_ETL_RUN_MESSAGE);
        }
        Optional<LocalDate> lastOrder = runs.findLastOrderDate();
        if (lastOrder.isEmpty()) {
            return registerRejected(etlRunId.get(), NO_ORDERS_MESSAGE);
        }

        LocalDate asOfDate = lastOrder.get().plusDays(1);
        long runId = runs.create(etlRunId.get(), asOfDate);
        try {
            executor.execute(() -> runJob(runId, asOfDate));
        } catch (RejectedExecutionException e) {
            runs.finish(runId, RunStatus.FAILED, null, null, "The segmentation worker is busy");
            throw new SegmentationAlreadyRunningException();
        }
        return find(runId);
    }

    public PageResult<SegmentationRun> list(int page, int size) {
        if (page < 0) {
            throw new IllegalArgumentException("page must not be negative");
        }
        if (size < 1 || size > MAX_PAGE_SIZE) {
            throw new IllegalArgumentException("size must be between 1 and " + MAX_PAGE_SIZE);
        }
        List<SegmentationRun> content = runs.findPage(page, size);
        return new PageResult<>(content, runs.count(), page, size);
    }

    public RunDetail get(long runId) {
        SegmentationRun run = find(runId);
        return new RunDetail(run, runs.findElbow(runId), runs.findClusters(runId));
    }

    private SegmentationRun registerRejected(long etlRunId, String message) {
        long runId = runs.create(etlRunId, LocalDate.now(clock));
        runs.finish(runId, RunStatus.FAILED, null, null, message);
        return find(runId);
    }

    private SegmentationRun find(long runId) {
        return runs.find(runId).orElseThrow(() -> new SegmentationRunNotFoundException(runId));
    }

    private void runJob(long runId, LocalDate asOfDate) {
        try {
            SegmentationJob.Outcome outcome = job.execute(runId, asOfDate);
            runs.finish(runId, RunStatus.SUCCESS, outcome.customersScored(), outcome.chosenK(), null);
        } catch (RuntimeException e) {
            log.error("Segmentation run {} failed", runId, e);
            String message = e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage();
            runs.finish(runId, RunStatus.FAILED, null, null, message);
        }
    }
}
