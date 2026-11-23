package edu.yildiz.ecommerce.analytics.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.function.Supplier;

import edu.yildiz.ecommerce.analytics.cache.CachedReport;
import edu.yildiz.ecommerce.analytics.cache.ReportCache;
import edu.yildiz.ecommerce.analytics.model.CustomerReports.CustomerMetrics;
import edu.yildiz.ecommerce.analytics.model.DateRange;
import edu.yildiz.ecommerce.analytics.model.Granularity;
import edu.yildiz.ecommerce.analytics.model.ProductMeasure;
import edu.yildiz.ecommerce.analytics.model.SalesReports.Fulfillment;
import edu.yildiz.ecommerce.analytics.model.SalesReports.Overview;
import edu.yildiz.ecommerce.analytics.model.SalesReports.TrendPoint;
import edu.yildiz.ecommerce.analytics.model.Totals.CustomerTotals;
import edu.yildiz.ecommerce.analytics.model.Totals.OrderTotals;
import edu.yildiz.ecommerce.analytics.model.Totals.SalesTotals;
import edu.yildiz.ecommerce.analytics.repository.ReportRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ReportServiceTest {

    private final ReportRepository repository = mock(ReportRepository.class);
    private final ReportCache cache = mock(ReportCache.class);
    private final ReportService service = new ReportService(repository, cache);

    /** The cache mock runs the loader, so the service logic is tested without Redis. */
    @BeforeEach
    void passThroughCache() {
        when(cache.get(anyString(), anyString(), any(), any()))
                .thenAnswer(invocation -> new CachedReport<>(((Supplier<?>) invocation.getArgument(3)).get(), false));
    }

    @Test
    void overviewDerivesTheAverageOrderValueAndTheDeliveredShare() {
        DateRange all = DateRange.unbounded();
        when(repository.salesTotals(all)).thenReturn(new SalesTotals(new BigDecimal("1000.00"), 40));
        when(repository.orderTotals(all)).thenReturn(new OrderTotals(8, 4, 6));
        when(repository.averageDeliveryDays(all)).thenReturn(new BigDecimal("2.5"));

        Overview overview = service.overview(all).value();

        assertThat(overview.revenue()).isEqualByComparingTo("1000.00");
        assertThat(overview.orders()).isEqualTo(8);
        assertThat(overview.customers()).isEqualTo(4);
        assertThat(overview.averageOrderValue()).isEqualByComparingTo("125.00");
        assertThat(overview.deliveredShare()).isEqualByComparingTo("0.7500");
        assertThat(overview.averageDeliveryDays()).isEqualByComparingTo("2.50");
    }

    @Test
    void anOverviewWithoutOrdersHasZeroRatios() {
        DateRange all = DateRange.unbounded();
        when(repository.salesTotals(all)).thenReturn(new SalesTotals(BigDecimal.ZERO, 0));
        when(repository.orderTotals(all)).thenReturn(new OrderTotals(0, 0, 0));

        Overview overview = service.overview(all).value();

        assertThat(overview.averageOrderValue()).isEqualByComparingTo("0");
        assertThat(overview.deliveredShare()).isEqualByComparingTo("0");
        assertThat(overview.averageDeliveryDays()).isNull();
    }

    @Test
    void aRangeWhoseStartIsAfterItsEndIsRejected() {
        assertThatThrownBy(() -> DateRange.of(LocalDate.of(2026, 2, 1), LocalDate.of(2026, 1, 1)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("from must not be after to");
    }

    @Test
    void anUnknownGranularityIsRejectedBeforeAnyQuery() {
        assertThatThrownBy(() -> service.trend("hour", DateRange.unbounded()))
                .isInstanceOf(IllegalArgumentException.class);
        verifyNoInteractions(repository);
    }

    @Test
    void theGranularityIsMatchedIgnoringCaseAndSpaces() {
        when(repository.trend(Granularity.WEEK, DateRange.unbounded())).thenReturn(List.of());

        service.trend(" week ", DateRange.unbounded());

        verify(repository).trend(Granularity.WEEK, DateRange.unbounded());
    }

    @Test
    void theTrendReturnsWhatTheRepositoryReturns() {
        List<TrendPoint> points = List.of(new TrendPoint("2026-03", new BigDecimal("10.00"), 2, 5));
        when(repository.trend(Granularity.MONTH, DateRange.unbounded())).thenReturn(points);

        assertThat(service.trend("month", DateRange.unbounded()).value()).isEqualTo(points);
    }

    @Test
    void aProductLimitBelowOneIsRaisedToOne() {
        service.topProducts("revenue", 0, null, DateRange.unbounded());

        verify(repository).topProducts(ProductMeasure.REVENUE, null, DateRange.unbounded(), 1);
    }

    @Test
    void aProductLimitAboveFiftyIsLoweredToFifty() {
        service.topProducts("units", 500, "  ", DateRange.unbounded());

        verify(repository).topProducts(ProductMeasure.UNITS, null, DateRange.unbounded(), 50);
    }

    @Test
    void aCategoryFilterIsTrimmed() {
        service.topProducts("revenue", 10, " Books ", DateRange.unbounded());

        verify(repository).topProducts(ProductMeasure.REVENUE, "Books", DateRange.unbounded(), 10);
    }

    @Test
    void anUnknownProductMeasureIsRejected() {
        assertThatThrownBy(() -> service.topProducts("profit", 10, null, DateRange.unbounded()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("by must be revenue or units");
    }

    @Test
    void aCustomerLimitAboveOneHundredIsLoweredToOneHundred() {
        service.topCustomers(1000, DateRange.unbounded());

        verify(repository).topCustomers(DateRange.unbounded(), 100);
    }

    @Test
    void customerMetricsDivideByTheNumberOfCustomers() {
        DateRange all = DateRange.unbounded();
        when(repository.customerTotals(all)).thenReturn(new CustomerTotals(4, 2, 10, new BigDecimal("500.00")));

        CustomerMetrics metrics = service.customerMetrics(all).value();

        assertThat(metrics.customersWithOrders()).isEqualTo(4);
        assertThat(metrics.repeatPurchaseRate()).isEqualByComparingTo("0.5000");
        assertThat(metrics.averageOrdersPerCustomer()).isEqualByComparingTo("2.50");
        assertThat(metrics.averageLifetimeValue()).isEqualByComparingTo("125.00");
    }

    @Test
    void customerMetricsWithoutCustomersAreZero() {
        DateRange all = DateRange.unbounded();
        when(repository.customerTotals(all)).thenReturn(new CustomerTotals(0, 0, 0, BigDecimal.ZERO));

        CustomerMetrics metrics = service.customerMetrics(all).value();

        assertThat(metrics.repeatPurchaseRate()).isEqualByComparingTo("0");
        assertThat(metrics.averageLifetimeValue()).isEqualByComparingTo("0");
    }

    @Test
    void fulfillmentCountsThePendingOrders() {
        DateRange all = DateRange.unbounded();
        when(repository.orderTotals(all)).thenReturn(new OrderTotals(10, 4, 7));
        when(repository.averageDeliveryDays(all)).thenReturn(new BigDecimal("3.126"));
        when(repository.fulfillmentByWarehouse(all)).thenReturn(List.of());

        Fulfillment fulfillment = service.fulfillment(all).value();

        assertThat(fulfillment.placed()).isEqualTo(10);
        assertThat(fulfillment.delivered()).isEqualTo(7);
        assertThat(fulfillment.pending()).isEqualTo(3);
        assertThat(fulfillment.deliveredShare()).isEqualByComparingTo("0.7000");
        assertThat(fulfillment.averageDeliveryDays()).isEqualByComparingTo("3.13");
    }
}
