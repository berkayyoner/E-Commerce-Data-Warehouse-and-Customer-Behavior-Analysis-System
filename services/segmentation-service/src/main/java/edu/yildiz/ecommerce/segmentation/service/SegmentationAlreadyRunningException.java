package edu.yildiz.ecommerce.segmentation.service;

public class SegmentationAlreadyRunningException extends RuntimeException {

    public SegmentationAlreadyRunningException() {
        super("A segmentation run is already in progress");
    }
}
