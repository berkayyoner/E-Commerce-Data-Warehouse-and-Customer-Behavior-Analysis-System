package edu.yildiz.ecommerce.segmentation.service;

public class SegmentationRunNotFoundException extends RuntimeException {

    public SegmentationRunNotFoundException(long runId) {
        super("Segmentation run " + runId + " does not exist");
    }
}
