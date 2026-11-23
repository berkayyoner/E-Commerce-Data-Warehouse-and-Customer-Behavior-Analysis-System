package edu.yildiz.ecommerce.analytics.cache;

/**
 * A report together with the information whether it came from the cache.
 *
 * @param hit true when the value was read from Redis, false when it was computed from the warehouse
 */
public record CachedReport<T>(T value, boolean hit) {
}
