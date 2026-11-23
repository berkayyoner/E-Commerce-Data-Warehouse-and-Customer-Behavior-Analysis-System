package edu.yildiz.ecommerce.segmentation.model;

import edu.yildiz.ecommerce.segmentation.rfm.RfmSegments;

/**
 * A validated filter, sort and page for the customer table.
 *
 * @param search     text that the first or last name must contain, null for no search
 * @param descending true for the descending order of {@code sort}
 */
public record CustomerQuery(
        String segment,
        Integer cluster,
        String search,
        CustomerSort sort,
        boolean descending,
        int page,
        int size) {

    public static final int MAX_PAGE_SIZE = 100;
    public static final int MAX_SEARCH_LENGTH = 100;

    public CustomerQuery {
        if (segment != null && !RfmSegments.segmentNames().contains(segment)) {
            throw new IllegalArgumentException("Unknown segment " + segment);
        }
        if (cluster != null && cluster < 0) {
            throw new IllegalArgumentException("cluster must not be negative");
        }
        if (search != null && search.length() > MAX_SEARCH_LENGTH) {
            throw new IllegalArgumentException("search must have at most " + MAX_SEARCH_LENGTH + " characters");
        }
        if (page < 0) {
            throw new IllegalArgumentException("page must not be negative");
        }
        if (size < 1 || size > MAX_PAGE_SIZE) {
            throw new IllegalArgumentException("size must be between 1 and " + MAX_PAGE_SIZE);
        }
        sort = sort == null ? CustomerSort.MONETARY : sort;
    }

    /** Reads the raw request parameters. Blank text counts as absent, the default sort is monetary, descending. */
    public static CustomerQuery of(String segment, Integer cluster, String search, String sort, String direction,
                                   int page, int size) {
        CustomerSort parsedSort = isBlank(sort) ? CustomerSort.MONETARY : CustomerSort.fromParameter(sort);
        return new CustomerQuery(
                isBlank(segment) ? null : segment,
                cluster,
                isBlank(search) ? null : search.trim(),
                parsedSort,
                parseDescending(direction),
                page,
                size);
    }

    private static boolean parseDescending(String direction) {
        if (isBlank(direction) || "desc".equals(direction)) {
            return true;
        }
        if ("asc".equals(direction)) {
            return false;
        }
        throw new IllegalArgumentException("direction must be asc or desc");
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
