package edu.yildiz.ecommerce.etl.job;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;
import java.util.function.Supplier;

import edu.yildiz.ecommerce.etl.model.EtlOutcome;
import edu.yildiz.ecommerce.etl.model.EtlStepResult;
import edu.yildiz.ecommerce.etl.model.QualityResult;
import edu.yildiz.ecommerce.etl.model.RunType;
import edu.yildiz.ecommerce.etl.repository.EtlRunRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/** Loads the dimensions, the facts and the inventory snapshot, then checks the result against the OLTP schema. */
@Component
public class EtlJob {

    private static final Logger log = LoggerFactory.getLogger(EtlJob.class);
    private static final DateTimeFormatter DATE_KEY = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final LocalDateTime BEGINNING_OF_TIME = LocalDateTime.of(1900, 1, 1, 0, 0);

    /** Rows seen and rows loaded by one step. */
    private record StepCounts(long read, long loaded) {
        static StepCounts of(long loaded) {
            return new StepCounts(loaded, loaded);
        }
    }

    private final JdbcTemplate jdbc;
    private final TransactionTemplate transactions;
    private final EtlStatements sql;
    private final EtlRunRepository runs;

    public EtlJob(JdbcTemplate jdbc, PlatformTransactionManager transactionManager, EtlStatements sql,
                  EtlRunRepository runs) {
        this.jdbc = jdbc;
        this.transactions = new TransactionTemplate(transactionManager);
        this.sql = sql;
        this.runs = runs;
    }

    /**
     * Runs the whole job for an already registered run.
     *
     * @param requested an incremental request becomes a full load when nothing has been loaded yet
     */
    public EtlOutcome execute(long runId, RunType requested) {
        Optional<LocalDateTime> watermark = requested == RunType.INCREMENTAL ? runs.findOrdersWatermark() : Optional.empty();
        boolean incremental = watermark.isPresent();
        if (requested == RunType.INCREMENTAL && !incremental) {
            log.info("Run {}: nothing has been loaded yet, switching to a full load", runId);
            runs.updateType(runId, RunType.FULL);
        }
        Timestamp since = Timestamp.valueOf(watermark.orElse(BEGINNING_OF_TIME));
        long[] totals = new long[3];

        if (!incremental) {
            step(runId, totals, "Empty fact tables", () -> {
                jdbc.execute(sql.truncateFactSales());
                jdbc.execute(sql.truncateFactOrders());
                runs.clearOrdersWatermark();
                return StepCounts.of(0);
            });
        }
        step(runId, totals, "Load warehouse dimension", () -> StepCounts.of(jdbc.update(sql.mergeWarehouses())));
        step(runId, totals, "Load product dimension", () -> StepCounts.of(jdbc.update(sql.mergeProducts())));
        step(runId, totals, "Load customer dimension", () ->
                StepCounts.of(jdbc.update(sql.closeChangedCustomers()) + jdbc.update(sql.insertCurrentCustomers())));
        step(runId, totals, "Load order facts", () -> new StepCounts(
                count(sql.countSourceOrders(), since), jdbc.update(sql.loadFactOrders(), since)));
        step(runId, totals, "Load sales facts", () -> new StepCounts(
                count(sql.countSourceOrderLines(), since), jdbc.update(sql.loadFactSales(), since)));
        if (incremental) {
            step(runId, totals, "Refresh order delivery", () -> StepCounts.of(jdbc.update(sql.refreshOrderDelivery())));
            step(runId, totals, "Refresh line delivery", () -> StepCounts.of(jdbc.update(sql.refreshLineDelivery())));
        }
        step(runId, totals, "Refresh monthly sales view", () -> {
            jdbc.execute(sql.refreshMonthlySales());
            return StepCounts.of(0);
        });
        step(runId, totals, "Load inventory snapshot", this::loadInventorySnapshot);

        saveWatermark();
        runQualityChecks(runId);
        return new EtlOutcome(totals[0], totals[1], totals[2]);
    }

    private void step(long runId, long[] totals, String name, Supplier<StepCounts> work) {
        long started = System.nanoTime();
        StepCounts counts = transactions.execute(status -> work.get());
        long milliseconds = (System.nanoTime() - started) / 1_000_000;
        runs.addStep(runId, new EtlStepResult(name, counts.read(), counts.loaded(), milliseconds));
        totals[0] += counts.read();
        totals[1] += counts.loaded();
        totals[2] += Math.max(0, counts.read() - counts.loaded());
        log.info("Run {}: {} read {}, loaded {} in {} ms", runId, name, counts.read(), counts.loaded(), milliseconds);
    }

    private long count(String query, Timestamp since) {
        Long value = jdbc.queryForObject(query, Long.class, since);
        return value == null ? 0 : value;
    }

    private StepCounts loadInventorySnapshot() {
        int snapshotKey = Integer.parseInt(LocalDate.now().format(DATE_KEY));
        jdbc.update(sql.deleteInventorySnapshot(), snapshotKey);
        return StepCounts.of(jdbc.update(sql.loadInventorySnapshot(), snapshotKey));
    }

    private void saveWatermark() {
        Timestamp latest = jdbc.queryForObject(sql.latestSourceOrderTime(), Timestamp.class);
        if (latest != null) {
            runs.saveOrdersWatermark(latest.toLocalDateTime());
        }
    }

    private void runQualityChecks(long runId) {
        for (EtlStatements.QualityCheck check : sql.qualityChecks()) {
            BigDecimal expected = jdbc.queryForObject(check.expectedSql(), BigDecimal.class);
            BigDecimal actual = jdbc.queryForObject(check.actualSql(), BigDecimal.class);
            boolean passed = expected != null && actual != null && expected.compareTo(actual) == 0;
            String detail = "expected " + expected + ", found " + actual;
            runs.addQualityResult(runId, new QualityResult(check.name(), passed, detail));
            if (!passed) {
                log.warn("Run {}: quality check '{}' failed ({})", runId, check.name(), detail);
            }
        }
    }
}
