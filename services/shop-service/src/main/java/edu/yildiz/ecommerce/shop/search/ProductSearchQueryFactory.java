package edu.yildiz.ecommerce.shop.search;

import static edu.yildiz.ecommerce.shop.search.ProductIndexSchema.ALIAS;
import static edu.yildiz.ecommerce.shop.search.ProductIndexSchema.BRAND;
import static edu.yildiz.ecommerce.shop.search.ProductIndexSchema.BRAND_TEXT;
import static edu.yildiz.ecommerce.shop.search.ProductIndexSchema.CATEGORY;
import static edu.yildiz.ecommerce.shop.search.ProductIndexSchema.CATEGORY_TEXT;
import static edu.yildiz.ecommerce.shop.search.ProductIndexSchema.CATEGORY_TR;
import static edu.yildiz.ecommerce.shop.search.ProductIndexSchema.ID;
import static edu.yildiz.ecommerce.shop.search.ProductIndexSchema.NAME;
import static edu.yildiz.ecommerce.shop.search.ProductIndexSchema.NAME_PREFIX;
import static edu.yildiz.ecommerce.shop.search.ProductIndexSchema.NAME_RAW;
import static edu.yildiz.ecommerce.shop.search.ProductIndexSchema.PRICE;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import co.elastic.clients.elasticsearch._types.FieldValue;
import co.elastic.clients.elasticsearch._types.SortOrder;
import co.elastic.clients.elasticsearch._types.aggregations.Aggregation;
import co.elastic.clients.elasticsearch._types.query_dsl.Operator;
import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import co.elastic.clients.elasticsearch._types.query_dsl.TextQueryType;
import co.elastic.clients.elasticsearch._types.SortOptions;
import co.elastic.clients.elasticsearch.core.SearchRequest;

/**
 * Builds the typed Elasticsearch requests of the product search. Every value from the user goes into a typed
 * builder, never into a JSON or query string.
 */
public final class ProductSearchQueryFactory {

    static final int FUZZY_MIN_LENGTH = 4;
    static final int FACET_SIZE = 20;
    static final String CATEGORIES = "categories";
    static final String BRANDS = "brands";
    static final String PRICE_STATS = "price";
    static final String BRAND_SAMPLE = "brandSample";

    private static final float NAME_BOOST = 3f;
    private static final float PREFIX_BOOST = 2f;
    private static final float ENGLISH_CATEGORY_BOOST = 1f;
    private static final float TURKISH_BOOST = 3f;
    private static final float DEFAULT_TURKISH_BOOST = 1f;

    /** The search: a bool query with the text match in must and the facet filters in filter context. */
    public SearchRequest search(ProductSearchCriteria criteria) {
        return SearchRequest.of(request -> request
                .index(ALIAS)
                .query(query(criteria))
                .from(criteria.from())
                .size(criteria.size())
                .sort(sortOptions(criteria.sort()))
                .trackScores(true)
                .trackTotalHits(track -> track.enabled(true))
                .aggregations(CATEGORIES, categoryAggregation())
                .aggregations(BRANDS, brandAggregation(FACET_SIZE))
                .aggregations(PRICE_STATS, Aggregation.of(aggregation -> aggregation.stats(stats -> stats.field(PRICE)))));
    }

    /** Typeahead over the edge-ngram field of the product names. */
    public SearchRequest suggestProducts(String text, int size) {
        return SearchRequest.of(request -> request
                .index(ALIAS)
                .size(size)
                .source(source -> source.filter(filter -> filter.includes(NAME)))
                .query(query -> query.match(match -> match
                        .field(NAME_PREFIX)
                        .query(FieldValue.of(text))
                        .operator(Operator.And))));
    }

    /** Brands that start with the text, read from the distinct values of a terms aggregation. */
    public SearchRequest suggestBrands(String text, int size) {
        return SearchRequest.of(request -> request
                .index(ALIAS)
                .size(0)
                .query(query -> query.prefix(prefix -> prefix
                        .field(BRAND)
                        .value(text.toLowerCase(Locale.ROOT))))
                .aggregations(BRANDS, brandAggregation(size)));
    }

    Query query(ProductSearchCriteria criteria) {
        return Query.of(query -> query.bool(bool -> bool
                .must(textQuery(criteria))
                .filter(filters(criteria))));
    }

    private Query textQuery(ProductSearchCriteria criteria) {
        if (!criteria.hasQuery()) {
            return Query.of(query -> query.matchAll(matchAll -> matchAll));
        }
        String text = criteria.query();
        float turkishBoost = criteria.language() == SearchLanguage.TR ? TURKISH_BOOST : DEFAULT_TURKISH_BOOST;
        List<String> fields = List.of(
                NAME + "^" + NAME_BOOST,
                NAME_PREFIX + "^" + PREFIX_BOOST,
                CATEGORY_TEXT + "^" + ENGLISH_CATEGORY_BOOST,
                CATEGORY_TR + "^" + turkishBoost,
                BRAND_TEXT + "^" + DEFAULT_TURKISH_BOOST);
        List<Query> should = new ArrayList<>();
        should.add(Query.of(query -> query.multiMatch(multi -> multi
                .query(text)
                .type(TextQueryType.BestFields)
                .fields(fields))));
        if (text.codePointCount(0, text.length()) >= FUZZY_MIN_LENGTH) {
            should.add(Query.of(query -> query.match(match -> match
                    .field(NAME)
                    .query(FieldValue.of(text))
                    .fuzziness("AUTO")
                    .boost(NAME_BOOST))));
        }
        return Query.of(query -> query.bool(bool -> bool
                .should(should)
                .minimumShouldMatch("1")));
    }

    private List<Query> filters(ProductSearchCriteria criteria) {
        List<Query> filters = new ArrayList<>();
        if (!criteria.categories().isEmpty()) {
            List<FieldValue> categories = criteria.categories().stream().map(FieldValue::of).toList();
            filters.add(Query.of(query -> query.terms(terms -> terms
                    .field(CATEGORY)
                    .terms(termsField -> termsField.value(categories)))));
        }
        if (criteria.brand() != null) {
            filters.add(Query.of(query -> query.term(term -> term
                    .field(BRAND)
                    .value(FieldValue.of(criteria.brand())))));
        }
        if (criteria.minPrice() != null || criteria.maxPrice() != null) {
            filters.add(priceFilter(criteria.minPrice(), criteria.maxPrice()));
        }
        return filters;
    }

    private static Query priceFilter(BigDecimal minPrice, BigDecimal maxPrice) {
        return Query.of(query -> query.range(range -> range.number(number -> {
            number.field(PRICE);
            if (minPrice != null) {
                number.gte(minPrice.doubleValue());
            }
            if (maxPrice != null) {
                number.lte(maxPrice.doubleValue());
            }
            return number;
        })));
    }

    private static List<SortOptions> sortOptions(SearchSort sort) {
        SortOptions primary = switch (sort) {
            case RELEVANCE -> SortOptions.of(option -> option.score(score -> score.order(SortOrder.Desc)));
            case PRICE_ASC -> fieldSort(PRICE, SortOrder.Asc);
            case PRICE_DESC -> fieldSort(PRICE, SortOrder.Desc);
            case NAME_ASC -> fieldSort(NAME_RAW, SortOrder.Asc);
        };
        return List.of(primary, fieldSort(ID, SortOrder.Asc));
    }

    private static SortOptions fieldSort(String field, SortOrder order) {
        return SortOptions.of(option -> option.field(sortField -> sortField.field(field).order(order)));
    }

    private static Aggregation categoryAggregation() {
        return Aggregation.of(aggregation -> aggregation.terms(terms -> terms.field(CATEGORY).size(FACET_SIZE)));
    }

    /**
     * Brand values are stored lowercase by the normalizer, so each bucket also carries one sample hit whose
     * source gives the brand as it was written.
     */
    static Aggregation brandAggregation(int size) {
        return Aggregation.of(aggregation -> aggregation
                .terms(terms -> terms.field(BRAND).size(size))
                .aggregations(BRAND_SAMPLE, sample -> sample.topHits(hits -> hits
                        .size(1)
                        .source(source -> source.filter(filter -> filter.includes(BRAND))))));
    }
}
