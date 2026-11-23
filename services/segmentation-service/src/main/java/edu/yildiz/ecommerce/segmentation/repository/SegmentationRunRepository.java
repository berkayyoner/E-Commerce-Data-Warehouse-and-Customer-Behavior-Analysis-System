package edu.yildiz.ecommerce.segmentation.repository;

import java.sql.CallableStatement;
import java.sql.Date;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import edu.yildiz.ecommerce.segmentation.model.ClusterProfile;
import edu.yildiz.ecommerce.segmentation.model.ElbowPoint;
import edu.yildiz.ecommerce.segmentation.model.RunStatus;
import edu.yildiz.ecommerce.segmentation.model.SegmentationRun;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

/** Reads and writes the run bookkeeping, the elbow curve and the clusters. */
@Repository
public class SegmentationRunRepository {

    private static final int MAX_ERROR_LENGTH = 2000;

    private static final RowMapper<SegmentationRun> RUN_MAPPER = (rs, rowNum) -> {
        Timestamp finished = rs.getTimestamp("finished_at");
        return new SegmentationRun(
                rs.getLong("run_id"),
                RunStatus.valueOf(rs.getString("status")),
                rs.getTimestamp("started_at").toInstant(),
                finished == null ? null : finished.toInstant(),
                rs.getLong("etl_run_id"),
                rs.getDate("as_of_date").toLocalDate(),
                rs.getObject("customers_scored", Long.class),
                rs.getObject("chosen_k", Integer.class),
                rs.getString("error_message"));
    };

    private final JdbcTemplate jdbc;

    public SegmentationRunRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** The newest ETL run that succeeded, if any. */
    public Optional<Long> findLatestSuccessfulEtlRunId() {
        return firstValue(jdbc.queryForList("SELECT MAX(run_id) FROM etl_run WHERE status = 'SUCCESS'", Long.class));
    }

    /** The day of the newest order in the warehouse, if there are orders. */
    public Optional<LocalDate> findLastOrderDate() {
        Optional<Date> date = firstValue(jdbc.queryForList("""
                SELECT MAX(d.full_date)
                  FROM fact_orders f
                  JOIN dim_date d ON d.date_key = f.order_date_key""", Date.class));
        return date.map(Date::toLocalDate);
    }

    /** The ETL run that the newest successful segmentation run was based on. */
    public Optional<Long> findLatestSuccessfulSegmentationEtlRunId() {
        return firstValue(jdbc.queryForList("""
                SELECT etl_run_id FROM segmentation_run
                 WHERE status = 'SUCCESS'
                 ORDER BY run_id DESC
                 FETCH FIRST 1 ROWS ONLY""", Long.class));
    }

    /** Inserts a running run and returns its id, which Oracle hands back with RETURNING INTO. */
    public long create(long etlRunId, LocalDate asOfDate) {
        Long runId = jdbc.execute((ConnectionCallback<Long>) connection -> {
            try (CallableStatement statement = connection.prepareCall("""
                    BEGIN
                        INSERT INTO segmentation_run (status, started_at, etl_run_id, as_of_date)
                        VALUES (?, ?, ?, ?)
                        RETURNING run_id INTO ?;
                    END;""")) {
                statement.setString(1, RunStatus.RUNNING.name());
                statement.setTimestamp(2, Timestamp.from(Instant.now()));
                statement.setLong(3, etlRunId);
                statement.setDate(4, Date.valueOf(asOfDate));
                statement.registerOutParameter(5, Types.NUMERIC);
                statement.execute();
                return statement.getLong(5);
            }
        });
        return runId;
    }

    public void finish(long runId, RunStatus status, Long customersScored, Integer chosenK, String error) {
        jdbc.update("""
                UPDATE segmentation_run
                   SET status = ?, finished_at = ?, customers_scored = ?, chosen_k = ?, error_message = ?
                 WHERE run_id = ?""",
                status.name(), Timestamp.from(Instant.now()), customersScored, chosenK, truncate(error), runId);
    }

    public boolean hasRunningRun() {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM segmentation_run WHERE status = 'RUNNING'",
                Integer.class);
        return count != null && count > 0;
    }

    /** Runs that were still marked as running when the service stopped can never finish. */
    public int failInterruptedRuns() {
        return jdbc.update("""
                UPDATE segmentation_run
                   SET status = 'FAILED', finished_at = ?, error_message = 'The service stopped before the run finished'
                 WHERE status = 'RUNNING'""", Timestamp.from(Instant.now()));
    }

    public Optional<SegmentationRun> find(long runId) {
        return jdbc.query("SELECT * FROM segmentation_run WHERE run_id = ?", RUN_MAPPER, runId)
                .stream()
                .findFirst();
    }

    public Optional<SegmentationRun> findLatestSuccessful() {
        return jdbc.query("""
                SELECT * FROM segmentation_run
                 WHERE run_id = (SELECT MAX(run_id) FROM segmentation_run WHERE status = 'SUCCESS')""", RUN_MAPPER)
                .stream()
                .findFirst();
    }

    public List<SegmentationRun> findPage(int page, int size) {
        return jdbc.query("SELECT * FROM segmentation_run ORDER BY run_id DESC OFFSET ? ROWS FETCH NEXT ? ROWS ONLY",
                RUN_MAPPER, (long) page * size, size);
    }

    public long count() {
        Long total = jdbc.queryForObject("SELECT COUNT(*) FROM segmentation_run", Long.class);
        return total == null ? 0 : total;
    }

    public void saveElbow(long runId, List<ElbowPoint> points) {
        jdbc.batchUpdate("INSERT INTO kmeans_elbow (run_id, k, inertia) VALUES (?, ?, ?)", points, 100,
                (statement, point) -> {
                    statement.setLong(1, runId);
                    statement.setInt(2, point.k());
                    statement.setDouble(3, point.inertia());
                });
    }

    public List<ElbowPoint> findElbow(long runId) {
        return jdbc.query("SELECT k, inertia FROM kmeans_elbow WHERE run_id = ? ORDER BY k",
                (rs, rowNum) -> new ElbowPoint(rs.getInt("k"), rs.getDouble("inertia")), runId);
    }

    public void saveClusters(long runId, List<ClusterProfile> clusters) {
        jdbc.batchUpdate("""
                INSERT INTO kmeans_cluster (run_id, cluster_id, label, customers, avg_recency_days, avg_frequency,
                                            avg_monetary)
                VALUES (?, ?, ?, ?, ?, ?, ?)""", clusters, 100, (statement, cluster) -> {
            statement.setLong(1, runId);
            statement.setInt(2, cluster.clusterId());
            statement.setString(3, cluster.label());
            statement.setLong(4, cluster.customers());
            statement.setDouble(5, cluster.averageRecencyDays());
            statement.setDouble(6, cluster.averageFrequency());
            statement.setDouble(7, cluster.averageMonetary());
        });
    }

    public List<ClusterProfile> findClusters(long runId) {
        return jdbc.query("""
                SELECT cluster_id, label, customers, avg_recency_days, avg_frequency, avg_monetary
                  FROM kmeans_cluster
                 WHERE run_id = ?
                 ORDER BY cluster_id""",
                (rs, rowNum) -> new ClusterProfile(
                        rs.getInt("cluster_id"),
                        rs.getString("label"),
                        rs.getLong("customers"),
                        rs.getDouble("avg_recency_days"),
                        rs.getDouble("avg_frequency"),
                        rs.getDouble("avg_monetary")),
                runId);
    }

    private static <T> Optional<T> firstValue(List<T> values) {
        return values.stream().filter(value -> value != null).findFirst();
    }

    private static String truncate(String text) {
        if (text == null || text.length() <= MAX_ERROR_LENGTH) {
            return text;
        }
        return text.substring(0, MAX_ERROR_LENGTH);
    }
}
