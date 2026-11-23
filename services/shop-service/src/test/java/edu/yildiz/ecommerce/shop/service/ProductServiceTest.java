package edu.yildiz.ecommerce.shop.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;

import edu.yildiz.ecommerce.shop.domain.Product;
import edu.yildiz.ecommerce.shop.dto.ProductDtos.ProductRequest;
import edu.yildiz.ecommerce.shop.dto.ProductDtos.ProductView;
import edu.yildiz.ecommerce.shop.model.PageResult;
import edu.yildiz.ecommerce.shop.repository.OrderLineRepository;
import edu.yildiz.ecommerce.shop.repository.ProductRepository;
import edu.yildiz.ecommerce.shop.search.ProductIndexEvent;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

class ProductServiceTest {

    private final ProductRepository products = mock(ProductRepository.class);
    private final OrderLineRepository orderLines = mock(OrderLineRepository.class);
    private final ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);
    private final ProductService service = new ProductService(products, orderLines, events);

    private static Product product(long id, String name) {
        return new Product(id, name, new BigDecimal("12.50"), "Home", "Lumen");
    }

    @Test
    void createTakesTheNextSequenceValueAndFillsTheItemDefaults() {
        when(products.nextId()).thenReturn(5001L);
        when(products.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProductView created = service.create(new ProductRequest("Desk Lamp", new BigDecimal("24.50"), "Home", "Lumen"));

        ArgumentCaptor<Product> saved = ArgumentCaptor.forClass(Product.class);
        verify(products).save(saved.capture());
        assertThat(created.id()).isEqualTo(5001L);
        assertThat(saved.getValue().getData()).isEqualTo("Desk Lamp");
        assertThat(saved.getValue().getImageId()).isEqualTo(1L);
    }

    @Test
    void updateChangesTheFieldsAndKeepsTheId() {
        Product existing = product(7, "Old Name");
        when(products.findById(7L)).thenReturn(Optional.of(existing));

        ProductView updated = service.update(7L, new ProductRequest("New Name", new BigDecimal("30.00"), "Garden",
                "Terra"));

        assertThat(updated.id()).isEqualTo(7L);
        assertThat(updated.name()).isEqualTo("New Name");
        assertThat(updated.price()).isEqualByComparingTo(new BigDecimal("30.00"));
        assertThat(existing.getData()).isEqualTo("New Name");
    }

    @Test
    void getFailsForAnUnknownProduct() {
        when(products.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.get(99L)).isInstanceOf(NotFoundException.class);
    }

    @Test
    void deleteRefusesAProductThatAppearsInOrderLines() {
        when(products.findById(7L)).thenReturn(Optional.of(product(7, "Lamp")));
        when(orderLines.existsByItemId(7L)).thenReturn(true);

        assertThatThrownBy(() -> service.delete(7L)).isInstanceOf(ConflictException.class);
        verify(products, never()).delete(any(Product.class));
    }

    @Test
    void deleteRemovesAProductThatWasNeverOrdered() {
        Product lamp = product(8, "Lamp");
        when(products.findById(8L)).thenReturn(Optional.of(lamp));
        when(orderLines.existsByItemId(8L)).thenReturn(false);

        service.delete(8L);

        verify(products).delete(lamp);
    }

    @Test
    void createPublishesAnIndexEventForTheNewProduct() {
        when(products.nextId()).thenReturn(5002L);
        when(products.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.create(new ProductRequest("Desk Lamp", new BigDecimal("24.50"), "Home", "Lumen"));

        ArgumentCaptor<ProductIndexEvent> event = ArgumentCaptor.forClass(ProductIndexEvent.class);
        verify(events).publishEvent(event.capture());
        assertThat(event.getValue().change()).isEqualTo(ProductIndexEvent.Change.UPSERTED);
        assertThat(event.getValue().productId()).isEqualTo(5002L);
    }

    @Test
    void updatePublishesAnIndexEventWithTheChangedProduct() {
        Product existing = product(7, "Old Name");
        when(products.findById(7L)).thenReturn(Optional.of(existing));

        service.update(7L, new ProductRequest("New Name", new BigDecimal("30.00"), "Garden", "Terra"));

        ArgumentCaptor<ProductIndexEvent> event = ArgumentCaptor.forClass(ProductIndexEvent.class);
        verify(events).publishEvent(event.capture());
        assertThat(event.getValue().product().getName()).isEqualTo("New Name");
    }

    @Test
    void deletePublishesARemovalEvent() {
        when(products.findById(8L)).thenReturn(Optional.of(product(8, "Lamp")));
        when(orderLines.existsByItemId(8L)).thenReturn(false);

        service.delete(8L);

        ArgumentCaptor<ProductIndexEvent> event = ArgumentCaptor.forClass(ProductIndexEvent.class);
        verify(events).publishEvent(event.capture());
        assertThat(event.getValue().change()).isEqualTo(ProductIndexEvent.Change.REMOVED);
        assertThat(event.getValue().productId()).isEqualTo(8L);
    }

    @Test
    void aRefusedDeletePublishesNothing() {
        when(products.findById(7L)).thenReturn(Optional.of(product(7, "Lamp")));
        when(orderLines.existsByItemId(7L)).thenReturn(true);

        assertThatThrownBy(() -> service.delete(7L)).isInstanceOf(ConflictException.class);
        verify(events, never()).publishEvent(any());
    }

    @Test
    void searchClampsThePageAndTheSize() {
        when(products.search(anyString(), any(Pageable.class))).thenReturn(Page.empty());

        PageResult<ProductView> result = service.search("", "id", "asc", -3, 500);

        assertThat(result.page()).isZero();
        assertThat(result.size()).isEqualTo(100);
    }

    @Test
    void searchFallsBackToTheIdSortForAnUnknownField() {
        when(products.search(anyString(), any(Pageable.class))).thenReturn(Page.empty());

        service.search("", "password", "desc", 0, 20);

        ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
        verify(products).search(anyString(), pageable.capture());
        Sort.Order order = pageable.getValue().getSort().getOrderFor("id");
        assertThat(order).isNotNull();
        assertThat(order.getDirection()).isEqualTo(Sort.Direction.DESC);
    }

    @Test
    void searchSortsByAWhitelistedField() {
        when(products.search(anyString(), any(Pageable.class))).thenReturn(Page.empty());

        service.search("", "price", "asc", 0, 20);

        ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
        verify(products).search(anyString(), pageable.capture());
        assertThat(pageable.getValue().getSort().getOrderFor("price")).isNotNull();
    }

    @Test
    void searchEscapesTheWildcardsTypedByTheUser() {
        when(products.search(eq("%50!%!_%"), any(Pageable.class))).thenReturn(Page.empty());

        service.search("50%_", "id", "asc", 0, 20);

        verify(products).search(eq("%50!%!_%"), any(Pageable.class));
    }
}
