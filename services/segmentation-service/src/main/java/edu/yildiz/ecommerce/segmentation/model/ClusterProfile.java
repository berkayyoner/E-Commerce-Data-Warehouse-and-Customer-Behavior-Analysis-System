package edu.yildiz.ecommerce.segmentation.model;

/** Averages of one K-Means cluster in the original units of the customer measures. */
public record ClusterProfile(
        int clusterId,
        String label,
        long customers,
        double averageRecencyDays,
        double averageFrequency,
        double averageMonetary) {
}
