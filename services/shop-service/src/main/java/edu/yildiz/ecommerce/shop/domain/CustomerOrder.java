package edu.yildiz.ecommerce.shop.domain;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

/** An order of the OLTP schema, stored in the OORDER table. */
@Entity
@Table(name = "OORDER")
@IdClass(OrderId.class)
public class CustomerOrder {

    @Id
    @Column(name = "O_W_ID")
    private Long warehouseId;

    @Id
    @Column(name = "O_D_ID")
    private Long districtId;

    @Id
    @Column(name = "O_ID")
    private Long orderId;

    @Column(name = "O_C_ID", nullable = false)
    private Long customerId;

    @Column(name = "O_CARRIER_ID")
    private Long carrierId;

    @Column(name = "O_OL_CNT", nullable = false)
    private Integer lineCount;

    @Column(name = "O_ALL_LOCAL")
    private Integer allLocal;

    @Column(name = "O_ENTRY_D", nullable = false)
    private LocalDateTime entryDate;

    @Column(name = "O_PAYMENT_METHOD", length = 20)
    private String paymentMethod;

    protected CustomerOrder() {
    }

    public CustomerOrder(Long warehouseId, Long districtId, Long orderId, Long customerId, Long carrierId,
                         Integer lineCount, LocalDateTime entryDate, String paymentMethod) {
        this.warehouseId = warehouseId;
        this.districtId = districtId;
        this.orderId = orderId;
        this.customerId = customerId;
        this.carrierId = carrierId;
        this.lineCount = lineCount;
        this.allLocal = 1;
        this.entryDate = entryDate;
        this.paymentMethod = paymentMethod;
    }

    public Long getWarehouseId() {
        return warehouseId;
    }

    public Long getDistrictId() {
        return districtId;
    }

    public Long getOrderId() {
        return orderId;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public Long getCarrierId() {
        return carrierId;
    }

    public Integer getLineCount() {
        return lineCount;
    }

    public LocalDateTime getEntryDate() {
        return entryDate;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }
}
