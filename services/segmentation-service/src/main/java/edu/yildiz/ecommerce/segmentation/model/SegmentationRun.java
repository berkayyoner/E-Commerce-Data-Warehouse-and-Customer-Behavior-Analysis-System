package edu.yildiz.ecommerce.segmentation.model;

import java.time.Instant;
import java.time.LocalDate;

/**
 * One segmentation run.
 *
 * @param etlRunId        the successful ETL run whose warehouse content was segmented
 * @param asOfDate        the day after the newest order; recency is counted from it
 * @param customersScored number of customers that received RFM scores, null until the run succeeds
 * @param chosenK         number of K-Means clusters picked by the elbow rule, null until the run succeeds
 */
public record SegmentationRun(
        long id,
        RunStatus status,
        Instant startedAt,
        Instant finishedAt,
        long etlRunId,
        LocalDate asOfDate,
        Long customersScored,
        Integer chosenK,
        String errorMessage) {
}
