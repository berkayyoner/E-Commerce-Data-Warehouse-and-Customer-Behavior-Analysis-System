package edu.yildiz.ecommerce.segmentation.web;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import edu.yildiz.ecommerce.segmentation.model.ClusterProfile;
import edu.yildiz.ecommerce.segmentation.model.ElbowPoint;
import edu.yildiz.ecommerce.segmentation.model.PageResult;
import edu.yildiz.ecommerce.segmentation.model.RunDetail;
import edu.yildiz.ecommerce.segmentation.model.RunStatus;
import edu.yildiz.ecommerce.segmentation.model.SegmentationRun;
import edu.yildiz.ecommerce.segmentation.service.SegmentationAlreadyRunningException;
import edu.yildiz.ecommerce.segmentation.service.SegmentationRunNotFoundException;
import edu.yildiz.ecommerce.segmentation.service.SegmentationRunService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class SegmentationRunControllerTest {

    private final SegmentationRunService service = mock(SegmentationRunService.class);
    private MockMvc mvc;

    private static SegmentationRun run(long id, RunStatus status) {
        return new SegmentationRun(id, status, Instant.parse("2026-11-23T10:00:00Z"), null, 4L,
                LocalDate.of(2026, 11, 23), null, null, null);
    }

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(new SegmentationRunController(service))
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
    }

    @Test
    void startAnswersWithAcceptedAndTheRunLocation() throws Exception {
        when(service.start()).thenReturn(run(12, RunStatus.RUNNING));

        mvc.perform(post("/api/segmentation/runs"))
                .andExpect(status().isAccepted())
                .andExpect(header().string("Location", "/api/segmentation/runs/12"))
                .andExpect(jsonPath("$.id").value(12))
                .andExpect(jsonPath("$.status").value("RUNNING"))
                .andExpect(jsonPath("$.etlRunId").value(4))
                .andExpect(jsonPath("$.asOfDate").value("2026-11-23"));
    }

    @Test
    void startReportsAConflictWhileARunIsActive() throws Exception {
        when(service.start()).thenThrow(new SegmentationAlreadyRunningException());

        mvc.perform(post("/api/segmentation/runs")).andExpect(status().isConflict());
    }

    @Test
    void listReturnsAPage() throws Exception {
        when(service.list(0, 20)).thenReturn(new PageResult<>(List.of(run(3, RunStatus.SUCCESS)), 1, 0, 20));

        mvc.perform(get("/api/segmentation/runs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.content[0].id").value(3))
                .andExpect(jsonPath("$.content[0].status").value("SUCCESS"));
    }

    @Test
    void listRejectsAPageSizeAboveTheLimit() throws Exception {
        when(service.list(0, 500)).thenThrow(new IllegalArgumentException("size must be between 1 and 100"));

        mvc.perform(get("/api/segmentation/runs").param("size", "500")).andExpect(status().isBadRequest());
    }

    @Test
    void getReturnsTheRunWithItsElbowAndClusters() throws Exception {
        when(service.get(4)).thenReturn(new RunDetail(run(4, RunStatus.SUCCESS),
                List.of(new ElbowPoint(2, 900.5), new ElbowPoint(3, 400.25)),
                List.of(new ClusterProfile(0, "Active high value", 120, 6.5, 7.25, 520.75))));

        mvc.perform(get("/api/segmentation/runs/4"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.run.id").value(4))
                .andExpect(jsonPath("$.elbow[1].k").value(3))
                .andExpect(jsonPath("$.clusters[0].label").value("Active high value"));
    }

    @Test
    void getReportsAnUnknownRun() throws Exception {
        when(service.get(404)).thenThrow(new SegmentationRunNotFoundException(404));

        mvc.perform(get("/api/segmentation/runs/404")).andExpect(status().isNotFound());
    }
}
