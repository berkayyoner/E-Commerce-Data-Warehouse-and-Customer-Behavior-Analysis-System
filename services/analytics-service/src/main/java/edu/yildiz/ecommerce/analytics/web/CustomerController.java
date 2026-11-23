package edu.yildiz.ecommerce.analytics.web;

import java.time.LocalDate;
import java.util.List;

import edu.yildiz.ecommerce.analytics.model.CustomerReports.CustomerMetrics;
import edu.yildiz.ecommerce.analytics.model.CustomerReports.CustomerValue;
import edu.yildiz.ecommerce.analytics.model.DateRange;
import edu.yildiz.ecommerce.analytics.service.ReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics/customers")
public class CustomerController {

    private final ReportService reports;

    public CustomerController(ReportService reports) {
        this.reports = reports;
    }

    @GetMapping("/top")
    public ResponseEntity<List<CustomerValue>> top(
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return CachedResponses.of(reports.topCustomers(limit, DateRange.of(from, to)));
    }

    @GetMapping("/metrics")
    public ResponseEntity<CustomerMetrics> metrics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return CachedResponses.of(reports.customerMetrics(DateRange.of(from, to)));
    }
}
