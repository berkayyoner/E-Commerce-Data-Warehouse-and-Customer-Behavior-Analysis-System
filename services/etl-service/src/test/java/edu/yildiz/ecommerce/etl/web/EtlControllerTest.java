package edu.yildiz.ecommerce.etl.web;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;

import edu.yildiz.ecommerce.etl.model.EtlRun;
import edu.yildiz.ecommerce.etl.model.EtlRunDetail;
import edu.yildiz.ecommerce.etl.model.EtlStepResult;
import edu.yildiz.ecommerce.etl.model.PageResult;
import edu.yildiz.ecommerce.etl.model.QualityResult;
import edu.yildiz.ecommerce.etl.model.RunStatus;
import edu.yildiz.ecommerce.etl.model.RunType;
import edu.yildiz.ecommerce.etl.service.EtlAlreadyRunningException;
import edu.yildiz.ecommerce.etl.service.EtlRunNotFoundException;
import edu.yildiz.ecommerce.etl.service.EtlRunService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class EtlControllerTest {

    private final EtlRunService service = mock(EtlRunService.class);
    private MockMvc mvc;

    private static EtlRun run(long id, RunStatus status) {
        return new EtlRun(id, RunType.FULL, status, Instant.parse("2026-11-23T10:00:00Z"), null, 0, 0, 0, null);
    }

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(new EtlController(service))
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
    }

    @Test
    void startAnswersWithAcceptedAndTheRunLocation() throws Exception {
        when(service.start(RunType.FULL)).thenReturn(run(12, RunStatus.RUNNING));

        mvc.perform(post("/api/etl/runs").contentType(MediaType.APPLICATION_JSON).content("{\"runType\":\"FULL\"}"))
                .andExpect(status().isAccepted())
                .andExpect(header().string("Location", "/api/etl/runs/12"))
                .andExpect(jsonPath("$.id").value(12))
                .andExpect(jsonPath("$.status").value("RUNNING"));
    }

    @Test
    void startReportsAConflictWhileARunIsActive() throws Exception {
        when(service.start(RunType.INCREMENTAL)).thenThrow(new EtlAlreadyRunningException());

        mvc.perform(post("/api/etl/runs").contentType(MediaType.APPLICATION_JSON).content("{\"runType\":\"INCREMENTAL\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    void startRejectsAnUnknownRunType() throws Exception {
        mvc.perform(post("/api/etl/runs").contentType(MediaType.APPLICATION_JSON).content("{\"runType\":\"PARTIAL\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void startRejectsAMissingRunType() throws Exception {
        mvc.perform(post("/api/etl/runs").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void listReturnsAPage() throws Exception {
        when(service.list(0, 20)).thenReturn(new PageResult<>(List.of(run(2, RunStatus.SUCCESS)), 1, 0, 20));

        mvc.perform(get("/api/etl/runs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.content[0].id").value(2));
    }

    @Test
    void getReturnsStepsAndQualityChecks() throws Exception {
        when(service.get(4)).thenReturn(new EtlRunDetail(run(4, RunStatus.SUCCESS),
                List.of(new EtlStepResult("Load sales facts", 10, 10, 250)),
                List.of(new QualityResult("Order line count matches OLTP", true, "expected 10, found 10"))));

        mvc.perform(get("/api/etl/runs/4"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.steps[0].stepName").value("Load sales facts"))
                .andExpect(jsonPath("$.qualityChecks[0].passed").value(true));
    }

    @Test
    void getReportsAnUnknownRun() throws Exception {
        when(service.get(404)).thenThrow(new EtlRunNotFoundException(404));

        mvc.perform(get("/api/etl/runs/404")).andExpect(status().isNotFound());
    }
}
