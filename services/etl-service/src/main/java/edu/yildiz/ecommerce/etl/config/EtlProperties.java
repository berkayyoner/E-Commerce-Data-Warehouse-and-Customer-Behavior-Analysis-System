package edu.yildiz.ecommerce.etl.config;

import java.util.regex.Pattern;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Settings of the ETL job.
 *
 * @param oltpSchema name of the Oracle schema that holds the source (TPC-C) tables
 */
@ConfigurationProperties(prefix = "etl")
public record EtlProperties(String oltpSchema) {

    private static final Pattern IDENTIFIER = Pattern.compile("[A-Za-z][A-Za-z0-9_]{0,29}");

    public EtlProperties {
        if (oltpSchema == null || !IDENTIFIER.matcher(oltpSchema).matches()) {
            throw new IllegalArgumentException("etl.oltp-schema must be a plain Oracle identifier");
        }
    }
}
