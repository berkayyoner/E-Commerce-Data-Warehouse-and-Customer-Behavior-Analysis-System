package edu.yildiz.ecommerce.shop.search;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Turkish names of the product categories. The English name stays the stored value; the Turkish name is
 * indexed in its own field and shown when the request asks for Turkish. Unknown categories keep their English name.
 */
public final class CategoryNames {

    private static final Map<String, String> TURKISH = Map.of(
            "Electronics", "Elektronik",
            "Clothing", "Giyim",
            "Home and Kitchen", "Ev ve Mutfak",
            "Books", "Kitap",
            "Sports and Outdoor", "Spor ve Outdoor",
            "Beauty and Care", "Kozmetik ve Bakım",
            "Toys and Games", "Oyuncak ve Oyun",
            "Grocery", "Market");

    private CategoryNames() {
    }

    /** The Turkish name of a category, or the category itself when no Turkish name is known. */
    public static String turkish(String english) {
        if (english == null) {
            return null;
        }
        return TURKISH.getOrDefault(english, english);
    }

    /** The category name in the language of the request. */
    public static String label(String english, SearchLanguage language) {
        return language == SearchLanguage.TR ? turkish(english) : english;
    }

    /**
     * The categories whose English or Turkish name starts with the text, ignoring case and diacritics,
     * named in the requested language and sorted by their English name.
     */
    public static List<String> matching(String text, SearchLanguage language) {
        String wanted = fold(text);
        return TURKISH.keySet().stream()
                .sorted()
                .filter(english -> fold(english).startsWith(wanted) || fold(TURKISH.get(english)).startsWith(wanted))
                .map(english -> label(english, language))
                .toList();
    }

    static String fold(String text) {
        String lower = text.toLowerCase(Locale.ROOT).replace('ı', 'i');
        return Normalizer.normalize(lower, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
    }
}
