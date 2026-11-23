package edu.yildiz.ecommerce.analytics.repository;

import java.sql.Date;
import java.util.ArrayList;
import java.util.List;

import edu.yildiz.ecommerce.analytics.config.AnalyticsProperties;
import edu.yildiz.ecommerce.analytics.model.DateRange;
import edu.yildiz.ecommerce.analytics.model.Granularity;
import edu.yildiz.ecommerce.analytics.model.ProductMeasure;
import org.springframework.stereotype.Component;

/**
 * SQL of the report endpoints. Statements are assembled only from fixed fragments: the period expression and the
 * ordering come from whitelists, while dates, categories and limits are always bound as JDBC parameters.
 * Revenue comes from the fact tables; the materialized view {@code mv_sales_monthly} answers the unfiltered reports.
 */
@Component
public class ReportQueries {

    static final String DATA_VERSION = """
            SELECT NVL(MAX(run_id), 0) FROM etl_run WHERE status = 'SUCCESS'""";

    private static final String SALES_TOTALS = """
            SELECT NVL(SUM(f.sales_amount), 0) AS revenue, NVL(SUM(f.quantity), 0) AS units
              FROM fact_sales f
              JOIN dim_date d ON d.date_key = f.order_date_key
             WHERE 1 = 1%1$s""";

    private static final String ORDER_TOTALS = """
            SELECT COUNT(*) AS orders,
                   COUNT(DISTINCT c.source_w_id || '-' || c.source_d_id || '-' || c.source_c_id) AS customers,
                   NVL(SUM(CASE WHEN f.is_delivered = 'Y' THEN 1 ELSE 0 END), 0) AS delivered
              FROM fact_orders f
              JOIN dim_date d ON d.date_key = f.order_date_key
              JOIN dim_customer c ON c.customer_key = f.customer_key
             WHERE 1 = 1%1$s""";

    private static final String AVERAGE_DELIVERY_DAYS = """
            SELECT AVG(f.delivery_days) AS average_days
              FROM fact_sales f
              JOIN dim_date d ON d.date_key = f.order_date_key
             WHERE f.delivery_days IS NOT NULL%1$s""";

    /** Revenue per period from the fact table, order counts per period from the order fact. */
    private static final String TREND = """
            SELECT s.period_label AS period_label, s.revenue AS revenue, NVL(o.order_count, 0) AS orders,
                   s.units AS units
              FROM (SELECT %1$s AS period_label, SUM(f.sales_amount) AS revenue, SUM(f.quantity) AS units
                      FROM fact_sales f
                      JOIN dim_date d ON d.date_key = f.order_date_key
                     WHERE 1 = 1%2$s
                     GROUP BY %1$s) s
              LEFT JOIN (SELECT %1$s AS period_label, COUNT(*) AS order_count
                           FROM fact_orders f
                           JOIN dim_date d ON d.date_key = f.order_date_key
                          WHERE 1 = 1%2$s
                          GROUP BY %1$s) o ON o.period_label = s.period_label
             ORDER BY s.period_label""";

    private static final String TREND_FROM_VIEW = """
            SELECT s.period_label AS period_label, s.revenue AS revenue, NVL(o.order_count, 0) AS orders,
                   s.units AS units
              FROM (SELECT m.year_month AS period_label, SUM(m.revenue) AS revenue, SUM(m.units) AS units
                      FROM mv_sales_monthly m
                     GROUP BY m.year_month) s
              LEFT JOIN (SELECT d.year_month AS period_label, COUNT(*) AS order_count
                           FROM fact_orders f
                           JOIN dim_date d ON d.date_key = f.order_date_key
                          GROUP BY d.year_month) o ON o.period_label = s.period_label
             ORDER BY s.period_label""";

    private static final String TOP_PRODUCTS = """
            SELECT p.source_item_id AS item_id, p.product_name AS product_name, p.category AS category,
                   p.brand AS brand, SUM(f.sales_amount) AS revenue, SUM(f.quantity) AS units
              FROM fact_sales f
              JOIN dim_date d ON d.date_key = f.order_date_key
              JOIN dim_product p ON p.product_key = f.product_key
             WHERE 1 = 1%1$s%2$s
             GROUP BY p.product_key, p.source_item_id, p.product_name, p.category, p.brand
             ORDER BY %3$s, p.source_item_id
             FETCH FIRST ? ROWS ONLY""";

    private static final String CATEGORIES_FROM_VIEW = """
            SELECT m.category AS category, SUM(m.revenue) AS revenue, SUM(m.units) AS units,
                   RATIO_TO_REPORT(SUM(m.revenue)) OVER () AS revenue_share
              FROM mv_sales_monthly m
             GROUP BY m.category
             ORDER BY revenue DESC, m.category""";

    private static final String CATEGORIES_FROM_FACT = """
            SELECT p.category AS category, SUM(f.sales_amount) AS revenue, SUM(f.quantity) AS units,
                   RATIO_TO_REPORT(SUM(f.sales_amount)) OVER () AS revenue_share
              FROM fact_sales f
              JOIN dim_date d ON d.date_key = f.order_date_key
              JOIN dim_product p ON p.product_key = f.product_key
             WHERE 1 = 1%1$s
             GROUP BY p.category
             ORDER BY revenue DESC, p.category""";

    private static final String REGION_SALES_FROM_VIEW = """
            (SELECT m.warehouse_region AS region, m.warehouse_city AS city,
                    SUM(m.revenue) AS revenue, SUM(m.units) AS units
               FROM mv_sales_monthly m
              GROUP BY m.warehouse_region, m.warehouse_city)""";

    private static final String REGION_SALES_FROM_FACT = """
            (SELECT w.region AS region, w.city AS city, SUM(f.sales_amount) AS revenue, SUM(f.quantity) AS units
               FROM fact_sales f
               JOIN dim_date d ON d.date_key = f.order_date_key
               JOIN dim_warehouse w ON w.warehouse_key = f.warehouse_key
              WHERE 1 = 1%1$s
              GROUP BY w.region, w.city)""";

    /** %1$s is the sales source, %2$s the date filter of the order counts. */
    private static final String REGIONS = """
            SELECT s.region AS region, s.city AS city, s.revenue AS revenue, NVL(o.order_count, 0) AS orders,
                   s.units AS units, RATIO_TO_REPORT(s.revenue) OVER () AS revenue_share
              FROM %1$s s
              LEFT JOIN (SELECT w.region AS region, w.city AS city, COUNT(*) AS order_count
                           FROM fact_orders f
                           JOIN dim_date d ON d.date_key = f.order_date_key
                           JOIN dim_warehouse w ON w.warehouse_key = f.warehouse_key
                          WHERE 1 = 1%2$s
                          GROUP BY w.region, w.city) o ON o.region = s.region AND o.city = s.city
             ORDER BY s.revenue DESC, s.region, s.city""";

    private static final String PAYMENTS = """
            SELECT s.payment_method AS payment_method, s.is_online AS is_online, s.revenue AS revenue,
                   NVL(o.order_count, 0) AS orders, RATIO_TO_REPORT(s.revenue) OVER () AS revenue_share
              FROM (SELECT pm.payment_method AS payment_method, pm.is_online AS is_online,
                           SUM(f.sales_amount) AS revenue
                      FROM fact_sales f
                      JOIN dim_date d ON d.date_key = f.order_date_key
                      JOIN dim_payment_method pm ON pm.payment_key = f.payment_key
                     WHERE 1 = 1%1$s
                     GROUP BY pm.payment_method, pm.is_online) s
              LEFT JOIN (SELECT pm.payment_method AS payment_method, COUNT(*) AS order_count
                           FROM fact_orders f
                           JOIN dim_date d ON d.date_key = f.order_date_key
                           JOIN dim_payment_method pm ON pm.payment_key = f.payment_key
                          WHERE 1 = 1%1$s
                          GROUP BY pm.payment_method) o ON o.payment_method = s.payment_method
             ORDER BY s.revenue DESC, s.payment_method""";

    /** %1$s is the date filter, used by both the order counts and the delivery days. */
    private static final String FULFILLMENT_BY_WAREHOUSE = """
            SELECT o.city AS city, o.region AS region, o.placed AS placed, o.delivered AS delivered,
                   s.average_days AS average_days
              FROM (SELECT w.city AS city, w.region AS region, COUNT(*) AS placed,
                           NVL(SUM(CASE WHEN f.is_delivered = 'Y' THEN 1 ELSE 0 END), 0) AS delivered
                      FROM fact_orders f
                      JOIN dim_date d ON d.date_key = f.order_date_key
                      JOIN dim_warehouse w ON w.warehouse_key = f.warehouse_key
                     WHERE 1 = 1%1$s
                     GROUP BY w.city, w.region) o
              LEFT JOIN (SELECT w.city AS city, w.region AS region, AVG(f.delivery_days) AS average_days
                           FROM fact_sales f
                           JOIN dim_date d ON d.date_key = f.order_date_key
                           JOIN dim_warehouse w ON w.warehouse_key = f.warehouse_key
                          WHERE f.delivery_days IS NOT NULL%1$s
                          GROUP BY w.city, w.region) s ON s.city = o.city AND s.region = o.region
             ORDER BY o.city, o.region""";

    private static final String TOP_CUSTOMERS = """
            SELECT c.source_w_id AS w_id, c.source_d_id AS d_id, c.source_c_id AS c_id,
                   NVL(MAX(CASE WHEN c.is_current = 'Y' THEN c.first_name || ' ' || c.last_name END),
                       MAX(c.first_name || ' ' || c.last_name)) AS customer_name,
                   NVL(MAX(CASE WHEN c.is_current = 'Y' THEN c.region END), MAX(c.region)) AS region,
                   COUNT(DISTINCT f.order_w_id || '-' || f.order_d_id || '-' || f.order_id) AS orders,
                   SUM(f.sales_amount) AS revenue,
                   MIN(d.full_date) AS first_order_date,
                   MAX(d.full_date) AS last_order_date
              FROM fact_sales f
              JOIN dim_date d ON d.date_key = f.order_date_key
              JOIN dim_customer c ON c.customer_key = f.customer_key
             WHERE 1 = 1%1$s
             GROUP BY c.source_w_id, c.source_d_id, c.source_c_id
             ORDER BY revenue DESC, c.source_w_id, c.source_d_id, c.source_c_id
             FETCH FIRST ? ROWS ONLY""";

    private static final String CUSTOMER_TOTALS = """
            SELECT COUNT(*) AS customers,
                   NVL(SUM(CASE WHEN x.order_count > 1 THEN 1 ELSE 0 END), 0) AS repeat_customers,
                   NVL(SUM(x.order_count), 0) AS orders,
                   NVL(SUM(x.revenue), 0) AS revenue
              FROM (SELECT c.source_w_id, c.source_d_id, c.source_c_id,
                           COUNT(*) AS order_count, SUM(f.order_amount) AS revenue
                      FROM fact_orders f
                      JOIN dim_date d ON d.date_key = f.order_date_key
                      JOIN dim_customer c ON c.customer_key = f.customer_key
                     WHERE 1 = 1%1$s
                     GROUP BY c.source_w_id, c.source_d_id, c.source_c_id) x""";

    /** %1$s is the OLTP schema name, checked by {@link AnalyticsProperties}. */
    private static final String OLTP_BENCHMARK = """
            SELECT TO_CHAR(o.o_entry_d, 'YYYY-MM') AS period_label, i.i_category AS category,
                   SUM(ol.ol_amount) AS revenue, SUM(ol.ol_quantity) AS units
              FROM %1$s.order_line ol
              JOIN %1$s.oorder o ON o.o_w_id = ol.ol_w_id AND o.o_d_id = ol.ol_d_id AND o.o_id = ol.ol_o_id
              JOIN %1$s.item i ON i.i_id = ol.ol_i_id
             GROUP BY TO_CHAR(o.o_entry_d, 'YYYY-MM'), i.i_category""";

    private static final String STAR_BENCHMARK = """
            SELECT d.year_month AS period_label, p.category AS category,
                   SUM(f.sales_amount) AS revenue, SUM(f.quantity) AS units
              FROM fact_sales f
              JOIN dim_date d ON d.date_key = f.order_date_key
              JOIN dim_product p ON p.product_key = f.product_key
             GROUP BY d.year_month, p.category""";

    private static final String VIEW_BENCHMARK = """
            SELECT m.year_month AS period_label, m.category AS category,
                   SUM(m.revenue) AS revenue, SUM(m.units) AS units
              FROM mv_sales_monthly m
             GROUP BY m.year_month, m.category""";

    private final String oltpSchema;

    public ReportQueries(AnalyticsProperties properties) {
        this.oltpSchema = properties.oltpSchema();
    }

    public BoundSql salesTotals(DateRange range) {
        DateFilter date = DateFilter.of(range);
        return new BoundSql(SALES_TOTALS.formatted(date.clause()), date.arguments());
    }

    public BoundSql orderTotals(DateRange range) {
        DateFilter date = DateFilter.of(range);
        return new BoundSql(ORDER_TOTALS.formatted(date.clause()), date.arguments());
    }

    public BoundSql averageDeliveryDays(DateRange range) {
        DateFilter date = DateFilter.of(range);
        return new BoundSql(AVERAGE_DELIVERY_DAYS.formatted(date.clause()), date.arguments());
    }

    /** The monthly trend of an unfiltered range comes from the materialized view. */
    public BoundSql trend(Granularity granularity, DateRange range) {
        if (granularity == Granularity.MONTH && range.isUnbounded()) {
            return new BoundSql(TREND_FROM_VIEW, List.of());
        }
        DateFilter date = DateFilter.of(range);
        String sql = TREND.formatted(periodExpression(granularity), date.clause());
        return new BoundSql(sql, twice(date));
    }

    public BoundSql topProducts(ProductMeasure measure, String category, DateRange range, int limit) {
        DateFilter date = DateFilter.of(range);
        String categoryClause = category == null ? "" : " AND p.category = ?";
        List<Object> arguments = new ArrayList<>(date.arguments());
        if (category != null) {
            arguments.add(category);
        }
        arguments.add(limit);
        return new BoundSql(TOP_PRODUCTS.formatted(date.clause(), categoryClause, productOrder(measure)), arguments);
    }

    public BoundSql categories(DateRange range) {
        if (range.isUnbounded()) {
            return new BoundSql(CATEGORIES_FROM_VIEW, List.of());
        }
        DateFilter date = DateFilter.of(range);
        return new BoundSql(CATEGORIES_FROM_FACT.formatted(date.clause()), date.arguments());
    }

    public BoundSql regions(DateRange range) {
        DateFilter date = DateFilter.of(range);
        String source = range.isUnbounded()
                ? REGION_SALES_FROM_VIEW
                : REGION_SALES_FROM_FACT.formatted(date.clause());
        return new BoundSql(REGIONS.formatted(source, date.clause()), twice(date));
    }

    public BoundSql payments(DateRange range) {
        DateFilter date = DateFilter.of(range);
        return new BoundSql(PAYMENTS.formatted(date.clause()), twice(date));
    }

    public BoundSql fulfillmentByWarehouse(DateRange range) {
        DateFilter date = DateFilter.of(range);
        return new BoundSql(FULFILLMENT_BY_WAREHOUSE.formatted(date.clause()), twice(date));
    }

    public BoundSql topCustomers(DateRange range, int limit) {
        DateFilter date = DateFilter.of(range);
        List<Object> arguments = new ArrayList<>(date.arguments());
        arguments.add(limit);
        return new BoundSql(TOP_CUSTOMERS.formatted(date.clause()), arguments);
    }

    public BoundSql customerTotals(DateRange range) {
        DateFilter date = DateFilter.of(range);
        return new BoundSql(CUSTOMER_TOTALS.formatted(date.clause()), date.arguments());
    }

    public String oltpBenchmark() {
        return OLTP_BENCHMARK.formatted(oltpSchema);
    }

    public String starBenchmark() {
        return STAR_BENCHMARK;
    }

    public String viewBenchmark() {
        return VIEW_BENCHMARK;
    }

    /** The only place where a granularity becomes SQL. Every value is a fixed expression. */
    static String periodExpression(Granularity granularity) {
        return switch (granularity) {
            case DAY -> "TO_CHAR(d.full_date, 'YYYY-MM-DD')";
            case WEEK -> "TO_CHAR(d.full_date, 'IYYY\"-W\"IW')";
            case MONTH -> "d.year_month";
            case YEAR -> "TO_CHAR(d.full_date, 'YYYY')";
        };
    }

    /** The only place where a measure becomes SQL. */
    static String productOrder(ProductMeasure measure) {
        return switch (measure) {
            case REVENUE -> "SUM(f.sales_amount) DESC";
            case UNITS -> "SUM(f.quantity) DESC";
        };
    }

    private static List<Object> twice(DateFilter date) {
        List<Object> arguments = new ArrayList<>(date.arguments());
        arguments.addAll(date.arguments());
        return arguments;
    }

    /**
     * The date condition: a fixed clause with one question mark per bound side. The clause is empty when the
     * range is unbounded, so an unfiltered report carries no parameters.
     */
    private record DateFilter(String clause, List<Object> arguments) {

        static DateFilter of(DateRange range) {
            StringBuilder clause = new StringBuilder();
            List<Object> arguments = new ArrayList<>();
            if (range.from() != null) {
                clause.append(" AND d.full_date >= ?");
                arguments.add(Date.valueOf(range.from()));
            }
            if (range.to() != null) {
                clause.append(" AND d.full_date <= ?");
                arguments.add(Date.valueOf(range.to()));
            }
            return new DateFilter(clause.toString(), arguments);
        }
    }
}
