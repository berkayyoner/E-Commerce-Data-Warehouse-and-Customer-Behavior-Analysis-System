package edu.yildiz.ecommerce.shop.search;

import edu.yildiz.ecommerce.shop.domain.Product;

/**
 * Published by the product service when a product change is made. The listener indexes it only after the
 * transaction commits, so a rolled back change never reaches the index.
 *
 * @param change    what happened to the product
 * @param productId the product the change is about
 * @param product   the product as it is after the change; null for a removal
 */
public record ProductIndexEvent(Change change, long productId, Product product) {

    public enum Change {
        UPSERTED, REMOVED
    }

    public static ProductIndexEvent upserted(Product product) {
        return new ProductIndexEvent(Change.UPSERTED, product.getId(), product);
    }

    public static ProductIndexEvent removed(long productId) {
        return new ProductIndexEvent(Change.REMOVED, productId, null);
    }
}
