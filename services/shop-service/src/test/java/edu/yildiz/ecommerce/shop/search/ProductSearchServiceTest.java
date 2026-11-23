package edu.yildiz.ecommerce.shop.search;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.List;

import edu.yildiz.ecommerce.shop.dto.SearchDtos.ProductSearchResponse;
import edu.yildiz.ecommerce.shop.dto.SearchDtos.Suggestion;
import edu.yildiz.ecommerce.shop.dto.SearchDtos.SuggestionType;
import org.junit.jupiter.api.Test;

class ProductSearchServiceTest {

    private final ProductIndexGateway gateway = mock(ProductIndexGateway.class);
    private final ProductSearchService service = new ProductSearchService(gateway);

    @Test
    void aTextShorterThanTwoCharactersGetsNoSuggestionsAndNoSearch() {
        assertThat(service.suggest("l", SearchLanguage.EN, 8)).isEmpty();
        assertThat(service.suggest("  ", SearchLanguage.EN, 8)).isEmpty();
        verifyNoInteractions(gateway);
    }

    @Test
    void suggestionsListCategoriesThenBrandsThenProducts() {
        when(gateway.suggestBrands(anyString(), anyInt())).thenReturn(List.of("Brand E"));
        when(gateway.suggestProductNames(anyString(), anyInt())).thenReturn(List.of("electro kettle"));

        List<Suggestion> suggestions = service.suggest("ele", SearchLanguage.EN, 8);

        assertThat(suggestions).containsExactly(
                new Suggestion("Electronics", SuggestionType.CATEGORY),
                new Suggestion("Brand E", SuggestionType.BRAND),
                new Suggestion("electro kettle", SuggestionType.PRODUCT));
    }

    @Test
    void categorySuggestionsUseTheTurkishLabelForTurkishRequests() {
        when(gateway.suggestBrands(anyString(), anyInt())).thenReturn(List.of());
        when(gateway.suggestProductNames(anyString(), anyInt())).thenReturn(List.of());

        List<Suggestion> suggestions = service.suggest("ele", SearchLanguage.TR, 8);

        assertThat(suggestions).containsExactly(new Suggestion("Elektronik", SuggestionType.CATEGORY));
    }

    @Test
    void duplicateTextsOfTheSameTypeAppearOnce() {
        when(gateway.suggestBrands(anyString(), anyInt())).thenReturn(List.of());
        when(gateway.suggestProductNames(anyString(), anyInt())).thenReturn(List.of("Desk Lamp", "desk lamp"));

        List<Suggestion> suggestions = service.suggest("desk", SearchLanguage.EN, 8);

        assertThat(suggestions).containsExactly(new Suggestion("Desk Lamp", SuggestionType.PRODUCT));
    }

    @Test
    void theNumberOfSuggestionsIsCappedAtEightAndFollowsTheRequestedSize() {
        when(gateway.suggestBrands(anyString(), anyInt())).thenReturn(List.of());
        when(gateway.suggestProductNames(anyString(), anyInt())).thenReturn(
                List.of("a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8", "a9", "a10"));

        assertThat(service.suggest("aa", SearchLanguage.EN, 50)).hasSize(8);
        assertThat(service.suggest("aa", SearchLanguage.EN, 3)).hasSize(3);
    }

    @Test
    void searchDelegatesToTheGateway() {
        ProductSearchResponse response = new ProductSearchResponse(List.of(), 0, 0, 20, null);
        when(gateway.search(any(ProductSearchCriteria.class))).thenReturn(response);

        ProductSearchResponse result = service.search(ProductSearchCriteria.of(
                "lamp", "en", null, null, null, null, null, 0, 20));

        assertThat(result).isSameAs(response);
    }
}
