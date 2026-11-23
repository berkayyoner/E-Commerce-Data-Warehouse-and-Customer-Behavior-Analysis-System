package edu.yildiz.ecommerce.segmentation.model;

/** The natural key of a customer in the source system. */
public record CustomerKey(long warehouseId, long districtId, long customerId) {

    /** The identifier shown to users, in the form warehouse-district-customer. */
    public String identifier() {
        return warehouseId + "-" + districtId + "-" + customerId;
    }
}
