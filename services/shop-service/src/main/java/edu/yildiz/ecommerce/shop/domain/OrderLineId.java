package edu.yildiz.ecommerce.shop.domain;

import java.io.Serializable;
import java.util.Objects;

/** Composite key of an order line: warehouse, district, order number and line number. */
public class OrderLineId implements Serializable {

    private Long warehouseId;
    private Long districtId;
    private Long orderId;
    private Integer lineNumber;

    protected OrderLineId() {
    }

    public OrderLineId(Long warehouseId, Long districtId, Long orderId, Integer lineNumber) {
        this.warehouseId = warehouseId;
        this.districtId = districtId;
        this.orderId = orderId;
        this.lineNumber = lineNumber;
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

    public Integer getLineNumber() {
        return lineNumber;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (!(other instanceof OrderLineId that)) {
            return false;
        }
        return Objects.equals(warehouseId, that.warehouseId)
                && Objects.equals(districtId, that.districtId)
                && Objects.equals(orderId, that.orderId)
                && Objects.equals(lineNumber, that.lineNumber);
    }

    @Override
    public int hashCode() {
        return Objects.hash(warehouseId, districtId, orderId, lineNumber);
    }
}
