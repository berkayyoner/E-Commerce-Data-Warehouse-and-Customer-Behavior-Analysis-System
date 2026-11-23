package edu.yildiz.ecommerce.shop.dto;

import java.math.BigDecimal;

import edu.yildiz.ecommerce.shop.domain.Warehouse;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Request and response shapes of the warehouse API. */
public final class WarehouseDtos {

    private WarehouseDtos() {
    }

    public record WarehouseView(long id, String name, String city, String state, String region, BigDecimal tax,
                                BigDecimal ytd) {

        public static WarehouseView of(Warehouse warehouse) {
            return new WarehouseView(warehouse.getId(), warehouse.getName(), warehouse.getCity(),
                    warehouse.getState(), warehouse.getRegion(), warehouse.getTax(), warehouse.getYtd());
        }
    }

    public record WarehouseRequest(
            @NotBlank @Size(max = 10) String name,
            @NotBlank @Size(max = 20) String city,
            @NotBlank @Size(max = 30) String region) {
    }
}
