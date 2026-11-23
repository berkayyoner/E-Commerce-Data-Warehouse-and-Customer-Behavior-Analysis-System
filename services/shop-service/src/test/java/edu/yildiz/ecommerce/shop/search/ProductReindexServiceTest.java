package edu.yildiz.ecommerce.shop.search;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.stream.IntStream;

import edu.yildiz.ecommerce.shop.domain.Product;
import edu.yildiz.ecommerce.shop.dto.SearchDtos.ReindexState;
import edu.yildiz.ecommerce.shop.dto.SearchDtos.ReindexStatus;
import edu.yildiz.ecommerce.shop.repository.ProductRepository;
import edu.yildiz.ecommerce.shop.service.ConflictException;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.Mockito;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

class ProductReindexServiceTest {

    private static final Instant NOW = Instant.parse("2026-11-23T10:00:00Z");

    private final ProductRepository products = mock(ProductRepository.class);
    private final ProductIndexGateway gateway = mock(ProductIndexGateway.class);
    private final ExecutorService executor = mock(ExecutorService.class);
    private final Clock clock = Clock.fixed(NOW, ZoneOffset.UTC);
    private final ProductReindexService service = new ProductReindexService(products, gateway,
            new ProductDocumentMapper(clock), executor, clock);

    private static List<Product> products(int count) {
        return IntStream.rangeClosed(1, count)
                .mapToObj(id -> new Product((long) id, "Item " + id, new BigDecimal("3.00"), "Grocery", "Brand A"))
                .toList();
    }

    private Runnable startAndCaptureWork() {
        service.start();
        ArgumentCaptor<Runnable> work = ArgumentCaptor.forClass(Runnable.class);
        verify(executor).execute(work.capture());
        return work.getValue();
    }

    @Test
    void theStatusIsIdleBeforeAnyReindex() {
        assertThat(service.status()).isEqualTo(ReindexStatus.idle());
    }

    @Test
    void startAnswersRunningWithTheTotalAndQueuesTheWork() {
        when(products.count()).thenReturn(3L);

        ReindexStatus status = service.start();

        assertThat(status.state()).isEqualTo(ReindexState.RUNNING);
        assertThat(status.total()).isEqualTo(3L);
        assertThat(status.indexed()).isZero();
        assertThat(status.startedAt()).isEqualTo(NOW);
        verify(executor).execute(Mockito.any(Runnable.class));
    }

    @Test
    void aSecondStartWhileRunningIsAConflict() {
        when(products.count()).thenReturn(3L);
        service.start();

        assertThatThrownBy(service::start).isInstanceOf(ConflictException.class);
        verify(executor).execute(any(Runnable.class));
    }

    @Test
    void aSuccessfulRunBuildsTheNewIndexThenSwitchesTheAliasThenDropsTheOldOne() {
        when(products.count()).thenReturn(3L);
        when(products.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(products(3)));
        when(gateway.indicesBehindAlias()).thenReturn(List.of("shop-products-v1"));
        Runnable work = startAndCaptureWork();

        work.run();

        String newIndex = "shop-products-v" + NOW.toEpochMilli();
        InOrder order = Mockito.inOrder(gateway);
        order.verify(gateway).createIndexVersion(newIndex);
        order.verify(gateway).bulkIndex(anyString(), any());
        order.verify(gateway).indicesBehindAlias();
        order.verify(gateway).switchAlias(newIndex, List.of("shop-products-v1"));
        order.verify(gateway).deleteIndex("shop-products-v1");
        ReindexStatus status = service.status();
        assertThat(status.state()).isEqualTo(ReindexState.SUCCESS);
        assertThat(status.indexed()).isEqualTo(3L);
        assertThat(status.finishedAt()).isEqualTo(NOW);
        assertThat(status.message()).isNull();
    }

    @Test
    void theProductsAreLoadedInPagesOfTwoThousand() {
        when(products.count()).thenReturn(2500L);
        Page<Product> first = new PageImpl<>(products(2000), PageRequest.of(0, 2000), 2500);
        Page<Product> second = new PageImpl<>(products(500), PageRequest.of(1, 2000), 2500);
        when(products.findAll(any(Pageable.class))).thenReturn(first, second);
        Runnable work = startAndCaptureWork();

        work.run();

        verify(gateway).bulkIndex(anyString(), argThatSize(2000));
        verify(gateway).bulkIndex(anyString(), argThatSize(500));
        assertThat(service.status().indexed()).isEqualTo(2500L);
    }

    @Test
    void aFailedBulkMarksTheRunFailedAndDropsTheNewIndexOnly() {
        when(products.count()).thenReturn(3L);
        when(products.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(products(3)));
        doThrow(new SearchUnavailableException("bulk index", new RuntimeException("down")))
                .when(gateway).bulkIndex(anyString(), any());
        Runnable work = startAndCaptureWork();

        work.run();

        ReindexStatus status = service.status();
        assertThat(status.state()).isEqualTo(ReindexState.FAILED);
        assertThat(status.message()).isEqualTo("The reindex failed, see the service log");
        verify(gateway).deleteIndex("shop-products-v" + NOW.toEpochMilli());
        verify(gateway, never()).switchAlias(anyString(), any());
    }

    @Test
    void aFailedAliasSwitchKeepsTheOldIndexInPlace() {
        when(products.count()).thenReturn(3L);
        when(products.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(products(3)));
        when(gateway.indicesBehindAlias()).thenReturn(List.of("shop-products-v1"));
        doThrow(new SearchUnavailableException("switch alias", new RuntimeException("down")))
                .when(gateway).switchAlias(anyString(), any());
        Runnable work = startAndCaptureWork();

        work.run();

        assertThat(service.status().state()).isEqualTo(ReindexState.FAILED);
        verify(gateway, never()).deleteIndex("shop-products-v1");
    }

    @Test
    void aNewStartIsAllowedOnceTheLastRunEnded() {
        when(products.count()).thenReturn(0L);
        when(products.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of()));
        Runnable work = startAndCaptureWork();
        work.run();

        ReindexStatus restarted = service.start();

        assertThat(restarted.state()).isEqualTo(ReindexState.RUNNING);
    }

    private static List<ProductDocument> argThatSize(int size) {
        return Mockito.argThat(documents -> documents != null && documents.size() == size);
    }
}
