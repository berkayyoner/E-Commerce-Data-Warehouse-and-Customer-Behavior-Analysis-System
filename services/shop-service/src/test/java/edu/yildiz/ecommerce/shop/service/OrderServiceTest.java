package edu.yildiz.ecommerce.shop.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyIterable;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import edu.yildiz.ecommerce.shop.domain.Customer;
import edu.yildiz.ecommerce.shop.domain.CustomerId;
import edu.yildiz.ecommerce.shop.domain.CustomerOrder;
import edu.yildiz.ecommerce.shop.domain.OrderId;
import edu.yildiz.ecommerce.shop.domain.OrderLine;
import edu.yildiz.ecommerce.shop.domain.Product;
import edu.yildiz.ecommerce.shop.dto.OrderDtos.OrderDetailView;
import edu.yildiz.ecommerce.shop.dto.OrderDtos.OrderLineView;
import edu.yildiz.ecommerce.shop.dto.OrderDtos.OrderSummaryView;
import edu.yildiz.ecommerce.shop.model.PageResult;
import edu.yildiz.ecommerce.shop.repository.CustomerOrderRepository;
import edu.yildiz.ecommerce.shop.repository.CustomerRepository;
import edu.yildiz.ecommerce.shop.repository.OrderLineRepository;
import edu.yildiz.ecommerce.shop.repository.OrderSummaryQuery;
import edu.yildiz.ecommerce.shop.repository.OrderSummaryQuery.Filter;
import edu.yildiz.ecommerce.shop.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class OrderServiceTest {

    private final OrderSummaryQuery summaries = mock(OrderSummaryQuery.class);
    private final CustomerOrderRepository orders = mock(CustomerOrderRepository.class);
    private final CustomerRepository customers = mock(CustomerRepository.class);
    private final OrderLineRepository orderLines = mock(OrderLineRepository.class);
    private final ProductRepository products = mock(ProductRepository.class);
    private final OrderService service = new OrderService(summaries, orders, customers, orderLines, products);

    @Test
    void detailSumsTheLinesAndNamesTheProducts() {
        LocalDateTime entered = LocalDateTime.of(2026, 11, 1, 10, 0);
        when(orders.findById(new OrderId(1L, 2L, 30L)))
                .thenReturn(Optional.of(new CustomerOrder(1L, 2L, 30L, 77L, 4L, 2, entered, "CASH")));
        when(customers.findById(new CustomerId(1L, 2L, 77L))).thenReturn(Optional.of(new Customer(
                new CustomerId(1L, 2L, 77L), "Ali", "Yilmaz", "ali@example.com", "Izmir", "Aegean",
                LocalDate.of(2026, 1, 1))));
        when(orderLines.findByWarehouseIdAndDistrictIdAndOrderIdOrderByLineNumberAsc(1L, 2L, 30L)).thenReturn(List.of(
                new OrderLine(1L, 2L, 30L, 1, 100L, null, new BigDecimal("10.50"), 2),
                new OrderLine(1L, 2L, 30L, 2, 101L, entered, new BigDecimal("4.25"), 1)));
        when(products.findAllById(anyIterable())).thenReturn(List.of(
                new Product(100L, "Lamp", new BigDecimal("5.25"), "Home", "Lumen"),
                new Product(101L, "Mug", new BigDecimal("4.25"), "Home", "Lumen")));

        OrderDetailView detail = service.get(1L, 2L, 30L);

        assertThat(detail.customerName()).isEqualTo("Ali Yilmaz");
        assertThat(detail.totalAmount()).isEqualByComparingTo(new BigDecimal("14.75"));
        assertThat(detail.delivered()).isTrue();
        assertThat(detail.lines()).extracting(OrderLineView::productName).containsExactly("Lamp", "Mug");
    }

    @Test
    void detailFailsForAnUnknownOrder() {
        when(orders.findById(new OrderId(1L, 1L, 404L))).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.get(1L, 1L, 404L)).isInstanceOf(NotFoundException.class);
    }

    @Test
    void listFallsBackToTheNewestFirstForAnUnknownSort() {
        when(summaries.findPage(any(), anyList(), anyBoolean(), anyLong(), anyInt())).thenReturn(List.of());
        when(summaries.count(any())).thenReturn(0L);

        service.search("", null, null, null, "bogus", "desc", 0, 20);

        verify(summaries).findPage(any(), eq(List.of("o.O_ENTRY_D")), eq(false), eq(0L), eq(20));
    }

    @Test
    void listTurnsTheToDateIntoAnExclusiveEnd() {
        when(summaries.findPage(any(), anyList(), anyBoolean(), anyLong(), anyInt())).thenReturn(List.of());
        when(summaries.count(any())).thenReturn(0L);

        service.search("", null, LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 30), "orderDate", "desc", 0, 20);

        ArgumentCaptor<Filter> filter = ArgumentCaptor.forClass(Filter.class);
        verify(summaries).findPage(filter.capture(), anyList(), anyBoolean(), anyLong(), anyInt());
        assertThat(filter.getValue().from()).isEqualTo(LocalDateTime.of(2026, 11, 1, 0, 0));
        assertThat(filter.getValue().toExclusive()).isEqualTo(LocalDateTime.of(2026, 12, 1, 0, 0));
    }

    @Test
    void listRejectsAPeriodThatEndsBeforeItStarts() {
        assertThatThrownBy(() -> service.search("", null, LocalDate.of(2026, 11, 10), LocalDate.of(2026, 11, 1),
                "orderDate", "desc", 0, 20)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void listReturnsTheRequestedPageWithTheTotal() {
        OrderSummaryView summary = new OrderSummaryView(1L, 2L, 30L, 77L, "Ali Yilmaz",
                LocalDateTime.of(2026, 11, 1, 10, 0), "CASH", 2, new BigDecimal("14.75"), true);
        when(summaries.findPage(any(), anyList(), anyBoolean(), anyLong(), anyInt())).thenReturn(List.of(summary));
        when(summaries.count(any())).thenReturn(42L);

        PageResult<OrderSummaryView> result = service.search("ali", 1L, null, null, "totalAmount", "asc", 1, 5);

        assertThat(result.total()).isEqualTo(42L);
        assertThat(result.page()).isEqualTo(1);
        assertThat(result.content()).containsExactly(summary);
    }
}
