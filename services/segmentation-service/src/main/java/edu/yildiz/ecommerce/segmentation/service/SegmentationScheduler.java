package edu.yildiz.ecommerce.segmentation.service;

import java.util.Optional;

import edu.yildiz.ecommerce.segmentation.repository.SegmentationRunRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Starts a nightly run when the ETL service has loaded data that the latest segmentation run did not see. */
@Component
public class SegmentationScheduler {

    private static final Logger log = LoggerFactory.getLogger(SegmentationScheduler.class);

    private final SegmentationRunRepository runs;
    private final SegmentationRunService service;

    public SegmentationScheduler(SegmentationRunRepository runs, SegmentationRunService service) {
        this.runs = runs;
        this.service = service;
    }

    @Scheduled(cron = "${segmentation.schedule-cron:0 30 3 * * *}")
    public void runWhenEtlHasNewData() {
        if (!hasNewEtlData()) {
            return;
        }
        try {
            service.start();
            log.info("Started a scheduled segmentation run");
        } catch (SegmentationAlreadyRunningException e) {
            log.info("Skipped the scheduled segmentation run because another run is active");
        }
    }

    /**
     * True when the newest successful ETL run is newer than the ETL run of the newest successful segmentation run,
     * or when no segmentation run has succeeded yet. False when the ETL service has not loaded anything.
     */
    boolean hasNewEtlData() {
        Optional<Long> latestEtlRun = runs.findLatestSuccessfulEtlRunId();
        if (latestEtlRun.isEmpty()) {
            return false;
        }
        Optional<Long> segmentedEtlRun = runs.findLatestSuccessfulSegmentationEtlRunId();
        return segmentedEtlRun.isEmpty() || latestEtlRun.get() > segmentedEtlRun.get();
    }
}
