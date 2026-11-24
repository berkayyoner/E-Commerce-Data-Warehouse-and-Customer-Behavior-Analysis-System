package edu.yildiz.ecommerce.auth.token;

import com.fasterxml.jackson.annotation.JsonProperty;

/** Request and response shapes of the token API used by the React applications. */
public final class TokenDtos {

    private TokenDtos() {
    }

    public record LoginRequest(String username, String password) {
    }

    public record RefreshRequest(@JsonProperty("refresh_token") String refreshToken) {
    }

    public record LogoutRequest(@JsonProperty("refresh_token") String refreshToken) {
    }

    public record TokenResponse(
            @JsonProperty("access_token") String accessToken,
            @JsonProperty("refresh_token") String refreshToken,
            @JsonProperty("token_type") String tokenType,
            @JsonProperty("expires_in") long expiresIn,
            @JsonProperty("display_name") String displayName,
            String role) {
    }
}
