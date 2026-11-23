package edu.yildiz.ecommerce.analytics.model;

import java.time.LocalDate;

/**
 * Optional, inclusive date filter on {@code dim_date.full_date}. A missing bound leaves that side open.
 */
public record DateRange(LocalDate from, LocalDate to) {

    public DateRange {
        if (from != null && to != null && from.isAfter(to)) {
            throw new IllegalArgumentException("from must not be after to");
        }
    }

    public static DateRange of(LocalDate from, LocalDate to) {
        return new DateRange(from, to);
    }

    public static DateRange unbounded() {
        return new DateRange(null, null);
    }

    public boolean isUnbounded() {
        return from == null && to == null;
    }

    /** The part of a cache key that describes the filter. */
    public String cacheKey() {
        return "from=" + (from == null ? "" : from) + ";to=" + (to == null ? "" : to);
    }
}
