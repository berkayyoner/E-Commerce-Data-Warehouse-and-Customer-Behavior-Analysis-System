package edu.yildiz.ecommerce.segmentation.model;

/** One RFM segment with its size and value. Share is between 0 and 1 with four decimals. */
public record SegmentSummary(
        String segment,
        long customers,
        double share,
        double averageRecencyDays,
        double averageFrequency,
        double averageMonetary,
        double totalRevenue) {
}
