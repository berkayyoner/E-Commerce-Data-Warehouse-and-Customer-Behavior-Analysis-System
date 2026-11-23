package edu.yildiz.ecommerce.segmentation.rfm;

import java.util.ArrayList;
import java.util.List;

/**
 * The segment rules for the RFM scores (1 to 5, 5 is the best). The rules are checked in order and the first match
 * wins; a pair that matches none of them is {@link #FALLBACK}. The same table builds the SQL CASE expression, so
 * the database and the Java code always agree.
 */
public final class RfmSegments {

    public static final String FALLBACK = "Hibernating";

    private static final int MIN_SCORE = 1;
    private static final int MAX_SCORE = 5;

    private static final List<Rule> RULES = List.of(
            new Rule("Champions", 4, 5, 4, 5),
            new Rule("Loyal Customers", 3, 5, 3, 5),
            new Rule("At Risk", 1, 2, 3, 5),
            new Rule("New Customers", 4, 5, 1, 1),
            new Rule("Promising", 3, 5, 1, 5),
            new Rule("Lost", 1, 1, 1, 5));

    /** A segment applies when both scores fall inside its ranges (inclusive). */
    public record Rule(String segment, int minRecency, int maxRecency, int minFrequency, int maxFrequency) {

        boolean matches(int recencyScore, int frequencyScore) {
            return recencyScore >= minRecency && recencyScore <= maxRecency
                    && frequencyScore >= minFrequency && frequencyScore <= maxFrequency;
        }
    }

    private RfmSegments() {
    }

    /** The segment of a recency score and a frequency score, both between 1 and 5. */
    public static String classify(int recencyScore, int frequencyScore) {
        checkScore(recencyScore);
        checkScore(frequencyScore);
        return RULES.stream()
                .filter(rule -> rule.matches(recencyScore, frequencyScore))
                .map(Rule::segment)
                .findFirst()
                .orElse(FALLBACK);
    }

    /** Every segment name, in rule order, fallback last. */
    public static List<String> segmentNames() {
        List<String> names = new ArrayList<>(RULES.stream().map(Rule::segment).toList());
        names.add(FALLBACK);
        return List.copyOf(names);
    }

    /** A SQL CASE expression that applies the same rules to two score columns. */
    public static String caseExpression(String recencyColumn, String frequencyColumn) {
        StringBuilder sql = new StringBuilder("CASE");
        for (Rule rule : RULES) {
            sql.append(" WHEN ").append(recencyColumn)
                    .append(" BETWEEN ").append(rule.minRecency()).append(" AND ").append(rule.maxRecency())
                    .append(" AND ").append(frequencyColumn)
                    .append(" BETWEEN ").append(rule.minFrequency()).append(" AND ").append(rule.maxFrequency())
                    .append(" THEN '").append(rule.segment()).append('\'');
        }
        return sql.append(" ELSE '").append(FALLBACK).append("' END").toString();
    }

    private static void checkScore(int score) {
        if (score < MIN_SCORE || score > MAX_SCORE) {
            throw new IllegalArgumentException("An RFM score must be between 1 and 5 but was " + score);
        }
    }
}
