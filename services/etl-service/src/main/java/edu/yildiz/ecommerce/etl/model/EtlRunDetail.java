package edu.yildiz.ecommerce.etl.model;

import java.util.List;

public record EtlRunDetail(EtlRun run, List<EtlStepResult> steps, List<QualityResult> qualityChecks) {
}
