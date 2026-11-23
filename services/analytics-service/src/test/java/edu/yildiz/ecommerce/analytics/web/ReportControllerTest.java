package edu.yildiz.ecommerce.analytics.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.util.List;

import edu.yildiz.ecommerce.analytics.cache.CachedReport;
import edu.yildiz.ecommerce.analytics.model.DateRange;
import edu.yildiz.ecommerce.analytics.model.SalesReports.CategorySales;
import edu.yildiz.ecommerce.analytics.model.SalesReports.Fulfillment;
import edu.yildiz.ecommerce.analytics.model.SalesReports.Overview;
import edu.yildiz.ecommerce.analytics.model.SalesReports.PaymentSales;
import edu.yildiz.ecommerce.analytics.model.SalesReports.ProductSales;
import edu.yildiz.ecommerce.analytics.model.SalesReports.RegionSales;
import edu.yildiz.ecommerce.analytics.model.SalesReports.TrendPoint;
import edu.yildiz.ecommerce.analytics.service.ReportService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class ReportControllerTest {

    private final ReportService service = mock(ReportService.class);
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(new ReportController(service))
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
    }

    @Test
    void overviewAnswersWithTheReportAndAMissHeader() throws Exception {
        Overview overview = new Overview(new BigDecimal("1200.00"), 10, 40, 4, new BigDecimal("120.00"),
                new BigDecimal("0.8000"), new BigDecimal("2.50"));
        when(service.overview(any(DateRange.class))).thenReturn(new CachedReport<>(overview, false));

        mvc.perform(get("/api/analytics/overview").param("from", "2026-01-01").param("to", "2026-01-31"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Cache", "MISS"))
                .andExpect(jsonPath("$.revenue").value(1200.0))
                .andExpect(jsonPath("$.orders").value(10))
                .andExpect(jsonPath("$.deliveredShare").value(0.8));
    }

    @Test
    void overviewAnswersWithAHitHeaderWhenRedisServedIt() throws Exception {
        Overview overview = new Overview(BigDecimal.ZERO, 0, 0, 0, BigDecimal.ZERO, BigDecimal.ZERO, null);
        when(service.overview(any(DateRange.class))).thenReturn(new CachedReport<>(overview, true));

        mvc.perform(get("/api/analytics/overview"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Cache", "HIT"));
    }

    @Test
    void trendPassesTheGranularityThrough() throws Exception {
        List<TrendPoint> points = List.of(new TrendPoint("2026-W03", new BigDecimal("50.00"), 2, 6));
        when(service.trend(eq("week"), any(DateRange.class))).thenReturn(new CachedReport<>(points, false));

        mvc.perform(get("/api/analytics/sales/trend").param("granularity", "week"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].period").value("2026-W03"))
                .andExpect(jsonPath("$[0].orders").value(2));
    }

    @Test
    void trendRejectsAnUnknownGranularity() throws Exception {
        when(service.trend(eq("hour"), any(DateRange.class)))
                .thenThrow(new IllegalArgumentException("granularity must be one of day, week, month or year"));

        mvc.perform(get("/api/analytics/sales/trend").param("granularity", "hour"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("granularity must be one of day, week, month or year"));
    }

    @Test
    void aMalformedDateIsABadRequest() throws Exception {
        mvc.perform(get("/api/analytics/overview").param("from", "01-02-2026"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void aStartDateAfterTheEndDateIsABadRequest() throws Exception {
        mvc.perform(get("/api/analytics/overview").param("from", "2026-02-01").param("to", "2026-01-01"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void topProductsDefaultsToTenRowsRankedByRevenue() throws Exception {
        List<ProductSales> products = List.of(
                new ProductSales(1042, "Oak desk", "Furniture", "Nordic", new BigDecimal("900.00"), 3));
        when(service.topProducts(eq("revenue"), eq(10), isNull(), any(DateRange.class)))
                .thenReturn(new CachedReport<>(products, false));

        mvc.perform(get("/api/analytics/products/top"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].productId").value(1042))
                .andExpect(jsonPath("$[0].name").value("Oak desk"));
    }

    @Test
    void categoriesAnswerWithShares() throws Exception {
        List<CategorySales> categories = List.of(
                new CategorySales("Furniture", new BigDecimal("900.00"), 3, new BigDecimal("0.7500")));
        when(service.categories(any(DateRange.class))).thenReturn(new CachedReport<>(categories, false));

        mvc.perform(get("/api/analytics/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].category").value("Furniture"))
                .andExpect(jsonPath("$[0].share").value(0.75));
    }

    @Test
    void regionsAnswerByRegionAndCity() throws Exception {
        List<RegionSales> regions = List.of(new RegionSales("Marmara", "Istanbul", new BigDecimal("300.00"),
                5, 9, new BigDecimal("0.3000")));
        when(service.regions(any(DateRange.class))).thenReturn(new CachedReport<>(regions, false));

        mvc.perform(get("/api/analytics/regions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].city").value("Istanbul"));
    }

    @Test
    void paymentsAnswerWithTheOnlineFlag() throws Exception {
        List<PaymentSales> payments = List.of(new PaymentSales("CARD", true, new BigDecimal("300.00"), 5,
                new BigDecimal("1.0000")));
        when(service.payments(any(DateRange.class))).thenReturn(new CachedReport<>(payments, false));

        mvc.perform(get("/api/analytics/payments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].paymentMethod").value("CARD"))
                .andExpect(jsonPath("$[0].isOnline").value(true));
    }

    @Test
    void fulfillmentAnswersWithTheWarehouseBreakdown() throws Exception {
        Fulfillment fulfillment = new Fulfillment(10, 7, 3, new BigDecimal("0.7000"), new BigDecimal("3.13"),
                List.of());
        when(service.fulfillment(any(DateRange.class))).thenReturn(new CachedReport<>(fulfillment, false));

        mvc.perform(get("/api/analytics/fulfillment"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pending").value(3))
                .andExpect(jsonPath("$.byWarehouse").isEmpty());
    }
}
