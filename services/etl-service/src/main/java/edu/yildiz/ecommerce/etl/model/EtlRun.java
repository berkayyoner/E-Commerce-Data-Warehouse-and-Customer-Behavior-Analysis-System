package edu.yildiz.ecommerce.etl.model;

import java.time.Instant;

public record EtlRun(
        long id,
        RunType runType,
        RunStatus status,
        Instant startedAt,
        Instant finishedAt,
        long rowsRead,
        long rowsLoaded,
        long rowsRejected,
        String errorMessage) {
}
