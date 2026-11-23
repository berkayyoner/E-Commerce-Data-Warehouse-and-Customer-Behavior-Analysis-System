package edu.yildiz.ecommerce.shop.search;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;

class ProductSearchCriteriaTest {

    private static ProductSearchCriteria of(String query, String lang, String sort, int page, int size) {
        return ProductSearchCriteria.of(query, lang, null, null, null, null, sort, page, size);
    }

    @Test
    void missingValuesGetTheDefaults() {
        ProductSearchCriteria criteria = of(null, null, null, 0, 20);

        assertThat(criteria.query()).isEmpty();
        assertThat(criteria.language()).isEqualTo(SearchLanguage.EN);
        assertThat(criteria.sort()).isEqualTo(SearchSort.RELEVANCE);
        assertThat(criteria.categories()).isEmpty();
        assertThat(criteria.brand()).isNull();
        assertThat(criteria.size()).isEqualTo(20);
        assertThat(criteria.hasQuery()).isFalse();
    }

    @Test
    void theQueryIsTrimmed() {
        assertThat(of("  lamp  ", "en", "relevance", 0, 20).query()).isEqualTo("lamp");
    }

    @Test
    void aQueryLongerThanOneHundredCharactersIsRejected() {
        String longQuery = "a".repeat(101);

        assertThatThrownBy(() -> of(longQuery, "en", null, 0, 20)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void aNegativePageIsRejected() {
        assertThatThrownBy(() -> of("lamp", "en", null, -1, 20))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("page must not be negative");
    }

    @Test
    void pagesBeyondTheResultWindowAreRejected() {
        assertThatThrownBy(() -> of("lamp", "en", null, 500, 100))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Only the first 10000 results can be paged");
    }

    @Test
    void theLastPageInsideTheResultWindowIsAccepted() {
        ProductSearchCriteria criteria = of("lamp", "en", null, 99, 100);

        assertThat(criteria.from()).isEqualTo(9900);
    }

    @Test
    void sizeIsClampedToTheAllowedRange() {
        assertThat(of("lamp", "en", null, 0, 500).size()).isEqualTo(100);
        assertThat(of("lamp", "en", null, 0, 0).size()).isEqualTo(1);
    }

    @Test
    void categoriesAreSplitTrimmedAndDeduplicated() {
        ProductSearchCriteria criteria = ProductSearchCriteria.of("", "en", " Books, ,Grocery,Books ", null, null,
                null, null, 0, 20);

        assertThat(criteria.categories()).containsExactly("Books", "Grocery");
    }

    @Test
    void aBlankBrandIsNoFilter() {
        ProductSearchCriteria criteria = ProductSearchCriteria.of("", "en", null, "   ", null, null, null, 0, 20);

        assertThat(criteria.brand()).isNull();
    }

    @Test
    void anUnknownLanguageIsRejected() {
        assertThatThrownBy(() -> of("lamp", "de", null, 0, 20))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("lang must be en or tr");
    }

    @Test
    void anUnknownSortIsRejected() {
        assertThatThrownBy(() -> of("lamp", "en", "password", 0, 20))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void aMinimumPriceAboveTheMaximumIsRejected() {
        assertThatThrownBy(() -> ProductSearchCriteria.of("", "en", null, null, new BigDecimal("50"),
                new BigDecimal("10"), null, 0, 20))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("minPrice must not be greater than maxPrice");
    }

    @Test
    void aNegativePriceIsRejected() {
        assertThatThrownBy(() -> ProductSearchCriteria.of("", "en", null, null, new BigDecimal("-1"), null, null,
                0, 20))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void sortKeysMapToTheirOrdering() {
        assertThat(SearchSort.of("priceAsc")).isEqualTo(SearchSort.PRICE_ASC);
        assertThat(SearchSort.of("priceDesc")).isEqualTo(SearchSort.PRICE_DESC);
        assertThat(SearchSort.of("nameAsc")).isEqualTo(SearchSort.NAME_ASC);
        assertThat(SearchSort.of(" ")).isEqualTo(SearchSort.RELEVANCE);
    }

    @Test
    void languageIsCaseInsensitive() {
        assertThat(SearchLanguage.of("TR")).isEqualTo(SearchLanguage.TR);
        assertThat(SearchLanguage.of(null)).isEqualTo(SearchLanguage.EN);
    }
}
