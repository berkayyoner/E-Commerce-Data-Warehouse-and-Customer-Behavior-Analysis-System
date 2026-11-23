package edu.yildiz.ecommerce.analytics.cache;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import edu.yildiz.ecommerce.analytics.repository.ReportRepository;
import org.junit.jupiter.api.Test;

class DataVersionTest {

    private final ReportRepository repository = mock(ReportRepository.class);
    private final MutableClock clock = new MutableClock(Instant.parse("2026-11-23T10:00:00Z"));
    private final DataVersion dataVersion = new DataVersion(repository, clock);

    @Test
    void theVersionIsReadOnceWithinTenSeconds() {
        when(repository.currentDataVersion()).thenReturn(4L);

        assertThat(dataVersion.current()).isEqualTo(4L);
        clock.advance(Duration.ofSeconds(9));
        assertThat(dataVersion.current()).isEqualTo(4L);

        verify(repository, times(1)).currentDataVersion();
    }

    @Test
    void theVersionIsReadAgainAfterTenSeconds() {
        when(repository.currentDataVersion()).thenReturn(4L, 5L);

        assertThat(dataVersion.current()).isEqualTo(4L);
        clock.advance(Duration.ofSeconds(10));
        assertThat(dataVersion.current()).isEqualTo(5L);
    }

    /** A clock that only moves when the test says so. */
    static final class MutableClock extends Clock {

        private Instant now;

        MutableClock(Instant now) {
            this.now = now;
        }

        void advance(Duration duration) {
            now = now.plus(duration);
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }
    }
}
