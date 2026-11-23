package edu.yildiz.ecommerce.segmentation.repository;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class CustomerSegmentRepositoryTest {

    @Test
    void theSearchTextMatchesAnywhereAndIgnoresCase() {
        assertThat(CustomerSegmentRepository.containsPattern("ada")).isEqualTo("%ADA%");
    }

    @Test
    void wildcardCharactersInTheSearchTextAreTakenLiterally() {
        assertThat(CustomerSegmentRepository.containsPattern("50%_off")).isEqualTo("%50\\%\\_OFF%");
    }

    @Test
    void aBackslashInTheSearchTextIsEscapedToo() {
        assertThat(CustomerSegmentRepository.containsPattern("a\\b")).isEqualTo("%A\\\\B%");
    }
}
