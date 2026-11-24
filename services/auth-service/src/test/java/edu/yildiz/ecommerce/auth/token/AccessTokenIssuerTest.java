package edu.yildiz.ecommerce.auth.token;

import static org.assertj.core.api.Assertions.assertThat;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.util.List;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.crypto.RSASSAVerifier;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import edu.yildiz.ecommerce.auth.config.AuthProperties;
import edu.yildiz.ecommerce.auth.user.AppUser;
import edu.yildiz.ecommerce.auth.user.Role;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

class AccessTokenIssuerTest {

    private static final Instant NOW = Instant.parse("2026-11-24T10:00:00Z");
    private static final KeyPair KEYS = generateKeys();

    private final JwtEncoder encoder = new NimbusJwtEncoder(new ImmutableJWKSet<SecurityContext>(new JWKSet(
            new RSAKey.Builder((RSAPublicKey) KEYS.getPublic()).privateKey((RSAPrivateKey) KEYS.getPrivate())
                    .keyID("test-key").build())));
    private final AccessTokenIssuer issuer = new AccessTokenIssuer(encoder,
            new AuthProperties("http://localhost:9000", List.of(), null, null, null, "admin", null));

    private static KeyPair generateKeys() {
        try {
            KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(2048);
            return generator.generateKeyPair();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private static AppUser user(String username, Role role) {
        return new AppUser(3, username, "hash", "Alice Demir", null, role, true, NOW);
    }

    private JWTClaimsSet verifiedClaims(String token) throws Exception {
        SignedJWT jwt = SignedJWT.parse(token);
        assertThat(jwt.verify(new RSASSAVerifier((RSAPublicKey) KEYS.getPublic()))).isTrue();
        assertThat(jwt.getHeader().getAlgorithm()).isEqualTo(JWSAlgorithm.RS256);
        return jwt.getJWTClaimsSet();
    }

    @Test
    void theTokenCarriesTheClaimsTheResourceServicesRead() throws Exception {
        JWTClaimsSet claims = verifiedClaims(issuer.issue(user("alice", Role.ANALYST), NOW));

        assertThat(claims.getIssuer()).isEqualTo("http://localhost:9000");
        assertThat(claims.getSubject()).isEqualTo("alice");
        assertThat(claims.getStringListClaim("roles")).containsExactly("ANALYST");
        assertThat(claims.getStringClaim("name")).isEqualTo("Alice Demir");
        assertThat(claims.getStringListClaim("scope")).containsExactly("dwh.read");
    }

    @Test
    void onlyAdministratorsGetTheWriteScope() throws Exception {
        JWTClaimsSet admin = verifiedClaims(issuer.issue(user("boss", Role.ADMIN), NOW));
        JWTClaimsSet viewer = verifiedClaims(issuer.issue(user("guest", Role.VIEWER), NOW));

        assertThat(admin.getStringListClaim("scope")).containsExactly("dwh.read", "dwh.write");
        assertThat(viewer.getStringListClaim("scope")).containsExactly("dwh.read");
    }

    @Test
    void theTokenLivesFifteenMinutes() throws Exception {
        JWTClaimsSet claims = verifiedClaims(issuer.issue(user("alice", Role.ANALYST), NOW));

        assertThat(claims.getIssueTime().toInstant()).isEqualTo(NOW);
        assertThat(claims.getExpirationTime().toInstant()).isEqualTo(NOW.plusSeconds(15 * 60));
    }
}
