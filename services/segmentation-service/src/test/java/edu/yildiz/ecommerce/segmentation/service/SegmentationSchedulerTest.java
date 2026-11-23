package edu.yildiz.ecommerce.segmentation.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import edu.yildiz.ecommerce.segmentation.repository.SegmentationRunRepository;
import org.junit.jupiter.api.Test;

class SegmentationSchedulerTest {

    private final SegmentationRunRepository runs = mock(SegmentationRunRepository.class);
    private final SegmentationRunService service = mock(SegmentationRunService.class);
    private final SegmentationScheduler scheduler = new SegmentationScheduler(runs, service);

    @Test
    void aRunStartsWhenTheEtlServiceLoadedNewerData() {
        when(runs.findLatestSuccessfulEtlRunId()).thenReturn(Optional.of(7L));
        when(runs.findLatestSuccessfulSegmentationEtlRunId()).thenReturn(Optional.of(5L));

        scheduler.runWhenEtlHasNewData();

        verify(service).start();
    }

    @Test
    void noRunStartsWhenTheLatestSegmentationAlreadySawTheNewestEtlRun() {
        when(runs.findLatestSuccessfulEtlRunId()).thenReturn(Optional.of(5L));
        when(runs.findLatestSuccessfulSegmentationEtlRunId()).thenReturn(Optional.of(5L));

        scheduler.runWhenEtlHasNewData();

        verify(service, never()).start();
    }

    @Test
    void noRunStartsWhenTheEtlServiceHasNeverLoaded() {
        when(runs.findLatestSuccessfulEtlRunId()).thenReturn(Optional.empty());

        scheduler.runWhenEtlHasNewData();

        verify(service, never()).start();
    }

    @Test
    void aRunStartsWhenNoSegmentationRunHasSucceededYet() {
        when(runs.findLatestSuccessfulEtlRunId()).thenReturn(Optional.of(2L));
        when(runs.findLatestSuccessfulSegmentationEtlRunId()).thenReturn(Optional.empty());

        scheduler.runWhenEtlHasNewData();

        verify(service).start();
    }

    @Test
    void aRunThatIsAlreadyActiveIsSkippedWithoutFailing() {
        when(runs.findLatestSuccessfulEtlRunId()).thenReturn(Optional.of(9L));
        when(runs.findLatestSuccessfulSegmentationEtlRunId()).thenReturn(Optional.of(8L));
        when(service.start()).thenThrow(new SegmentationAlreadyRunningException());

        assertThatCode(scheduler::runWhenEtlHasNewData).doesNotThrowAnyException();
    }

    @Test
    void hasNewEtlDataIsTrueOnlyForANewerEtlRun() {
        when(runs.findLatestSuccessfulEtlRunId()).thenReturn(Optional.of(12L));
        when(runs.findLatestSuccessfulSegmentationEtlRunId()).thenReturn(Optional.of(11L));

        assertThat(scheduler.hasNewEtlData()).isTrue();
    }
}
