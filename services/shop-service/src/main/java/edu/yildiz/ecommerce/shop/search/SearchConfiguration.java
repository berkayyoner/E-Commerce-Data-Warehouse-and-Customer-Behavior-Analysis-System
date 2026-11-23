package edu.yildiz.ecommerce.shop.search;

import java.time.Clock;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SearchConfiguration {

    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }

    /** One worker, so two reindexes never run at the same time. Daemon thread, it does not block shutdown. */
    @Bean(destroyMethod = "shutdown")
    ExecutorService reindexExecutor() {
        return Executors.newSingleThreadExecutor(runnable -> {
            Thread thread = new Thread(runnable, "product-reindex");
            thread.setDaemon(true);
            return thread;
        });
    }
}
