package edu.yildiz.ecommerce.analytics.cache;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.Collection;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.Cursor;
import org.springframework.data.redis.core.ScanOptions;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

class ReportCacheTest {

    record Sample(String name, int value) {
    }

    private static final TypeReference<Sample> SAMPLE = new TypeReference<Sample>() {
    };

    private final StringRedisTemplate redis = mock(StringRedisTemplate.class);
    @SuppressWarnings("unchecked")
    private final ValueOperations<String, String> values = mock(ValueOperations.class);
    private final DataVersion dataVersion = mock(DataVersion.class);
    private final JsonMapper mapper = JsonMapper.builder().build();
    private final ReportCache cache = new ReportCache(redis, mapper, dataVersion);

    @BeforeEach
    void setUp() {
        when(redis.opsForValue()).thenReturn(values);
        when(dataVersion.current()).thenReturn(7L);
    }

    private String json(Object value) {
        return mapper.writeValueAsString(value);
    }

    @Test
    void aCachedValueIsReturnedWithoutRunningTheLoader() {
        when(values.get("report:7:overview:p")).thenReturn(json(new Sample("cached", 1)));
        AtomicInteger loads = new AtomicInteger();

        CachedReport<Sample> report = cache.get("overview", "p", SAMPLE, () -> {
            loads.incrementAndGet();
            return new Sample("fresh", 2);
        });

        assertThat(report.hit()).isTrue();
        assertThat(report.value()).isEqualTo(new Sample("cached", 1));
        assertThat(loads).hasValue(0);
    }

    @Test
    void aMissRunsTheLoaderAndStoresTheValueForSixHours() {
        when(values.get(anyString())).thenReturn(null);

        CachedReport<Sample> report = cache.get("overview", "p", SAMPLE, () -> new Sample("fresh", 2));

        assertThat(report.hit()).isFalse();
        assertThat(report.value()).isEqualTo(new Sample("fresh", 2));
        verify(values).set("report:7:overview:p", json(new Sample("fresh", 2)), Duration.ofHours(6));
    }

    @Test
    void theDataVersionIsPartOfTheKey() {
        when(values.get(anyString())).thenReturn(null);
        cache.get("overview", "p", SAMPLE, () -> new Sample("a", 1));

        when(dataVersion.current()).thenReturn(8L);
        cache.get("overview", "p", SAMPLE, () -> new Sample("b", 2));

        verify(values).get("report:7:overview:p");
        verify(values).get("report:8:overview:p");
    }

    @Test
    void aRedisReadFailureFallsBackToTheLoader() {
        when(values.get(anyString())).thenThrow(new RedisConnectionFailureException("Redis is down"));

        CachedReport<Sample> report = cache.get("overview", "p", SAMPLE, () -> new Sample("fresh", 2));

        assertThat(report.hit()).isFalse();
        assertThat(report.value()).isEqualTo(new Sample("fresh", 2));
    }

    @Test
    void aRedisWriteFailureStillReturnsTheComputedReport() {
        when(values.get(anyString())).thenReturn(null);
        doThrow(new RedisConnectionFailureException("Redis is down"))
                .when(values).set(anyString(), anyString(), any(Duration.class));

        CachedReport<Sample> report = cache.get("overview", "p", SAMPLE, () -> new Sample("fresh", 2));

        assertThat(report.value()).isEqualTo(new Sample("fresh", 2));
    }

    @Test
    void anUnreadableCachedValueIsComputedAgain() {
        when(values.get(anyString())).thenReturn("{not json");

        CachedReport<Sample> report = cache.get("overview", "p", SAMPLE, () -> new Sample("fresh", 2));

        assertThat(report.hit()).isFalse();
        assertThat(report.value()).isEqualTo(new Sample("fresh", 2));
    }

    @Test
    void aDataVersionFailureIsNotHiddenFromTheCaller() {
        when(dataVersion.current()).thenThrow(new DataAccessResourceFailureException("warehouse is down"));

        assertThatThrownBy(
                        () -> cache.get("overview", "p", SAMPLE, () -> new Sample("fresh", 2)))
                .isInstanceOf(DataAccessResourceFailureException.class);
    }

    @Test
    @SuppressWarnings("unchecked")
    void clearDeletesEveryReportKeyFoundByScan() {
        Cursor<String> keys = mock(Cursor.class);
        when(keys.hasNext()).thenReturn(true, true, false);
        when(keys.next()).thenReturn("report:7:overview:p", "report:8:trend:x");
        when(redis.scan(any(ScanOptions.class))).thenReturn(keys);
        when(redis.delete(anyCollection())).thenReturn(2L);

        assertThat(cache.clear()).isEqualTo(2);
        verify(redis).delete(List.of("report:7:overview:p", "report:8:trend:x"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void clearDeletesInBatchesOfFiveHundred() {
        AtomicInteger remaining = new AtomicInteger(501);
        Cursor<String> keys = mock(Cursor.class);
        when(keys.hasNext()).thenAnswer(invocation -> remaining.get() > 0);
        when(keys.next()).thenAnswer(invocation -> "report:7:overview:" + remaining.getAndDecrement());
        when(redis.scan(any(ScanOptions.class))).thenReturn(keys);
        when(redis.delete(anyCollection())).thenAnswer(invocation ->
                (long) ((Collection<?>) invocation.getArgument(0)).size());

        assertThat(cache.clear()).isEqualTo(501);
        verify(redis, times(2)).delete(anyCollection());
    }
}
