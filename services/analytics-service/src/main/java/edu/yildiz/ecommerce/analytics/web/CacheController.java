package edu.yildiz.ecommerce.analytics.web;

import edu.yildiz.ecommerce.analytics.cache.ReportCache;
import edu.yildiz.ecommerce.analytics.model.CacheClearResult;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics/cache")
public class CacheController {

    private final ReportCache cache;

    public CacheController(ReportCache cache) {
        this.cache = cache;
    }

    @PostMapping("/clear")
    public CacheClearResult clear() {
        return new CacheClearResult(cache.clear());
    }
}
