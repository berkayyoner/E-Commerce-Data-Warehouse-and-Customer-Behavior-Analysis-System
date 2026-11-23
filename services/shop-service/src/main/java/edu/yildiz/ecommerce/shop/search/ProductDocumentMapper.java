package edu.yildiz.ecommerce.shop.search;

import java.time.Clock;
import java.time.Instant;

import edu.yildiz.ecommerce.shop.domain.Product;
import org.springframework.stereotype.Component;

/** Turns a product row into the document that is indexed. */
@Component
public class ProductDocumentMapper {

    private final Clock clock;

    public ProductDocumentMapper(Clock clock) {
        this.clock = clock;
    }

    public ProductDocument toDocument(Product product) {
        return new ProductDocument(
                product.getId(),
                product.getName(),
                product.getCategory(),
                CategoryNames.turkish(product.getCategory()),
                product.getBrand(),
                product.getPrice(),
                Instant.now(clock).toString());
    }
}
