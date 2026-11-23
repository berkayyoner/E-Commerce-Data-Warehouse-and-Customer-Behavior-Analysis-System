package edu.yildiz.ecommerce.segmentation.model;

/** One cell of the recency by frequency heat map. Only score combinations that have customers are returned. */
public record RfmGridCell(int recencyScore, int frequencyScore, long customers, double averageMonetary) {
}
