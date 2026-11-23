package edu.yildiz.ecommerce.segmentation.model;

import java.util.List;

/**
 * The clusters of the latest successful run.
 *
 * @param chosenK the number of clusters picked by the elbow rule, null when no run has succeeded yet
 */
public record ClusterOverview(List<ClusterView> clusters, List<ElbowPoint> elbow, Integer chosenK) {
}
