package edu.yildiz.ecommerce.auth.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import edu.yildiz.ecommerce.auth.config.AuthProperties;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;

class RegisteredClientsTest {

    private final PasswordEncoder encoder = new BCryptPasswordEncoder(4);

    private static AuthProperties properties(List<String> apiTestUris, String etlSecret) {
        return new AuthProperties("http://localhost:9000", List.of("http://localhost:3000"),
                List.of("http://localhost:3000/callback"), List.of("http://localhost:3001/callback"), apiTestUris,
                etlSecret, null, null, "admin", null);
    }

    @Test
    void bothReactAppsAreRegisteredAsPublicClientsThatRequireProofKeys() {
        RegisteredClientRepository clients = RegisteredClients.create(properties(List.of(), ""), encoder);

        for (String id : List.of(RegisteredClients.ANALYTICS_PORTAL, RegisteredClients.ADMIN_PORTAL)) {
            RegisteredClient client = clients.findByClientId(id);
            assertThat(client).isNotNull();
            assertThat(client.getClientAuthenticationMethods()).containsExactly(ClientAuthenticationMethod.NONE);
            assertThat(client.getClientSettings().isRequireProofKey()).isTrue();
        }
    }

    @Test
    void thePortalCannotWriteButTheConsoleCan() {
        RegisteredClientRepository clients = RegisteredClients.create(properties(List.of(), ""), encoder);

        assertThat(clients.findByClientId(RegisteredClients.ANALYTICS_PORTAL).getScopes()).contains("dwh.read")
                .doesNotContain("dwh.write");
        assertThat(clients.findByClientId(RegisteredClients.ADMIN_PORTAL).getScopes()).contains("dwh.read", "dwh.write");
    }

    @Test
    void theApiTestClientExistsOnlyWhenARedirectAddressIsConfigured() {
        assertThat(RegisteredClients.create(properties(List.of(), ""), encoder)
                .findByClientId(RegisteredClients.API_TEST)).isNull();

        RegisteredClient client = RegisteredClients.create(
                properties(List.of("https://oauth.pstmn.io/v1/callback"), ""), encoder)
                .findByClientId(RegisteredClients.API_TEST);

        assertThat(client).isNotNull();
        assertThat(client.getRedirectUris()).containsExactly("https://oauth.pstmn.io/v1/callback");
    }

    @Test
    void theSchedulerClientExistsOnlyWithASecretAndStoresItHashed() {
        assertThat(RegisteredClients.create(properties(List.of(), ""), encoder)
                .findByClientId(RegisteredClients.ETL_SCHEDULER)).isNull();

        RegisteredClient client = RegisteredClients.create(properties(List.of(), "s3cret"), encoder)
                .findByClientId(RegisteredClients.ETL_SCHEDULER);

        assertThat(client).isNotNull();
        assertThat(client.getClientSecret()).isNotEqualTo("s3cret");
        assertThat(encoder.matches("s3cret", client.getClientSecret())).isTrue();
        assertThat(client.getScopes()).containsExactly("etl.run");
    }
}
