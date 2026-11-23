package edu.yildiz.ecommerce.shop.search;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import edu.yildiz.ecommerce.shop.domain.Product;
import org.junit.jupiter.api.Test;

class ProductDocumentMapperTest {

    private final ProductDocumentMapper mapper = new ProductDocumentMapper(
            Clock.fixed(Instant.parse("2026-11-23T10:15:30Z"), ZoneOffset.UTC));

    @Test
    void theDocumentCarriesTheTurkishCategoryLabel() {
        Product product = new Product(42L, "zchoozcrhxkeyri", new BigDecimal("12.50"), "Toys and Games", "Brand C");

        ProductDocument document = mapper.toDocument(product);

        assertThat(document.id()).isEqualTo(42L);
        assertThat(document.name()).isEqualTo("zchoozcrhxkeyri");
        assertThat(document.category()).isEqualTo("Toys and Games");
        assertThat(document.categoryTr()).isEqualTo("Oyuncak ve Oyun");
        assertThat(document.brand()).isEqualTo("Brand C");
        assertThat(document.price()).isEqualByComparingTo("12.50");
    }

    @Test
    void anUnknownCategoryKeepsItsNameAsTheTurkishLabel() {
        Product product = new Product(7L, "Lamp", new BigDecimal("1.00"), "Garden", "Brand A");

        assertThat(mapper.toDocument(product).categoryTr()).isEqualTo("Garden");
    }

    @Test
    void theIndexTimeComesFromTheClock() {
        Product product = new Product(1L, "Lamp", new BigDecimal("1.00"), "Grocery", "Brand A");

        assertThat(mapper.toDocument(product).indexedAt()).isEqualTo("2026-11-23T10:15:30Z");
    }
}
