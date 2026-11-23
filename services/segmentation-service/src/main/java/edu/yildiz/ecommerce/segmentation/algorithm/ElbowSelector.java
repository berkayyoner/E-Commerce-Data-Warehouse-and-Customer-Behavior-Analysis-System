package edu.yildiz.ecommerce.segmentation.algorithm;

import java.util.Comparator;
import java.util.List;

import edu.yildiz.ecommerce.segmentation.model.ElbowPoint;

/**
 * Chooses k with the elbow rule. Both axes are scaled to 0 to 1, a line is drawn from the first to the last point
 * of the curve, and the point farthest from that line is the elbow.
 */
public final class ElbowSelector {

    /** Distances below this are rounding noise, not a bend. */
    private static final double TOLERANCE = 1e-9;

    private ElbowSelector() {
    }

    /** A curve without a bend (all points on the line) answers the smallest k. */
    public static int choose(List<ElbowPoint> points) {
        if (points.isEmpty()) {
            throw new IllegalArgumentException("The elbow curve has no points");
        }
        List<ElbowPoint> curve = points.stream().sorted(Comparator.comparingInt(ElbowPoint::k)).toList();
        ElbowPoint first = curve.get(0);
        ElbowPoint last = curve.get(curve.size() - 1);
        if (curve.size() < 3 || first.k() == last.k()) {
            return first.k();
        }

        double kRange = last.k() - first.k();
        double inertiaMin = curve.stream().mapToDouble(ElbowPoint::inertia).min().orElseThrow();
        double inertiaMax = curve.stream().mapToDouble(ElbowPoint::inertia).max().orElseThrow();
        double inertiaRange = inertiaMax - inertiaMin;

        double[] x = new double[curve.size()];
        double[] y = new double[curve.size()];
        for (int i = 0; i < curve.size(); i++) {
            x[i] = (curve.get(i).k() - first.k()) / kRange;
            y[i] = inertiaRange == 0 ? 0 : (curve.get(i).inertia() - inertiaMin) / inertiaRange;
        }

        double lineLength = Math.hypot(x[curve.size() - 1] - x[0], y[curve.size() - 1] - y[0]);
        int elbow = 0;
        double largestDistance = TOLERANCE;
        for (int i = 1; i < curve.size() - 1; i++) {
            double distance = distanceToLine(x[i], y[i], x[0], y[0], x[curve.size() - 1], y[curve.size() - 1], lineLength);
            if (distance > largestDistance) {
                largestDistance = distance;
                elbow = i;
            }
        }
        return curve.get(elbow).k();
    }

    private static double distanceToLine(double px, double py, double ax, double ay, double bx, double by,
                                         double lineLength) {
        return Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / lineLength;
    }
}
