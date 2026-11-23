package edu.yildiz.ecommerce.segmentation.service;

import java.util.List;
import java.util.Optional;

import edu.yildiz.ecommerce.segmentation.model.ClusterOverview;
import edu.yildiz.ecommerce.segmentation.model.ClusterProfile;
import edu.yildiz.ecommerce.segmentation.model.ClusterView;
import edu.yildiz.ecommerce.segmentation.model.CustomerQuery;
import edu.yildiz.ecommerce.segmentation.model.CustomerRow;
import edu.yildiz.ecommerce.segmentation.model.PageResult;
import edu.yildiz.ecommerce.segmentation.model.RfmGridCell;
import edu.yildiz.ecommerce.segmentation.model.SegmentSummary;
import edu.yildiz.ecommerce.segmentation.model.SegmentationRun;
import edu.yildiz.ecommerce.segmentation.repository.CustomerSegmentRepository;
import edu.yildiz.ecommerce.segmentation.repository.SegmentationRunRepository;
import org.springframework.stereotype.Service;

/**
 * Answers the dashboard reads. The segment table holds the state of the latest run that changed it; the clusters
 * and the elbow curve belong to the latest successful run. Without a successful run the answers are empty.
 */
@Service
public class SegmentationReadService {

    private final SegmentationRunRepository runs;
    private final CustomerSegmentRepository customers;

    public SegmentationReadService(SegmentationRunRepository runs, CustomerSegmentRepository customers) {
        this.runs = runs;
        this.customers = customers;
    }

    public List<SegmentSummary> segments() {
        return hasSuccessfulRun() ? customers.findSegments() : List.of();
    }

    public List<RfmGridCell> rfmGrid() {
        return hasSuccessfulRun() ? customers.findRfmGrid() : List.of();
    }

    public ClusterOverview clusters() {
        Optional<SegmentationRun> latest = runs.findLatestSuccessful();
        if (latest.isEmpty()) {
            return new ClusterOverview(List.of(), List.of(), null);
        }
        long runId = latest.get().id();
        List<ClusterProfile> profiles = runs.findClusters(runId);
        long total = profiles.stream().mapToLong(ClusterProfile::customers).sum();
        List<ClusterView> views = profiles.stream()
                .map(profile -> new ClusterView(
                        profile.clusterId(),
                        profile.label(),
                        profile.customers(),
                        share(profile.customers(), total),
                        profile.averageRecencyDays(),
                        profile.averageFrequency(),
                        profile.averageMonetary()))
                .toList();
        return new ClusterOverview(views, runs.findElbow(runId), latest.get().chosenK());
    }

    public PageResult<CustomerRow> customers(CustomerQuery query) {
        Optional<SegmentationRun> latest = runs.findLatestSuccessful();
        if (latest.isEmpty()) {
            return new PageResult<>(List.of(), 0, query.page(), query.size());
        }
        return customers.findCustomers(latest.get().id(), query);
    }

    private boolean hasSuccessfulRun() {
        return runs.findLatestSuccessful().isPresent();
    }

    /** The part of the total as a fraction with four decimals. */
    private static double share(long part, long total) {
        if (total == 0) {
            return 0;
        }
        return Math.round((double) part * 10000 / total) / 10000.0;
    }
}
