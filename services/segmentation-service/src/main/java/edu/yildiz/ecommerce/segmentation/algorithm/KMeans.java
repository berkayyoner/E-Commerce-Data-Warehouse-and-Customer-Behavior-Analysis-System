package edu.yildiz.ecommerce.segmentation.algorithm;

import java.util.Arrays;
import java.util.Random;

/**
 * K-Means with k-means++ seeding and Lloyd iterations. The seed is fixed, so the same points always give the same
 * clusters, in the same order.
 */
public final class KMeans {

    public static final long DEFAULT_SEED = 42L;
    public static final int MAX_ITERATIONS = 100;

    private final long seed;

    /**
     * @param centroids   the final centers, one row per cluster
     * @param assignments the cluster of every point, in the order of the input
     * @param inertia     the sum of the squared distances of the points to their centers
     */
    public record Result(double[][] centroids, int[] assignments, double inertia) {
    }

    public KMeans() {
        this(DEFAULT_SEED);
    }

    public KMeans(long seed) {
        this.seed = seed;
    }

    /**
     * @param points rows of equally long feature vectors
     * @param k      the number of clusters, from 1 to the number of points
     */
    public Result fit(double[][] points, int k) {
        if (points.length == 0) {
            throw new IllegalArgumentException("At least one point is needed");
        }
        if (k < 1 || k > points.length) {
            throw new IllegalArgumentException("k must be between 1 and " + points.length + " but was " + k);
        }
        Random random = new Random(seed);
        double[][] centroids = seedCentroids(points, k, random);
        int[] assignments = new int[points.length];
        Arrays.fill(assignments, -1);
        for (int iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
            if (!assign(points, centroids, assignments)) {
                break;
            }
            moveCentroids(points, assignments, centroids);
        }
        assign(points, centroids, assignments);
        return new Result(centroids, assignments, inertia(points, centroids, assignments));
    }

    /** The first center is a random point; every next center is drawn with a probability that grows with its distance. */
    private static double[][] seedCentroids(double[][] points, int k, Random random) {
        double[][] centroids = new double[k][];
        centroids[0] = points[random.nextInt(points.length)].clone();
        double[] nearest = new double[points.length];
        for (int i = 0; i < points.length; i++) {
            nearest[i] = squaredDistance(points[i], centroids[0]);
        }
        for (int c = 1; c < k; c++) {
            double total = Arrays.stream(nearest).sum();
            int chosen = total <= 0 ? random.nextInt(points.length) : drawWeighted(nearest, total, random);
            centroids[c] = points[chosen].clone();
            for (int i = 0; i < points.length; i++) {
                nearest[i] = Math.min(nearest[i], squaredDistance(points[i], centroids[c]));
            }
        }
        return centroids;
    }

    private static int drawWeighted(double[] weights, double total, Random random) {
        double target = random.nextDouble() * total;
        double cumulative = 0;
        for (int i = 0; i < weights.length; i++) {
            cumulative += weights[i];
            if (cumulative > target) {
                return i;
            }
        }
        return weights.length - 1;
    }

    /** Gives every point its nearest center. Returns true when at least one assignment changed. */
    private static boolean assign(double[][] points, double[][] centroids, int[] assignments) {
        boolean changed = false;
        for (int i = 0; i < points.length; i++) {
            int nearest = nearestCentroid(points[i], centroids);
            if (assignments[i] != nearest) {
                assignments[i] = nearest;
                changed = true;
            }
        }
        return changed;
    }

    /** Moves every center to the mean of its points. A center without points stays where it is. */
    private static void moveCentroids(double[][] points, int[] assignments, double[][] centroids) {
        int dimensions = points[0].length;
        double[][] sums = new double[centroids.length][dimensions];
        int[] counts = new int[centroids.length];
        for (int i = 0; i < points.length; i++) {
            int cluster = assignments[i];
            counts[cluster]++;
            for (int j = 0; j < dimensions; j++) {
                sums[cluster][j] += points[i][j];
            }
        }
        for (int c = 0; c < centroids.length; c++) {
            if (counts[c] == 0) {
                continue;
            }
            for (int j = 0; j < dimensions; j++) {
                centroids[c][j] = sums[c][j] / counts[c];
            }
        }
    }

    private static int nearestCentroid(double[] point, double[][] centroids) {
        int nearest = 0;
        double best = Double.POSITIVE_INFINITY;
        for (int c = 0; c < centroids.length; c++) {
            double distance = squaredDistance(point, centroids[c]);
            if (distance < best) {
                best = distance;
                nearest = c;
            }
        }
        return nearest;
    }

    private static double inertia(double[][] points, double[][] centroids, int[] assignments) {
        double sum = 0;
        for (int i = 0; i < points.length; i++) {
            sum += squaredDistance(points[i], centroids[assignments[i]]);
        }
        return sum;
    }

    private static double squaredDistance(double[] a, double[] b) {
        double sum = 0;
        for (int j = 0; j < a.length; j++) {
            double difference = a[j] - b[j];
            sum += difference * difference;
        }
        return sum;
    }
}
