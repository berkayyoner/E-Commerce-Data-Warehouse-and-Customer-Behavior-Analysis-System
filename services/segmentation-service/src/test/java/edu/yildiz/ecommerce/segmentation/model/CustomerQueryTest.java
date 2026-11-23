package edu.yildiz.ecommerce.segmentation.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class CustomerQueryTest {

    @Test
    void theDefaultIsMonetaryDescendingFromTheFirstPage() {
        CustomerQuery query = CustomerQuery.of(null, null, null, null, null, 0, 20);

        assertThat(query.sort()).isEqualTo(CustomerSort.MONETARY);
        assertThat(query.descending()).isTrue();
        assertThat(query.page()).isZero();
        assertThat(query.size()).isEqualTo(20);
    }

    @Test
    void theSortNameAndDirectionAreRead() {
        CustomerQuery query = CustomerQuery.of(null, null, null, "recencyDays", "asc", 2, 50);

        assertThat(query.sort()).isEqualTo(CustomerSort.RECENCY_DAYS);
        assertThat(query.descending()).isFalse();
    }

    @Test
    void anUnknownSortColumnIsRejected() {
        assertThatThrownBy(() -> CustomerQuery.of(null, null, null, "password", null, 0, 20))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void anUnknownDirectionIsRejected() {
        assertThatThrownBy(() -> CustomerQuery.of(null, null, null, null, "up", 0, 20))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void aSizeAboveTheLimitIsRejected() {
        assertThatThrownBy(() -> CustomerQuery.of(null, null, null, null, null, 0, 101))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void aNonPositiveSizeAndANegativePageAreRejected() {
        assertThatThrownBy(() -> CustomerQuery.of(null, null, null, null, null, 0, 0))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> CustomerQuery.of(null, null, null, null, null, -1, 20))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void anUnknownSegmentIsRejected() {
        assertThatThrownBy(() -> CustomerQuery.of("Stars", null, null, null, null, 0, 20))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void aNegativeClusterIsRejected() {
        assertThatThrownBy(() -> CustomerQuery.of(null, -1, null, null, null, 0, 20))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void blankTextCountsAsAbsent() {
        CustomerQuery query = CustomerQuery.of(" ", null, "   ", null, null, 0, 20);

        assertThat(query.segment()).isNull();
        assertThat(query.search()).isNull();
    }

    @Test
    void theSearchTextIsTrimmed() {
        CustomerQuery query = CustomerQuery.of(null, null, "  smith ", null, null, 0, 20);

        assertThat(query.search()).isEqualTo("smith");
    }
}
