package edu.yildiz.ecommerce.auth.token;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import edu.yildiz.ecommerce.auth.config.AuthProperties;
import edu.yildiz.ecommerce.auth.user.AppUser;
import edu.yildiz.ecommerce.auth.user.Role;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.stereotype.Component;

/**
 * Signs the access tokens of users. The resource services read the {@code roles} and {@code scope} claims, so
 * both are written here.
 */
@Component
class AccessTokenIssuer {

    static final Duration LIFETIME = Duration.ofMinutes(15);

    private static final String READ = "dwh.read";
    private static final String WRITE = "dwh.write";

    private final JwtEncoder encoder;
    private final String issuer;

    AccessTokenIssuer(JwtEncoder encoder, AuthProperties properties) {
        this.encoder = encoder;
        this.issuer = properties.issuer();
    }

    String issue(AppUser user, Instant now) {
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(issuer)
                .subject(user.username())
                .issuedAt(now)
                .expiresAt(now.plus(LIFETIME))
                .claim("roles", List.of(user.role().name()))
                .claim("name", user.displayName())
                .claim("scope", scopesFor(user.role()))
                .build();
        JwsHeader header = JwsHeader.with(SignatureAlgorithm.RS256).build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    /** Administrators may change data; every other role may only read it. */
    static List<String> scopesFor(Role role) {
        return role == Role.ADMIN ? List.of(READ, WRITE) : List.of(READ);
    }
}
