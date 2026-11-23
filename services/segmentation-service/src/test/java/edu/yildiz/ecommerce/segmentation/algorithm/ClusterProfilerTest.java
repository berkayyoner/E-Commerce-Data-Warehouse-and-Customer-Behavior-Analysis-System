package edu.yildiz.ecommerce.segmentation.algorithm;

import static org.assertj.core.api.Assertions.assertThat;

import edu.yildiz.ecommerce.segmentation.model.ClusterProfile;
import org.junit.jupiter.api.Test;

class ClusterProfilerTest {

    @Test
    void clustersAreRenumberedByMonetaryValueDescending() {
        double[][] values = {
                {10, 1, 10}, {12, 1, 10},
                {5, 2, 500}, {6, 2, 500},
                {20, 1, 100}, {22, 1, 100}};
        int[] assignments = {0, 0, 1, 1, 2, 2};

        ClusterProfiler.Profiling profiling = ClusterProfiler.profile(values, assignments, 3);

        assertThat(profiling.clusters()).extracting(ClusterProfile::clusterId).containsExactly(0, 1, 2);
        assertThat(profiling.clusters()).extracting(ClusterProfile::averageMonetary)
                .containsExactly(500.0, 100.0, 10.0);
        assertThat(profiling.assignments()).containsExactly(2, 2, 0, 0, 1, 1);
    }

    @Test
    void averagesAreInTheOriginalUnits() {
        double[][] values = {{10, 2, 40}, {20, 4, 60}, {100, 1, 5}};
        int[] assignments = {0, 0, 1};

        ClusterProfiler.Profiling profiling = ClusterProfiler.profile(values, assignments, 2);

        ClusterProfile first = profiling.clusters().get(0);
        assertThat(first.customers()).isEqualTo(2);
        assertThat(first.averageRecencyDays()).isEqualTo(15.0);
        assertThat(first.averageFrequency()).isEqualTo(3.0);
        assertThat(first.averageMonetary()).isEqualTo(50.0);
    }

    @Test
    void identicalLabelsGetNumberedSuffixesInMonetaryOrder() {
        double[][] values = {
                {10, 1, 900}, {10, 1, 900},
                {10, 1, 800}, {10, 1, 800},
                {10, 9, 100}, {10, 9, 100}};
        int[] assignments = {0, 0, 1, 1, 2, 2};

        ClusterProfiler.Profiling profiling = ClusterProfiler.profile(values, assignments, 3);

        assertThat(profiling.clusters()).extracting(ClusterProfile::label).containsExactly(
                "Dormant low value", "Dormant low value 2", "Dormant low value 3");
    }
}
