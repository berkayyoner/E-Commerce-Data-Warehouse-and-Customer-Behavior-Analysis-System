package edu.yildiz.ecommerce.shop.support;

import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.data.domain.Sort;

/**
 * Rules shared by the list endpoints: page and size limits, sort whitelists and LIKE patterns.
 * Patterns use {@code !} as the escape character, so a % or _ typed by the user matches literally.
 */
public final class Paging {

    public static final int MAX_PAGE_SIZE = 100;

    private Paging() {
    }

    public static int page(int page) {
        return Math.max(page, 0);
    }

    public static int size(int size) {
        return Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
    }

    public static boolean ascending(String direction) {
        return !"desc".equalsIgnoreCase(direction);
    }

    /** The columns of a sort key; an unknown or missing key falls back to the default key. */
    public static List<String> columns(Map<String, List<String>> whitelist, String key, String defaultKey) {
        List<String> columns = key == null ? null : whitelist.get(key);
        return columns != null ? columns : whitelist.get(defaultKey);
    }

    public static Sort sort(Map<String, List<String>> whitelist, String key, String defaultKey, String direction) {
        Sort.Direction order = ascending(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return Sort.by(order, columns(whitelist, key, defaultKey).toArray(String[]::new));
    }

    /** A case-insensitive "contains" pattern for a LIKE clause that escapes the user's wildcards. */
    public static String containsPattern(String text) {
        String normalized = text == null ? "" : text.trim().toLowerCase(Locale.ROOT);
        return "%" + escape(normalized) + "%";
    }

    static String escape(String text) {
        return text.replace("!", "!!").replace("%", "!%").replace("_", "!_");
    }
}
