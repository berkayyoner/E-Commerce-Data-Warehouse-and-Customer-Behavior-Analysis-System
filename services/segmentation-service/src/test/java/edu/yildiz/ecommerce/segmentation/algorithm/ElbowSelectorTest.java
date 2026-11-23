package edu.yildiz.ecommerce.segmentation.algorithm;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import edu.yildiz.ecommerce.segmentation.model.ElbowPoint;
import org.junit.jupiter.api.Test;

class ElbowSelectorTest {

    /** Inertia falls steeply until k = 4 and flattens afterwards. */
    private static List<ElbowPoint> bentCurve() {
        double[] inertia = {1000, 400, 200, 150, 130, 120, 115};
        List<ElbowPoint> points = new ArrayList<>();
        for (int i = 0; i < inertia.length; i++) {
            points.add(new ElbowPoint(i + 2, inertia[i]));
        }
        return points;
    }

    @Test
    void picksTheObviousElbow() {
        assertThat(ElbowSelector.choose(bentCurve())).isEqualTo(4);
    }

    @Test
    void theChoiceDoesNotDependOnTheScaleOfTheInertia() {
        List<ElbowPoint> scaled = new ArrayList<>();
        for (ElbowPoint point : bentCurve()) {
            scaled.add(new ElbowPoint(point.k(), point.inertia() * 1000));
        }

        assertThat(ElbowSelector.choose(scaled)).isEqualTo(4);
    }

    @Test
    void theInputOrderDoesNotMatter() {
        List<ElbowPoint> shuffled = new ArrayList<>(bentCurve());
        Collections.reverse(shuffled);

        assertThat(ElbowSelector.choose(shuffled)).isEqualTo(4);
    }

    @Test
    void aStraightLineDoesNotFailAndAnswersTheSmallestK() {
        List<ElbowPoint> line = new ArrayList<>();
        for (int k = 2; k <= 6; k++) {
            line.add(new ElbowPoint(k, 100 - 20 * k));
        }

        assertThat(ElbowSelector.choose(line)).isEqualTo(2);
    }

    @Test
    void aFlatCurveDoesNotFail() {
        List<ElbowPoint> flat = List.of(new ElbowPoint(2, 50), new ElbowPoint(3, 50), new ElbowPoint(4, 50));

        assertThat(ElbowSelector.choose(flat)).isEqualTo(2);
    }

    @Test
    void twoPointsAnswerTheFirstK() {
        List<ElbowPoint> two = List.of(new ElbowPoint(2, 90), new ElbowPoint(3, 40));

        assertThat(ElbowSelector.choose(two)).isEqualTo(2);
    }

    @Test
    void anEmptyCurveIsRejected() {
        assertThatThrownBy(() -> ElbowSelector.choose(List.of())).isInstanceOf(IllegalArgumentException.class);
    }
}
