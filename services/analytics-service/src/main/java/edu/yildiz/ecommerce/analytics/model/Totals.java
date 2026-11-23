package edu.yildiz.ecommerce.analytics.model;

import java.math.BigDecimal;

/** Raw totals read by the repository; the service turns them into the reports. */
public final class Totals {

    private Totals() {
    }

    public record SalesTotals(BigDecimal revenue, long units) {
    }

    public record OrderTotals(long orders, long customers, long delivered) {
    }

    public record CustomerTotals(long customers, long repeatCustomers, long orders, BigDecimal revenue) {
    }
}
