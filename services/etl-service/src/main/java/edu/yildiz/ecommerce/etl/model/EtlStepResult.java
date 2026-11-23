package edu.yildiz.ecommerce.etl.model;

public record EtlStepResult(String stepName, long rowsRead, long rowsLoaded, long durationMs) {
}
