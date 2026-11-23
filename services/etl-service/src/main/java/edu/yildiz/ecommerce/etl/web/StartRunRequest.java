package edu.yildiz.ecommerce.etl.web;

import edu.yildiz.ecommerce.etl.model.RunType;
import jakarta.validation.constraints.NotNull;

public record StartRunRequest(@NotNull RunType runType) {
}
