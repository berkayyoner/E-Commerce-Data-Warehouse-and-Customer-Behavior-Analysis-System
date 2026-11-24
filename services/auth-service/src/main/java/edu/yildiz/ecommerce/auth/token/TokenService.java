package edu.yildiz.ecommerce.auth.token;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;

import edu.yildiz.ecommerce.auth.token.TokenDtos.TokenResponse;
import edu.yildiz.ecommerce.auth.user.AppUser;
import edu.yildiz.ecommerce.auth.user.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;

/** Signs users in, rotates refresh tokens and signs them out. */
@Service
public class TokenService {

    static final Duration REFRESH_LIFETIME = Duration.ofHours(8);

    private final AuthenticationManager authenticationManager;
    private final UserRepository users;
    private final RefreshTokenRepository refreshTokens;
    private final AccessTokenIssuer accessTokens;
    private final LoginAttemptLimiter attempts;
    private final Clock clock;

    TokenService(AuthenticationManager authenticationManager, UserRepository users,
                 RefreshTokenRepository refreshTokens, AccessTokenIssuer accessTokens,
                 LoginAttemptLimiter attempts, Clock clock) {
        this.authenticationManager = authenticationManager;
        this.users = users;
        this.refreshTokens = refreshTokens;
        this.accessTokens = accessTokens;
        this.attempts = attempts;
        this.clock = clock;
    }

    public TokenResponse login(String username, String password, String clientAddress) {
        if (isBlank(username) || isBlank(password)) {
            throw new InvalidGrantException();
        }
        String key = username.toLowerCase(Locale.ROOT) + "|" + clientAddress;
        if (attempts.isBlocked(key)) {
            throw new TooManyAttemptsException();
        }
        try {
            authenticationManager.authenticate(UsernamePasswordAuthenticationToken.unauthenticated(username, password));
        } catch (InternalAuthenticationServiceException e) {
            // The user table could not be read: this is a server error, not a wrong password.
            throw e;
        } catch (AuthenticationException e) {
            attempts.recordFailure(key);
            throw new InvalidGrantException();
        }
        AppUser user = users.findByUsername(username).orElseThrow(InvalidGrantException::new);
        attempts.reset(key);

        Instant now = clock.instant();
        refreshTokens.deleteExpired(now);
        return issue(user, now);
    }

    /** Spends the refresh token and answers with a new pair. The old refresh token cannot be used again. */
    public TokenResponse refresh(String refreshToken) {
        if (isBlank(refreshToken)) {
            throw new InvalidGrantException();
        }
        String hash = RefreshTokens.hash(refreshToken);
        Instant now = clock.instant();
        long userId = refreshTokens.findActiveUserId(hash, now).orElseThrow(InvalidGrantException::new);
        AppUser user = users.findById(userId).filter(AppUser::enabled).orElseThrow(InvalidGrantException::new);
        // A concurrent request may have spent the same token between the lookup and this point.
        if (refreshTokens.revokeIfActive(hash, now) == 0) {
            throw new InvalidGrantException();
        }
        return issue(user, now);
    }

    /** Revokes the refresh token when it is known. The caller always gets the same answer. */
    public void logout(String refreshToken) {
        if (isBlank(refreshToken)) {
            return;
        }
        refreshTokens.revokeIfActive(RefreshTokens.hash(refreshToken), clock.instant());
    }

    private TokenResponse issue(AppUser user, Instant now) {
        String accessToken = accessTokens.issue(user, now);
        String refreshToken = RefreshTokens.generate();
        refreshTokens.insert(user.id(), RefreshTokens.hash(refreshToken), now.plus(REFRESH_LIFETIME));
        return new TokenResponse(accessToken, refreshToken, "Bearer",
                AccessTokenIssuer.LIFETIME.toSeconds(), user.displayName(), user.role().name());
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
