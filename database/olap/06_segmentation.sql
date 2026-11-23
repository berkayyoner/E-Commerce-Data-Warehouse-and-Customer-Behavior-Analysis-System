-- Customer segmentation results (RFM scores, RFM segments and K-Means clusters). Run as DWH_OLAP.
-- The segmentation service writes these tables; the report API and the personnel portal read them.
WHENEVER SQLERROR EXIT FAILURE ROLLBACK;

-- One row per segmentation run. etl_run_id is the newest successful ETL run the scores are based on.
CREATE TABLE segmentation_run (
    run_id            NUMBER        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    status            VARCHAR2(10)  NOT NULL CHECK (status IN ('RUNNING', 'SUCCESS', 'FAILED')),
    started_at        TIMESTAMP     NOT NULL,
    finished_at       TIMESTAMP,
    etl_run_id        NUMBER        NOT NULL,
    as_of_date        DATE          NOT NULL,           -- recency is counted up to this day
    customers_scored  NUMBER        DEFAULT 0 NOT NULL,
    chosen_k          NUMBER(2),
    error_message     VARCHAR2(2000)
);

-- Inertia of the K-Means model for every tried k; the elbow of this curve picks the number of clusters.
CREATE TABLE kmeans_elbow (
    run_id            NUMBER        NOT NULL REFERENCES segmentation_run (run_id),
    k                 NUMBER(2)     NOT NULL,
    inertia           NUMBER        NOT NULL,
    CONSTRAINT pk_kmeans_elbow PRIMARY KEY (run_id, k)
);

-- Average behaviour of every cluster of a run.
CREATE TABLE kmeans_cluster (
    run_id            NUMBER        NOT NULL REFERENCES segmentation_run (run_id),
    cluster_id        NUMBER(2)     NOT NULL,
    label             VARCHAR2(40)  NOT NULL,
    customers         NUMBER        NOT NULL,
    avg_recency_days  NUMBER(8,2)   NOT NULL,
    avg_frequency     NUMBER(8,2)   NOT NULL,
    avg_monetary      NUMBER(14,2)  NOT NULL,
    CONSTRAINT pk_kmeans_cluster PRIMARY KEY (run_id, cluster_id)
);

-- The current segment of every customer who has ordered. A new run replaces the rows of the previous one.
CREATE TABLE customer_segment (
    source_w_id       NUMBER        NOT NULL,
    source_d_id       NUMBER        NOT NULL,
    source_c_id       NUMBER        NOT NULL,
    run_id            NUMBER        NOT NULL REFERENCES segmentation_run (run_id),
    recency_days      NUMBER        NOT NULL,
    frequency         NUMBER        NOT NULL,
    monetary          NUMBER(14,2)  NOT NULL,
    r_score           NUMBER(1)     NOT NULL,
    f_score           NUMBER(1)     NOT NULL,
    m_score           NUMBER(1)     NOT NULL,
    rfm_segment       VARCHAR2(30)  NOT NULL,
    cluster_id        NUMBER(2),
    CONSTRAINT pk_customer_segment PRIMARY KEY (source_w_id, source_d_id, source_c_id)
);
CREATE INDEX idx_customer_segment_rfm ON customer_segment (rfm_segment);
CREATE INDEX idx_customer_segment_cluster ON customer_segment (cluster_id);
