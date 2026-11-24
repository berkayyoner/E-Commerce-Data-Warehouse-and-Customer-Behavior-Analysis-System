package edu.yildiz.ecommerce.auth.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import edu.yildiz.ecommerce.auth.config.AuthProperties;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;

class RegisteredClientsTest {

    private final PasswordEncoder encoder = new BCryptPasswordEncoder(4);

    private static AuthProperties properties(String etlSecret) {
        return new AuthProperties("http://localhost:9000", List.of("http://localhost:3000"), etlSecret,
                null, null, "admin", null);
    }

    @Test
    void theReactApplicationsAreNoLongerOAuthClients() {
        RegisteredClientRepository clients = RegisteredClients.create(properties("s3cret"), encoder);

        for (String id : List.of("analytics-portal", "dwh-admin", "api-test")) {
            assertThat(clients.findByClientId(id)).isNull();
        }
    }

    @Test
    void theSchedulerClientExistsOnlyWithASecret() {
        assertThat(RegisteredClients.create(properties(""), encoder)
                .findByClientId(RegisteredClients.ETL_SCHEDULER)).isNull();
        assertThat(RegisteredClients.create(properties(null), encoder)
                .findByClientId(RegisteredClients.ETL_SCHEDULER)).isNull();
    }

    @Test
    void theSchedulerClientUsesClientCredentialsAndStoresItsSecretHashed() {
        RegisteredClient client = RegisteredClients.create(properties("s3cret"), encoder)
                .findByClientId(RegisteredClients.ETL_SCHEDULER);

        assertThat(client).isNotNull();
        assertThat(client.getClientSecret()).isNotEqualTo("s3cret");
        assertThat(encoder.matches("s3cret", client.getClientSecret())).isTrue();
        assertThat(client.getClientAuthenticationMethods()).containsExactly(ClientAuthenticationMethod.CLIENT_SECRET_BASIC);
        assertThat(client.getAuthorizationGrantTypes()).containsExactly(AuthorizationGrantType.CLIENT_CREDENTIALS);
        assertThat(client.getScopes()).containsExactly("etl.run");
    }
}
