package edu.yildiz.ecommerce.segmentation.algorithm;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.stream.IntStream;

import edu.yildiz.ecommerce.segmentation.algorithm.ClusterLabeler.Averages;
import edu.yildiz.ecommerce.segmentation.model.ClusterProfile;

/**
 * Turns the raw K-Means assignments into stable, named clusters. Cluster 0 is the cluster with the highest average
 * monetary value, cluster 1 the next, and so on.
 */
public final class ClusterProfiler {

    /**
     * @param clusters    the clusters in their new order
     * @param assignments the new cluster id of every customer, in the order of the input
     */
    public record Profiling(List<ClusterProfile> clusters, int[] assignments) {
    }

    private ClusterProfiler() {
    }

    /**
     * @param values      the raw measures in the order recency days, frequency, monetary, in original units
     * @param assignments the raw cluster of every customer, from 0 to k minus 1
     */
    public static Profiling profile(double[][] values, int[] assignments, int k) {
        int customers = values.length;
        double[][] sums = new double[k][3];
        long[] counts = new long[k];
        double[] totals = new double[3];
        for (int i = 0; i < customers; i++) {
            int cluster = assignments[i];
            counts[cluster]++;
            for (int j = 0; j < 3; j++) {
                sums[cluster][j] += values[i][j];
                totals[j] += values[i][j];
            }
        }
        Averages overall = averages(totals, customers);
        Averages[] clusterAverages = new Averages[k];
        for (int c = 0; c < k; c++) {
            clusterAverages[c] = averages(sums[c], counts[c]);
        }

        Integer[] order = IntStream.range(0, k).boxed().toArray(Integer[]::new);
        Arrays.sort(order, Comparator.comparingDouble((Integer c) -> clusterAverages[c].monetary())
                .reversed()
                .thenComparingInt(c -> c));
        int[] newIdOf = new int[k];
        List<String> baseLabels = new ArrayList<>(k);
        for (int position = 0; position < k; position++) {
            newIdOf[order[position]] = position;
            baseLabels.add(ClusterLabeler.label(clusterAverages[order[position]], overall));
        }
        List<String> labels = ClusterLabeler.makeUnique(baseLabels);

        List<ClusterProfile> clusters = new ArrayList<>(k);
        for (int position = 0; position < k; position++) {
            int original = order[position];
            Averages average = clusterAverages[original];
            clusters.add(new ClusterProfile(position, labels.get(position), counts[original],
                    average.recencyDays(), average.frequency(), average.monetary()));
        }

        int[] remapped = new int[customers];
        for (int i = 0; i < customers; i++) {
            remapped[i] = newIdOf[assignments[i]];
        }
        return new Profiling(clusters, remapped);
    }

    private static Averages averages(double[] sums, long count) {
        if (count == 0) {
            return new Averages(0, 0, 0);
        }
        return new Averages(sums[0] / count, sums[1] / count, sums[2] / count);
    }
}
