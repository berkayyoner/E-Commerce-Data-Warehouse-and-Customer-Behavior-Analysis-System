package edu.yildiz.ecommerce.analytics.config;

import java.util.regex.Pattern;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Settings of the analytics queries.
 *
 * @param oltpSchema name of the Oracle schema that holds the OLTP (TPC-C) tables, used by the benchmark
 */
@ConfigurationProperties(prefix = "analytics")
public record AnalyticsProperties(String oltpSchema) {

    private static final Pattern IDENTIFIER = Pattern.compile("[A-Za-z][A-Za-z0-9_]{0,29}");

    public AnalyticsProperties {
        if (oltpSchema == null || !IDENTIFIER.matcher(oltpSchema).matches()) {
            throw new IllegalArgumentException("analytics.oltp-schema must be a plain Oracle identifier");
        }
    }
}
