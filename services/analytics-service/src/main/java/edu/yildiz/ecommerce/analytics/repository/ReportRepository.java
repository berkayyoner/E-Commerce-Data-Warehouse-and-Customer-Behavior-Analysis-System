package edu.yildiz.ecommerce.analytics.repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

import edu.yildiz.ecommerce.analytics.model.CustomerReports.CustomerValue;
import edu.yildiz.ecommerce.analytics.model.DateRange;
import edu.yildiz.ecommerce.analytics.model.Granularity;
import edu.yildiz.ecommerce.analytics.model.ProductMeasure;
import edu.yildiz.ecommerce.analytics.model.SalesReports.CategorySales;
import edu.yildiz.ecommerce.analytics.model.SalesReports.PaymentSales;
import edu.yildiz.ecommerce.analytics.model.SalesReports.ProductSales;
import edu.yildiz.ecommerce.analytics.model.SalesReports.RegionSales;
import edu.yildiz.ecommerce.analytics.model.SalesReports.TrendPoint;
import edu.yildiz.ecommerce.analytics.model.SalesReports.WarehouseFulfillment;
import edu.yildiz.ecommerce.analytics.model.Totals.CustomerTotals;
import edu.yildiz.ecommerce.analytics.model.Totals.OrderTotals;
import edu.yildiz.ecommerce.analytics.model.Totals.SalesTotals;
import edu.yildiz.ecommerce.analytics.support.Figures;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

/** Runs the report statements of {@link ReportQueries} and maps the rows to the answers. */
@Repository
public class ReportRepository {

    private final JdbcTemplate jdbc;
    private final ReportQueries queries;

    public ReportRepository(JdbcTemplate jdbc, ReportQueries queries) {
        this.jdbc = jdbc;
        this.queries = queries;
    }

    /** Run id of the last successful ETL run; it changes whenever the warehouse is reloaded. */
    public long currentDataVersion() {
        Long version = jdbc.queryForObject(ReportQueries.DATA_VERSION, Long.class);
        return version == null ? 0 : version;
    }

    public SalesTotals salesTotals(DateRange range) {
        return single(queries.salesTotals(range), (rs, row) ->
                new SalesTotals(Figures.money(rs.getBigDecimal("revenue")), rs.getLong("units")));
    }

    public OrderTotals orderTotals(DateRange range) {
        return single(queries.orderTotals(range), (rs, row) ->
                new OrderTotals(rs.getLong("orders"), rs.getLong("customers"), rs.getLong("delivered")));
    }

    /** Null when no line of the range was delivered. */
    public BigDecimal averageDeliveryDays(DateRange range) {
        return single(queries.averageDeliveryDays(range), (rs, row) -> rs.getBigDecimal("average_days"));
    }

    public List<TrendPoint> trend(Granularity granularity, DateRange range) {
        return run(queries.trend(granularity, range), (rs, row) -> new TrendPoint(
                rs.getString("period_label"),
                Figures.money(rs.getBigDecimal("revenue")),
                rs.getLong("orders"),
                rs.getLong("units")));
    }

    public List<ProductSales> topProducts(ProductMeasure measure, String category, DateRange range, int limit) {
        return run(queries.topProducts(measure, category, range, limit), (rs, row) -> new ProductSales(
                rs.getLong("item_id"),
                rs.getString("product_name"),
                rs.getString("category"),
                rs.getString("brand"),
                Figures.money(rs.getBigDecimal("revenue")),
                rs.getLong("units")));
    }

    public List<CategorySales> categories(DateRange range) {
        return run(queries.categories(range), (rs, row) -> new CategorySales(
                rs.getString("category"),
                Figures.money(rs.getBigDecimal("revenue")),
                rs.getLong("units"),
                Figures.orZero(rs.getBigDecimal("revenue_share"), 4)));
    }

    public List<RegionSales> regions(DateRange range) {
        return run(queries.regions(range), (rs, row) -> new RegionSales(
                rs.getString("region"),
                rs.getString("city"),
                Figures.money(rs.getBigDecimal("revenue")),
                rs.getLong("orders"),
                rs.getLong("units"),
                Figures.orZero(rs.getBigDecimal("revenue_share"), 4)));
    }

    public List<PaymentSales> payments(DateRange range) {
        return run(queries.payments(range), (rs, row) -> new PaymentSales(
                rs.getString("payment_method"),
                "Y".equals(rs.getString("is_online")),
                Figures.money(rs.getBigDecimal("revenue")),
                rs.getLong("orders"),
                Figures.orZero(rs.getBigDecimal("revenue_share"), 4)));
    }

    public List<WarehouseFulfillment> fulfillmentByWarehouse(DateRange range) {
        return run(queries.fulfillmentByWarehouse(range), (rs, row) -> new WarehouseFulfillment(
                rs.getString("city"),
                rs.getString("region"),
                rs.getLong("placed"),
                rs.getLong("delivered"),
                Figures.rounded(rs.getBigDecimal("average_days"), 2)));
    }

    public List<CustomerValue> topCustomers(DateRange range, int limit) {
        return run(queries.topCustomers(range, limit), (rs, row) -> new CustomerValue(
                rs.getInt("w_id") + "-" + rs.getInt("d_id") + "-" + rs.getInt("c_id"),
                rs.getString("customer_name"),
                rs.getString("region"),
                rs.getLong("orders"),
                Figures.money(rs.getBigDecimal("revenue")),
                toLocalDate(rs.getDate("first_order_date")),
                toLocalDate(rs.getDate("last_order_date"))));
    }

    public CustomerTotals customerTotals(DateRange range) {
        return single(queries.customerTotals(range), (rs, row) -> new CustomerTotals(
                rs.getLong("customers"),
                rs.getLong("repeat_customers"),
                rs.getLong("orders"),
                Figures.money(rs.getBigDecimal("revenue"))));
    }

    /** Executes the statement and counts the rows, reading every row from the result set. */
    public long countRows(String sql) {
        AtomicLong rows = new AtomicLong();
        jdbc.query(sql, (RowCallbackHandler) resultSet -> rows.incrementAndGet());
        return rows.get();
    }

    private <T> List<T> run(BoundSql statement, RowMapper<T> mapper) {
        return jdbc.query(statement.sql(), mapper, statement.arguments().toArray());
    }

    private <T> T single(BoundSql statement, RowMapper<T> mapper) {
        return run(statement, mapper).getFirst();
    }

    private static LocalDate toLocalDate(java.sql.Date date) {
        return date == null ? null : date.toLocalDate();
    }
}
