package edu.yildiz.ecommerce.segmentation.model;

/** Sum of squared distances of the customers to their centroids when the data is split into k clusters. */
public record ElbowPoint(int k, double inertia) {
}
