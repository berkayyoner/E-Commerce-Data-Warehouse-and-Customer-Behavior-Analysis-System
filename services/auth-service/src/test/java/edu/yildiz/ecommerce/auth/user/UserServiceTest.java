package edu.yildiz.ecommerce.auth.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import edu.yildiz.ecommerce.auth.user.UserDtos.CreateUserRequest;
import edu.yildiz.ecommerce.auth.user.UserDtos.PageResult;
import edu.yildiz.ecommerce.auth.user.UserDtos.UpdateUserRequest;
import edu.yildiz.ecommerce.auth.user.UserDtos.UserView;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

class UserServiceTest {

    private final UserRepository users = mock(UserRepository.class);
    private final PasswordEncoder encoder = new BCryptPasswordEncoder(4);
    private final UserService service = new UserService(users, encoder);

    private static AppUser user(long id, String username, Role role, boolean enabled) {
        return new AppUser(id, username, "hash", username + " name", null, role, enabled, Instant.parse("2026-11-23T10:00:00Z"));
    }

    @Test
    void createStoresAHashedPassword() {
        when(users.findByUsername("mert")).thenReturn(Optional.empty());
        when(users.insert(eq("mert"), anyString(), eq("Mert Kaya"), isNull(), eq(Role.ANALYST))).thenReturn(5L);
        when(users.findById(5L)).thenReturn(Optional.of(user(5, "mert", Role.ANALYST, true)));

        UserView created = service.create(new CreateUserRequest(" mert ", "secret-pass", "Mert Kaya", " ", Role.ANALYST));

        assertThat(created.username()).isEqualTo("mert");
        verify(users).insert(eq("mert"), org.mockito.ArgumentMatchers.argThat(hash ->
                !hash.equals("secret-pass") && encoder.matches("secret-pass", hash)), eq("Mert Kaya"), isNull(), eq(Role.ANALYST));
    }

    @Test
    void createRefusesATakenUsername() {
        when(users.findByUsername("mert")).thenReturn(Optional.of(user(1, "mert", Role.VIEWER, true)));

        assertThatThrownBy(() -> service.create(new CreateUserRequest("mert", "secret-pass", "Mert", null, Role.VIEWER)))
                .isInstanceOf(UsernameTakenException.class);

        verify(users, never()).insert(anyString(), anyString(), anyString(), any(), any());
    }

    @Test
    void updateKeepsThePasswordWhenNoneIsSent() {
        when(users.findById(2L)).thenReturn(Optional.of(user(2, "ayse", Role.VIEWER, true)));

        service.update(2L, new UpdateUserRequest("Ayse Demir", null, Role.ANALYST, true, null), "admin");

        verify(users).update(2L, "Ayse Demir", null, Role.ANALYST, true, null);
    }

    @Test
    void theLastActiveAdministratorCannotBeDemoted() {
        when(users.findById(1L)).thenReturn(Optional.of(user(1, "boss", Role.ADMIN, true)));
        when(users.countEnabledAdmins()).thenReturn(1L);

        assertThatThrownBy(() -> service.update(1L, new UpdateUserRequest("Boss", null, Role.VIEWER, true, null), "other"))
                .isInstanceOf(InvalidUserOperationException.class);

        verify(users, never()).update(anyLong(), anyString(), any(), any(), anyBoolean(), any());
    }

    @Test
    void anAdministratorCanBeDemotedWhenAnotherOneExists() {
        when(users.findById(1L)).thenReturn(Optional.of(user(1, "boss", Role.ADMIN, true)));
        when(users.countEnabledAdmins()).thenReturn(2L);

        service.update(1L, new UpdateUserRequest("Boss", null, Role.ANALYST, true, null), "other");

        verify(users).update(1L, "Boss", null, Role.ANALYST, true, null);
    }

    @Test
    void usersCannotDisableOrDeleteThemselves() {
        when(users.findById(3L)).thenReturn(Optional.of(user(3, "sibel", Role.ANALYST, true)));

        assertThatThrownBy(() -> service.update(3L, new UpdateUserRequest("Sibel", null, Role.ANALYST, false, null), "Sibel"))
                .isInstanceOf(InvalidUserOperationException.class);
        assertThatThrownBy(() -> service.delete(3L, "sibel")).isInstanceOf(InvalidUserOperationException.class);
    }

    @Test
    void deleteRemovesAnotherUser() {
        when(users.findById(4L)).thenReturn(Optional.of(user(4, "kemal", Role.VIEWER, true)));

        service.delete(4L, "admin");

        verify(users).delete(4L);
    }

    @Test
    void getFailsForAnUnknownUser() {
        when(users.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.get(99L)).isInstanceOf(UserNotFoundException.class);
    }

    @Test
    void searchLimitsThePageAndHidesPasswordHashes() {
        when(users.search("", "username", true, 0, 100)).thenReturn(List.of(user(1, "a", Role.VIEWER, true)));
        when(users.count("")).thenReturn(1L);

        PageResult<UserView> page = service.search("", "username", true, -2, 1000);

        assertThat(page.size()).isEqualTo(100);
        assertThat(page.content()).hasSize(1);
        assertThat(page.content().get(0).toString()).doesNotContain("hash");
    }
}
