package edu.yildiz.ecommerce.analytics.model;

/** The measure that ranks the product report. */
public enum ProductMeasure {
    REVENUE, UNITS;

    /** Reads a request value; the match ignores case and surrounding spaces. */
    public static ProductMeasure parse(String value) {
        if (value != null) {
            String wanted = value.trim();
            for (ProductMeasure measure : values()) {
                if (measure.name().equalsIgnoreCase(wanted)) {
                    return measure;
                }
            }
        }
        throw new IllegalArgumentException("by must be revenue or units");
    }
}
