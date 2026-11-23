package edu.yildiz.ecommerce.shop.dto;

import java.math.BigDecimal;

import edu.yildiz.ecommerce.shop.domain.Product;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Request and response shapes of the product API. */
public final class ProductDtos {

    private ProductDtos() {
    }

    public record ProductView(long id, String name, BigDecimal price, String category, String brand) {

        public static ProductView of(Product product) {
            return new ProductView(product.getId(), product.getName(), product.getPrice(), product.getCategory(),
                    product.getBrand());
        }
    }

    public record ProductRequest(
            @NotBlank @Size(max = 24) String name,
            @NotNull @DecimalMin("0.01") @DecimalMax("999.99") @Digits(integer = 3, fraction = 2) BigDecimal price,
            @NotBlank @Size(max = 30) String category,
            @NotBlank @Size(max = 30) String brand) {
    }
}
