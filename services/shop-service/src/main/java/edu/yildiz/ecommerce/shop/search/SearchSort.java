package edu.yildiz.ecommerce.shop.search;

/** Orderings of the product search. The key is the value the API accepts. */
public enum SearchSort {

    RELEVANCE("relevance"),
    PRICE_ASC("priceAsc"),
    PRICE_DESC("priceDesc"),
    NAME_ASC("nameAsc");

    private final String key;

    SearchSort(String key) {
        this.key = key;
    }

    /** Parses the sort parameter. A missing value means relevance. */
    public static SearchSort of(String value) {
        if (value == null || value.isBlank()) {
            return RELEVANCE;
        }
        String trimmed = value.trim();
        for (SearchSort sort : values()) {
            if (sort.key.equals(trimmed)) {
                return sort;
            }
        }
        throw new IllegalArgumentException("sort must be one of relevance, priceAsc, priceDesc, nameAsc");
    }
}
