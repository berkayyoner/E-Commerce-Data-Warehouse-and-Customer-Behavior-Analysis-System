package edu.yildiz.ecommerce.segmentation.rfm;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;

import org.junit.jupiter.api.Test;

class RfmSegmentsTest {

    @Test
    void everyScorePairMapsToExactlyOneKnownSegment() {
        List<String> names = RfmSegments.segmentNames();

        for (int recency = 1; recency <= 5; recency++) {
            for (int frequency = 1; frequency <= 5; frequency++) {
                String segment = RfmSegments.classify(recency, frequency);
                assertThat(names).contains(segment);
            }
        }
    }

    @Test
    void theSegmentNamesAreSevenDistinctNames() {
        assertThat(RfmSegments.segmentNames()).hasSize(7).doesNotHaveDuplicates();
    }

    @Test
    void championsBuyOftenAndRecently() {
        assertThat(RfmSegments.classify(5, 5)).isEqualTo("Champions");
        assertThat(RfmSegments.classify(4, 4)).isEqualTo("Champions");
    }

    @Test
    void customersWithOneRecentOrderAreNewCustomers() {
        assertThat(RfmSegments.classify(5, 1)).isEqualTo("New Customers");
    }

    @Test
    void frequentButNotRecentCustomersAreAtRisk() {
        assertThat(RfmSegments.classify(2, 4)).isEqualTo("At Risk");
        assertThat(RfmSegments.classify(1, 5)).isEqualTo("At Risk");
    }

    @Test
    void customersWhoOnlyBoughtLongAgoAreLost() {
        assertThat(RfmSegments.classify(1, 1)).isEqualTo("Lost");
    }

    @Test
    void middleScoresAreLoyalOrPromising() {
        assertThat(RfmSegments.classify(3, 3)).isEqualTo("Loyal Customers");
        assertThat(RfmSegments.classify(3, 1)).isEqualTo("Promising");
    }

    @Test
    void unmatchedPairsFallBackToHibernating() {
        assertThat(RfmSegments.classify(2, 2)).isEqualTo("Hibernating");
    }

    @Test
    void scoresOutsideOneToFiveAreRejected() {
        assertThatThrownBy(() -> RfmSegments.classify(0, 3)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> RfmSegments.classify(3, 6)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void theSqlCaseExpressionCarriesTheSameRules() {
        String sql = RfmSegments.caseExpression("r_score", "f_score");

        assertThat(sql).startsWith("CASE WHEN r_score BETWEEN 4 AND 5 AND f_score BETWEEN 4 AND 5 THEN 'Champions'");
        assertThat(sql).contains("THEN 'At Risk'", "THEN 'New Customers'", "THEN 'Lost'", "THEN 'Promising'");
        assertThat(sql).endsWith("ELSE 'Hibernating' END");
    }
}
