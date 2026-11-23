package edu.yildiz.ecommerce.analytics.service;

import java.math.BigDecimal;
import java.util.List;

import edu.yildiz.ecommerce.analytics.cache.CachedReport;
import edu.yildiz.ecommerce.analytics.cache.ReportCache;
import edu.yildiz.ecommerce.analytics.model.CustomerReports.CustomerMetrics;
import edu.yildiz.ecommerce.analytics.model.CustomerReports.CustomerValue;
import edu.yildiz.ecommerce.analytics.model.DateRange;
import edu.yildiz.ecommerce.analytics.model.Granularity;
import edu.yildiz.ecommerce.analytics.model.ProductMeasure;
import edu.yildiz.ecommerce.analytics.model.SalesReports.CategorySales;
import edu.yildiz.ecommerce.analytics.model.SalesReports.Fulfillment;
import edu.yildiz.ecommerce.analytics.model.SalesReports.Overview;
import edu.yildiz.ecommerce.analytics.model.SalesReports.PaymentSales;
import edu.yildiz.ecommerce.analytics.model.SalesReports.ProductSales;
import edu.yildiz.ecommerce.analytics.model.SalesReports.RegionSales;
import edu.yildiz.ecommerce.analytics.model.SalesReports.TrendPoint;
import edu.yildiz.ecommerce.analytics.model.SalesReports.WarehouseFulfillment;
import edu.yildiz.ecommerce.analytics.model.Totals.CustomerTotals;
import edu.yildiz.ecommerce.analytics.model.Totals.OrderTotals;
import edu.yildiz.ecommerce.analytics.model.Totals.SalesTotals;
import edu.yildiz.ecommerce.analytics.repository.ReportRepository;
import edu.yildiz.ecommerce.analytics.support.Figures;
import org.springframework.stereotype.Service;
import tools.jackson.core.type.TypeReference;

/**
 * The analytics reports. Every report is cached per data version; the arguments are checked before the cache is
 * consulted, so an invalid request never reaches Redis or the warehouse.
 */
@Service
public class ReportService {

    static final int MAX_PRODUCT_LIMIT = 50;
    static final int MAX_CUSTOMER_LIMIT = 100;

    private static final TypeReference<Overview> OVERVIEW_TYPE = new TypeReference<Overview>() {
    };
    private static final TypeReference<List<TrendPoint>> TREND_TYPE = new TypeReference<List<TrendPoint>>() {
    };
    private static final TypeReference<List<ProductSales>> PRODUCTS_TYPE = new TypeReference<List<ProductSales>>() {
    };
    private static final TypeReference<List<CategorySales>> CATEGORIES_TYPE =
            new TypeReference<List<CategorySales>>() {
            };
    private static final TypeReference<List<RegionSales>> REGIONS_TYPE = new TypeReference<List<RegionSales>>() {
    };
    private static final TypeReference<List<PaymentSales>> PAYMENTS_TYPE =
            new TypeReference<List<PaymentSales>>() {
            };
    private static final TypeReference<Fulfillment> FULFILLMENT_TYPE = new TypeReference<Fulfillment>() {
    };
    private static final TypeReference<List<CustomerValue>> CUSTOMERS_TYPE =
            new TypeReference<List<CustomerValue>>() {
            };
    private static final TypeReference<CustomerMetrics> CUSTOMER_METRICS_TYPE =
            new TypeReference<CustomerMetrics>() {
            };

    private final ReportRepository repository;
    private final ReportCache cache;

    public ReportService(ReportRepository repository, ReportCache cache) {
        this.repository = repository;
        this.cache = cache;
    }

    public CachedReport<Overview> overview(DateRange range) {
        return cache.get("overview", range.cacheKey(), OVERVIEW_TYPE, () -> buildOverview(range));
    }

    public CachedReport<List<TrendPoint>> trend(String granularityName, DateRange range) {
        Granularity granularity = Granularity.parse(granularityName);
        return cache.get("trend", "granularity=" + granularity + ";" + range.cacheKey(), TREND_TYPE,
                () -> repository.trend(granularity, range));
    }

    public CachedReport<List<ProductSales>> topProducts(String measureName, int limit, String category,
                                                        DateRange range) {
        ProductMeasure measure = ProductMeasure.parse(measureName);
        int size = clamp(limit, 1, MAX_PRODUCT_LIMIT);
        String categoryFilter = blankToNull(category);
        String parameters = "by=" + measure + ";limit=" + size + ";category=" + (categoryFilter == null
                ? "" : categoryFilter) + ";" + range.cacheKey();
        return cache.get("products-top", parameters, PRODUCTS_TYPE,
                () -> repository.topProducts(measure, categoryFilter, range, size));
    }

    public CachedReport<List<CategorySales>> categories(DateRange range) {
        return cache.get("categories", range.cacheKey(), CATEGORIES_TYPE, () -> repository.categories(range));
    }

    public CachedReport<List<RegionSales>> regions(DateRange range) {
        return cache.get("regions", range.cacheKey(), REGIONS_TYPE, () -> repository.regions(range));
    }

    public CachedReport<List<PaymentSales>> payments(DateRange range) {
        return cache.get("payments", range.cacheKey(), PAYMENTS_TYPE, () -> repository.payments(range));
    }

    public CachedReport<Fulfillment> fulfillment(DateRange range) {
        return cache.get("fulfillment", range.cacheKey(), FULFILLMENT_TYPE, () -> buildFulfillment(range));
    }

    public CachedReport<List<CustomerValue>> topCustomers(int limit, DateRange range) {
        int size = clamp(limit, 1, MAX_CUSTOMER_LIMIT);
        return cache.get("customers-top", "limit=" + size + ";" + range.cacheKey(), CUSTOMERS_TYPE,
                () -> repository.topCustomers(range, size));
    }

    public CachedReport<CustomerMetrics> customerMetrics(DateRange range) {
        return cache.get("customers-metrics", range.cacheKey(), CUSTOMER_METRICS_TYPE,
                () -> buildCustomerMetrics(range));
    }

    private Overview buildOverview(DateRange range) {
        SalesTotals sales = repository.salesTotals(range);
        OrderTotals orders = repository.orderTotals(range);
        BigDecimal averageDays = repository.averageDeliveryDays(range);
        BigDecimal orderCount = BigDecimal.valueOf(orders.orders());
        return new Overview(
                sales.revenue(),
                orders.orders(),
                sales.units(),
                orders.customers(),
                Figures.divide(sales.revenue(), orderCount, 2),
                Figures.divide(BigDecimal.valueOf(orders.delivered()), orderCount, 4),
                Figures.rounded(averageDays, 2));
    }

    private Fulfillment buildFulfillment(DateRange range) {
        OrderTotals orders = repository.orderTotals(range);
        BigDecimal averageDays = repository.averageDeliveryDays(range);
        List<WarehouseFulfillment> byWarehouse = repository.fulfillmentByWarehouse(range);
        BigDecimal placed = BigDecimal.valueOf(orders.orders());
        return new Fulfillment(
                orders.orders(),
                orders.delivered(),
                orders.orders() - orders.delivered(),
                Figures.divide(BigDecimal.valueOf(orders.delivered()), placed, 4),
                Figures.rounded(averageDays, 2),
                byWarehouse);
    }

    private CustomerMetrics buildCustomerMetrics(DateRange range) {
        CustomerTotals totals = repository.customerTotals(range);
        BigDecimal customers = BigDecimal.valueOf(totals.customers());
        return new CustomerMetrics(
                totals.customers(),
                totals.repeatCustomers(),
                Figures.divide(BigDecimal.valueOf(totals.repeatCustomers()), customers, 4),
                Figures.divide(BigDecimal.valueOf(totals.orders()), customers, 2),
                Figures.divide(totals.revenue(), customers, 2));
    }

    private static int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }

    private static String blankToNull(String text) {
        return text == null || text.isBlank() ? null : text.trim();
    }
}
