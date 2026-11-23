package edu.yildiz.ecommerce.shop.domain;

import java.io.Serializable;
import java.util.Objects;

/** Composite key of an order: warehouse, district and order number. */
public class OrderId implements Serializable {

    private Long warehouseId;
    private Long districtId;
    private Long orderId;

    protected OrderId() {
    }

    public OrderId(Long warehouseId, Long districtId, Long orderId) {
        this.warehouseId = warehouseId;
        this.districtId = districtId;
        this.orderId = orderId;
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

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (!(other instanceof OrderId that)) {
            return false;
        }
        return Objects.equals(warehouseId, that.warehouseId)
                && Objects.equals(districtId, that.districtId)
                && Objects.equals(orderId, that.orderId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(warehouseId, districtId, orderId);
    }
}
