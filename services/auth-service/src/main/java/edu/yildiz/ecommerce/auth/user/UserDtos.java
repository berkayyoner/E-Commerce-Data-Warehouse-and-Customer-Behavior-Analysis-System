package edu.yildiz.ecommerce.auth.user;

import java.time.Instant;
import java.util.List;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Request and response shapes of the user API. */
public final class UserDtos {

    private UserDtos() {
    }

    /** What the API shows about a user. The password hash never leaves the service. */
    public record UserView(long id, String username, String displayName, String email, Role role, boolean enabled,
                           Instant createdAt) {

        public static UserView of(AppUser user) {
            return new UserView(user.id(), user.username(), user.displayName(), user.email(), user.role(),
                    user.enabled(), user.createdAt());
        }
    }

    public record CreateUserRequest(
            @NotBlank @Size(min = 3, max = 60) @Pattern(regexp = "[A-Za-z0-9._-]+") String username,
            @NotBlank @Size(min = 8, max = 72) String password,
            @NotBlank @Size(max = 100) String displayName,
            @Email @Size(max = 120) String email,
            @NotNull Role role) {
    }

    /** The password is optional: it is only changed when one is sent. */
    public record UpdateUserRequest(
            @NotBlank @Size(max = 100) String displayName,
            @Email @Size(max = 120) String email,
            @NotNull Role role,
            boolean enabled,
            @Size(min = 8, max = 72) String password) {
    }

    public record CurrentUser(String username, List<String> roles) {
    }

    public record PageResult<T>(List<T> content, long total, int page, int size) {
    }
}
