package edu.yildiz.ecommerce.shop.search;

import java.util.Locale;

/** Languages a search request can ask for. Turkish boosts the Turkish category names. */
public enum SearchLanguage {

    EN, TR;

    /** Parses the lang parameter. A missing value means English. */
    public static SearchLanguage of(String value) {
        if (value == null || value.isBlank()) {
            return EN;
        }
        return switch (value.trim().toLowerCase(Locale.ROOT)) {
            case "en" -> EN;
            case "tr" -> TR;
            default -> throw new IllegalArgumentException("lang must be en or tr");
        };
    }
}
