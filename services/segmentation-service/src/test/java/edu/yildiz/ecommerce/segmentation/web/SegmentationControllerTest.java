package edu.yildiz.ecommerce.segmentation.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import edu.yildiz.ecommerce.segmentation.model.ClusterOverview;
import edu.yildiz.ecommerce.segmentation.model.ClusterView;
import edu.yildiz.ecommerce.segmentation.model.CustomerQuery;
import edu.yildiz.ecommerce.segmentation.model.CustomerRow;
import edu.yildiz.ecommerce.segmentation.model.CustomerSort;
import edu.yildiz.ecommerce.segmentation.model.ElbowPoint;
import edu.yildiz.ecommerce.segmentation.model.PageResult;
import edu.yildiz.ecommerce.segmentation.model.RfmGridCell;
import edu.yildiz.ecommerce.segmentation.model.SegmentSummary;
import edu.yildiz.ecommerce.segmentation.service.SegmentationReadService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class SegmentationControllerTest {

    private final SegmentationReadService service = mock(SegmentationReadService.class);
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(new SegmentationController(service))
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
    }

    private static CustomerRow customer() {
        return new CustomerRow("1-2-3", "Ada Lovelace", "North", 4, 9, 812.5, 5, 5, 5, "Champions", 0,
                "Active high value");
    }

    @Test
    void segmentsAnswerTheSegmentSummaries() throws Exception {
        when(service.segments()).thenReturn(List.of(
                new SegmentSummary("Champions", 4200, 0.1234, 5.5, 12.0, 640.25, 2_688_000.5)));

        mvc.perform(get("/api/segmentation/segments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].segment").value("Champions"))
                .andExpect(jsonPath("$[0].share").value(0.1234))
                .andExpect(jsonPath("$[0].totalRevenue").value(2_688_000.5));
    }

    @Test
    void rfmGridAnswersTheCells() throws Exception {
        when(service.rfmGrid()).thenReturn(List.of(new RfmGridCell(5, 4, 310, 455.0)));

        mvc.perform(get("/api/segmentation/rfm-grid"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].recencyScore").value(5))
                .andExpect(jsonPath("$[0].frequencyScore").value(4))
                .andExpect(jsonPath("$[0].customers").value(310));
    }

    @Test
    void clustersAnswerTheLabelsTheElbowAndTheChosenK() throws Exception {
        when(service.clusters()).thenReturn(new ClusterOverview(
                List.of(new ClusterView(0, "Active high value", 600, 0.6, 5, 8, 400)),
                List.of(new ElbowPoint(2, 900), new ElbowPoint(3, 400)),
                3));

        mvc.perform(get("/api/segmentation/clusters"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.clusters[0].label").value("Active high value"))
                .andExpect(jsonPath("$.clusters[0].share").value(0.6))
                .andExpect(jsonPath("$.elbow[0].k").value(2))
                .andExpect(jsonPath("$.chosenK").value(3));
    }

    @Test
    void customersAnswerAPageOfRows() throws Exception {
        when(service.customers(any())).thenReturn(new PageResult<>(List.of(customer()), 1, 0, 20));

        mvc.perform(get("/api/segmentation/customers").param("segment", "Champions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.content[0].customerId").value("1-2-3"))
                .andExpect(jsonPath("$.content[0].clusterLabel").value("Active high value"));
    }

    @Test
    void customersPassTheParametersAsAValidatedQuery() throws Exception {
        when(service.customers(any())).thenReturn(new PageResult<>(List.of(), 0, 2, 50));

        mvc.perform(get("/api/segmentation/customers")
                        .param("cluster", "1")
                        .param("search", "ada")
                        .param("sort", "recencyDays")
                        .param("direction", "asc")
                        .param("page", "2")
                        .param("size", "50"))
                .andExpect(status().isOk());

        ArgumentCaptor<CustomerQuery> captor = ArgumentCaptor.forClass(CustomerQuery.class);
        verify(service).customers(captor.capture());
        CustomerQuery query = captor.getValue();
        assertThat(query.cluster()).isEqualTo(1);
        assertThat(query.search()).isEqualTo("ada");
        assertThat(query.sort()).isEqualTo(CustomerSort.RECENCY_DAYS);
        assertThat(query.descending()).isFalse();
        assertThat(query.page()).isEqualTo(2);
        assertThat(query.size()).isEqualTo(50);
    }

    @Test
    void customersDefaultToMonetaryDescending() throws Exception {
        when(service.customers(any())).thenReturn(new PageResult<>(List.of(), 0, 0, 20));

        mvc.perform(get("/api/segmentation/customers")).andExpect(status().isOk());

        ArgumentCaptor<CustomerQuery> captor = ArgumentCaptor.forClass(CustomerQuery.class);
        verify(service).customers(captor.capture());
        assertThat(captor.getValue().sort()).isEqualTo(CustomerSort.MONETARY);
        assertThat(captor.getValue().descending()).isTrue();
    }

    @Test
    void customersRejectAnUnknownSortColumn() throws Exception {
        mvc.perform(get("/api/segmentation/customers").param("sort", "password"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void customersRejectAnUnknownSegment() throws Exception {
        mvc.perform(get("/api/segmentation/customers").param("segment", "Stars"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void customersRejectANonNumericCluster() throws Exception {
        mvc.perform(get("/api/segmentation/customers").param("cluster", "one"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void customersRejectASizeAboveOneHundred() throws Exception {
        mvc.perform(get("/api/segmentation/customers").param("size", "250"))
                .andExpect(status().isBadRequest());
    }
}
