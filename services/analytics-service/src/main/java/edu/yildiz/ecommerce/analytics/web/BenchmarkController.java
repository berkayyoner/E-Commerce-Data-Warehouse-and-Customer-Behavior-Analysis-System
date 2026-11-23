package edu.yildiz.ecommerce.analytics.web;

import java.util.List;

import edu.yildiz.ecommerce.analytics.model.BenchmarkResult;
import edu.yildiz.ecommerce.analytics.service.BenchmarkService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
public class BenchmarkController {

    private final BenchmarkService benchmark;

    public BenchmarkController(BenchmarkService benchmark) {
        this.benchmark = benchmark;
    }

    /** Runs the benchmark on every call; the answer is never cached. */
    @GetMapping("/benchmark")
    public List<BenchmarkResult> benchmark() {
        return benchmark.run();
    }
}
