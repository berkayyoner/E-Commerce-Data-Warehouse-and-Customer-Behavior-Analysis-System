package edu.yildiz.ecommerce.auth.token;

import java.util.Map;

import edu.yildiz.ecommerce.auth.token.TokenDtos.LoginRequest;
import edu.yildiz.ecommerce.auth.token.TokenDtos.LogoutRequest;
import edu.yildiz.ecommerce.auth.token.TokenDtos.RefreshRequest;
import edu.yildiz.ecommerce.auth.token.TokenDtos.TokenResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** The JSON token API: sign in, refresh and sign out. */
@RestController
@RequestMapping("/auth")
public class TokenController {

    private final TokenService tokens;

    public TokenController(TokenService tokens) {
        this.tokens = tokens;
    }

    @PostMapping("/login")
    public TokenResponse login(@RequestBody LoginRequest request, HttpServletRequest http) {
        return tokens.login(request.username(), request.password(), http.getRemoteAddr());
    }

    @PostMapping("/refresh")
    public TokenResponse refresh(@RequestBody RefreshRequest request) {
        return tokens.refresh(request.refreshToken());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody(required = false) LogoutRequest request) {
        tokens.logout(request == null ? null : request.refreshToken());
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(InvalidGrantException.class)
    public ResponseEntity<Map<String, String>> invalidGrant() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "invalid_grant"));
    }

    @ExceptionHandler(TooManyAttemptsException.class)
    public ResponseEntity<Map<String, String>> tooManyAttempts() {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of("error", "too_many_requests"));
    }
}
