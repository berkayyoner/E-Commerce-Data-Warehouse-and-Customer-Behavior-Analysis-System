package edu.yildiz.ecommerce.analytics.web;

import edu.yildiz.ecommerce.analytics.cache.CachedReport;
import org.springframework.http.ResponseEntity;

/** Answers a cached report with an {@code X-Cache} header that says whether Redis served it. */
final class CachedResponses {

    private CachedResponses() {
    }

    static <T> ResponseEntity<T> of(CachedReport<T> report) {
        return ResponseEntity.ok()
                .header("X-Cache", report.hit() ? "HIT" : "MISS")
                .body(report.value());
    }
}
