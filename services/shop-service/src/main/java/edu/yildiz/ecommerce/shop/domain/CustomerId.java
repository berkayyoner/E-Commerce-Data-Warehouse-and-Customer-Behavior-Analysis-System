package edu.yildiz.ecommerce.shop.domain;

import java.io.Serializable;
import java.util.Objects;

/** Composite key of a customer: warehouse, district and customer number. */
public class CustomerId implements Serializable {

    private Long warehouseId;
    private Long districtId;
    private Long customerId;

    protected CustomerId() {
    }

    public CustomerId(Long warehouseId, Long districtId, Long customerId) {
        this.warehouseId = warehouseId;
        this.districtId = districtId;
        this.customerId = customerId;
    }

    public Long getWarehouseId() {
        return warehouseId;
    }

    public Long getDistrictId() {
        return districtId;
    }

    public Long getCustomerId() {
        return customerId;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (!(other instanceof CustomerId that)) {
            return false;
        }
        return Objects.equals(warehouseId, that.warehouseId)
                && Objects.equals(districtId, that.districtId)
                && Objects.equals(customerId, that.customerId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(warehouseId, districtId, customerId);
    }
}
