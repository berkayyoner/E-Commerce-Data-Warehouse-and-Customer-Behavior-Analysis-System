package edu.yildiz.ecommerce.shop.web;

import java.math.BigDecimal;
import java.util.List;

import edu.yildiz.ecommerce.shop.dto.SearchDtos.ProductSearchResponse;
import edu.yildiz.ecommerce.shop.dto.SearchDtos.ReindexStatus;
import edu.yildiz.ecommerce.shop.dto.SearchDtos.Suggestion;
import edu.yildiz.ecommerce.shop.search.ProductReindexService;
import edu.yildiz.ecommerce.shop.search.ProductSearchCriteria;
import edu.yildiz.ecommerce.shop.search.ProductSearchService;
import edu.yildiz.ecommerce.shop.search.SearchLanguage;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/shop/search")
public class SearchController {

    private final ProductSearchService search;
    private final ProductReindexService reindex;

    public SearchController(ProductSearchService search, ProductReindexService reindex) {
        this.search = search;
        this.reindex = reindex;
    }

    @GetMapping("/products")
    public ProductSearchResponse products(@RequestParam(defaultValue = "") String q,
                                          @RequestParam(defaultValue = "en") String lang,
                                          @RequestParam(required = false) String category,
                                          @RequestParam(required = false) String brand,
                                          @RequestParam(required = false) BigDecimal minPrice,
                                          @RequestParam(required = false) BigDecimal maxPrice,
                                          @RequestParam(defaultValue = "relevance") String sort,
                                          @RequestParam(defaultValue = "0") int page,
                                          @RequestParam(defaultValue = "20") int size) {
        return search.search(ProductSearchCriteria.of(q, lang, category, brand, minPrice, maxPrice, sort, page,
                size));
    }

    @GetMapping("/suggest")
    public List<Suggestion> suggest(@RequestParam(defaultValue = "") String q,
                                    @RequestParam(defaultValue = "en") String lang,
                                    @RequestParam(defaultValue = "8") int size) {
        return search.suggest(q, SearchLanguage.of(lang), size);
    }

    /** Starts a full reindex in the background and answers 202 with its initial status. */
    @PostMapping("/reindex")
    public ResponseEntity<ReindexStatus> startReindex() {
        return ResponseEntity.accepted().body(reindex.start());
    }

    @GetMapping("/reindex")
    public ReindexStatus reindexStatus() {
        return reindex.status();
    }
}
