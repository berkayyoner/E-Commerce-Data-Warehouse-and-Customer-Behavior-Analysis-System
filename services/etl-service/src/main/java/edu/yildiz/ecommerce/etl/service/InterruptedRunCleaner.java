package edu.yildiz.ecommerce.etl.service;

import edu.yildiz.ecommerce.etl.repository.EtlRunRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/** Marks runs left over from a previous process as failed, otherwise no new run could ever start. */
@Component
public class InterruptedRunCleaner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(InterruptedRunCleaner.class);

    private final EtlRunRepository runs;

    public InterruptedRunCleaner(EtlRunRepository runs) {
        this.runs = runs;
    }

    @Override
    public void run(ApplicationArguments args) {
        int closed = runs.failInterruptedRuns();
        if (closed > 0) {
            log.warn("Marked {} interrupted ETL run(s) as failed", closed);
        }
    }
}
