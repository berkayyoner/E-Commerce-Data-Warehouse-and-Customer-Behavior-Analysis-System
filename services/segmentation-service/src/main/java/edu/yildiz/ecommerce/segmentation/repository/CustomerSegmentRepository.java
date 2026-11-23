package edu.yildiz.ecommerce.segmentation.repository;

import java.sql.Date;
import java.sql.PreparedStatement;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.IntStream;
import java.util.stream.Stream;

import edu.yildiz.ecommerce.segmentation.model.CustomerKey;
import edu.yildiz.ecommerce.segmentation.model.CustomerMetrics;
import edu.yildiz.ecommerce.segmentation.model.CustomerQuery;
import edu.yildiz.ecommerce.segmentation.model.CustomerRow;
import edu.yildiz.ecommerce.segmentation.model.PageResult;
import edu.yildiz.ecommerce.segmentation.model.RfmGridCell;
import edu.yildiz.ecommerce.segmentation.model.SegmentSummary;
import edu.yildiz.ecommerce.segmentation.rfm.RfmSegments;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/** Computes the RFM scores and the cluster assignments, and reads the customer segment table. */
@Repository
public class CustomerSegmentRepository {

    private static final int FETCH_SIZE = 2000;
    private static final int UPDATE_BATCH_SIZE = 5000;

    private static final String INSERT_SCORED = """
            INSERT INTO customer_segment (source_w_id, source_d_id, source_c_id, run_id, recency_days, frequency,
                                          monetary, r_score, f_score, m_score, rfm_segment, cluster_id)
            SELECT source_w_id, source_d_id, source_c_id, ?, recency_days, frequency, monetary,
                   r_score, f_score, m_score, %s, NULL
              FROM (
                    SELECT source_w_id, source_d_id, source_c_id, recency_days, frequency, monetary,
                           6 - CEIL(5 * CUME_DIST() OVER (ORDER BY recency_days)) AS r_score,
                           GREATEST(1, CEIL(5 * PERCENT_RANK() OVER (ORDER BY frequency))) AS f_score,
                           CEIL(5 * CUME_DIST() OVER (ORDER BY monetary)) AS m_score
                      FROM (
                            SELECT dc.source_w_id, dc.source_d_id, dc.source_c_id,
                                   TRUNC(CAST(? AS DATE)) - TRUNC(MAX(d.full_date)) AS recency_days,
                                   COUNT(*) AS frequency,
                                   SUM(f.order_amount) AS monetary
                              FROM fact_orders f
                              JOIN dim_customer dc ON dc.customer_key = f.customer_key
                              JOIN dim_date d ON d.date_key = f.order_date_key
                             GROUP BY dc.source_w_id, dc.source_d_id, dc.source_c_id
                           )
                   )
            """;

    private static final String FROM_SEGMENTS = """
             FROM customer_segment cs
             JOIN dim_customer dc
               ON dc.source_w_id = cs.source_w_id
              AND dc.source_d_id = cs.source_d_id
              AND dc.source_c_id = cs.source_c_id
              AND dc.is_current = 'Y'""";

    private static final String CLUSTER_JOIN = " LEFT JOIN kmeans_cluster kc ON kc.run_id = ? AND kc.cluster_id = cs.cluster_id";

    private final JdbcTemplate jdbc;

    public CustomerSegmentRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /**
     * Replaces the segment table with the scores of the current orders. Must run inside a transaction so that
     * readers never see an empty table for long.
     *
     * @return the number of customers scored
     */
    public long replaceScores(long runId, LocalDate asOfDate) {
        jdbc.update("DELETE FROM customer_segment");
        String insert = INSERT_SCORED.formatted(RfmSegments.caseExpression("r_score", "f_score"));
        return jdbc.update(insert, runId, Date.valueOf(asOfDate));
    }

    /** Streams the raw measures of every customer scored by the run. */
    public List<CustomerMetrics> findMetrics(long runId) {
        List<CustomerMetrics> metrics = new ArrayList<>();
        jdbc.query(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                    SELECT source_w_id, source_d_id, source_c_id, recency_days, frequency, monetary
                      FROM customer_segment
                     WHERE run_id = ?""");
            statement.setFetchSize(FETCH_SIZE);
            statement.setLong(1, runId);
            return statement;
        }, rs -> {
            CustomerKey key = new CustomerKey(rs.getLong("source_w_id"), rs.getLong("source_d_id"),
                    rs.getLong("source_c_id"));
            metrics.add(new CustomerMetrics(key, rs.getDouble("recency_days"), rs.getDouble("frequency"),
                    rs.getDouble("monetary")));
        });
        return metrics;
    }

    /** Sets the cluster of every customer. {@code clusterIds[i]} belongs to {@code keys.get(i)}. */
    public void updateClusters(List<CustomerKey> keys, int[] clusterIds) {
        List<Integer> indexes = IntStream.range(0, keys.size()).boxed().toList();
        jdbc.batchUpdate("""
                UPDATE customer_segment
                   SET cluster_id = ?
                 WHERE source_w_id = ? AND source_d_id = ? AND source_c_id = ?""", indexes, UPDATE_BATCH_SIZE,
                (statement, index) -> {
                    CustomerKey key = keys.get(index);
                    statement.setInt(1, clusterIds[index]);
                    statement.setLong(2, key.warehouseId());
                    statement.setLong(3, key.districtId());
                    statement.setLong(4, key.customerId());
                });
    }

    public List<SegmentSummary> findSegments() {
        return jdbc.query("""
                SELECT rfm_segment,
                       COUNT(*) AS customers,
                       ROUND(COUNT(*) / SUM(COUNT(*)) OVER (), 4) AS customer_share,
                       AVG(recency_days) AS avg_recency,
                       AVG(frequency) AS avg_frequency,
                       AVG(monetary) AS avg_monetary,
                       SUM(monetary) AS total_revenue
                  FROM customer_segment
                 GROUP BY rfm_segment
                 ORDER BY total_revenue DESC""",
                (rs, rowNum) -> new SegmentSummary(
                        rs.getString("rfm_segment"),
                        rs.getLong("customers"),
                        rs.getDouble("customer_share"),
                        rs.getDouble("avg_recency"),
                        rs.getDouble("avg_frequency"),
                        rs.getDouble("avg_monetary"),
                        rs.getDouble("total_revenue")));
    }

    public List<RfmGridCell> findRfmGrid() {
        return jdbc.query("""
                SELECT r_score, f_score, COUNT(*) AS customers, AVG(monetary) AS avg_monetary
                  FROM customer_segment
                 GROUP BY r_score, f_score
                 ORDER BY r_score, f_score""",
                (rs, rowNum) -> new RfmGridCell(
                        rs.getInt("r_score"),
                        rs.getInt("f_score"),
                        rs.getLong("customers"),
                        rs.getDouble("avg_monetary")));
    }

    /**
     * One page of the customer table for the given run's clusters. The filters, the search and the sort are added
     * to a fixed statement; every value that comes from the request is bound as a parameter.
     */
    public PageResult<CustomerRow> findCustomers(long clusterRunId, CustomerQuery query) {
        Filter filter = filter(query);

        Long total = jdbc.queryForObject("SELECT COUNT(*)" + FROM_SEGMENTS + filter.where(),
                Long.class, filter.arguments().toArray());
        List<Object> pageArguments = new ArrayList<>();
        pageArguments.add(clusterRunId);
        pageArguments.addAll(filter.arguments());
        pageArguments.add((long) query.page() * query.size());
        pageArguments.add(query.size());

        String sql = """
                SELECT cs.source_w_id, cs.source_d_id, cs.source_c_id, dc.first_name, dc.last_name, dc.region,
                       cs.recency_days, cs.frequency, cs.monetary, cs.r_score, cs.f_score, cs.m_score,
                       cs.rfm_segment, cs.cluster_id, kc.label
                """ + FROM_SEGMENTS + CLUSTER_JOIN + filter.where()
                + " ORDER BY " + sortExpression(query) + ", cs.source_w_id, cs.source_d_id, cs.source_c_id"
                + " OFFSET ? ROWS FETCH NEXT ? ROWS ONLY";
        List<CustomerRow> content = jdbc.query(sql, (rs, rowNum) -> new CustomerRow(
                rs.getLong("source_w_id") + "-" + rs.getLong("source_d_id") + "-" + rs.getLong("source_c_id"),
                displayName(rs.getString("first_name"), rs.getString("last_name")),
                rs.getString("region"),
                rs.getLong("recency_days"),
                rs.getLong("frequency"),
                rs.getDouble("monetary"),
                rs.getInt("r_score"),
                rs.getInt("f_score"),
                rs.getInt("m_score"),
                rs.getString("rfm_segment"),
                rs.getObject("cluster_id", Integer.class),
                rs.getString("label")),
                pageArguments.toArray());
        return new PageResult<>(content, total == null ? 0 : total, query.page(), query.size());
    }

    private static Filter filter(CustomerQuery query) {
        StringBuilder where = new StringBuilder();
        List<Object> arguments = new ArrayList<>();
        if (query.segment() != null) {
            where.append(" AND cs.rfm_segment = ?");
            arguments.add(query.segment());
        }
        if (query.cluster() != null) {
            where.append(" AND cs.cluster_id = ?");
            arguments.add(query.cluster());
        }
        if (query.search() != null) {
            where.append(" AND UPPER(dc.first_name || ' ' || dc.last_name) LIKE ? ESCAPE '\\'");
            arguments.add(containsPattern(query.search()));
        }
        String clause = where.isEmpty() ? "" : " WHERE" + where.substring(" AND".length());
        return new Filter(clause, arguments);
    }

    private static String sortExpression(CustomerQuery query) {
        return query.sort().expression() + (query.descending() ? " DESC" : " ASC");
    }

    /** A LIKE pattern that matches the text anywhere, with the wildcard characters of the text taken literally. */
    static String containsPattern(String text) {
        String escaped = text.toUpperCase()
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
        return "%" + escaped + "%";
    }

    private static String displayName(String firstName, String lastName) {
        return Stream.of(firstName, lastName)
                .filter(part -> part != null && !part.isBlank())
                .map(String::trim)
                .reduce((first, second) -> first + " " + second)
                .orElse("");
    }

    private record Filter(String where, List<Object> arguments) {
    }
}
