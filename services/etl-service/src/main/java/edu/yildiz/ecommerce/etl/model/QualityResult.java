package edu.yildiz.ecommerce.etl.model;

public record QualityResult(String checkName, boolean passed, String detail) {
}
