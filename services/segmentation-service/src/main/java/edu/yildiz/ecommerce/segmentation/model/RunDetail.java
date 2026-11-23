package edu.yildiz.ecommerce.segmentation.model;

import java.util.List;

/** A run with the inertia of every tried k and the clusters it produced. */
public record RunDetail(SegmentationRun run, List<ElbowPoint> elbow, List<ClusterProfile> clusters) {
}
