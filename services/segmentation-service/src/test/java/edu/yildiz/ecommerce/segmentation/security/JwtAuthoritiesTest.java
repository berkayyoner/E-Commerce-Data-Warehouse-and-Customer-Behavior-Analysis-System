package edu.yildiz.ecommerce.segmentation.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

class JwtAuthoritiesTest {

    @Test
    void rolesBecomeRoleAuthoritiesAndScopesBecomeScopeAuthorities() {
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "none")
                .claim("roles", List.of("ANALYST"))
                .claim("scope", List.of("etl.run"))
                .build();

        assertThat(new JwtAuthorities().convert(jwt))
                .extracting(GrantedAuthority::getAuthority)
                .containsExactly("ROLE_ANALYST", "SCOPE_etl.run");
    }

    @Test
    void aTokenWithoutRoleOrScopeClaimsHasNoAuthorities() {
        Jwt jwt = Jwt.withTokenValue("token").header("alg", "none").claim("sub", "someone").build();

        assertThat(new JwtAuthorities().convert(jwt)).isEmpty();
    }
}
