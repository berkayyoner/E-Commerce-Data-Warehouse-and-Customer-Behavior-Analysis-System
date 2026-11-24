package edu.yildiz.ecommerce.auth.token;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import edu.yildiz.ecommerce.auth.token.TokenDtos.TokenResponse;
import edu.yildiz.ecommerce.auth.user.AppUser;
import edu.yildiz.ecommerce.auth.user.Role;
import edu.yildiz.ecommerce.auth.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;

class TokenServiceTest {

    private static final Instant NOW = Instant.parse("2026-11-24T10:00:00Z");

    private final AuthenticationManager authenticationManager = mock(AuthenticationManager.class);
    private final UserRepository users = mock(UserRepository.class);
    private final RefreshTokenRepository refreshTokens = mock(RefreshTokenRepository.class);
    private final AccessTokenIssuer accessTokens = mock(AccessTokenIssuer.class);
    private final Clock clock = Clock.fixed(NOW, ZoneOffset.UTC);
    private final LoginAttemptLimiter attempts = new LoginAttemptLimiter(clock);
    private final TokenService service = new TokenService(authenticationManager, users, refreshTokens,
            accessTokens, attempts, clock);

    private static AppUser user(long id, String username, Role role, boolean enabled) {
        return new AppUser(id, username, "hash", "Alice Demir", null, role, enabled, NOW);
    }

    private void knownUser(AppUser user) {
        when(users.findByUsername(user.username())).thenReturn(Optional.of(user));
        when(users.findById(user.id())).thenReturn(Optional.of(user));
        when(accessTokens.issue(any(), any())).thenReturn("access-jwt");
    }

    @Test
    void loginAnswersWithTokensAndStoresOnlyTheHashOfTheRefreshToken() {
        knownUser(user(7, "alice", Role.ANALYST, true));

        TokenResponse response = service.login("alice", "secret-pass", "10.0.0.1");

        assertThat(response.accessToken()).isEqualTo("access-jwt");
        assertThat(response.tokenType()).isEqualTo("Bearer");
        assertThat(response.expiresIn()).isEqualTo(900);
        assertThat(response.displayName()).isEqualTo("Alice Demir");
        assertThat(response.role()).isEqualTo("ANALYST");
        ArgumentCaptor<String> hash = ArgumentCaptor.forClass(String.class);
        verify(refreshTokens).insert(eq(7L), hash.capture(), eq(NOW.plus(Duration.ofHours(8))));
        assertThat(hash.getValue()).isEqualTo(RefreshTokens.hash(response.refreshToken()))
                .isNotEqualTo(response.refreshToken());
        verify(refreshTokens).deleteExpired(NOW);
    }

    @Test
    void wrongPasswordIsAnsweredWithInvalidGrant() {
        knownUser(user(7, "alice", Role.ANALYST, true));
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("bad"));

        assertThatThrownBy(() -> service.login("alice", "wrong", "10.0.0.1"))
                .isInstanceOf(InvalidGrantException.class);

        verify(refreshTokens, never()).insert(anyLong(), anyString(), any());
    }

    @Test
    void disabledUserIsAnsweredWithInvalidGrant() {
        when(authenticationManager.authenticate(any())).thenThrow(new DisabledException("disabled"));

        assertThatThrownBy(() -> service.login("alice", "secret-pass", "10.0.0.1"))
                .isInstanceOf(InvalidGrantException.class);
    }

    @Test
    void fiveFailuresLockTheUserAndAddressEvenForTheRightPassword() {
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("bad"));
        for (int i = 0; i < 5; i++) {
            assertThatThrownBy(() -> service.login("alice", "wrong", "10.0.0.1"))
                    .isInstanceOf(InvalidGrantException.class);
        }

        assertThatThrownBy(() -> service.login("alice", "secret-pass", "10.0.0.1"))
                .isInstanceOf(TooManyAttemptsException.class);

        verify(authenticationManager, times(5)).authenticate(any());
    }

    @Test
    void theLockoutDoesNotApplyToAnotherAddress() {
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("bad"));
        for (int i = 0; i < 5; i++) {
            assertThatThrownBy(() -> service.login("alice", "wrong", "10.0.0.1"))
                    .isInstanceOf(InvalidGrantException.class);
        }
        knownUser(user(7, "alice", Role.ANALYST, true));
        doReturn(null).when(authenticationManager).authenticate(any());

        assertThat(service.login("alice", "secret-pass", "10.0.0.2").accessToken()).isEqualTo("access-jwt");
    }

    @Test
    void refreshRotatesTheTokenAndRevokesTheOldOne() {
        knownUser(user(7, "alice", Role.ANALYST, true));
        when(refreshTokens.findActiveUserId(eq(RefreshTokens.hash("old-token")), eq(NOW))).thenReturn(Optional.of(7L));
        when(refreshTokens.revokeIfActive(RefreshTokens.hash("old-token"), NOW)).thenReturn(1);

        TokenResponse response = service.refresh("old-token");

        assertThat(response.refreshToken()).isNotEqualTo("old-token");
        verify(refreshTokens).revokeIfActive(RefreshTokens.hash("old-token"), NOW);
        verify(refreshTokens).insert(eq(7L), eq(RefreshTokens.hash(response.refreshToken())), any());
    }

    @Test
    void unknownExpiredOrRevokedRefreshTokenIsAnsweredWithInvalidGrant() {
        when(refreshTokens.findActiveUserId(anyString(), any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.refresh("gone")).isInstanceOf(InvalidGrantException.class);

        verify(refreshTokens, never()).revokeIfActive(anyString(), any());
        verify(refreshTokens, never()).insert(anyLong(), anyString(), any());
    }

    @Test
    void refreshTokenSpentByAConcurrentRequestIsRefused() {
        knownUser(user(7, "alice", Role.ANALYST, true));
        when(refreshTokens.findActiveUserId(anyString(), any())).thenReturn(Optional.of(7L));
        when(refreshTokens.revokeIfActive(anyString(), any())).thenReturn(0);

        assertThatThrownBy(() -> service.refresh("old-token")).isInstanceOf(InvalidGrantException.class);

        verify(refreshTokens, never()).insert(anyLong(), anyString(), any());
    }

    @Test
    void refreshIsRefusedForADisabledUser() {
        knownUser(user(7, "alice", Role.ANALYST, false));
        when(refreshTokens.findActiveUserId(anyString(), any())).thenReturn(Optional.of(7L));

        assertThatThrownBy(() -> service.refresh("old-token")).isInstanceOf(InvalidGrantException.class);

        verify(refreshTokens, never()).revokeIfActive(anyString(), any());
    }

    @Test
    void logoutRevokesTheKnownRefreshToken() {
        service.logout("old-token");

        verify(refreshTokens).revokeIfActive(RefreshTokens.hash("old-token"), NOW);
    }

    @Test
    void logoutWithoutATokenDoesNothing() {
        service.logout(null);
        service.logout("  ");

        verifyNoInteractions(refreshTokens);
    }
}
