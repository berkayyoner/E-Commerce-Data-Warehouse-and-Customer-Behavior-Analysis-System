package edu.yildiz.ecommerce.auth.config;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Settings of the authorization server.
 *
 * @param issuer             public address of this server, written into every token
 * @param allowedOrigins     browser origins of the React applications (needed for CORS on the token endpoint)
 * @param analyticsRedirectUris redirect addresses of the public analytics portal
 * @param adminRedirectUris  redirect addresses of the personnel (admin) portal
 * @param etlClientSecret    secret of the service client that triggers scheduled ETL runs
 * @param jwtPrivateKey      PKCS8 RSA private key, base64 encoded; a temporary key is generated when empty
 * @param jwtPublicKey       X509 RSA public key, base64 encoded
 * @param adminUsername      first administrator, created when the user table is empty
 * @param adminPassword      password of the first administrator; no administrator is created when empty
 */
@ConfigurationProperties(prefix = "auth")
public record AuthProperties(
        String issuer,
        List<String> allowedOrigins,
        List<String> analyticsRedirectUris,
        List<String> adminRedirectUris,
        String etlClientSecret,
        String jwtPrivateKey,
        String jwtPublicKey,
        String adminUsername,
        String adminPassword) {

    public AuthProperties {
        allowedOrigins = allowedOrigins == null ? List.of() : List.copyOf(allowedOrigins);
        analyticsRedirectUris = analyticsRedirectUris == null ? List.of() : List.copyOf(analyticsRedirectUris);
        adminRedirectUris = adminRedirectUris == null ? List.of() : List.copyOf(adminRedirectUris);
    }
}
