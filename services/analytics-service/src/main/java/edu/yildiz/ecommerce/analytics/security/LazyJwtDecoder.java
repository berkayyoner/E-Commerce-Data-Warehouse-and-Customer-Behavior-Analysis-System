package edu.yildiz.ecommerce.analytics.security;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtDecoders;
import org.springframework.security.oauth2.jwt.JwtException;

/**
 * Decodes access tokens with the keys of the authorization server, which are looked up when the first token arrives.
 * The service can therefore start before the authorization server is up; until it answers, tokens are refused.
 */
public class LazyJwtDecoder implements JwtDecoder {

    private final String issuer;
    private volatile JwtDecoder delegate;

    public LazyJwtDecoder(String issuer) {
        this.issuer = issuer;
    }

    @Override
    public Jwt decode(String token) throws JwtException {
        return delegate().decode(token);
    }

    private JwtDecoder delegate() {
        JwtDecoder current = delegate;
        if (current == null) {
            synchronized (this) {
                current = delegate;
                if (current == null) {
                    current = create();
                    delegate = current;
                }
            }
        }
        return current;
    }

    /** Reads the discovery document of the issuer and checks the issuer claim of every token. */
    private JwtDecoder create() {
        try {
            return JwtDecoders.fromIssuerLocation(issuer);
        } catch (RuntimeException e) {
            throw new JwtException("The authorization server at " + issuer + " cannot be reached", e);
        }
    }
}
