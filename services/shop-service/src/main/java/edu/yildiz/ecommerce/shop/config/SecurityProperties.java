package edu.yildiz.ecommerce.shop.config;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @param allowedOrigins browser origins of the shop front-ends (CORS)
 */
@ConfigurationProperties(prefix = "security")
public record SecurityProperties(List<String> allowedOrigins) {

    public SecurityProperties {
        allowedOrigins = allowedOrigins == null ? List.of() : List.copyOf(allowedOrigins);
    }
}
