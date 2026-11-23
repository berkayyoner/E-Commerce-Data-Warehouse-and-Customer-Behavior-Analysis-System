package edu.yildiz.ecommerce.etl.service;

public class EtlAlreadyRunningException extends RuntimeException {

    public EtlAlreadyRunningException() {
        super("An ETL run is already in progress");
    }
}
