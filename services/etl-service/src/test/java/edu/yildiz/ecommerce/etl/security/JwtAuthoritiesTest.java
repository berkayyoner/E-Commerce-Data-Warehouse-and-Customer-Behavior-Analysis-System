package edu.yildiz.ecommerce.etl.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

class JwtAuthoritiesTest {

    private final JwtAuthorities converter = new JwtAuthorities();

    private static Jwt.Builder token() {
        return Jwt.withTokenValue("token").header("alg", "none").subject("someone")
                .issuedAt(Instant.parse("2026-11-23T10:00:00Z")).expiresAt(Instant.parse("2026-11-23T10:15:00Z"));
    }

    @Test
    void rolesBecomeRoleAuthorities() {
        Jwt jwt = token().claim("roles", java.util.List.of("ADMIN", "ANALYST")).build();

        assertThat(converter.convert(jwt)).extracting(GrantedAuthority::getAuthority)
                .containsExactly("ROLE_ADMIN", "ROLE_ANALYST");
    }

    @Test
    void scopesBecomeScopeAuthorities() {
        Jwt jwt = token().claim("scope", java.util.List.of("etl.run")).build();

        assertThat(converter.convert(jwt)).extracting(GrantedAuthority::getAuthority)
                .containsExactly("SCOPE_etl.run");
    }

    @Test
    void aTokenWithoutRolesOrScopesHasNoAuthorities() {
        assertThat(converter.convert(token().claim("name", "x").build())).isEmpty();
    }
}
