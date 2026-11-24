package edu.yildiz.ecommerce.auth.security;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

import edu.yildiz.ecommerce.auth.config.AuthProperties;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.server.authorization.client.InMemoryRegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.settings.TokenSettings;

/** The services that may ask this server for tokens without a user. The React applications use the token API. */
final class RegisteredClients {

    static final String ETL_SCHEDULER = "etl-scheduler";

    private RegisteredClients() {
    }

    static RegisteredClientRepository create(AuthProperties properties, PasswordEncoder passwordEncoder) {
        if (properties.etlClientSecret() == null || properties.etlClientSecret().isBlank()) {
            return new NoRegisteredClients();
        }
        return new InMemoryRegisteredClientRepository(List.of(serviceClient(properties.etlClientSecret(), passwordEncoder)));
    }

    /** Used when no service client is configured, so no application can ask for a token. */
    private static final class NoRegisteredClients implements RegisteredClientRepository {

        @Override
        public void save(RegisteredClient registeredClient) {
            throw new UnsupportedOperationException("Clients are configured from the settings only");
        }

        @Override
        public RegisteredClient findById(String id) {
            return null;
        }

        @Override
        public RegisteredClient findByClientId(String clientId) {
            return null;
        }
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
