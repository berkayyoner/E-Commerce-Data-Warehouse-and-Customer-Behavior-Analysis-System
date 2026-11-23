package edu.yildiz.ecommerce.analytics.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import edu.yildiz.ecommerce.analytics.config.AnalyticsProperties;
import edu.yildiz.ecommerce.analytics.model.BenchmarkResult;
import edu.yildiz.ecommerce.analytics.repository.ReportQueries;
import edu.yildiz.ecommerce.analytics.repository.ReportRepository;
import org.junit.jupiter.api.Test;

class BenchmarkServiceTest {

    private final ReportRepository repository = mock(ReportRepository.class);
    private final ReportQueries queries = new ReportQueries(new AnalyticsProperties("DWH_OLTP"));
    private final BenchmarkService service = new BenchmarkService(repository, queries);

    @Test
    void theBenchmarkReportsTheThreeSchemasWithTheSameRowCount() {
        when(repository.countRows(anyString())).thenReturn(12L);

        List<BenchmarkResult> results = service.run();

        assertThat(results).extracting(BenchmarkResult::name)
                .containsExactly("OLTP schema", "Star schema", "Materialized view");
        assertThat(results).extracting(BenchmarkResult::rows).containsOnly(12L);
        assertThat(results.getFirst().speedupVsOltp()).isEqualByComparingTo("1.00");
    }

    @Test
    void eachQueryRunsOneWarmUpAndThreeTimedRuns() {
        when(repository.countRows(anyString())).thenReturn(1L);

        service.run();

        verify(repository, times(12)).countRows(anyString());
    }
}
