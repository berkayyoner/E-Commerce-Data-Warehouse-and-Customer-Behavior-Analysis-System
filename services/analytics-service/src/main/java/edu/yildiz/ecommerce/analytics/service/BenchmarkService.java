package edu.yildiz.ecommerce.analytics.service;

import java.math.BigDecimal;
import java.util.List;

import edu.yildiz.ecommerce.analytics.model.BenchmarkResult;
import edu.yildiz.ecommerce.analytics.repository.ReportQueries;
import edu.yildiz.ecommerce.analytics.repository.ReportRepository;
import edu.yildiz.ecommerce.analytics.support.Figures;
import org.springframework.stereotype.Service;

/**
 * Compares the same business question on the OLTP schema, the star schema and the materialized view. Never cached,
 * because the point is to measure the database.
 */
@Service
public class BenchmarkService {

    static final int RUNS = 3;

    static final String OLTP = "OLTP schema";
    static final String STAR = "Star schema";
    static final String VIEW = "Materialized view";

    private final ReportRepository repository;
    private final ReportQueries queries;

    public BenchmarkService(ReportRepository repository, ReportQueries queries) {
        this.repository = repository;
        this.queries = queries;
    }

    public List<BenchmarkResult> run() {
        Measurement oltp = measure(queries.oltpBenchmark());
        Measurement star = measure(queries.starBenchmark());
        Measurement view = measure(queries.viewBenchmark());
        BigDecimal oltpMilliseconds = milliseconds(oltp);
        return List.of(
                new BenchmarkResult(OLTP, oltp.rows(), Figures.orZero(oltpMilliseconds, 3),
                        BigDecimal.ONE.setScale(2)),
                result(STAR, star, oltpMilliseconds),
                result(VIEW, view, oltpMilliseconds));
    }

    /** One warm-up run, then the average of {@link #RUNS} timed runs. */
    private Measurement measure(String sql) {
        repository.countRows(sql);
        long totalNanos = 0;
        long rows = 0;
        for (int run = 0; run < RUNS; run++) {
            long start = System.nanoTime();
            rows = repository.countRows(sql);
            totalNanos += System.nanoTime() - start;
        }
        return new Measurement(rows, totalNanos / RUNS);
    }

    private static BenchmarkResult result(String name, Measurement measurement, BigDecimal oltpMilliseconds) {
        BigDecimal milliseconds = milliseconds(measurement);
        return new BenchmarkResult(
                name,
                measurement.rows(),
                Figures.orZero(milliseconds, 3),
                Figures.divide(oltpMilliseconds, milliseconds, 2));
    }

    private static BigDecimal milliseconds(Measurement measurement) {
        return BigDecimal.valueOf(measurement.averageNanos(), 6);
    }

    private record Measurement(long rows, long averageNanos) {
    }
}
