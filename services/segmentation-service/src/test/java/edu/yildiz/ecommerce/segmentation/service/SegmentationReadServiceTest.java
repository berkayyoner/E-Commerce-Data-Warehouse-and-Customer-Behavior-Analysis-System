package edu.yildiz.ecommerce.segmentation.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import edu.yildiz.ecommerce.segmentation.model.ClusterOverview;
import edu.yildiz.ecommerce.segmentation.model.ClusterProfile;
import edu.yildiz.ecommerce.segmentation.model.ClusterView;
import edu.yildiz.ecommerce.segmentation.model.CustomerQuery;
import edu.yildiz.ecommerce.segmentation.model.CustomerRow;
import edu.yildiz.ecommerce.segmentation.model.ElbowPoint;
import edu.yildiz.ecommerce.segmentation.model.PageResult;
import edu.yildiz.ecommerce.segmentation.model.RunStatus;
import edu.yildiz.ecommerce.segmentation.model.SegmentationRun;
import edu.yildiz.ecommerce.segmentation.repository.CustomerSegmentRepository;
import edu.yildiz.ecommerce.segmentation.repository.SegmentationRunRepository;
import org.junit.jupiter.api.Test;

class SegmentationReadServiceTest {

    private final SegmentationRunRepository runs = mock(SegmentationRunRepository.class);
    private final CustomerSegmentRepository customers = mock(CustomerSegmentRepository.class);
    private final SegmentationReadService service = new SegmentationReadService(runs, customers);

    private static SegmentationRun successfulRun(long id, int chosenK) {
        return new SegmentationRun(id, RunStatus.SUCCESS, Instant.parse("2026-11-23T10:00:00Z"),
                Instant.parse("2026-11-23T10:05:00Z"), 4L, LocalDate.of(2026, 11, 23), 1000L, chosenK, null);
    }

    @Test
    void segmentsAreEmptyWithoutASuccessfulRun() {
        when(runs.findLatestSuccessful()).thenReturn(Optional.empty());

        assertThat(service.segments()).isEmpty();
        assertThat(service.rfmGrid()).isEmpty();
        verify(customers, never()).findSegments();
    }

    @Test
    void clustersCarryTheirShareAndTheChosenK() {
        when(runs.findLatestSuccessful()).thenReturn(Optional.of(successfulRun(12, 3)));
        when(runs.findClusters(12L)).thenReturn(List.of(
                new ClusterProfile(0, "Active high value", 600, 5, 8, 400),
                new ClusterProfile(1, "Dormant low value", 300, 60, 2, 50),
                new ClusterProfile(2, "Lapsed high value", 100, 70, 9, 300)));
        when(runs.findElbow(12L)).thenReturn(List.of(new ElbowPoint(2, 900), new ElbowPoint(3, 400)));

        ClusterOverview overview = service.clusters();

        assertThat(overview.chosenK()).isEqualTo(3);
        assertThat(overview.clusters()).extracting(ClusterView::share).containsExactly(0.6, 0.3, 0.1);
        assertThat(overview.elbow()).hasSize(2);
    }

    @Test
    void clustersAreEmptyWithoutASuccessfulRun() {
        when(runs.findLatestSuccessful()).thenReturn(Optional.empty());

        ClusterOverview overview = service.clusters();

        assertThat(overview.clusters()).isEmpty();
        assertThat(overview.elbow()).isEmpty();
        assertThat(overview.chosenK()).isNull();
    }

    @Test
    void customersAnswerAnEmptyPageWithoutASuccessfulRun() {
        when(runs.findLatestSuccessful()).thenReturn(Optional.empty());
        CustomerQuery query = CustomerQuery.of(null, null, null, null, null, 2, 10);

        PageResult<CustomerRow> page = service.customers(query);

        assertThat(page.content()).isEmpty();
        assertThat(page.total()).isZero();
        assertThat(page.page()).isEqualTo(2);
        assertThat(page.size()).isEqualTo(10);
        verify(customers, never()).findCustomers(anyLong(), any());
    }

    @Test
    void customersAreReadForTheLatestSuccessfulRun() {
        CustomerQuery query = CustomerQuery.of(null, null, null, null, null, 0, 20);
        PageResult<CustomerRow> expected = new PageResult<>(List.of(), 0, 0, 20);
        when(runs.findLatestSuccessful()).thenReturn(Optional.of(successfulRun(12, 4)));
        when(customers.findCustomers(12L, query)).thenReturn(expected);

        assertThat(service.customers(query)).isSameAs(expected);
    }
}
