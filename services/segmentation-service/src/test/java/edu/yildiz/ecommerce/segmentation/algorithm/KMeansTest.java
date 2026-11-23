package edu.yildiz.ecommerce.segmentation.algorithm;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.within;

import java.util.Random;
import java.util.Set;

import org.junit.jupiter.api.Test;

class KMeansTest {

    private static final double[][] CENTERS = {{0, 0, 0}, {10, 10, 10}, {-10, 10, 0}};

    /** Thirty points around each of three well separated centers. */
    private static double[][] threeBlobs() {
        Random random = new Random(7);
        double[][] points = new double[90][3];
        for (int i = 0; i < points.length; i++) {
            int group = i / 30;
            for (int j = 0; j < 3; j++) {
                points[i][j] = CENTERS[group][j] + random.nextGaussian() * 0.5;
            }
        }
        return points;
    }

    @Test
    void recoversTheThreeSeparatedGroups() {
        double[][] points = threeBlobs();

        KMeans.Result result = new KMeans().fit(points, 3);

        int[] assignments = result.assignments();
        int first = assignments[0];
        int second = assignments[30];
        int third = assignments[60];
        assertThat(Set.of(first, second, third)).hasSize(3);
        for (int i = 0; i < points.length; i++) {
            int expected = i < 30 ? first : i < 60 ? second : third;
            assertThat(assignments[i]).isEqualTo(expected);
        }
    }

    @Test
    void inertiaDecreasesAsKGrows() {
        double[][] points = threeBlobs();
        double[] inertia = new double[5];
        for (int k = 1; k <= 5; k++) {
            inertia[k - 1] = new KMeans().fit(points, k).inertia();
        }

        for (int i = 0; i < inertia.length - 1; i++) {
            assertThat(inertia[i + 1]).isLessThan(inertia[i]);
        }
    }

    @Test
    void theSameSeedGivesTheSameClusters() {
        double[][] points = threeBlobs();

        KMeans.Result first = new KMeans(42L).fit(points, 4);
        KMeans.Result second = new KMeans(42L).fit(points, 4);

        assertThat(second.assignments()).containsExactly(first.assignments());
        assertThat(second.inertia()).isEqualTo(first.inertia());
    }

    @Test
    void aSingleClusterCentersOnTheMeanOfAllPoints() {
        double[][] points = {{1, 2}, {3, 4}, {5, 6}};

        KMeans.Result result = new KMeans().fit(points, 1);

        assertThat(result.centroids()[0][0]).isEqualTo(3.0);
        assertThat(result.centroids()[0][1]).isEqualTo(4.0);
        assertThat(result.assignments()).containsOnly(0);
    }

    @Test
    void inertiaIsTheSumOfSquaredDistancesToTheCentroids() {
        double[][] points = {{0}, {2}, {10}, {12}};

        KMeans.Result result = new KMeans().fit(points, 2);

        assertThat(result.inertia()).isCloseTo(4.0, within(1e-9));
    }

    @Test
    void kAbovePointCountIsRejected() {
        double[][] points = {{1}, {2}};

        assertThatThrownBy(() -> new KMeans().fit(points, 3)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void kBelowOneIsRejected() {
        double[][] points = {{1}, {2}};

        assertThatThrownBy(() -> new KMeans().fit(points, 0)).isInstanceOf(IllegalArgumentException.class);
    }
}
