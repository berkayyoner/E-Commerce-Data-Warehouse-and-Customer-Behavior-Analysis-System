package edu.yildiz.ecommerce.analytics.model;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Answers of the customer reports. A customer is identified by its natural key, never by a dimension row. */
public final class CustomerReports {

    private CustomerReports() {
    }

    /**
     * @param customerId the warehouse, district and customer numbers joined with dashes, for example 3-7-1204
     */
    public record CustomerValue(String customerId, String name, String region, long orders, BigDecimal revenue,
                                LocalDate firstOrderDate, LocalDate lastOrderDate) {
    }

    /**
     * @param repeatPurchaseRate customers with two or more orders divided by customers with orders (0 to 1)
     * @param averageLifetimeValue order amount per customer within the requested period
     */
    public record CustomerMetrics(long customersWithOrders, long repeatCustomers, BigDecimal repeatPurchaseRate,
                                  BigDecimal averageOrdersPerCustomer, BigDecimal averageLifetimeValue) {
    }
}
