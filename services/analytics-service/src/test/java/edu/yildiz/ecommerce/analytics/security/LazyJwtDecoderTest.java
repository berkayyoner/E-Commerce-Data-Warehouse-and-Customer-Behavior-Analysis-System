package edu.yildiz.ecommerce.analytics.security;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.JwtException;

class LazyJwtDecoderTest {

    @Test
    void creatingTheDecoderDoesNotContactTheAuthorizationServer() {
        new LazyJwtDecoder("http://localhost:1");
    }

    @Test
    void anUnreachableAuthorizationServerRefusesTheToken() {
        LazyJwtDecoder decoder = new LazyJwtDecoder("http://localhost:1");

        assertThatThrownBy(() -> decoder.decode("any.token.value")).isInstanceOf(JwtException.class);
    }
}
