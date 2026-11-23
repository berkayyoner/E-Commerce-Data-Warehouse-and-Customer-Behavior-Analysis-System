package edu.yildiz.ecommerce.analytics.cache;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

import edu.yildiz.ecommerce.analytics.repository.ReportRepository;
import org.springframework.stereotype.Component;

/**
 * The data version that every cache key carries. It is the run id of the last successful ETL run, read from the
 * warehouse at most once every ten seconds, so a finished load invalidates all reports within that time.
 */
@Component
public class DataVersion {

    static final Duration LIFETIME = Duration.ofSeconds(10);

    private final ReportRepository repository;
    private final Clock clock;
    private volatile Snapshot snapshot;

    public DataVersion(ReportRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    public long current() {
        Instant now = clock.instant();
        Snapshot latest = snapshot;
        if (latest != null && Duration.between(latest.loadedAt(), now).compareTo(LIFETIME) < 0) {
            return latest.version();
        }
        long version = repository.currentDataVersion();
        snapshot = new Snapshot(version, now);
        return version;
    }

    private record Snapshot(long version, Instant loadedAt) {
    }
}
