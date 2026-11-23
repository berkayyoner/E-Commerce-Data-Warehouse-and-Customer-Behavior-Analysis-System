package edu.yildiz.ecommerce.auth.security;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import edu.yildiz.ecommerce.auth.config.AuthProperties;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.oidc.OidcScopes;
import org.springframework.security.oauth2.server.authorization.client.InMemoryRegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.settings.ClientSettings;
import org.springframework.security.oauth2.server.authorization.settings.TokenSettings;

/** The applications that may ask this server for tokens. */
final class RegisteredClients {

    static final String ANALYTICS_PORTAL = "analytics-portal";
    static final String ADMIN_PORTAL = "dwh-admin";
    static final String API_TEST = "api-test";
    static final String ETL_SCHEDULER = "etl-scheduler";

    private RegisteredClients() {
    }

    static RegisteredClientRepository create(AuthProperties properties, PasswordEncoder passwordEncoder) {
        List<RegisteredClient> clients = new ArrayList<>();
        clients.add(browserClient(ANALYTICS_PORTAL, properties.analyticsRedirectUris(), "dwh.read"));
        clients.add(browserClient(ADMIN_PORTAL, properties.adminRedirectUris(), "dwh.read", "dwh.write"));
        if (!properties.apiTestRedirectUris().isEmpty()) {
            clients.add(browserClient(API_TEST, properties.apiTestRedirectUris(), "dwh.read", "dwh.write"));
        }
        if (properties.etlClientSecret() != null && !properties.etlClientSecret().isBlank()) {
            clients.add(serviceClient(properties.etlClientSecret(), passwordEncoder));
        }
        return new InMemoryRegisteredClientRepository(clients);
    }

    /** A React application: authorization code flow with PKCE, so no client secret is stored in the browser. */
    private static RegisteredClient browserClient(String clientId, List<String> redirectUris, String... scopes) {
        RegisteredClient.Builder builder = RegisteredClient.withId(UUID.nameUUIDFromBytes(clientId.getBytes()).toString())
                .clientId(clientId)
                .clientAuthenticationMethod(ClientAuthenticationMethod.NONE)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)
                .scope(OidcScopes.OPENID)
                .scope(OidcScopes.PROFILE)
                .clientSettings(ClientSettings.builder()
                        .requireProofKey(true)
                        .requireAuthorizationConsent(false)
                        .build())
                .tokenSettings(TokenSettings.builder()
                        .accessTokenTimeToLive(Duration.ofMinutes(15))
                        .refreshTokenTimeToLive(Duration.ofHours(8))
                        .reuseRefreshTokens(false)
                        .build());
        redirectUris.forEach(builder::redirectUri);
        for (String scope : scopes) {
            builder.scope(scope);
        }
        return builder.build();
    }

    /** A service that acts without a user, for example the scheduler that starts nightly ETL runs. */
    private static RegisteredClient serviceClient(String secret, PasswordEncoder passwordEncoder) {
        return RegisteredClient.withId(UUID.nameUUIDFromBytes(ETL_SCHEDULER.getBytes()).toString())
                .clientId(ETL_SCHEDULER)
                .clientSecret(passwordEncoder.encode(secret))
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .authorizationGrantType(AuthorizationGrantType.CLIENT_CREDENTIALS)
                .scope("etl.run")
                .tokenSettings(TokenSettings.builder().accessTokenTimeToLive(Duration.ofMinutes(10)).build())
                .build();
    }
}
