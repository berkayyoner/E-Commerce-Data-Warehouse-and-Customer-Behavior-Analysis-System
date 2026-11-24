package edu.yildiz.ecommerce.auth.token;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Component;

/**
 * Counts failed sign in attempts per key (user name and address). The counters live in memory, so they start
 * again when the service restarts.
 */
@Component
class LoginAttemptLimiter {

    static final int MAX_FAILURES = 5;
    static final Duration WINDOW = Duration.ofMinutes(10);

    private final Clock clock;
    private final Map<String, Deque<Instant>> failures = new HashMap<>();

    LoginAttemptLimiter(Clock clock) {
        this.clock = clock;
    }

    synchronized boolean isBlocked(String key) {
        return recentFailures(key) >= MAX_FAILURES;
    }

    synchronized void recordFailure(String key) {
        Deque<Instant> times = failures.computeIfAbsent(key, k -> new ArrayDeque<>());
        prune(times);
        times.addLast(clock.instant());
    }

    synchronized void reset(String key) {
        failures.remove(key);
    }

    private int recentFailures(String key) {
        Deque<Instant> times = failures.get(key);
        if (times == null) {
            return 0;
        }
        prune(times);
        if (times.isEmpty()) {
            failures.remove(key);
        }
        return times.size();
    }

    private void prune(Deque<Instant> times) {
        Instant cutoff = clock.instant().minus(WINDOW);
        times.removeIf(time -> time.isBefore(cutoff));
    }
}
