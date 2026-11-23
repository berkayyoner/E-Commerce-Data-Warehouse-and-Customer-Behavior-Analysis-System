package edu.yildiz.ecommerce.shop.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/** Response shapes of the order API. Orders are read only. */
public final class OrderDtos {

    private OrderDtos() {
    }

    public record OrderSummaryView(long warehouseId, long districtId, long orderId, long customerId,
                                   String customerName, LocalDateTime orderDate, String paymentMethod,
                                   int lineCount, BigDecimal totalAmount, boolean delivered) {
    }

    public record OrderDetailView(long warehouseId, long districtId, long orderId, long customerId,
                                  String customerName, LocalDateTime orderDate, String paymentMethod,
                                  int lineCount, BigDecimal totalAmount, boolean delivered,
                                  List<OrderLineView> lines) {
    }

    public record OrderLineView(int lineNumber, long itemId, String productName, int quantity, BigDecimal amount,
                                LocalDateTime deliveryDate) {
    }
}
