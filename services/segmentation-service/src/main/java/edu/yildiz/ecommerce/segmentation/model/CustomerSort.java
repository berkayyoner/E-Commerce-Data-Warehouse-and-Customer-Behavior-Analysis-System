package edu.yildiz.ecommerce.segmentation.model;

import java.util.Arrays;

/** The columns the customer table can be sorted by. The SQL expression is fixed here, never taken from a request. */
public enum CustomerSort {

    NAME("name", "dc.last_name || ' ' || dc.first_name"),
    REGION("region", "dc.region"),
    RECENCY_DAYS("recencyDays", "cs.recency_days"),
    FREQUENCY("frequency", "cs.frequency"),
    MONETARY("monetary", "cs.monetary"),
    SEGMENT("segment", "cs.rfm_segment"),
    CLUSTER_ID("clusterId", "cs.cluster_id");

    private final String parameter;
    private final String expression;

    CustomerSort(String parameter, String expression) {
        this.parameter = parameter;
        this.expression = expression;
    }

    public String expression() {
        return expression;
    }

    /** Reads the name used in the request, for example {@code recencyDays}. */
    public static CustomerSort fromParameter(String value) {
        return Arrays.stream(values())
                .filter(sort -> sort.parameter.equals(value))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown sort " + value));
    }
}
