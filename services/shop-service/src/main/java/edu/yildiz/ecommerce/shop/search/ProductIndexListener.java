package edu.yildiz.ecommerce.shop.search;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Keeps the index in step with the database. Runs after the change has committed. A failure to reach
 * Elasticsearch is logged and does not affect the product API call; a full reindex repairs the index later.
 */
@Component
public class ProductIndexListener {

    private static final Logger log = LoggerFactory.getLogger(ProductIndexListener.class);

    private final ProductIndexGateway gateway;
    private final ProductDocumentMapper mapper;

    public ProductIndexListener(ProductIndexGateway gateway, ProductDocumentMapper mapper) {
        this.gateway = gateway;
        this.mapper = mapper;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void productChanged(ProductIndexEvent event) {
        try {
            if (event.change() == ProductIndexEvent.Change.REMOVED) {
                gateway.deleteDocument(event.productId());
            } else {
                gateway.indexDocument(mapper.toDocument(event.product()));
            }
        } catch (RuntimeException e) {
            log.warn("Product {} was saved but the search index was not updated: {}", event.productId(),
                    e.getMessage());
        }
    }
}
