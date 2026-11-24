package edu.yildiz.ecommerce.etl.config;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @param issuer         address of the authorization server that signs the access tokens
 * @param allowedOrigins browser origins of the web application (CORS)
 */
@ConfigurationProperties(prefix = "security")
public record SecurityProperties(String issuer, List<String> allowedOrigins) {

    public SecurityProperties {
        allowedOrigins = allowedOrigins == null ? List.of() : List.copyOf(allowedOrigins);
    }
}
