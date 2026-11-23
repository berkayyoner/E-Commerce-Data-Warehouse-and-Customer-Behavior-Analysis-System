package edu.yildiz.ecommerce.shop.search;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;

import co.elastic.clients.elasticsearch.indices.CreateIndexRequest;
import org.junit.jupiter.api.Test;

class ProductIndexSchemaTest {

    private static final CreateIndexRequest REQUEST = ProductIndexSchema.createRequest("shop-products-v1");

    @Test
    void versionNamesCarryTheTimestamp() {
        assertThat(ProductIndexSchema.newVersionName(Instant.ofEpochMilli(1_700_000_000_000L)))
                .isEqualTo("shop-products-v1700000000000");
    }

    @Test
    void theIndexIsCreatedWithTheRequestedName() {
        assertThat(REQUEST.index()).isEqualTo("shop-products-v1");
    }

    @Test
    void theNameFieldHasAnEnglishAnalyzerAndAPrefixSubfield() {
        var name = REQUEST.mappings().properties().get("name").text();

        assertThat(name.analyzer()).isEqualTo("english");
        assertThat(name.fields().get("prefix").text().analyzer()).isEqualTo("product_prefix_index");
        assertThat(name.fields().get("prefix").text().searchAnalyzer()).isEqualTo("product_prefix_search");
        assertThat(name.fields().get("raw").keyword().ignoreAbove()).isEqualTo(64);
    }

    @Test
    void theTurkishCategoryFieldUsesTheTurkishAnalyzer() {
        var categoryTr = REQUEST.mappings().properties().get("categoryTr").text();

        assertThat(categoryTr.analyzer()).isEqualTo("product_turkish");
        assertThat(categoryTr.fields().get("raw").keyword()).isNotNull();
    }

    @Test
    void theBrandFieldIsNormalizedToLowercaseKeyword() {
        var brand = REQUEST.mappings().properties().get("brand").keyword();

        assertThat(brand.normalizer()).isEqualTo("product_lowercase");
        assertThat(brand.fields().get("text").text().analyzer()).isEqualTo("english");
    }

    @Test
    void thePriceIsAScaledFloatWithTwoDecimals() {
        var price = REQUEST.mappings().properties().get("price").scaledFloat();

        assertThat(price.scalingFactor()).isEqualTo(100d);
    }

    @Test
    void theIndexedAtFieldIsADate() {
        assertThat(REQUEST.mappings().properties().get("indexedAt").isDate()).isTrue();
    }

    @Test
    void theNgramRangeNeedsTheMaximumDifferenceSetting() {
        assertThat(REQUEST.settings().maxNgramDiff()).isEqualTo(13);
    }
}
