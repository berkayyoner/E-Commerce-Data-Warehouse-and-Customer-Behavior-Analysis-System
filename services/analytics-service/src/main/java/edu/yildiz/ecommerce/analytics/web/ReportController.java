package edu.yildiz.ecommerce.analytics.web;

import java.time.LocalDate;
import java.util.List;

import edu.yildiz.ecommerce.analytics.model.DateRange;
import edu.yildiz.ecommerce.analytics.model.SalesReports.CategorySales;
import edu.yildiz.ecommerce.analytics.model.SalesReports.Fulfillment;
import edu.yildiz.ecommerce.analytics.model.SalesReports.Overview;
import edu.yildiz.ecommerce.analytics.model.SalesReports.PaymentSales;
import edu.yildiz.ecommerce.analytics.model.SalesReports.ProductSales;
import edu.yildiz.ecommerce.analytics.model.SalesReports.RegionSales;
import edu.yildiz.ecommerce.analytics.model.SalesReports.TrendPoint;
import edu.yildiz.ecommerce.analytics.service.ReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
public class ReportController {

    private final ReportService reports;

    public ReportController(ReportService reports) {
        this.reports = reports;
    }

    @GetMapping("/overview")
    public ResponseEntity<Overview> overview(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return CachedResponses.of(reports.overview(DateRange.of(from, to)));
    }

    @GetMapping("/sales/trend")
    public ResponseEntity<List<TrendPoint>> trend(
            @RequestParam(defaultValue = "month") String granularity,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return CachedResponses.of(reports.trend(granularity, DateRange.of(from, to)));
    }

    @GetMapping("/products/top")
    public ResponseEntity<List<ProductSales>> topProducts(
            @RequestParam(defaultValue = "revenue") String by,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return CachedResponses.of(reports.topProducts(by, limit, category, DateRange.of(from, to)));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<CategorySales>> categories(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return CachedResponses.of(reports.categories(DateRange.of(from, to)));
    }

    @GetMapping("/regions")
    public ResponseEntity<List<RegionSales>> regions(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return CachedResponses.of(reports.regions(DateRange.of(from, to)));
    }

    @GetMapping("/payments")
    public ResponseEntity<List<PaymentSales>> payments(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return CachedResponses.of(reports.payments(DateRange.of(from, to)));
    }

    @GetMapping("/fulfillment")
    public ResponseEntity<Fulfillment> fulfillment(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return CachedResponses.of(reports.fulfillment(DateRange.of(from, to)));
    }
}
