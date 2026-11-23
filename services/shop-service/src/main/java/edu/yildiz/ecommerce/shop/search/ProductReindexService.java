package edu.yildiz.ecommerce.shop.search;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.ExecutorService;

import edu.yildiz.ecommerce.shop.domain.Product;
import edu.yildiz.ecommerce.shop.dto.SearchDtos.ReindexState;
import edu.yildiz.ecommerce.shop.dto.SearchDtos.ReindexStatus;
import edu.yildiz.ecommerce.shop.repository.ProductRepository;
import edu.yildiz.ecommerce.shop.service.ConflictException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

/**
 * Rebuilds the product index from the database. Each run writes a new physical index version, bulk loads every
 * product in pages, then moves the alias to the new version and drops the old one. Only one run is allowed at a time.
 */
@Service
public class ProductReindexService {

    static final int BATCH_SIZE = 2000;

    private static final Logger log = LoggerFactory.getLogger(ProductReindexService.class);

    private final ProductRepository products;
    private final ProductIndexGateway gateway;
    private final ProductDocumentMapper mapper;
    private final ExecutorService executor;
    private final Clock clock;
    private ReindexStatus status = ReindexStatus.idle();

    public ProductReindexService(ProductRepository products, ProductIndexGateway gateway,
                                 ProductDocumentMapper mapper, ExecutorService executor, Clock clock) {
        this.products = products;
        this.gateway = gateway;
        this.mapper = mapper;
        this.executor = executor;
        this.clock = clock;
    }

    /**
     * Starts a reindex on the background worker and returns its initial status.
     *
     * @throws ConflictException when a reindex is already running
     */
    public synchronized ReindexStatus start() {
        if (status.state() == ReindexState.RUNNING) {
            throw new ConflictException("A product reindex is already running");
        }
        long total = products.count();
        status = new ReindexStatus(ReindexState.RUNNING, 0, total, Instant.now(clock), null, null);
        executor.execute(this::runReindex);
        return status;
    }

    public synchronized ReindexStatus status() {
        return status;
    }

    private void runReindex() {
        String indexName = ProductIndexSchema.newVersionName(Instant.now(clock));
        try {
            gateway.createIndexVersion(indexName);
            copyProducts(indexName);
            List<String> previous = gateway.indicesBehindAlias();
            gateway.switchAlias(indexName, previous);
            previous.forEach(this::dropIndex);
            finish(ReindexState.SUCCESS, null);
            log.info("Product reindex finished into {}", indexName);
        } catch (RuntimeException e) {
            log.error("Product reindex into {} failed", indexName, e);
            dropIndex(indexName);
            finish(ReindexState.FAILED, "The reindex failed, see the service log");
        }
    }

    private void copyProducts(String indexName) {
        long indexed = 0;
        int pageNumber = 0;
        Page<Product> page;
        do {
            page = products.findAll(PageRequest.of(pageNumber++, BATCH_SIZE, Sort.by("id")));
            List<ProductDocument> documents = page.getContent().stream().map(mapper::toDocument).toList();
            if (!documents.isEmpty()) {
                gateway.bulkIndex(indexName, documents);
                indexed += documents.size();
                updateProgress(indexed);
            }
        } while (page.hasNext());
    }

    private void dropIndex(String indexName) {
        try {
            gateway.deleteIndex(indexName);
        } catch (RuntimeException e) {
            log.warn("Could not delete index {}: {}", indexName, e.getMessage());
        }
    }

    private synchronized void updateProgress(long indexed) {
        status = status.withIndexed(indexed);
    }

    private synchronized void finish(ReindexState state, String message) {
        status = new ReindexStatus(state, status.indexed(), status.total(), status.startedAt(), Instant.now(clock),
                message);
    }
}
