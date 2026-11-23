package edu.yildiz.ecommerce.auth.user;

import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

@Repository
public class UserRepository {

    /** Sort names accepted from the API and the column each one stands for. */
    private static final Map<String, String> SORT_COLUMNS = Map.of(
            "username", "username",
            "displayName", "display_name",
            "email", "email",
            "role", "role",
            "enabled", "enabled",
            "createdAt", "created_at");

    private static final RowMapper<AppUser> MAPPER = (rs, rowNum) -> new AppUser(
            rs.getLong("user_id"),
            rs.getString("username"),
            rs.getString("password_hash"),
            rs.getString("display_name"),
            rs.getString("email"),
            Role.valueOf(rs.getString("role")),
            "Y".equals(rs.getString("enabled")),
            rs.getTimestamp("created_at").toInstant());

    private final JdbcTemplate jdbc;

    public UserRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<AppUser> findById(long id) {
        return jdbc.query("SELECT * FROM app_user WHERE user_id = ?", MAPPER, id).stream().findFirst();
    }

    public Optional<AppUser> findByUsername(String username) {
        return jdbc.query("SELECT * FROM app_user WHERE LOWER(username) = LOWER(?)", MAPPER, username)
                .stream().findFirst();
    }

    /** One page of users. The search text is matched against user name, display name and e-mail. */
    public List<AppUser> search(String text, String sort, boolean ascending, int page, int size) {
        String column = SORT_COLUMNS.getOrDefault(sort, "username");
        String direction = ascending ? "ASC" : "DESC";
        String pattern = likePattern(text);
        return jdbc.query("""
                SELECT * FROM app_user
                 WHERE LOWER(username) LIKE ? ESCAPE '\\' OR LOWER(display_name) LIKE ? ESCAPE '\\'
                    OR LOWER(NVL(email, '')) LIKE ? ESCAPE '\\'
                 ORDER BY %s %s, user_id OFFSET ? ROWS FETCH NEXT ? ROWS ONLY""".formatted(column, direction),
                MAPPER, pattern, pattern, pattern, (long) page * size, size);
    }

    public long count(String text) {
        String pattern = likePattern(text);
        Long total = jdbc.queryForObject("""
                SELECT COUNT(*) FROM app_user
                 WHERE LOWER(username) LIKE ? ESCAPE '\\' OR LOWER(display_name) LIKE ? ESCAPE '\\'
                    OR LOWER(NVL(email, '')) LIKE ? ESCAPE '\\'""", Long.class, pattern, pattern, pattern);
        return total == null ? 0 : total;
    }

    public long countAll() {
        Long total = jdbc.queryForObject("SELECT COUNT(*) FROM app_user", Long.class);
        return total == null ? 0 : total;
    }

    public long countEnabledAdmins() {
        Long total = jdbc.queryForObject(
                "SELECT COUNT(*) FROM app_user WHERE role = 'ADMIN' AND enabled = 'Y'", Long.class);
        return total == null ? 0 : total;
    }

    public long insert(String username, String passwordHash, String displayName, String email, Role role) {
        KeyHolder keys = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                    INSERT INTO app_user (username, password_hash, display_name, email, role, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)""", new String[] {"USER_ID"});
            statement.setString(1, username);
            statement.setString(2, passwordHash);
            statement.setString(3, displayName);
            statement.setString(4, email);
            statement.setString(5, role.name());
            statement.setTimestamp(6, Timestamp.from(java.time.Instant.now()));
            return statement;
        }, keys);
        return keys.getKey().longValue();
    }

    /** A null password hash keeps the stored password. */
    public void update(long id, String displayName, String email, Role role, boolean enabled, String passwordHash) {
        jdbc.update("""
                UPDATE app_user
                   SET display_name = ?, email = ?, role = ?, enabled = ?, password_hash = NVL(?, password_hash)
                 WHERE user_id = ?""", displayName, email, role.name(), enabled ? "Y" : "N", passwordHash, id);
    }

    public void delete(long id) {
        jdbc.update("DELETE FROM app_user WHERE user_id = ?", id);
    }

    /** Turns the search text into a LIKE pattern in which the user's own % and _ characters are literal. */
    private static String likePattern(String text) {
        String value = text == null ? "" : text.trim().toLowerCase();
        String escaped = value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
        return "%" + escaped + "%";
    }
}
