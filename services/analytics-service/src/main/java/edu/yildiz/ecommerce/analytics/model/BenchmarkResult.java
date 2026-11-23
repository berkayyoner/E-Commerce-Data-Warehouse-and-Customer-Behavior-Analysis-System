package edu.yildiz.ecommerce.analytics.model;

import java.math.BigDecimal;

/**
 * Result of one query of the benchmark.
 *
 * @param milliseconds average time of three runs after a warm-up run, including the full fetch of the rows
 * @param speedupVsOltp how many times faster this query is than the same question on the OLTP schema
 */
public record BenchmarkResult(String name, long rows, BigDecimal milliseconds, BigDecimal speedupVsOltp) {
}
