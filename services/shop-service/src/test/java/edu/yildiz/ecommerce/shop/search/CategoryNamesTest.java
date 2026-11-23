package edu.yildiz.ecommerce.shop.search;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class CategoryNamesTest {

    @Test
    void knownCategoriesHaveTheirTurkishName() {
        assertThat(CategoryNames.turkish("Electronics")).isEqualTo("Elektronik");
        assertThat(CategoryNames.turkish("Beauty and Care")).isEqualTo("Kozmetik ve Bakım");
        assertThat(CategoryNames.turkish("Grocery")).isEqualTo("Market");
    }

    @Test
    void unknownCategoriesFallBackToTheEnglishName() {
        assertThat(CategoryNames.turkish("Garden")).isEqualTo("Garden");
        assertThat(CategoryNames.turkish(null)).isNull();
    }

    @Test
    void labelFollowsTheRequestedLanguage() {
        assertThat(CategoryNames.label("Books", SearchLanguage.EN)).isEqualTo("Books");
        assertThat(CategoryNames.label("Books", SearchLanguage.TR)).isEqualTo("Kitap");
    }

    @Test
    void matchingFindsCategoriesByEnglishOrTurkishPrefix() {
        assertThat(CategoryNames.matching("ele", SearchLanguage.EN)).containsExactly("Electronics");
        assertThat(CategoryNames.matching("ele", SearchLanguage.TR)).containsExactly("Elektronik");
        assertThat(CategoryNames.matching("ev", SearchLanguage.EN)).containsExactly("Home and Kitchen");
    }

    @Test
    void matchingIgnoresCaseAndDiacritics() {
        assertThat(CategoryNames.matching("KOZMETIK ve bakim", SearchLanguage.TR))
                .containsExactly("Kozmetik ve Bakım");
    }
}
