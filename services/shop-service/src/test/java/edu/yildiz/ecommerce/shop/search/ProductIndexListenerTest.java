package edu.yildiz.ecommerce.shop.search;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;

import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import edu.yildiz.ecommerce.shop.domain.Product;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

class ProductIndexListenerTest {

    private final ProductIndexGateway gateway = mock(ProductIndexGateway.class);
    private final ProductDocumentMapper mapper = new ProductDocumentMapper(
            Clock.fixed(Instant.parse("2026-11-23T10:00:00Z"), ZoneOffset.UTC));
    private final ProductIndexListener listener = new ProductIndexListener(gateway, mapper);

    private static Product lamp() {
        return new Product(9L, "Desk Lamp", new BigDecimal("24.50"), "Electronics", "Brand A");
    }

    @Test
    void aCommittedUpdateIndexesTheProduct() {
        listener.productChanged(ProductIndexEvent.upserted(lamp()));

        verify(gateway).indexDocument(mapper.toDocument(lamp()));
    }

    @Test
    void aCommittedRemovalDeletesTheDocument() {
        listener.productChanged(ProductIndexEvent.removed(9L));

        verify(gateway).deleteDocument(9L);
        verifyNoMoreInteractions(gateway);
    }

    @Test
    void aFailingIndexIsSwallowedSoTheProductCallSucceeds() {
        doThrow(new SearchUnavailableException("index product 9", new RuntimeException("down")))
                .when(gateway).indexDocument(any());

        assertThatCode(() -> listener.productChanged(ProductIndexEvent.upserted(lamp()))).doesNotThrowAnyException();
    }

    @Test
    void aFailingDeleteIsSwallowedToo() {
        doThrow(new SearchUnavailableException("delete product 9", new RuntimeException("down")))
                .when(gateway).deleteDocument(9L);

        assertThatCode(() -> listener.productChanged(ProductIndexEvent.removed(9L))).doesNotThrowAnyException();
    }

    @Test
    void theListenerRunsOnlyAfterTheTransactionCommits() throws NoSuchMethodException {
        Method method = ProductIndexListener.class.getMethod("productChanged", ProductIndexEvent.class);

        TransactionalEventListener annotation = method.getAnnotation(TransactionalEventListener.class);

        assertThat(annotation).isNotNull();
        assertThat(annotation.phase()).isEqualTo(TransactionPhase.AFTER_COMMIT);
    }

    @Test
    void aRemovalEventCarriesNoProduct() {
        ProductIndexEvent event = ProductIndexEvent.removed(5L);

        assertThat(event.change()).isEqualTo(ProductIndexEvent.Change.REMOVED);
        assertThat(event.product()).isNull();
    }
}
