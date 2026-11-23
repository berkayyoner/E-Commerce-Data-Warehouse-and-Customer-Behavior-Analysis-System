package edu.yildiz.ecommerce.analytics.model;

/** Period size of the sales trend. Only these values ever reach the SQL text. */
public enum Granularity {
    DAY, WEEK, MONTH, YEAR;

    /** Reads a request value; the match ignores case and surrounding spaces. */
    public static Granularity parse(String value) {
        if (value != null) {
            String wanted = value.trim();
            for (Granularity granularity : values()) {
                if (granularity.name().equalsIgnoreCase(wanted)) {
                    return granularity;
                }
            }
        }
        throw new IllegalArgumentException("granularity must be one of day, week, month or year");
    }
}
