package edu.yildiz.ecommerce.shop.search;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import edu.yildiz.ecommerce.shop.dto.SearchDtos.ProductSearchResponse;
import edu.yildiz.ecommerce.shop.dto.SearchDtos.Suggestion;
import edu.yildiz.ecommerce.shop.dto.SearchDtos.SuggestionType;
import org.springframework.stereotype.Service;

@Service
public class ProductSearchService {

    static final int MIN_SUGGEST_LENGTH = 2;
    static final int MAX_SUGGESTIONS = 8;

    private final ProductIndexGateway gateway;

    public ProductSearchService(ProductIndexGateway gateway) {
        this.gateway = gateway;
    }

    public ProductSearchResponse search(ProductSearchCriteria criteria) {
        return gateway.search(criteria);
    }

    /**
     * Up to eight distinct suggestions: matching categories first, then brands, then product names. Texts shorter
     * than two characters get no suggestions.
     */
    public List<Suggestion> suggest(String text, SearchLanguage language, int size) {
        String prefix = text == null ? "" : text.trim();
        if (prefix.codePointCount(0, prefix.length()) < MIN_SUGGEST_LENGTH) {
            return List.of();
        }
        int limit = Math.clamp(size, 1, MAX_SUGGESTIONS);
        Map<String, Suggestion> suggestions = new LinkedHashMap<>();
        CategoryNames.matching(prefix, language)
                .forEach(label -> add(suggestions, new Suggestion(label, SuggestionType.CATEGORY)));
        gateway.suggestBrands(prefix, limit)
                .forEach(brand -> add(suggestions, new Suggestion(brand, SuggestionType.BRAND)));
        gateway.suggestProductNames(prefix, limit)
                .forEach(name -> add(suggestions, new Suggestion(name, SuggestionType.PRODUCT)));
        return suggestions.values().stream().limit(limit).toList();
    }

    private static void add(Map<String, Suggestion> suggestions, Suggestion suggestion) {
        String key = suggestion.type() + ":" + suggestion.text().toLowerCase(Locale.ROOT);
        suggestions.putIfAbsent(key, suggestion);
    }
}
