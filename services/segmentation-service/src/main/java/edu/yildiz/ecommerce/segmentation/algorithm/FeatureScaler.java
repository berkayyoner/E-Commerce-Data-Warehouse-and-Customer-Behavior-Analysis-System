package edu.yildiz.ecommerce.segmentation.algorithm;

/**
 * Prepares the customer measures for K-Means: every value becomes ln(1 + value), so that large monetary amounts do
 * not dominate, and every column is then standardized to mean 0 and deviation 1.
 */
public final class FeatureScaler {

    private FeatureScaler() {
    }

    /** A column without any variation becomes all zeros. Negative values count as zero before the logarithm. */
    public static double[][] logStandardized(double[][] rows) {
        if (rows.length == 0) {
            return new double[0][0];
        }
        int columns = rows[0].length;
        double[][] result = new double[rows.length][columns];
        for (int i = 0; i < rows.length; i++) {
            for (int j = 0; j < columns; j++) {
                result[i][j] = Math.log1p(Math.max(0.0, rows[i][j]));
            }
        }
        for (int j = 0; j < columns; j++) {
            standardizeColumn(result, j);
        }
        return result;
    }

    private static void standardizeColumn(double[][] values, int column) {
        int n = values.length;
        double mean = 0;
        for (double[] row : values) {
            mean += row[column];
        }
        mean /= n;
        double variance = 0;
        for (double[] row : values) {
            double difference = row[column] - mean;
            variance += difference * difference;
        }
        double deviation = Math.sqrt(variance / n);
        if (deviation == 0) {
            deviation = 1;
        }
        for (double[] row : values) {
            row[column] = (row[column] - mean) / deviation;
        }
    }
}
