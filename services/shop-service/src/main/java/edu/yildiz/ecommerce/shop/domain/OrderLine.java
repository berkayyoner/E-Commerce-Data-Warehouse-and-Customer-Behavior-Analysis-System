package edu.yildiz.ecommerce.shop.domain;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

/** A line of an order, stored in the ORDER_LINE table. The product is referenced by its number only. */
@Entity
@Table(name = "ORDER_LINE")
@IdClass(OrderLineId.class)
public class OrderLine {

    @Id
    @Column(name = "OL_W_ID")
    private Long warehouseId;

    @Id
    @Column(name = "OL_D_ID")
    private Long districtId;

    @Id
    @Column(name = "OL_O_ID")
    private Long orderId;

    @Id
    @Column(name = "OL_NUMBER")
    private Integer lineNumber;

    @Column(name = "OL_I_ID", nullable = false)
    private Long itemId;

    @Column(name = "OL_DELIVERY_D")
    private LocalDateTime deliveryDate;

    @Column(name = "OL_AMOUNT", precision = 6, scale = 2)
    private BigDecimal amount;

    @Column(name = "OL_SUPPLY_W_ID")
    private Long supplyWarehouseId;

    @Column(name = "OL_QUANTITY")
    private Integer quantity;

    @Column(name = "OL_DIST_INFO", length = 24)
    private String distInfo;

    protected OrderLine() {
    }

    public OrderLine(Long warehouseId, Long districtId, Long orderId, Integer lineNumber, Long itemId,
                     LocalDateTime deliveryDate, BigDecimal amount, Integer quantity) {
        this.warehouseId = warehouseId;
        this.districtId = districtId;
        this.orderId = orderId;
        this.lineNumber = lineNumber;
        this.itemId = itemId;
        this.deliveryDate = deliveryDate;
        this.amount = amount;
        this.supplyWarehouseId = warehouseId;
        this.quantity = quantity;
        this.distInfo = "";
    }

    public Integer getLineNumber() {
        return lineNumber;
    }

    public Long getItemId() {
        return itemId;
    }

    public LocalDateTime getDeliveryDate() {
        return deliveryDate;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public Integer getQuantity() {
        return quantity;
    }
}
