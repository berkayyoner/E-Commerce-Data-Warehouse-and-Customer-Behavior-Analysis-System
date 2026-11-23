package edu.yildiz.ecommerce.segmentation.model;

/** One customer of the segment table, joined to the current customer dimension row and the cluster label. */
public record CustomerRow(
        String customerId,
        String name,
        String region,
        long recencyDays,
        long frequency,
        double monetary,
        int rScore,
        int fScore,
        int mScore,
        String segment,
        Integer clusterId,
        String clusterLabel) {
}
