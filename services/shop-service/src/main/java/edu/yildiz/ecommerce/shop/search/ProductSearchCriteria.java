package edu.yildiz.ecommerce.shop.search;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

import edu.yildiz.ecommerce.shop.support.Paging;

/**
 * A validated product search. The raw request values go through {@link #of}, so every rule about them lives here.
 * Rejected values raise an {@link IllegalArgumentException}, which the API answers with 400.
 */
public record ProductSearchCriteria(String query, SearchLanguage language, List<String> categories, String brand,
                                    BigDecimal minPrice, BigDecimal maxPrice, SearchSort sort, int page, int size) {

    static final int MAX_QUERY_LENGTH = 100;

    /** Elasticsearch refuses to page past this many hits. */
    static final int MAX_RESULT_WINDOW = 10_000;

    public ProductSearchCriteria {
        categories = List.copyOf(categories);
    }

    public static ProductSearchCriteria of(String query, String lang, String category, String brand,
                                           BigDecimal minPrice, BigDecimal maxPrice, String sort, int page,
                                           int size) {
        String text = query == null ? "" : query.trim();
        if (text.length() > MAX_QUERY_LENGTH) {
            throw new IllegalArgumentException("q must be at most 100 characters");
        }
        if (page < 0) {
            throw new IllegalArgumentException("page must not be negative");
        }
        int safeSize = Paging.size(size);
        if ((long) (page + 1) * safeSize > MAX_RESULT_WINDOW) {
            throw new IllegalArgumentException("Only the first 10000 results can be paged");
        }
        if (minPrice != null && minPrice.signum() < 0 || maxPrice != null && maxPrice.signum() < 0) {
            throw new IllegalArgumentException("price must not be negative");
        }
        if (minPrice != null && maxPrice != null && minPrice.compareTo(maxPrice) > 0) {
            throw new IllegalArgumentException("minPrice must not be greater than maxPrice");
        }
        return new ProductSearchCriteria(text, SearchLanguage.of(lang), categoriesOf(category), blankToNull(brand),
                minPrice, maxPrice, SearchSort.of(sort), page, safeSize);
    }

    public boolean hasQuery() {
        return !query.isEmpty();
    }

    /** Index of the first hit on the page. */
    public int from() {
        return page * size;
    }

    private static List<String> categoriesOf(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        return Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(part -> !part.isEmpty())
                .distinct()
                .toList();
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
