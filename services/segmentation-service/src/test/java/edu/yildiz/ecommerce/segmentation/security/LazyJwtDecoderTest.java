package edu.yildiz.ecommerce.segmentation.security;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.JwtException;

class LazyJwtDecoderTest {

    @Test
    void creatingTheDecoderDoesNotContactTheAuthorizationServer() {
        assertThatCode(() -> new LazyJwtDecoder("http://localhost:1")).doesNotThrowAnyException();
    }

    @Test
    void anUnreachableAuthorizationServerRefusesTheToken() {
        LazyJwtDecoder decoder = new LazyJwtDecoder("http://localhost:1");

        assertThatThrownBy(() -> decoder.decode("any.token.value")).isInstanceOf(JwtException.class);
    }
}
