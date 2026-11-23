package edu.yildiz.ecommerce.analytics.cache;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.function.Supplier;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.Cursor;
import org.springframework.data.redis.core.ScanOptions;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

/**
 * Redis cache of the reports. A key looks like {@code report:<data version>:<report>:<parameters>}, so a new ETL
 * run makes every older entry unreachable. The cache is an optimization only: when Redis fails, the report is
 * computed from the warehouse instead.
 */
@Component
public class ReportCache {

    static final String PREFIX = "report:";
    static final Duration TTL = Duration.ofHours(6);
    private static final int DELETE_BATCH = 500;

    private static final Logger log = LoggerFactory.getLogger(ReportCache.class);

    private final StringRedisTemplate redis;
    private final JsonMapper mapper;
    private final DataVersion dataVersion;

    public ReportCache(StringRedisTemplate redis, JsonMapper mapper, DataVersion dataVersion) {
        this.redis = redis;
        this.mapper = mapper;
        this.dataVersion = dataVersion;
    }

    /**
     * Returns the cached report, or runs the loader and stores its result for six hours.
     *
     * @param reportName the name of the report, for example {@code overview}
     * @param parameters the filters of the report in a stable text form
     * @param type       the JSON type of the report, needed to read a list or a record back
     * @param loader     computes the report from the warehouse
     */
    public <T> CachedReport<T> get(String reportName, String parameters, TypeReference<T> type, Supplier<T> loader) {
        String key = PREFIX + dataVersion.current() + ":" + reportName + ":" + parameters;
        Optional<T> cached = read(key, type);
        if (cached.isPresent()) {
            return new CachedReport<>(cached.get(), true);
        }
        T value = loader.get();
        write(key, value);
        return new CachedReport<>(value, false);
    }

    /** Deletes every cached report with a SCAN, which does not block Redis the way KEYS does. */
    public long clear() {
        ScanOptions options = ScanOptions.scanOptions().match(PREFIX + "*").count(DELETE_BATCH).build();
        long deleted = 0;
        List<String> batch = new ArrayList<>();
        try (Cursor<String> keys = redis.scan(options)) {
            while (keys.hasNext()) {
                batch.add(keys.next());
                if (batch.size() == DELETE_BATCH) {
                    deleted += delete(batch);
                    batch.clear();
                }
            }
        }
        if (!batch.isEmpty()) {
            deleted += delete(batch);
        }
        return deleted;
    }

    private <T> Optional<T> read(String key, TypeReference<T> type) {
        try {
            String json = redis.opsForValue().get(key);
            return json == null ? Optional.empty() : Optional.ofNullable(mapper.readValue(json, type));
        } catch (RuntimeException e) {
            log.warn("Report cache read failed for {}, computing the report from the warehouse: {}", key,
                    e.getMessage());
            return Optional.empty();
        }
    }

    private void write(String key, Object value) {
        try {
            redis.opsForValue().set(key, mapper.writeValueAsString(value), TTL);
        } catch (RuntimeException e) {
            log.warn("Report cache write failed for {}: {}", key, e.getMessage());
        }
    }

    private long delete(List<String> keys) {
        Long removed = redis.delete(keys);
        return removed == null ? 0 : removed;
    }
}
