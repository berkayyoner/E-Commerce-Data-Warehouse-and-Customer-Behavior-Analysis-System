-- Bookkeeping tables used by the ETL service.
WHENEVER SQLERROR EXIT FAILURE ROLLBACK;

CREATE TABLE etl_run (
    run_id          NUMBER        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    run_type        VARCHAR2(12)  NOT NULL CHECK (run_type IN ('FULL', 'INCREMENTAL')),
    status          VARCHAR2(10)  NOT NULL CHECK (status IN ('RUNNING', 'SUCCESS', 'FAILED')),
    started_at      TIMESTAMP     NOT NULL,
    finished_at     TIMESTAMP,
    rows_read       NUMBER        DEFAULT 0 NOT NULL,
    rows_loaded     NUMBER        DEFAULT 0 NOT NULL,
    rows_rejected   NUMBER        DEFAULT 0 NOT NULL,
    error_message   VARCHAR2(2000)
);

CREATE TABLE etl_step (
    step_id         NUMBER        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    run_id          NUMBER        NOT NULL REFERENCES etl_run (run_id),
    step_name       VARCHAR2(40)  NOT NULL,
    rows_read       NUMBER        DEFAULT 0 NOT NULL,
    rows_loaded     NUMBER        DEFAULT 0 NOT NULL,
    duration_ms     NUMBER        DEFAULT 0 NOT NULL
);

-- The highest order date that has been loaded; the next incremental run starts after it.
CREATE TABLE etl_watermark (
    source_name     VARCHAR2(30)  PRIMARY KEY,
    last_value      DATE          NOT NULL,
    updated_at      TIMESTAMP     NOT NULL
);

CREATE TABLE etl_quality_result (
    check_id        NUMBER        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    run_id          NUMBER        NOT NULL REFERENCES etl_run (run_id),
    check_name      VARCHAR2(60)  NOT NULL,
    passed          CHAR(1)       NOT NULL CHECK (passed IN ('Y', 'N')),
    detail          VARCHAR2(400)
);
