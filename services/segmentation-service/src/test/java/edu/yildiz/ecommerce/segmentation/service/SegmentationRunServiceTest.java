package edu.yildiz.ecommerce.segmentation.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.Executor;
import java.util.concurrent.RejectedExecutionException;

import edu.yildiz.ecommerce.segmentation.job.SegmentationJob;
import edu.yildiz.ecommerce.segmentation.model.ClusterProfile;
import edu.yildiz.ecommerce.segmentation.model.ElbowPoint;
import edu.yildiz.ecommerce.segmentation.model.PageResult;
import edu.yildiz.ecommerce.segmentation.model.RunDetail;
import edu.yildiz.ecommerce.segmentation.model.RunStatus;
import edu.yildiz.ecommerce.segmentation.model.SegmentationRun;
import edu.yildiz.ecommerce.segmentation.repository.SegmentationRunRepository;
import org.junit.jupiter.api.Test;

class SegmentationRunServiceTest {

    private static final LocalDate AS_OF = LocalDate.of(2026, 11, 23);
    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-11-23T10:00:00Z"), ZoneOffset.UTC);

    private final SegmentationRunRepository runs = mock(SegmentationRunRepository.class);
    private final SegmentationJob job = mock(SegmentationJob.class);

    private static SegmentationRun run(long id, RunStatus status) {
        return new SegmentationRun(id, status, Instant.parse("2026-11-23T10:00:00Z"), null, 4L, AS_OF, null, null,
                null);
    }

    private SegmentationRunService service(Executor executor) {
        return new SegmentationRunService(runs, job, executor, CLOCK);
    }

    private void readyToStart() {
        when(runs.hasRunningRun()).thenReturn(false);
        when(runs.findLatestSuccessfulEtlRunId()).thenReturn(Optional.of(4L));
        when(runs.findLastOrderDate()).thenReturn(Optional.of(LocalDate.of(2026, 11, 22)));
    }

    @Test
    void aSecondStartWhileARunIsActiveIsRefused() {
        when(runs.hasRunningRun()).thenReturn(true);

        assertThatThrownBy(() -> service(Runnable::run).start())
                .isInstanceOf(SegmentationAlreadyRunningException.class);

        verify(runs, never()).create(anyLong(), any(LocalDate.class));
    }

    @Test
    void aRunScoresTheWarehouseInTheBackgroundAndRecordsTheOutcome() {
        readyToStart();
        when(runs.create(4L, AS_OF)).thenReturn(9L);
        when(runs.find(9L)).thenReturn(Optional.of(run(9, RunStatus.RUNNING)));
        when(job.execute(9L, AS_OF)).thenReturn(new SegmentationJob.Outcome(155_000L, 4));

        SegmentationRun started = service(Runnable::run).start();

        assertThat(started.id()).isEqualTo(9L);
        verify(runs).finish(9L, RunStatus.SUCCESS, 155_000L, 4, null);
    }

    @Test
    void aFailingJobMarksTheRunAsFailedWithItsMessage() {
        readyToStart();
        when(runs.create(4L, AS_OF)).thenReturn(3L);
        when(runs.find(3L)).thenReturn(Optional.of(run(3, RunStatus.RUNNING)));
        when(job.execute(3L, AS_OF)).thenThrow(new IllegalStateException("table is missing"));

        service(Runnable::run).start();

        verify(runs).finish(3L, RunStatus.FAILED, null, null, "table is missing");
    }

    @Test
    void aJobWithoutMessageFailsWithItsExceptionName() {
        readyToStart();
        when(runs.create(4L, AS_OF)).thenReturn(3L);
        when(runs.find(3L)).thenReturn(Optional.of(run(3, RunStatus.RUNNING)));
        when(job.execute(3L, AS_OF)).thenThrow(new IllegalStateException());

        service(Runnable::run).start();

        verify(runs).finish(3L, RunStatus.FAILED, null, null, "IllegalStateException");
    }

    @Test
    void withoutASuccessfulEtlRunTheRunIsRegisteredAsFailed() {
        when(runs.hasRunningRun()).thenReturn(false);
        when(runs.findLatestSuccessfulEtlRunId()).thenReturn(Optional.empty());
        when(runs.create(0L, AS_OF)).thenReturn(3L);
        when(runs.find(3L)).thenReturn(Optional.of(run(3, RunStatus.FAILED)));

        SegmentationRun started = service(Runnable::run).start();

        assertThat(started.status()).isEqualTo(RunStatus.FAILED);
        verify(runs).finish(3L, RunStatus.FAILED, null, null, SegmentationRunService.NO_ETL_RUN_MESSAGE);
        verifyNoInteractions(job);
    }

    @Test
    void withoutOrdersTheRunIsRegisteredAsFailed() {
        when(runs.hasRunningRun()).thenReturn(false);
        when(runs.findLatestSuccessfulEtlRunId()).thenReturn(Optional.of(4L));
        when(runs.findLastOrderDate()).thenReturn(Optional.empty());
        when(runs.create(4L, AS_OF)).thenReturn(6L);
        when(runs.find(6L)).thenReturn(Optional.of(run(6, RunStatus.FAILED)));

        service(Runnable::run).start();

        verify(runs).finish(6L, RunStatus.FAILED, null, null, SegmentationRunService.NO_ORDERS_MESSAGE);
        verifyNoInteractions(job);
    }

    @Test
    void aBusyWorkerFailsTheRegisteredRunAndReportsAConflict() {
        readyToStart();
        when(runs.create(4L, AS_OF)).thenReturn(5L);
        Executor busy = task -> {
            throw new RejectedExecutionException("busy");
        };

        assertThatThrownBy(() -> service(busy).start()).isInstanceOf(SegmentationAlreadyRunningException.class);

        verify(runs).finish(5L, RunStatus.FAILED, null, null, "The segmentation worker is busy");
    }

    @Test
    void listReturnsThePageAndTheTotal() {
        when(runs.findPage(2, 5)).thenReturn(List.of(run(11, RunStatus.SUCCESS)));
        when(runs.count()).thenReturn(11L);

        PageResult<SegmentationRun> page = service(Runnable::run).list(2, 5);

        assertThat(page.content()).hasSize(1);
        assertThat(page.total()).isEqualTo(11L);
        assertThat(page.page()).isEqualTo(2);
        assertThat(page.size()).isEqualTo(5);
    }

    @Test
    void listRejectsAPageSizeAboveOneHundred() {
        assertThatThrownBy(() -> service(Runnable::run).list(0, 101)).isInstanceOf(IllegalArgumentException.class);
        verify(runs, never()).findPage(anyInt(), anyInt());
    }

    @Test
    void listRejectsANegativePage() {
        assertThatThrownBy(() -> service(Runnable::run).list(-1, 20)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void getReturnsTheElbowCurveAndTheClusters() {
        when(runs.find(7L)).thenReturn(Optional.of(run(7, RunStatus.SUCCESS)));
        when(runs.findElbow(7L)).thenReturn(List.of(new ElbowPoint(2, 900), new ElbowPoint(3, 400)));
        when(runs.findClusters(7L)).thenReturn(List.of(new ClusterProfile(0, "Active high value", 10, 5, 8, 400)));

        RunDetail detail = service(Runnable::run).get(7L);

        assertThat(detail.run().id()).isEqualTo(7L);
        assertThat(detail.elbow()).hasSize(2);
        assertThat(detail.clusters().get(0).label()).isEqualTo("Active high value");
    }

    @Test
    void getFailsForAnUnknownRun() {
        when(runs.find(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service(Runnable::run).get(99L))
                .isInstanceOf(SegmentationRunNotFoundException.class);
    }
}
