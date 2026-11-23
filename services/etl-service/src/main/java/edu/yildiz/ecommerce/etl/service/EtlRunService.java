package edu.yildiz.ecommerce.etl.service;

import java.util.List;
import java.util.concurrent.Executor;
import java.util.concurrent.RejectedExecutionException;

import edu.yildiz.ecommerce.etl.job.EtlJob;
import edu.yildiz.ecommerce.etl.model.EtlOutcome;
import edu.yildiz.ecommerce.etl.model.EtlRun;
import edu.yildiz.ecommerce.etl.model.EtlRunDetail;
import edu.yildiz.ecommerce.etl.model.PageResult;
import edu.yildiz.ecommerce.etl.model.RunStatus;
import edu.yildiz.ecommerce.etl.model.RunType;
import edu.yildiz.ecommerce.etl.repository.EtlRunRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

/** Starts ETL runs in the background and reports on them. Only one run can be active at a time. */
@Service
public class EtlRunService {

    private static final Logger log = LoggerFactory.getLogger(EtlRunService.class);
    private static final int MAX_PAGE_SIZE = 100;

    private final EtlRunRepository runs;
    private final EtlJob job;
    private final Executor executor;

    public EtlRunService(EtlRunRepository runs, EtlJob job, @Qualifier("etlExecutor") Executor executor) {
        this.runs = runs;
        this.job = job;
        this.executor = executor;
    }

    /** Registers a run and hands it to the background worker. */
    public synchronized EtlRun start(RunType runType) {
        if (runs.hasRunningRun()) {
            throw new EtlAlreadyRunningException();
        }
        long runId = runs.create(runType);
        try {
            executor.execute(() -> runJob(runId, runType));
        } catch (RejectedExecutionException e) {
            runs.finish(runId, RunStatus.FAILED, 0, 0, 0, "The ETL worker is busy");
            throw new EtlAlreadyRunningException();
        }
        return runs.find(runId).orElseThrow(() -> new EtlRunNotFoundException(runId));
    }

    public PageResult<EtlRun> list(int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        List<EtlRun> content = runs.findPage(safePage, safeSize);
        return new PageResult<>(content, runs.count(), safePage, safeSize);
    }

    public EtlRunDetail get(long runId) {
        EtlRun run = runs.find(runId).orElseThrow(() -> new EtlRunNotFoundException(runId));
        return new EtlRunDetail(run, runs.findSteps(runId), runs.findQualityResults(runId));
    }

    private void runJob(long runId, RunType runType) {
        try {
            EtlOutcome outcome = job.execute(runId, runType);
            runs.finish(runId, RunStatus.SUCCESS, outcome.rowsRead(), outcome.rowsLoaded(), outcome.rowsRejected(), null);
        } catch (RuntimeException e) {
            log.error("ETL run {} failed", runId, e);
            runs.finish(runId, RunStatus.FAILED, 0, 0, 0, e.getMessage());
        }
    }
}
