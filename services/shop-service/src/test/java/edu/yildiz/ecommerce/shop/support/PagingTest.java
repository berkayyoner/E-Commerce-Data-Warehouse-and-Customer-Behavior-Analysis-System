package edu.yildiz.ecommerce.shop.support;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

class PagingTest {

    private static final Map<String, List<String>> FIELDS = Map.of("id", List.of("id"), "name", List.of("name"));

    @Test
    void pageNeverGoesBelowZeroAndSizeStaysBetweenOneAndTheMaximum() {
        assertThat(Paging.page(-1)).isZero();
        assertThat(Paging.size(0)).isEqualTo(1);
        assertThat(Paging.size(1000)).isEqualTo(Paging.MAX_PAGE_SIZE);
    }

    @Test
    void containsPatternEscapesThePercentAndUnderscoreSigns() {
        assertThat(Paging.containsPattern("50%_!")).isEqualTo("%50!%!_!!%");
        assertThat(Paging.containsPattern("  Ayse ")).isEqualTo("%ayse%");
        assertThat(Paging.containsPattern(null)).isEqualTo("%%");
    }

    @Test
    void unknownOrMissingSortKeysUseTheDefault() {
        assertThat(Paging.columns(FIELDS, "nope", "id")).containsExactly("id");
        assertThat(Paging.columns(FIELDS, null, "id")).containsExactly("id");
        assertThat(Paging.columns(FIELDS, "name", "id")).containsExactly("name");
    }

    @Test
    void onlyTheWordDescReversesTheOrder() {
        assertThat(Paging.ascending(null)).isTrue();
        assertThat(Paging.ascending("asc")).isTrue();
        assertThat(Paging.ascending("DESC")).isFalse();
    }
}
