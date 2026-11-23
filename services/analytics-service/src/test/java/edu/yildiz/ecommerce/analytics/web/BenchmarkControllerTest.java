package edu.yildiz.ecommerce.analytics.web;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.util.List;

import edu.yildiz.ecommerce.analytics.model.BenchmarkResult;
import edu.yildiz.ecommerce.analytics.service.BenchmarkService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class BenchmarkControllerTest {

    private final BenchmarkService service = mock(BenchmarkService.class);
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(new BenchmarkController(service))
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
    }

    @Test
    void benchmarkAnswersWithTheThreeMeasurementsAndIsNeverCached() throws Exception {
        when(service.run()).thenReturn(List.of(
                new BenchmarkResult("OLTP schema", 900, new BigDecimal("420.500"), new BigDecimal("1.00")),
                new BenchmarkResult("Star schema", 900, new BigDecimal("38.200"), new BigDecimal("11.01")),
                new BenchmarkResult("Materialized view", 900, new BigDecimal("1.100"), new BigDecimal("382.27"))));

        mvc.perform(get("/api/analytics/benchmark"))
                .andExpect(status().isOk())
                .andExpect(header().doesNotExist("X-Cache"))
                .andExpect(jsonPath("$[1].name").value("Star schema"))
                .andExpect(jsonPath("$[2].speedupVsOltp").value(382.27));
    }
}
