package edu.yildiz.ecommerce.etl.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.Executor;
import java.util.concurrent.RejectedExecutionException;

import edu.yildiz.ecommerce.etl.job.EtlJob;
import edu.yildiz.ecommerce.etl.model.EtlOutcome;
import edu.yildiz.ecommerce.etl.model.EtlRun;
import edu.yildiz.ecommerce.etl.model.PageResult;
import edu.yildiz.ecommerce.etl.model.RunStatus;
import edu.yildiz.ecommerce.etl.model.RunType;
import edu.yildiz.ecommerce.etl.repository.EtlRunRepository;
import org.junit.jupiter.api.Test;

class EtlRunServiceTest {

    private final EtlRunRepository runs = mock(EtlRunRepository.class);
    private final EtlJob job = mock(EtlJob.class);

    private static EtlRun runningRun(long id, RunType type) {
        return new EtlRun(id, type, RunStatus.RUNNING, Instant.parse("2026-11-23T10:00:00Z"), null, 0, 0, 0, null);
    }

    @Test
    void startRegistersTheRunAndExecutesTheJobInTheBackground() {
        Executor sameThread = Runnable::run;
        EtlRunService service = new EtlRunService(runs, job, sameThread);
        when(runs.hasRunningRun()).thenReturn(false);
        when(runs.create(RunType.FULL)).thenReturn(7L);
        when(runs.find(7L)).thenReturn(Optional.of(runningRun(7, RunType.FULL)));
        when(job.execute(7L, RunType.FULL)).thenReturn(new EtlOutcome(10, 9, 1));

        EtlRun run = service.start(RunType.FULL);

        assertThat(run.id()).isEqualTo(7L);
        verify(runs).finish(7L, RunStatus.SUCCESS, 10, 9, 1, null);
    }

    @Test
    void startRefusesASecondRunWhileOneIsActive() {
        EtlRunService service = new EtlRunService(runs, job, Runnable::run);
        when(runs.hasRunningRun()).thenReturn(true);

        assertThatThrownBy(() -> service.start(RunType.INCREMENTAL)).isInstanceOf(EtlAlreadyRunningException.class);

        verify(runs, never()).create(RunType.INCREMENTAL);
    }

    @Test
    void aFailingJobMarksTheRunAsFailed() {
        EtlRunService service = new EtlRunService(runs, job, Runnable::run);
        when(runs.hasRunningRun()).thenReturn(false);
        when(runs.create(RunType.FULL)).thenReturn(3L);
        when(runs.find(3L)).thenReturn(Optional.of(runningRun(3, RunType.FULL)));
        when(job.execute(3L, RunType.FULL)).thenThrow(new IllegalStateException("table is missing"));

        service.start(RunType.FULL);

        verify(runs).finish(3L, RunStatus.FAILED, 0, 0, 0, "table is missing");
    }

    @Test
    void aBusyWorkerFailsTheRegisteredRunAndReportsAConflict() {
        Executor busy = task -> {
            throw new RejectedExecutionException("busy");
        };
        EtlRunService service = new EtlRunService(runs, job, busy);
        when(runs.hasRunningRun()).thenReturn(false);
        when(runs.create(RunType.FULL)).thenReturn(5L);

        assertThatThrownBy(() -> service.start(RunType.FULL)).isInstanceOf(EtlAlreadyRunningException.class);

        verify(runs).finish(5L, RunStatus.FAILED, 0, 0, 0, "The ETL worker is busy");
    }

    @Test
    void listLimitsThePageSize() {
        EtlRunService service = new EtlRunService(runs, job, Runnable::run);
        when(runs.findPage(anyInt(), anyInt())).thenReturn(List.of());
        when(runs.count()).thenReturn(0L);

        PageResult<EtlRun> page = service.list(-3, 5000);

        assertThat(page.page()).isZero();
        assertThat(page.size()).isEqualTo(100);
        verify(runs).findPage(0, 100);
    }

    @Test
    void getFailsForAnUnknownRun() {
        EtlRunService service = new EtlRunService(runs, job, Runnable::run);
        when(runs.find(eq(99L))).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.get(99L)).isInstanceOf(EtlRunNotFoundException.class);

        verify(runs, never()).findSteps(anyLong());
    }
}
