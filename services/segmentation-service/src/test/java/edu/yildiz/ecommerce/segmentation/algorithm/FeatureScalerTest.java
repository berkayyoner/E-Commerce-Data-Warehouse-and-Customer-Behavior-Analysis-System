package edu.yildiz.ecommerce.segmentation.algorithm;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

import org.junit.jupiter.api.Test;

class FeatureScalerTest {

    @Test
    void everyColumnEndsUpWithMeanZeroAndDeviationOne() {
        double[][] rows = {{1, 100}, {5, 10}, {30, 1000}, {2, 50}, {400, 7}};

        double[][] scaled = FeatureScaler.logStandardized(rows);

        for (int column = 0; column < 2; column++) {
            double mean = 0;
            for (double[] row : scaled) {
                mean += row[column];
            }
            mean /= scaled.length;
            double variance = 0;
            for (double[] row : scaled) {
                variance += (row[column] - mean) * (row[column] - mean);
            }
            assertThat(mean).isCloseTo(0, within(1e-9));
            assertThat(Math.sqrt(variance / scaled.length)).isCloseTo(1, within(1e-9));
        }
    }

    @Test
    void aConstantColumnBecomesZeros() {
        double[][] rows = {{7, 1}, {7, 2}, {7, 3}};

        double[][] scaled = FeatureScaler.logStandardized(rows);

        for (double[] row : scaled) {
            assertThat(row[0]).isCloseTo(0, within(1e-9));
        }
    }

    @Test
    void negativeValuesCountAsZeroBeforeTheLogarithm() {
        double[][] rows = {{-5, 1}, {0, 2}, {3, 3}};

        double[][] scaled = FeatureScaler.logStandardized(rows);

        for (double[] row : scaled) {
            for (double value : row) {
                assertThat(Double.isFinite(value)).isTrue();
            }
        }
        assertThat(scaled[0][0]).isCloseTo(scaled[1][0], within(1e-9));
    }

    @Test
    void anEmptyMatrixStaysEmpty() {
        assertThat(FeatureScaler.logStandardized(new double[0][])).isEmpty();
    }
}
