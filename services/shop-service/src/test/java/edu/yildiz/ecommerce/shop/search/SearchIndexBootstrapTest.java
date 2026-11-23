package edu.yildiz.ecommerce.shop.search;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import edu.yildiz.ecommerce.shop.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.springframework.boot.ApplicationArguments;

class SearchIndexBootstrapTest {

    private final ProductIndexGateway gateway = mock(ProductIndexGateway.class);
    private final ProductRepository products = mock(ProductRepository.class);
    private final ProductReindexService reindex = mock(ProductReindexService.class);
    private final SearchIndexBootstrap bootstrap = new SearchIndexBootstrap(gateway, products, reindex);

    @Test
    void aMissingAliasStartsAReindex() throws Exception {
        when(gateway.aliasExists()).thenReturn(false);

        bootstrap.run(mock(ApplicationArguments.class));

        verify(reindex).start();
    }

    @Test
    void anEmptyIndexOverAFilledTableStartsAReindex() throws Exception {
        when(gateway.aliasExists()).thenReturn(true);
        when(gateway.documentCount()).thenReturn(0L);
        when(products.count()).thenReturn(100_000L);

        bootstrap.run(mock(ApplicationArguments.class));

        verify(reindex).start();
    }

    @Test
    void anIndexThatHoldsDocumentsIsLeftAlone() throws Exception {
        when(gateway.aliasExists()).thenReturn(true);
        when(gateway.documentCount()).thenReturn(5L);

        bootstrap.run(mock(ApplicationArguments.class));

        verify(reindex, never()).start();
    }

    @Test
    void anEmptyIndexOverAnEmptyTableIsLeftAlone() throws Exception {
        when(gateway.aliasExists()).thenReturn(true);
        when(gateway.documentCount()).thenReturn(0L);
        when(products.count()).thenReturn(0L);

        bootstrap.run(mock(ApplicationArguments.class));

        verify(reindex, never()).start();
    }

    @Test
    void anUnreachableElasticsearchDoesNotStopTheStartup() {
        when(gateway.aliasExists()).thenThrow(new SearchUnavailableException("alias check",
                new RuntimeException("connection refused")));

        assertThatCode(() -> bootstrap.run(mock(ApplicationArguments.class))).doesNotThrowAnyException();
        verify(reindex, never()).start();
    }
}
