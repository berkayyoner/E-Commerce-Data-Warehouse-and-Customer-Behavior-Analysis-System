package edu.yildiz.ecommerce.analytics.model;

import java.math.BigDecimal;
import java.util.List;

/** Answers of the sales and operations reports. Money is rounded to two decimals, shares to four. */
public final class SalesReports {

    private SalesReports() {
    }

    /**
     * @param averageOrderValue revenue divided by orders
     * @param deliveredShare    delivered orders divided by all orders (0 to 1)
     * @param averageDeliveryDays average of the delivery days of the order lines, null when none was delivered
     */
    public record Overview(BigDecimal revenue, long orders, long units, long customers,
                           BigDecimal averageOrderValue, BigDecimal deliveredShare,
                           BigDecimal averageDeliveryDays) {
    }

    /** One period of the trend. The period is a day, an ISO week, a month or a year, depending on the granularity. */
    public record TrendPoint(String period, BigDecimal revenue, long orders, long units) {
    }

    public record ProductSales(long productId, String name, String category, String brand, BigDecimal revenue,
                               long units) {
    }

    public record CategorySales(String category, BigDecimal revenue, long units, BigDecimal share) {
    }

    public record RegionSales(String region, String city, BigDecimal revenue, long orders, long units,
                              BigDecimal share) {
    }

    public record PaymentSales(String paymentMethod, boolean isOnline, BigDecimal revenue, long orders,
                               BigDecimal share) {
    }

    /**
     * @param pending orders that were placed but not delivered yet
     */
    public record Fulfillment(long placed, long delivered, long pending, BigDecimal deliveredShare,
                              BigDecimal averageDeliveryDays, List<WarehouseFulfillment> byWarehouse) {
    }

    public record WarehouseFulfillment(String city, String region, long placed, long delivered,
                                       BigDecimal averageDeliveryDays) {
    }
}
