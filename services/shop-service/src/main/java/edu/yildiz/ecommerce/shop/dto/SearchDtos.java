package edu.yildiz.ecommerce.shop.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/** Request and response shapes of the search API. */
public final class SearchDtos {

    private SearchDtos() {
    }

    /** One product of a result page. The category label is in the language of the request. */
    public record ProductHit(Long id, String name, BigDecimal price, String category, String categoryLabel,
                             String brand, Double score) {
    }

    public record FacetTerm(String value, long count) {
    }

    /** Lowest and highest price of the hits. Both are null when nothing matched. */
    public record PriceRange(BigDecimal min, BigDecimal max) {
    }

    public record SearchFacets(List<FacetTerm> categories, List<FacetTerm> brands, PriceRange price) {
    }

    public record ProductSearchResponse(List<ProductHit> content, long total, int page, int size,
                                        SearchFacets facets) {
    }

    public enum SuggestionType {
        PRODUCT, CATEGORY, BRAND
    }

    public record Suggestion(String text, SuggestionType type) {
    }

    public enum ReindexState {
        IDLE, RUNNING, SUCCESS, FAILED
    }

    /** Progress of the last full reindex. */
    public record ReindexStatus(ReindexState state, long indexed, long total, Instant startedAt, Instant finishedAt,
                                String message) {

        public static ReindexStatus idle() {
            return new ReindexStatus(ReindexState.IDLE, 0, 0, null, null, null);
        }

        public ReindexStatus withIndexed(long count) {
            return new ReindexStatus(state, count, total, startedAt, finishedAt, message);
        }
    }
}
