package edu.yildiz.ecommerce.analytics.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.sql.Date;
import java.time.LocalDate;

import edu.yildiz.ecommerce.analytics.config.AnalyticsProperties;
import edu.yildiz.ecommerce.analytics.model.DateRange;
import edu.yildiz.ecommerce.analytics.model.Granularity;
import edu.yildiz.ecommerce.analytics.model.ProductMeasure;
import org.junit.jupiter.api.Test;

class ReportQueriesTest {

    private final ReportQueries queries = new ReportQueries(new AnalyticsProperties("DWH_OLTP"));
    private static final DateRange JANUARY = DateRange.of(LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 31));

    private static long questionMarks(BoundSql sql) {
        return sql.sql().chars().filter(character -> character == '?').count();
    }

    @Test
    void granularitiesMapToFixedPeriodExpressions() {
        assertThat(ReportQueries.periodExpression(Granularity.DAY))
                .isEqualTo("TO_CHAR(d.full_date, 'YYYY-MM-DD')");
        assertThat(ReportQueries.periodExpression(Granularity.WEEK))
                .isEqualTo("TO_CHAR(d.full_date, 'IYYY\"-W\"IW')");
        assertThat(ReportQueries.periodExpression(Granularity.MONTH)).isEqualTo("d.year_month");
        assertThat(ReportQueries.periodExpression(Granularity.YEAR))
                .isEqualTo("TO_CHAR(d.full_date, 'YYYY')");
    }

    @Test
    void anUnfilteredMonthlyTrendReadsTheMaterializedView() {
        BoundSql sql = queries.trend(Granularity.MONTH, DateRange.unbounded());

        assertThat(sql.sql()).contains("mv_sales_monthly").doesNotContain("fact_sales");
        assertThat(sql.arguments()).isEmpty();
    }

    @Test
    void aFilteredTrendReadsTheFactTableWithBoundDates() {
        BoundSql sql = queries.trend(Granularity.DAY, JANUARY);

        assertThat(sql.sql()).contains("fact_sales").doesNotContain("mv_sales_monthly");
        assertThat(sql.arguments()).containsExactly(
                Date.valueOf("2026-01-01"), Date.valueOf("2026-01-31"),
                Date.valueOf("2026-01-01"), Date.valueOf("2026-01-31"));
        assertThat(questionMarks(sql)).isEqualTo(4);
    }

    @Test
    void userTextIsBoundAsAParameterAndNeverConcatenated() {
        String hostile = "x' OR '1'='1";

        BoundSql sql = queries.topProducts(ProductMeasure.REVENUE, hostile, JANUARY, 5);

        assertThat(sql.sql()).doesNotContain("OR '1'").contains("p.category = ?");
        assertThat(sql.arguments()).containsExactly(
                Date.valueOf("2026-01-01"), Date.valueOf("2026-01-31"), hostile, 5);
    }

    @Test
    void theMeasureChoosesTheOrderingExpression() {
        assertThat(queries.topProducts(ProductMeasure.UNITS, null, DateRange.unbounded(), 10).sql())
                .contains("ORDER BY SUM(f.quantity) DESC");
        assertThat(queries.topProducts(ProductMeasure.REVENUE, null, DateRange.unbounded(), 10).sql())
                .contains("ORDER BY SUM(f.sales_amount) DESC");
    }

    @Test
    void anUnfilteredProductRankingOnlyBindsTheLimit() {
        BoundSql sql = queries.topProducts(ProductMeasure.REVENUE, null, DateRange.unbounded(), 10);

        assertThat(sql.arguments()).containsExactly(10);
        assertThat(sql.sql()).doesNotContain("p.category = ?");
    }

    @Test
    void theRegionReportUsesTheViewOnlyWithoutDates() {
        BoundSql unfiltered = queries.regions(DateRange.unbounded());
        BoundSql filtered = queries.regions(JANUARY);

        assertThat(unfiltered.sql()).contains("mv_sales_monthly");
        assertThat(unfiltered.arguments()).isEmpty();
        assertThat(filtered.sql()).doesNotContain("mv_sales_monthly").contains("fact_sales");
        assertThat(questionMarks(filtered)).isEqualTo(4);
    }

    @Test
    void theBenchmarkUsesTheConfiguredOltpSchema() {
        String sql = queries.oltpBenchmark();

        assertThat(sql).contains("DWH_OLTP.order_line", "DWH_OLTP.oorder", "DWH_OLTP.item");
        assertThat(sql).doesNotContain("%1$s");
    }
}
