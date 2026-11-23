package edu.yildiz.ecommerce.shop.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import edu.yildiz.ecommerce.shop.dto.SearchDtos.FacetTerm;
import edu.yildiz.ecommerce.shop.dto.SearchDtos.PriceRange;
import edu.yildiz.ecommerce.shop.dto.SearchDtos.ProductHit;
import edu.yildiz.ecommerce.shop.dto.SearchDtos.ProductSearchResponse;
import edu.yildiz.ecommerce.shop.dto.SearchDtos.ReindexState;
import edu.yildiz.ecommerce.shop.dto.SearchDtos.ReindexStatus;
import edu.yildiz.ecommerce.shop.dto.SearchDtos.SearchFacets;
import edu.yildiz.ecommerce.shop.dto.SearchDtos.Suggestion;
import edu.yildiz.ecommerce.shop.dto.SearchDtos.SuggestionType;
import edu.yildiz.ecommerce.shop.search.ProductReindexService;
import edu.yildiz.ecommerce.shop.search.ProductSearchCriteria;
import edu.yildiz.ecommerce.shop.search.ProductSearchService;
import edu.yildiz.ecommerce.shop.search.SearchLanguage;
import edu.yildiz.ecommerce.shop.search.SearchSort;
import edu.yildiz.ecommerce.shop.search.SearchUnavailableException;
import edu.yildiz.ecommerce.shop.service.ConflictException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class SearchControllerTest {

    private final ProductSearchService search = mock(ProductSearchService.class);
    private final ProductReindexService reindex = mock(ProductReindexService.class);
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(new SearchController(search, reindex))
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
    }

    private static ProductSearchResponse oneHit() {
        ProductHit hit = new ProductHit(5001L, "Desk Lamp", new BigDecimal("24.50"), "Electronics", "Elektronik",
                "Brand A", 2.5);
        SearchFacets facets = new SearchFacets(List.of(new FacetTerm("Electronics", 1)),
                List.of(new FacetTerm("Brand A", 1)),
                new PriceRange(new BigDecimal("24.50"), new BigDecimal("24.50")));
        return new ProductSearchResponse(List.of(hit), 1, 0, 20, facets);
    }

    @Test
    void searchAnswersWithHitsAndFacets() throws Exception {
        when(search.search(any(ProductSearchCriteria.class))).thenReturn(oneHit());

        mvc.perform(get("/api/shop/search/products").param("q", "lamp"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].name").value("Desk Lamp"))
                .andExpect(jsonPath("$.content[0].categoryLabel").value("Elektronik"))
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.facets.categories[0].value").value("Electronics"))
                .andExpect(jsonPath("$.facets.price.max").value(24.5));
    }

    @Test
    void anUnknownSortIsABadRequest() throws Exception {
        mvc.perform(get("/api/shop/search/products").param("sort", "password"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail", containsString("sort must be")));
    }

    @Test
    void anUnknownLanguageIsABadRequest() throws Exception {
        mvc.perform(get("/api/shop/search/products").param("lang", "de"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("lang must be en or tr"));
    }

    @Test
    void aNegativePageIsABadRequest() throws Exception {
        mvc.perform(get("/api/shop/search/products").param("page", "-1"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void aPriceThatIsNotANumberIsABadRequest() throws Exception {
        mvc.perform(get("/api/shop/search/products").param("minPrice", "cheap"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Invalid value for parameter minPrice"));
    }

    @Test
    void anInvertedPriceRangeIsABadRequest() throws Exception {
        mvc.perform(get("/api/shop/search/products").param("minPrice", "50").param("maxPrice", "10"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void pagesBeyondTheResultWindowAreABadRequest() throws Exception {
        mvc.perform(get("/api/shop/search/products").param("page", "500").param("size", "100"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void anUnavailableElasticsearchAnswersServiceUnavailable() throws Exception {
        when(search.search(any(ProductSearchCriteria.class)))
                .thenThrow(new SearchUnavailableException("search", new RuntimeException("refused")));

        mvc.perform(get("/api/shop/search/products"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.detail").value("The search service is unavailable"));
    }

    @Test
    void suggestAnswersTheTypedSuggestions() throws Exception {
        when(search.suggest("la", SearchLanguage.EN, 8))
                .thenReturn(List.of(new Suggestion("Desk Lamp", SuggestionType.PRODUCT)));

        mvc.perform(get("/api/shop/search/suggest").param("q", "la"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].text").value("Desk Lamp"))
                .andExpect(jsonPath("$[0].type").value("PRODUCT"));
    }

    @Test
    void suggestRejectsAnUnknownLanguage() throws Exception {
        mvc.perform(get("/api/shop/search/suggest").param("q", "la").param("lang", "fr"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void startingAReindexAnswersAccepted() throws Exception {
        when(reindex.start()).thenReturn(new ReindexStatus(ReindexState.RUNNING, 0, 100_000, Instant.EPOCH, null,
                null));

        mvc.perform(post("/api/shop/search/reindex"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.state").value("RUNNING"))
                .andExpect(jsonPath("$.total").value(100000));
    }

    @Test
    void startingAReindexWhileOneRunsAnswersConflict() throws Exception {
        when(reindex.start()).thenThrow(new ConflictException("A product reindex is already running"));

        mvc.perform(post("/api/shop/search/reindex")).andExpect(status().isConflict());
    }

    @Test
    void reindexStatusReportsTheLastRun() throws Exception {
        when(reindex.status()).thenReturn(ReindexStatus.idle());

        mvc.perform(get("/api/shop/search/reindex"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.state").value("IDLE"))
                .andExpect(jsonPath("$.indexed").value(0));
    }

    @Test
    void theRequestParametersReachTheCriteria() throws Exception {
        when(search.search(any(ProductSearchCriteria.class))).thenReturn(oneHit());
        ArgumentCaptor<ProductSearchCriteria> captured = ArgumentCaptor.forClass(ProductSearchCriteria.class);

        mvc.perform(get("/api/shop/search/products").param("q", "lamp").param("lang", "tr").param("size", "500")
                        .param("category", "Books,Grocery").param("sort", "priceAsc"))
                .andExpect(status().isOk());

        verify(search).search(captured.capture());
        assertThat(captured.getValue().query()).isEqualTo("lamp");
        assertThat(captured.getValue().language()).isEqualTo(SearchLanguage.TR);
        assertThat(captured.getValue().size()).isEqualTo(100);
        assertThat(captured.getValue().categories()).containsExactly("Books", "Grocery");
        assertThat(captured.getValue().sort()).isEqualTo(SearchSort.PRICE_ASC);
    }
}
