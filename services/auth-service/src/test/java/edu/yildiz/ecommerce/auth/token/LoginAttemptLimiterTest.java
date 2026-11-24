package edu.yildiz.ecommerce.auth.token;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import org.junit.jupiter.api.Test;

class LoginAttemptLimiterTest {

    /** A clock that only moves when the test moves it. */
    private static final class MovableClock extends Clock {

        private Instant now;

        MovableClock(Instant start) {
            this.now = start;
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

    private final MovableClock clock = new MovableClock(Instant.parse("2026-11-24T10:00:00Z"));
    private final LoginAttemptLimiter limiter = new LoginAttemptLimiter(clock);

    @Test
    void theFifthFailureBlocksTheKey() {
        for (int i = 0; i < 4; i++) {
            limiter.recordFailure("alice|10.0.0.1");
        }
        assertThat(limiter.isBlocked("alice|10.0.0.1")).isFalse();

        limiter.recordFailure("alice|10.0.0.1");

        assertThat(limiter.isBlocked("alice|10.0.0.1")).isTrue();
        assertThat(limiter.isBlocked("bob|10.0.0.1")).isFalse();
    }

    @Test
    void failuresOlderThanTenMinutesNoLongerCount() {
        for (int i = 0; i < 5; i++) {
            limiter.recordFailure("alice|10.0.0.1");
        }
        clock.advance(LoginAttemptLimiter.WINDOW.plusSeconds(1));

        assertThat(limiter.isBlocked("alice|10.0.0.1")).isFalse();
    }

    @Test
    void aSuccessfulLoginClearsTheFailures() {
        for (int i = 0; i < 4; i++) {
            limiter.recordFailure("alice|10.0.0.1");
        }
        limiter.reset("alice|10.0.0.1");
        for (int i = 0; i < 4; i++) {
            limiter.recordFailure("alice|10.0.0.1");
        }

        assertThat(limiter.isBlocked("alice|10.0.0.1")).isFalse();
    }
}
