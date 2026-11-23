package edu.yildiz.ecommerce.shop.search;

import static edu.yildiz.ecommerce.shop.search.ProductIndexSchema.ALIAS;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.ElasticsearchException;
import co.elastic.clients.elasticsearch._types.aggregations.Aggregate;
import co.elastic.clients.elasticsearch._types.aggregations.StatsAggregate;
import co.elastic.clients.elasticsearch._types.aggregations.StringTermsBucket;
import co.elastic.clients.elasticsearch.core.BulkResponse;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.elasticsearch.core.bulk.BulkOperation;
import co.elastic.clients.elasticsearch.core.search.Hit;
import co.elastic.clients.elasticsearch.indices.update_aliases.Action;
import co.elastic.clients.json.JsonData;
import edu.yildiz.ecommerce.shop.dto.SearchDtos.FacetTerm;
import edu.yildiz.ecommerce.shop.dto.SearchDtos.PriceRange;
import edu.yildiz.ecommerce.shop.dto.SearchDtos.ProductHit;
import edu.yildiz.ecommerce.shop.dto.SearchDtos.ProductSearchResponse;
import edu.yildiz.ecommerce.shop.dto.SearchDtos.SearchFacets;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * The only class that talks to Elasticsearch. Typed client calls are made here and their results are mapped to the
 * application's own shapes.
 */
@Component
public class ElasticsearchProductIndexGateway implements ProductIndexGateway {

    private static final Logger log = LoggerFactory.getLogger(ElasticsearchProductIndexGateway.class);

    private final ElasticsearchClient client;
    private final ProductSearchQueryFactory queries = new ProductSearchQueryFactory();

    public ElasticsearchProductIndexGateway(ElasticsearchClient client) {
        this.client = client;
    }

    @Override
    public void indexDocument(ProductDocument document) {
        perform("index product " + document.id(), () -> client.index(request -> request
                .index(ALIAS)
                .id(String.valueOf(document.id()))
                .document(document)));
    }

    @Override
    public void deleteDocument(long productId) {
        perform("delete product " + productId, () -> client.delete(request -> request
                .index(ALIAS)
                .id(String.valueOf(productId))));
    }

    @Override
    public void bulkIndex(String indexName, List<ProductDocument> documents) {
        List<BulkOperation> operations = documents.stream()
                .map(document -> BulkOperation.of(operation -> operation.index(index -> index
                        .id(String.valueOf(document.id()))
                        .document(document))))
                .toList();
        BulkResponse response = execute("bulk index into " + indexName,
                () -> client.bulk(request -> request.index(indexName).operations(operations)));
        if (response.errors()) {
            throw new IllegalStateException("Bulk indexing into " + indexName + " reported failed items");
        }
    }

    @Override
    public void createIndexVersion(String indexName) {
        perform("create index " + indexName,
                () -> client.indices().create(ProductIndexSchema.createRequest(indexName)));
    }

    @Override
    public void switchAlias(String newIndex, List<String> previousIndices) {
        perform("refresh index " + newIndex, () -> client.indices().refresh(request -> request.index(newIndex)));
        List<Action> actions = new ArrayList<>();
        for (String previous : previousIndices) {
            actions.add(Action.of(action -> action.remove(remove -> remove.index(previous).alias(ALIAS))));
        }
        actions.add(Action.of(action -> action.add(add -> add.index(newIndex).alias(ALIAS))));
        perform("switch alias " + ALIAS, () -> client.indices().updateAliases(request -> request.actions(actions)));
    }

    @Override
    public void deleteIndex(String indexName) {
        perform("delete index " + indexName, () -> client.indices().delete(request -> request.index(indexName)));
    }

    @Override
    public boolean aliasExists() {
        return execute("alias check", () -> client.indices().existsAlias(request -> request.name(ALIAS)).value());
    }

    @Override
    public List<String> indicesBehindAlias() {
        if (!aliasExists()) {
            return List.of();
        }
        return execute("alias lookup",
                () -> List.copyOf(client.indices().getAlias(request -> request.name(ALIAS)).aliases().keySet()));
    }

    @Override
    public long documentCount() {
        return execute("count", () -> client.count(request -> request.index(ALIAS)).count());
    }

    @Override
    public ProductSearchResponse search(ProductSearchCriteria criteria) {
        SearchResponse<ProductDocument> response = execute("search",
                () -> client.search(queries.search(criteria), ProductDocument.class));
        List<ProductHit> content = response.hits().hits().stream()
                .filter(hit -> hit.source() != null)
                .map(hit -> toHit(hit, criteria.language()))
                .toList();
        long total = response.hits().total() == null ? 0 : response.hits().total().value();
        return new ProductSearchResponse(content, total, criteria.page(), criteria.size(),
                facets(response.aggregations()));
    }

    @Override
    public List<String> suggestProductNames(String text, int size) {
        SearchResponse<ProductDocument> response = execute("suggest products",
                () -> client.search(queries.suggestProducts(text, size), ProductDocument.class));
        return response.hits().hits().stream()
                .map(Hit::source)
                .filter(Objects::nonNull)
                .map(ProductDocument::name)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
    }

    @Override
    public List<String> suggestBrands(String text, int size) {
        SearchResponse<ProductDocument> response = execute("suggest brands",
                () -> client.search(queries.suggestBrands(text, size), ProductDocument.class));
        return response.aggregations().get(ProductSearchQueryFactory.BRANDS).sterms().buckets().array().stream()
                .map(ElasticsearchProductIndexGateway::brandName)
                .toList();
    }

    private static ProductHit toHit(Hit<ProductDocument> hit, SearchLanguage language) {
        ProductDocument document = hit.source();
        return new ProductHit(document.id(), document.name(), document.price(), document.category(),
                CategoryNames.label(document.category(), language), document.brand(), hit.score());
    }

    private static SearchFacets facets(Map<String, Aggregate> aggregations) {
        List<FacetTerm> categories = aggregations.get(ProductSearchQueryFactory.CATEGORIES).sterms().buckets().array()
                .stream()
                .map(bucket -> new FacetTerm(bucket.key().stringValue(), bucket.docCount()))
                .toList();
        List<FacetTerm> brands = aggregations.get(ProductSearchQueryFactory.BRANDS).sterms().buckets().array()
                .stream()
                .map(bucket -> new FacetTerm(brandName(bucket), bucket.docCount()))
                .toList();
        return new SearchFacets(categories, brands, priceRange(aggregations.get(ProductSearchQueryFactory.PRICE_STATS)
                .stats()));
    }

    private static PriceRange priceRange(StatsAggregate stats) {
        if (stats.count() == 0) {
            return new PriceRange(null, null);
        }
        return new PriceRange(BigDecimal.valueOf(stats.min()), BigDecimal.valueOf(stats.max()));
    }

    /** The brand as it was written, taken from the sample hit of the bucket; the bucket key is only lowercase. */
    private static String brandName(StringTermsBucket bucket) {
        Aggregate sample = bucket.aggregations().get(ProductSearchQueryFactory.BRAND_SAMPLE);
        if (sample != null) {
            List<Hit<JsonData>> hits = sample.topHits().hits().hits();
            if (!hits.isEmpty() && hits.get(0).source() != null) {
                String brand = hits.get(0).source().to(ProductDocument.class).brand();
                if (brand != null) {
                    return brand;
                }
            }
        }
        return bucket.key().stringValue();
    }

    private <T> T execute(String operation, ElasticCall<T> call) {
        try {
            return call.run();
        } catch (IOException | ElasticsearchException e) {
            log.warn("Elasticsearch {} failed: {}", operation, e.getMessage());
            throw new SearchUnavailableException(operation, e);
        }
    }

    private void perform(String operation, VoidCall call) {
        execute(operation, () -> {
            call.run();
            return null;
        });
    }

    @FunctionalInterface
    private interface ElasticCall<T> {
        T run() throws IOException;
    }

    @FunctionalInterface
    private interface VoidCall {
        void run() throws IOException;
    }
}
