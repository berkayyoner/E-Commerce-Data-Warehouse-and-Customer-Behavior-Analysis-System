package edu.yildiz.ecommerce.etl.service;

public class EtlRunNotFoundException extends RuntimeException {

    public EtlRunNotFoundException(long runId) {
        super("ETL run " + runId + " does not exist");
    }
}
