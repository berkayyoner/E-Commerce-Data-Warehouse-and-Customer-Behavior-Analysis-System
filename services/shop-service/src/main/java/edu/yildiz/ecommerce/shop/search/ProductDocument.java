package edu.yildiz.ecommerce.shop.search;

import java.math.BigDecimal;

/**
 * A product as stored in the search index. Field names match the mapping in {@link ProductIndexSchema}.
 * The id is also the document id.
 */
public record ProductDocument(Long id, String name, String category, String categoryTr, String brand,
                              BigDecimal price, String indexedAt) {
}
