package edu.yildiz.ecommerce.analytics.web;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import edu.yildiz.ecommerce.analytics.cache.ReportCache;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class CacheControllerTest {

    @Test
    void clearAnswersWithTheNumberOfDeletedReports() throws Exception {
        ReportCache cache = mock(ReportCache.class);
        when(cache.clear()).thenReturn(7L);
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new CacheController(cache))
                .setControllerAdvice(new ApiExceptionHandler())
                .build();

        mvc.perform(post("/api/analytics/cache/clear"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deleted").value(7));
    }
}
