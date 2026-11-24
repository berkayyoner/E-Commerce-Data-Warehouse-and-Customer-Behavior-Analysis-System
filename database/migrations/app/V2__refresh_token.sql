-- Refresh tokens issued by the token API. Only the SHA-256 hash of each token is stored. Run as DWH_APP.

CREATE TABLE refresh_token (
    token_id        NUMBER        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id         NUMBER        NOT NULL,
    token_hash      VARCHAR2(64)  NOT NULL UNIQUE,
    expires_at      TIMESTAMP     NOT NULL,
    revoked         CHAR(1)       DEFAULT 'N' NOT NULL CHECK (revoked IN ('Y', 'N')),
    created_at      TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL,
    CONSTRAINT fk_refresh_token_user FOREIGN KEY (user_id) REFERENCES app_user (user_id) ON DELETE CASCADE
);
