package edu.yildiz.ecommerce.segmentation.job;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import edu.yildiz.ecommerce.segmentation.algorithm.ClusterProfiler;
import edu.yildiz.ecommerce.segmentation.algorithm.ElbowSelector;
import edu.yildiz.ecommerce.segmentation.algorithm.FeatureScaler;
import edu.yildiz.ecommerce.segmentation.algorithm.KMeans;
import edu.yildiz.ecommerce.segmentation.model.CustomerMetrics;
import edu.yildiz.ecommerce.segmentation.model.ElbowPoint;
import edu.yildiz.ecommerce.segmentation.repository.CustomerSegmentRepository;
import edu.yildiz.ecommerce.segmentation.repository.SegmentationRunRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * The work of one segmentation run: RFM scores for every customer, then K-Means for k = 2 to 8, the elbow rule to
 * pick k, and the labelled clusters. Any exception propagates to the caller, which marks the run as failed.
 */
@Component
public class SegmentationJob {

    static final int MIN_K = 2;
    static final int MAX_K = 8;

    /** The result of a run that succeeded. */
    public record Outcome(long customersScored, int chosenK) {
    }

    private final CustomerSegmentRepository customers;
    private final SegmentationRunRepository runs;
    private final TransactionTemplate transactions;

    public SegmentationJob(CustomerSegmentRepository customers, SegmentationRunRepository runs,
                           TransactionTemplate transactions) {
        this.customers = customers;
        this.runs = runs;
        this.transactions = transactions;
    }

    public Outcome execute(long runId, LocalDate asOfDate) {
        long scored = transactions.execute(status -> customers.replaceScores(runId, asOfDate));
        List<CustomerMetrics> metrics = customers.findMetrics(runId);
        if (metrics.size() < MIN_K) {
            throw new IllegalStateException("At least " + MIN_K + " customers are needed for clustering");
        }

        double[][] raw = toRawValues(metrics);
        double[][] features = FeatureScaler.logStandardized(raw);
        Map<Integer, KMeans.Result> fits = new TreeMap<>();
        List<ElbowPoint> elbow = new ArrayList<>();
        KMeans kMeans = new KMeans();
        int largestK = Math.min(MAX_K, metrics.size());
        for (int k = MIN_K; k <= largestK; k++) {
            KMeans.Result fit = kMeans.fit(features, k);
            fits.put(k, fit);
            elbow.add(new ElbowPoint(k, fit.inertia()));
        }
        runs.saveElbow(runId, elbow);

        int chosenK = ElbowSelector.choose(elbow);
        ClusterProfiler.Profiling profiling = ClusterProfiler.profile(raw, fits.get(chosenK).assignments(), chosenK);
        customers.updateClusters(metrics.stream().map(CustomerMetrics::key).toList(), profiling.assignments());
        runs.saveClusters(runId, profiling.clusters());
        return new Outcome(scored, chosenK);
    }

    private static double[][] toRawValues(List<CustomerMetrics> metrics) {
        double[][] raw = new double[metrics.size()][3];
        for (int i = 0; i < metrics.size(); i++) {
            CustomerMetrics metric = metrics.get(i);
            raw[i][0] = metric.recencyDays();
            raw[i][1] = metric.frequency();
            raw[i][2] = metric.monetary();
        }
        return raw;
    }
}
