package edu.yildiz.ecommerce.etl.model;

/** Row totals of a finished ETL run. */
public record EtlOutcome(long rowsRead, long rowsLoaded, long rowsRejected) {
}
