package edu.yildiz.ecommerce.shop.web;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import edu.yildiz.ecommerce.shop.dto.OrderDtos.OrderDetailView;
import edu.yildiz.ecommerce.shop.dto.OrderDtos.OrderLineView;
import edu.yildiz.ecommerce.shop.dto.OrderDtos.OrderSummaryView;
import edu.yildiz.ecommerce.shop.model.PageResult;
import edu.yildiz.ecommerce.shop.service.NotFoundException;
import edu.yildiz.ecommerce.shop.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class OrderControllerTest {

    private final OrderService service = mock(OrderService.class);
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(new OrderController(service))
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
    }

    @Test
    void listPassesTheFiltersAndThePagingToTheService() throws Exception {
        OrderSummaryView summary = new OrderSummaryView(1L, 2L, 30L, 77L, "Ali Yilmaz",
                LocalDateTime.of(2026, 11, 5, 9, 0), "CASH", 2, new BigDecimal("14.75"), false);
        when(service.search("", 1L, LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 30), "totalAmount", "asc", 2, 5))
                .thenReturn(new PageResult<>(List.of(summary), 11, 2, 5));

        mvc.perform(get("/api/shop/orders?warehouseId=1&from=2026-11-01&to=2026-11-30&sort=totalAmount"
                        + "&direction=asc&page=2&size=5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(11))
                .andExpect(jsonPath("$.content[0].customerName").value("Ali Yilmaz"))
                .andExpect(jsonPath("$.content[0].delivered").value(false));
    }

    @Test
    void detailReturnsTheOrderWithItsLines() throws Exception {
        OrderLineView line = new OrderLineView(1, 100L, "Desk Lamp", 2, new BigDecimal("10.50"), null);
        OrderDetailView detail = new OrderDetailView(1L, 2L, 30L, 77L, "Ali Yilmaz",
                LocalDateTime.of(2026, 11, 5, 9, 0), "CASH", 1, new BigDecimal("10.50"), true, List.of(line));
        when(service.get(1L, 2L, 30L)).thenReturn(detail);

        mvc.perform(get("/api/shop/orders/1/2/30"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lines[0].productName").value("Desk Lamp"))
                .andExpect(jsonPath("$.lines[0].itemId").value(100));
    }

    @Test
    void detailReportsAnUnknownOrder() throws Exception {
        when(service.get(1L, 2L, 99L)).thenThrow(new NotFoundException("Order 1/2/99 was not found"));

        mvc.perform(get("/api/shop/orders/1/2/99")).andExpect(status().isNotFound());
    }
}
