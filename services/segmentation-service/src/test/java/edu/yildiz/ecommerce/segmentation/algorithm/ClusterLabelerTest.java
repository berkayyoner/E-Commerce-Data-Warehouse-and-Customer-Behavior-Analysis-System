package edu.yildiz.ecommerce.segmentation.algorithm;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import edu.yildiz.ecommerce.segmentation.algorithm.ClusterLabeler.Averages;
import org.junit.jupiter.api.Test;

class ClusterLabelerTest {

    private static final Averages OVERALL = new Averages(30, 5, 200);

    @Test
    void highValueAndRecentIsActiveHighValue() {
        assertThat(ClusterLabeler.label(new Averages(10, 8, 400), OVERALL))
                .isEqualTo(ClusterLabeler.ACTIVE_HIGH_VALUE);
    }

    @Test
    void highValueAndNotRecentIsLapsedHighValue() {
        assertThat(ClusterLabeler.label(new Averages(60, 8, 400), OVERALL))
                .isEqualTo(ClusterLabeler.LAPSED_HIGH_VALUE);
    }

    @Test
    void lowValueAndRecentIsRecentLowSpenders() {
        assertThat(ClusterLabeler.label(new Averages(10, 2, 50), OVERALL))
                .isEqualTo(ClusterLabeler.RECENT_LOW_SPENDERS);
    }

    @Test
    void lowValueAndNotRecentIsDormantLowValue() {
        assertThat(ClusterLabeler.label(new Averages(60, 2, 50), OVERALL))
                .isEqualTo(ClusterLabeler.DORMANT_LOW_VALUE);
    }

    @Test
    void mixedValueIsDormantLowValue() {
        assertThat(ClusterLabeler.label(new Averages(10, 8, 50), OVERALL))
                .isEqualTo(ClusterLabeler.DORMANT_LOW_VALUE);
    }

    @Test
    void repeatedLabelsGetNumberedSuffixes() {
        List<String> labels = ClusterLabeler.makeUnique(List.of("Dormant low value", "Active high value",
                "Dormant low value", "Dormant low value"));

        assertThat(labels).containsExactly("Dormant low value", "Active high value", "Dormant low value 2",
                "Dormant low value 3");
    }
}
