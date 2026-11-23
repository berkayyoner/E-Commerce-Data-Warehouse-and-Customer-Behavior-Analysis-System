package edu.yildiz.ecommerce.segmentation.algorithm;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Names the clusters by comparing their averages with the averages of all customers. Recency is in days, so a low
 * recency means a recent purchase.
 */
public final class ClusterLabeler {

    public static final String ACTIVE_HIGH_VALUE = "Active high value";
    public static final String LAPSED_HIGH_VALUE = "Lapsed high value";
    public static final String RECENT_LOW_SPENDERS = "Recent low spenders";
    public static final String DORMANT_LOW_VALUE = "Dormant low value";

    /** Averages in the original units. */
    public record Averages(double recencyDays, double frequency, double monetary) {
    }

    private ClusterLabeler() {
    }

    /**
     * Frequency and monetary above the overall average: active when recency is below the average, lapsed otherwise.
     * Frequency and monetary below the overall average with recency below the average: recent low spenders.
     * Everything else: dormant low value.
     */
    public static String label(Averages cluster, Averages overall) {
        boolean highValue = cluster.frequency() > overall.frequency() && cluster.monetary() > overall.monetary();
        boolean lowValue = cluster.frequency() < overall.frequency() && cluster.monetary() < overall.monetary();
        boolean recent = cluster.recencyDays() < overall.recencyDays();
        if (highValue) {
            return recent ? ACTIVE_HIGH_VALUE : LAPSED_HIGH_VALUE;
        }
        if (lowValue && recent) {
            return RECENT_LOW_SPENDERS;
        }
        return DORMANT_LOW_VALUE;
    }

    /** Appends " 2", " 3" and so on to repeated labels, so that every label is unique. The input order decides. */
    public static List<String> makeUnique(List<String> labels) {
        Map<String, Integer> seen = new HashMap<>();
        List<String> unique = new ArrayList<>(labels.size());
        for (String label : labels) {
            int occurrence = seen.merge(label, 1, Integer::sum);
            unique.add(occurrence == 1 ? label : label + " " + occurrence);
        }
        return unique;
    }
}
