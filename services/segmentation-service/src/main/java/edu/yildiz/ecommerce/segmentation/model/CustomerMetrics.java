package edu.yildiz.ecommerce.segmentation.model;

/** The raw RFM measures of one customer, in their original units. */
public record CustomerMetrics(CustomerKey key, double recencyDays, double frequency, double monetary) {
}
