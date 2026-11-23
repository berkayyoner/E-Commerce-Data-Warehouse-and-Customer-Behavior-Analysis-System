package edu.yildiz.ecommerce.shop.search;

import edu.yildiz.ecommerce.shop.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Prepares the search index when the service starts. A missing alias or an empty index over a non-empty product
 * table starts a full reindex in the background. An unreachable Elasticsearch is logged and does not stop the start.
 */
@Component
public class SearchIndexBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SearchIndexBootstrap.class);

    private final ProductIndexGateway gateway;
    private final ProductRepository products;
    private final ProductReindexService reindex;

    public SearchIndexBootstrap(ProductIndexGateway gateway, ProductRepository products,
                                ProductReindexService reindex) {
        this.gateway = gateway;
        this.products = products;
        this.reindex = reindex;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            boolean missing = !gateway.aliasExists();
            if (missing || (gateway.documentCount() == 0 && products.count() > 0)) {
                reindex.start();
                log.info("Product search index is missing or empty, started a full reindex");
            }
        } catch (RuntimeException e) {
            log.warn("Product search index is not ready, search answers 503 until it is: {}", e.getMessage());
        }
    }
}
