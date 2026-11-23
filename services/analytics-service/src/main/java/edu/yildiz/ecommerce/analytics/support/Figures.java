package edu.yildiz.ecommerce.analytics.support;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Rounding and division rules shared by the reports. */
public final class Figures {

    private Figures() {
    }

    /** Money with two decimals; a missing value counts as zero. */
    public static BigDecimal money(BigDecimal value) {
        return orZero(value, 2);
    }

    /** Rounds to the given scale; a missing value counts as zero. */
    public static BigDecimal orZero(BigDecimal value, int scale) {
        return (value == null ? BigDecimal.ZERO : value).setScale(scale, RoundingMode.HALF_UP);
    }

    /** Rounds to the given scale; a missing value stays missing. */
    public static BigDecimal rounded(BigDecimal value, int scale) {
        return value == null ? null : value.setScale(scale, RoundingMode.HALF_UP);
    }

    /** Quotient rounded to the given scale; a zero or missing denominator gives zero. */
    public static BigDecimal divide(BigDecimal numerator, BigDecimal denominator, int scale) {
        if (denominator == null || denominator.signum() == 0) {
            return BigDecimal.ZERO.setScale(scale, RoundingMode.HALF_UP);
        }
        BigDecimal dividend = numerator == null ? BigDecimal.ZERO : numerator;
        return dividend.divide(denominator, scale, RoundingMode.HALF_UP);
    }
}
