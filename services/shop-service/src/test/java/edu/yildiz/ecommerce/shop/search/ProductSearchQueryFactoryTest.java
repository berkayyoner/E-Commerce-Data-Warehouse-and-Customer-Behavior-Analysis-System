package edu.yildiz.ecommerce.shop.search;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.List;

import co.elastic.clients.elasticsearch._types.SortOrder;
import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import co.elastic.clients.elasticsearch.core.SearchRequest;
import org.junit.jupiter.api.Test;

class ProductSearchQueryFactoryTest {

    private final ProductSearchQueryFactory factory = new ProductSearchQueryFactory();

    private static ProductSearchCriteria criteria(String query, String lang) {
        return ProductSearchCriteria.of(query, lang, null, null, null, null, null, 0, 20);
    }

    private static List<String> textFields(Query query) {
        return query.bool().must().get(0).bool().should().get(0).multiMatch().fields();
    }

    @Test
    void aBlankQueryMatchesEverything() {
        Query query = factory.query(criteria("", "en"));

        assertThat(query.bool().must().get(0).isMatchAll()).isTrue();
    }

    @Test
    void theTextQueryBoostsNameAndPrefixAndCategoryFields() {
        Query query = factory.query(criteria("lamp", "en"));

        assertThat(textFields(query)).containsExactly("name^3.0", "name.prefix^2.0", "category.text^1.0",
                "categoryTr^1.0", "brand.text^1.0");
    }

    @Test
    void theTurkishLanguageBoostsTheTurkishCategoryName() {
        Query query = factory.query(criteria("elektronik", "tr"));

        assertThat(textFields(query)).contains("categoryTr^3.0");
    }

    @Test
    void fuzzinessIsOnlyUsedForFourOrMoreCharacters() {
        Query longer = factory.query(criteria("lamp", "en"));
        Query shorter = factory.query(criteria("lam", "en"));

        assertThat(longer.bool().must().get(0).bool().should()).hasSize(2);
        assertThat(longer.bool().must().get(0).bool().should().get(1).match().field()).isEqualTo("name");
        assertThat(longer.bool().must().get(0).bool().should().get(1).match().fuzziness()).isEqualTo("AUTO");
        assertThat(shorter.bool().must().get(0).bool().should()).hasSize(1);
    }

    @Test
    void theTextShouldClausesNeedAtLeastOneMatch() {
        Query query = factory.query(criteria("lamp", "en"));

        assertThat(query.bool().must().get(0).bool().minimumShouldMatch()).isEqualTo("1");
    }

    @Test
    void noFilterIsAddedWhenNothingWasAsked() {
        Query query = factory.query(criteria("lamp", "en"));

        assertThat(query.bool().filter()).isEmpty();
    }

    @Test
    void severalCategoriesBecomeATermsFilter() {
        ProductSearchCriteria criteria = ProductSearchCriteria.of("", "en", "Books,Grocery", null, null, null, null,
                0, 20);

        Query filter = factory.query(criteria).bool().filter().get(0);

        assertThat(filter.terms().field()).isEqualTo("category");
        assertThat(filter.terms().terms().value()).hasSize(2);
    }

    @Test
    void aBrandBecomesATermFilter() {
        ProductSearchCriteria criteria = ProductSearchCriteria.of("", "en", null, "Brand A", null, null, null, 0, 20);

        Query filter = factory.query(criteria).bool().filter().get(0);

        assertThat(filter.term().field()).isEqualTo("brand");
        assertThat(filter.term().value().stringValue()).isEqualTo("Brand A");
    }

    @Test
    void aPriceRangeIsAFilterWithBothBounds() {
        ProductSearchCriteria criteria = ProductSearchCriteria.of("", "en", null, null, new BigDecimal("5"),
                new BigDecimal("20.5"), null, 0, 20);

        Query filter = factory.query(criteria).bool().filter().get(0);

        assertThat(filter.range().number().field()).isEqualTo("price");
        assertThat(filter.range().number().gte()).isEqualTo(5.0);
        assertThat(filter.range().number().lte()).isEqualTo(20.5);
    }

    @Test
    void aPriceRangeWithOnlyAMinimumHasNoUpperBound() {
        ProductSearchCriteria criteria = ProductSearchCriteria.of("", "en", null, null, new BigDecimal("5"), null,
                null, 0, 20);

        Query filter = factory.query(criteria).bool().filter().get(0);

        assertThat(filter.range().number().gte()).isEqualTo(5.0);
        assertThat(filter.range().number().lte()).isNull();
    }

    @Test
    void priceSortsAscendingAndDescending() {
        SearchRequest ascending = factory.search(ProductSearchCriteria.of("", "en", null, null, null, null,
                "priceAsc", 0, 20));
        SearchRequest descending = factory.search(ProductSearchCriteria.of("", "en", null, null, null, null,
                "priceDesc", 0, 20));

        assertThat(ascending.sort().get(0).field().field()).isEqualTo("price");
        assertThat(ascending.sort().get(0).field().order()).isEqualTo(SortOrder.Asc);
        assertThat(descending.sort().get(0).field().order()).isEqualTo(SortOrder.Desc);
    }

    @Test
    void nameSortUsesTheRawKeywordSubfield() {
        SearchRequest request = factory.search(ProductSearchCriteria.of("", "en", null, null, null, null, "nameAsc",
                0, 20));

        assertThat(request.sort().get(0).field().field()).isEqualTo("name.raw");
    }

    @Test
    void relevanceSortsByScoreWithIdAsTieBreaker() {
        SearchRequest request = factory.search(criteria("lamp", "en"));

        assertThat(request.sort().get(0).score()).isNotNull();
        assertThat(request.sort().get(1).field().field()).isEqualTo("id");
        assertThat(request.trackScores()).isTrue();
    }

    @Test
    void theRequestPagesWithFromAndSize() {
        ProductSearchCriteria criteria = ProductSearchCriteria.of("", "en", null, null, null, null, null, 3, 50);

        SearchRequest request = factory.search(criteria);

        assertThat(request.from()).isEqualTo(150);
        assertThat(request.size()).isEqualTo(50);
    }

    @Test
    void theSearchCarriesTheFacetAggregations() {
        SearchRequest request = factory.search(criteria("", "en"));

        assertThat(request.aggregations()).containsKeys("categories", "brands", "price");
    }

    @Test
    void productSuggestionsMatchTheEdgeNgramFieldWithAllWords() {
        SearchRequest request = factory.suggestProducts("desk la", 8);

        assertThat(request.size()).isEqualTo(8);
        assertThat(request.query().match().field()).isEqualTo("name.prefix");
        assertThat(request.query().match().operator()).isEqualTo(co.elastic.clients.elasticsearch._types.query_dsl
                .Operator.And);
    }

    @Test
    void brandSuggestionsUseALowercasePrefix() {
        SearchRequest request = factory.suggestBrands("Brand A", 5);

        assertThat(request.query().prefix().field()).isEqualTo("brand");
        assertThat(request.query().prefix().value()).isEqualTo("brand a");
        assertThat(request.aggregations()).containsKey("brands");
    }
}
