package edu.yildiz.ecommerce.shop.search;

import java.util.List;

import edu.yildiz.ecommerce.shop.dto.SearchDtos.ProductSearchResponse;

/**
 * Everything the service needs from the search index. Services and tests depend on this interface only; the
 * Elasticsearch client is hidden behind {@link ElasticsearchProductIndexGateway}. Failures to reach the cluster
 * surface as {@link SearchUnavailableException}.
 */
public interface ProductIndexGateway {

    /** Writes one product, replacing the document with the same id. Goes through the alias. */
    void indexDocument(ProductDocument document);

    /** Removes the document of one product through the alias. A missing document is not an error. */
    void deleteDocument(long productId);

    /** Writes many products into one physical index version in one bulk request. */
    void bulkIndex(String indexName, List<ProductDocument> documents);

    /** Creates an empty physical index with the product settings and mapping. */
    void createIndexVersion(String indexName);

    /**
     * Points the alias at the new index in one atomic step and removes it from the previous indices. The new index
     * is refreshed first, so its documents are searchable when the alias moves.
     */
    void switchAlias(String newIndex, List<String> previousIndices);

    void deleteIndex(String indexName);

    boolean aliasExists();

    /** Physical indices the alias points at; empty when the alias does not exist. */
    List<String> indicesBehindAlias();

    long documentCount();

    ProductSearchResponse search(ProductSearchCriteria criteria);

    /** Names of products whose name starts with the text, best matches first. */
    List<String> suggestProductNames(String text, int size);

    /** Brands that start with the text, written as they are stored on the products. */
    List<String> suggestBrands(String text, int size);
}
