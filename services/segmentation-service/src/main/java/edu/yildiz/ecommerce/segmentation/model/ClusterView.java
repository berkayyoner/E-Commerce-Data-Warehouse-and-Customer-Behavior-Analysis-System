package edu.yildiz.ecommerce.segmentation.model;

/** A cluster as the dashboards show it, with its share of the scored customers (0 to 1, four decimals). */
public record ClusterView(
        int clusterId,
        String label,
        long customers,
        double share,
        double averageRecencyDays,
        double averageFrequency,
        double averageMonetary) {
}
