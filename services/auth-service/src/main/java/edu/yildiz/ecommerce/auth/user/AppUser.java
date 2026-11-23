package edu.yildiz.ecommerce.auth.user;

import java.time.Instant;

/** A row of the app_user table. */
public record AppUser(
        long id,
        String username,
        String passwordHash,
        String displayName,
        String email,
        Role role,
        boolean enabled,
        Instant createdAt) {
}
