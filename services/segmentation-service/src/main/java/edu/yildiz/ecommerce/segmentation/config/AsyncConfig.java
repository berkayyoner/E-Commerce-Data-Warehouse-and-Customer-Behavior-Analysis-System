package edu.yildiz.ecommerce.segmentation.config;

import java.util.concurrent.Executor;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@Configuration
public class AsyncConfig {

    /** A single worker thread: only one segmentation run may be active at a time. */
    @Bean(name = "segmentationExecutor")
    public Executor segmentationExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(1);
        executor.setMaxPoolSize(1);
        executor.setQueueCapacity(0);
        executor.setThreadNamePrefix("segmentation-");
        executor.initialize();
        return executor;
    }
}
