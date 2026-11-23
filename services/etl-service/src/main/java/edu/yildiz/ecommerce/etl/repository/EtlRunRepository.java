package edu.yildiz.ecommerce.etl.repository;

import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import edu.yildiz.ecommerce.etl.model.EtlRun;
import edu.yildiz.ecommerce.etl.model.EtlStepResult;
import edu.yildiz.ecommerce.etl.model.QualityResult;
import edu.yildiz.ecommerce.etl.model.RunStatus;
import edu.yildiz.ecommerce.etl.model.RunType;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

/** Reads and writes the ETL bookkeeping tables of the warehouse schema. */
@Repository
public class EtlRunRepository {

    private static final String ORDERS_WATERMARK = "ORDERS";
    private static final int MAX_ERROR_LENGTH = 2000;
    private static final int MAX_DETAIL_LENGTH = 400;

    private static final RowMapper<EtlRun> RUN_MAPPER = (rs, rowNum) -> {
        Timestamp finished = rs.getTimestamp("finished_at");
        return new EtlRun(
                rs.getLong("run_id"),
                RunType.valueOf(rs.getString("run_type")),
                RunStatus.valueOf(rs.getString("status")),
                rs.getTimestamp("started_at").toInstant(),
                finished == null ? null : finished.toInstant(),
                rs.getLong("rows_read"),
                rs.getLong("rows_loaded"),
                rs.getLong("rows_rejected"),
                rs.getString("error_message"));
    };

    private final JdbcTemplate jdbc;

    public EtlRunRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public long create(RunType runType) {
        KeyHolder keys = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                    "INSERT INTO etl_run (run_type, status, started_at) VALUES (?, ?, ?)",
                    new String[] {"RUN_ID"});
            statement.setString(1, runType.name());
            statement.setString(2, RunStatus.RUNNING.name());
            statement.setTimestamp(3, Timestamp.from(Instant.now()));
            return statement;
        }, keys);
        return keys.getKey().longValue();
    }

    public void updateType(long runId, RunType runType) {
        jdbc.update("UPDATE etl_run SET run_type = ? WHERE run_id = ?", runType.name(), runId);
    }

    public void finish(long runId, RunStatus status, long rowsRead, long rowsLoaded, long rowsRejected, String error) {
        jdbc.update("""
                UPDATE etl_run
                   SET status = ?, finished_at = ?, rows_read = ?, rows_loaded = ?, rows_rejected = ?, error_message = ?
                 WHERE run_id = ?""",
                status.name(), Timestamp.from(Instant.now()), rowsRead, rowsLoaded, rowsRejected,
                truncate(error, MAX_ERROR_LENGTH), runId);
    }

    public boolean hasRunningRun() {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM etl_run WHERE status = 'RUNNING'", Integer.class);
        return count != null && count > 0;
    }

    /** Runs that were still marked as running when the service stopped can never finish. */
    public int failInterruptedRuns() {
        return jdbc.update("""
                UPDATE etl_run
                   SET status = 'FAILED', finished_at = ?, error_message = 'The service stopped before the run finished'
                 WHERE status = 'RUNNING'""", Timestamp.from(Instant.now()));
    }

    public void addStep(long runId, EtlStepResult step) {
        jdbc.update("""
                INSERT INTO etl_step (run_id, step_name, rows_read, rows_loaded, duration_ms) VALUES (?, ?, ?, ?, ?)""",
                runId, step.stepName(), step.rowsRead(), step.rowsLoaded(), step.durationMs());
    }

    public void addQualityResult(long runId, QualityResult result) {
        jdbc.update("INSERT INTO etl_quality_result (run_id, check_name, passed, detail) VALUES (?, ?, ?, ?)",
                runId, result.checkName(), result.passed() ? "Y" : "N", truncate(result.detail(), MAX_DETAIL_LENGTH));
    }

    public Optional<EtlRun> find(long runId) {
        List<EtlRun> runs = jdbc.query("SELECT * FROM etl_run WHERE run_id = ?", RUN_MAPPER, runId);
        return runs.stream().findFirst();
    }

    public List<EtlRun> findPage(int page, int size) {
        return jdbc.query("SELECT * FROM etl_run ORDER BY run_id DESC OFFSET ? ROWS FETCH NEXT ? ROWS ONLY",
                RUN_MAPPER, (long) page * size, size);
    }

    public long count() {
        Long total = jdbc.queryForObject("SELECT COUNT(*) FROM etl_run", Long.class);
        return total == null ? 0 : total;
    }

    public List<EtlStepResult> findSteps(long runId) {
        return jdbc.query(
                "SELECT step_name, rows_read, rows_loaded, duration_ms FROM etl_step WHERE run_id = ? ORDER BY step_id",
                (rs, rowNum) -> new EtlStepResult(rs.getString("step_name"), rs.getLong("rows_read"),
                        rs.getLong("rows_loaded"), rs.getLong("duration_ms")),
                runId);
    }

    public List<QualityResult> findQualityResults(long runId) {
        return jdbc.query(
                "SELECT check_name, passed, detail FROM etl_quality_result WHERE run_id = ? ORDER BY check_id",
                (rs, rowNum) -> new QualityResult(rs.getString("check_name"), "Y".equals(rs.getString("passed")),
                        rs.getString("detail")),
                runId);
    }

    public Optional<LocalDateTime> findOrdersWatermark() {
        try {
            Timestamp value = jdbc.queryForObject(
                    "SELECT last_value FROM etl_watermark WHERE source_name = ?", Timestamp.class, ORDERS_WATERMARK);
            return Optional.ofNullable(value).map(Timestamp::toLocalDateTime);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public void saveOrdersWatermark(LocalDateTime value) {
        int updated = jdbc.update("UPDATE etl_watermark SET last_value = ?, updated_at = ? WHERE source_name = ?",
                Timestamp.valueOf(value), Timestamp.from(Instant.now()), ORDERS_WATERMARK);
        if (updated == 0) {
            jdbc.update("INSERT INTO etl_watermark (source_name, last_value, updated_at) VALUES (?, ?, ?)",
                    ORDERS_WATERMARK, Timestamp.valueOf(value), Timestamp.from(Instant.now()));
        }
    }

    public void clearOrdersWatermark() {
        jdbc.update("DELETE FROM etl_watermark WHERE source_name = ?", ORDERS_WATERMARK);
    }

    private static String truncate(String text, int maxLength) {
        if (text == null || text.length() <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength);
    }
}
