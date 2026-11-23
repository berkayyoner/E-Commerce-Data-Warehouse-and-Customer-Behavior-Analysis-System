package edu.yildiz.ecommerce.etl.model;

public enum RunType {
    /** Rebuilds both fact tables from scratch. */
    FULL,
    /** Loads only the orders that are newer than the last loaded order. */
    INCREMENTAL
}
