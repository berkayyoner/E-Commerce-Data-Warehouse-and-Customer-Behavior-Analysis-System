-- Application tables (users and roles). Run as DWH_APP.
WHENEVER SQLERROR EXIT FAILURE ROLLBACK;

CREATE TABLE app_user (
    user_id         NUMBER        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username        VARCHAR2(60)  NOT NULL UNIQUE,
    password_hash   VARCHAR2(120) NOT NULL,
    display_name    VARCHAR2(100) NOT NULL,
    email           VARCHAR2(120),
    role            VARCHAR2(10)  NOT NULL CHECK (role IN ('ADMIN', 'ANALYST', 'VIEWER')),
    enabled         CHAR(1)       DEFAULT 'Y' NOT NULL CHECK (enabled IN ('Y', 'N')),
    created_at      TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL
);
