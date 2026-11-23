package edu.yildiz.ecommerce.analytics.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import edu.yildiz.ecommerce.analytics.cache.CachedReport;
import edu.yildiz.ecommerce.analytics.model.CustomerReports.CustomerMetrics;
import edu.yildiz.ecommerce.analytics.model.CustomerReports.CustomerValue;
import edu.yildiz.ecommerce.analytics.model.DateRange;
import edu.yildiz.ecommerce.analytics.service.ReportService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class CustomerControllerTest {

    private final ReportService service = mock(ReportService.class);
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(new CustomerController(service))
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
    }

    @Test
    void topCustomersDefaultToTwentyRows() throws Exception {
        List<CustomerValue> customers = List.of(new CustomerValue("3-7-1204", "Ada Lovelace", "Marmara", 4,
                new BigDecimal("880.00"), LocalDate.of(2026, 1, 2), LocalDate.of(2026, 3, 9)));
        when(service.topCustomers(eq(20), any(DateRange.class))).thenReturn(new CachedReport<>(customers, false));

        mvc.perform(get("/api/analytics/customers/top"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].customerId").value("3-7-1204"))
                .andExpect(jsonPath("$[0].firstOrderDate").value("2026-01-02"));
    }

    @Test
    void topCustomersRejectANonNumericLimit() throws Exception {
        mvc.perform(get("/api/analytics/customers/top").param("limit", "many"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void metricsAnswerWithTheRepeatRate() throws Exception {
        CustomerMetrics metrics = new CustomerMetrics(4, 2, new BigDecimal("0.5000"), new BigDecimal("2.50"),
                new BigDecimal("125.00"));
        when(service.customerMetrics(any(DateRange.class))).thenReturn(new CachedReport<>(metrics, false));

        mvc.perform(get("/api/analytics/customers/metrics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.repeatPurchaseRate").value(0.5))
                .andExpect(jsonPath("$.customersWithOrders").value(4));
    }
}
