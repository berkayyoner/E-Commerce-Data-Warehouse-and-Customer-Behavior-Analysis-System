package edu.yildiz.ecommerce.shop.search;

import java.time.Instant;
import java.util.List;

import co.elastic.clients.elasticsearch._types.analysis.LowercaseTokenFilterLanguages;
import co.elastic.clients.elasticsearch._types.analysis.TokenChar;
import co.elastic.clients.elasticsearch._types.mapping.TypeMapping;
import co.elastic.clients.elasticsearch.indices.CreateIndexRequest;
import co.elastic.clients.elasticsearch.indices.IndexSettings;

/**
 * Layout of the product search index: the alias the service reads, the physical index versions behind it,
 * the analyzers and the field mapping.
 */
public final class ProductIndexSchema {

    /** The name the search reads from. It points at the newest physical index version. */
    public static final String ALIAS = "shop-products";

    static final String VERSION_PREFIX = "shop-products-v";

    public static final String ID = "id";
    public static final String NAME = "name";
    public static final String NAME_PREFIX = "name.prefix";
    public static final String NAME_RAW = "name.raw";
    public static final String CATEGORY = "category";
    public static final String CATEGORY_TEXT = "category.text";
    public static final String CATEGORY_TR = "categoryTr";
    public static final String BRAND = "brand";
    public static final String BRAND_TEXT = "brand.text";
    public static final String PRICE = "price";
    public static final String INDEXED_AT = "indexedAt";

    static final String PREFIX_TOKENIZER = "product_prefix_tokenizer";
    static final String PREFIX_INDEX_ANALYZER = "product_prefix_index";
    static final String PREFIX_SEARCH_ANALYZER = "product_prefix_search";
    static final String TURKISH_ANALYZER = "product_turkish";
    static final String TURKISH_LOWERCASE = "product_turkish_lowercase";
    static final String TURKISH_STEMMER = "product_turkish_stemmer";
    static final String LOWERCASE_NORMALIZER = "product_lowercase";
    static final String ENGLISH_ANALYZER = "english";

    static final int PREFIX_MIN_GRAM = 2;
    static final int PREFIX_MAX_GRAM = 15;
    static final int KEYWORD_IGNORE_ABOVE = 64;
    static final double PRICE_SCALING_FACTOR = 100d;

    private ProductIndexSchema() {
    }

    /** Name of a physical index version, unique per start of a reindex. */
    public static String newVersionName(Instant when) {
        return VERSION_PREFIX + when.toEpochMilli();
    }

    /** The request that creates an empty index with the product settings and mapping. */
    public static CreateIndexRequest createRequest(String indexName) {
        return CreateIndexRequest.of(request -> request
                .index(indexName)
                .settings(settings())
                .mappings(mapping()));
    }

    private static IndexSettings settings() {
        return IndexSettings.of(settings -> settings
                .numberOfShards("1")
                .numberOfReplicas("0")
                .maxNgramDiff(PREFIX_MAX_GRAM - PREFIX_MIN_GRAM)
                .analysis(analysis -> analysis
                        .tokenizer(PREFIX_TOKENIZER, tokenizer -> tokenizer.definition(definition -> definition
                                .edgeNgram(edge -> edge
                                        .minGram(PREFIX_MIN_GRAM)
                                        .maxGram(PREFIX_MAX_GRAM)
                                        .tokenChars(List.of(TokenChar.Letter, TokenChar.Digit)))))
                        .analyzer(PREFIX_INDEX_ANALYZER, analyzer -> analyzer.custom(custom -> custom
                                .tokenizer(PREFIX_TOKENIZER)
                                .filter(List.of("lowercase"))))
                        .analyzer(PREFIX_SEARCH_ANALYZER, analyzer -> analyzer.custom(custom -> custom
                                .tokenizer("standard")
                                .filter(List.of("lowercase"))))
                        .filter(TURKISH_LOWERCASE, filter -> filter.definition(definition -> definition
                                .lowercase(lowercase -> lowercase.language(LowercaseTokenFilterLanguages.Turkish))))
                        .filter(TURKISH_STEMMER, filter -> filter.definition(definition -> definition
                                .stemmer(stemmer -> stemmer.language("turkish"))))
                        .analyzer(TURKISH_ANALYZER, analyzer -> analyzer.custom(custom -> custom
                                .tokenizer("standard")
                                .filter(List.of(TURKISH_LOWERCASE, "asciifolding", TURKISH_STEMMER))))
                        .normalizer(LOWERCASE_NORMALIZER, normalizer -> normalizer.custom(custom -> custom
                                .filter(List.of("lowercase"))))));
    }

    private static TypeMapping mapping() {
        return TypeMapping.of(mapping -> mapping
                .properties(ID, property -> property.long_(number -> number))
                .properties(NAME, property -> property.text(text -> text
                        .analyzer(ENGLISH_ANALYZER)
                        .fields("prefix", field -> field.text(prefix -> prefix
                                .analyzer(PREFIX_INDEX_ANALYZER)
                                .searchAnalyzer(PREFIX_SEARCH_ANALYZER)))
                        .fields("raw", field -> field.keyword(raw -> raw.ignoreAbove(KEYWORD_IGNORE_ABOVE)))))
                .properties(CATEGORY, property -> property.keyword(keyword -> keyword
                        .fields("text", field -> field.text(text -> text.analyzer(ENGLISH_ANALYZER)))))
                .properties(CATEGORY_TR, property -> property.text(text -> text
                        .analyzer(TURKISH_ANALYZER)
                        .fields("raw", field -> field.keyword(raw -> raw.ignoreAbove(KEYWORD_IGNORE_ABOVE)))))
                .properties(BRAND, property -> property.keyword(keyword -> keyword
                        .normalizer(LOWERCASE_NORMALIZER)
                        .fields("text", field -> field.text(text -> text.analyzer(ENGLISH_ANALYZER)))))
                .properties(PRICE, property -> property.scaledFloat(scaled -> scaled
                        .scalingFactor(PRICE_SCALING_FACTOR)))
                .properties(INDEXED_AT, property -> property.date(date -> date)));
    }
}
