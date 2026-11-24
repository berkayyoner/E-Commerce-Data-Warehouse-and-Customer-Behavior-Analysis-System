package edu.yildiz.ecommerce.auth.token;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
class RefreshTokenRepository {

    private final JdbcTemplate jdbc;

    RefreshTokenRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    void insert(long userId, String tokenHash, Instant expiresAt) {
        jdbc.update("INSERT INTO refresh_token (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
                userId, tokenHash, Timestamp.from(expiresAt));
    }

    /** The owner of a token that is neither revoked nor expired. */
    Optional<Long> findActiveUserId(String tokenHash, Instant now) {
        return jdbc.query("""
                SELECT user_id FROM refresh_token
                 WHERE token_hash = ? AND revoked = 'N' AND expires_at > ?""",
                (rs, rowNum) -> rs.getLong("user_id"), tokenHash, Timestamp.from(now)).stream().findFirst();
    }

    /** Revokes the token only while it is still active, so a token can be spent once. Returns the rows changed. */
    int revokeIfActive(String tokenHash, Instant now) {
        return jdbc.update("""
                UPDATE refresh_token SET revoked = 'Y'
                 WHERE token_hash = ? AND revoked = 'N' AND expires_at > ?""",
                tokenHash, Timestamp.from(now));
    }

    int deleteExpired(Instant now) {
        return jdbc.update("DELETE FROM refresh_token WHERE expires_at <= ?", Timestamp.from(now));
    }
}
