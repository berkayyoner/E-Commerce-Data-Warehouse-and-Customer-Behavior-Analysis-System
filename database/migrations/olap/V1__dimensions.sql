-- Dimension tables of the star schema. Run as DWH_OLAP.

-- Date dimension: one row per day, filled by 04_load_dim_date.sql.
CREATE TABLE dim_date (
    date_key        NUMBER(8)     PRIMARY KEY,          -- 20260131
    full_date       DATE          NOT NULL UNIQUE,
    day_of_month    NUMBER(2)     NOT NULL,
    day_of_week     NUMBER(1)     NOT NULL,             -- 1 = Monday ... 7 = Sunday
    day_name        VARCHAR2(10)  NOT NULL,
    week_of_year    NUMBER(2)     NOT NULL,
    month_number    NUMBER(2)     NOT NULL,
    month_name      VARCHAR2(10)  NOT NULL,
    quarter_number  NUMBER(1)     NOT NULL,
    year_number     NUMBER(4)     NOT NULL,
    year_month      VARCHAR2(7)   NOT NULL,             -- 2026-01
    is_weekend      CHAR(1)       NOT NULL CHECK (is_weekend IN ('Y', 'N'))
);

-- Customer dimension. Slowly changing (type 2): when the region or city of a customer changes the
-- current row is closed and a new row is added, so old sales keep the region they were made in.
CREATE TABLE dim_customer (
    customer_key    NUMBER        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    source_w_id     NUMBER        NOT NULL,
    source_d_id     NUMBER        NOT NULL,
    source_c_id     NUMBER        NOT NULL,
    first_name      VARCHAR2(16)  NOT NULL,
    last_name       VARCHAR2(16)  NOT NULL,
    email           VARCHAR2(60),
    city            VARCHAR2(20),
    region          VARCHAR2(30)  NOT NULL,
    credit_rating   CHAR(2)       NOT NULL,             -- GC good credit, BC bad credit
    registered_date DATE          NOT NULL,
    valid_from      DATE          NOT NULL,
    valid_to        DATE          DEFAULT DATE '9999-12-31' NOT NULL,
    is_current      CHAR(1)       DEFAULT 'Y' NOT NULL CHECK (is_current IN ('Y', 'N'))
);
CREATE INDEX idx_dim_customer_source ON dim_customer (source_w_id, source_d_id, source_c_id, is_current);

-- Product dimension (type 1: changes overwrite the row).
CREATE TABLE dim_product (
    product_key     NUMBER        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    source_item_id  NUMBER        NOT NULL UNIQUE,
    product_name    VARCHAR2(24)  NOT NULL,
    category        VARCHAR2(30)  NOT NULL,
    brand           VARCHAR2(30)  NOT NULL,
    list_price      NUMBER(7,2)   NOT NULL,
    price_band      VARCHAR2(10)  NOT NULL CHECK (price_band IN ('Budget', 'Standard', 'Premium'))
);

-- Warehouse dimension: the shop or fulfilment centre that handled the order.
CREATE TABLE dim_warehouse (
    warehouse_key   NUMBER        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    source_w_id     NUMBER        NOT NULL UNIQUE,
    warehouse_name  VARCHAR2(10)  NOT NULL,
    city            VARCHAR2(20)  NOT NULL,
    region          VARCHAR2(30)  NOT NULL
);

CREATE TABLE dim_payment_method (
    payment_key     NUMBER        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    payment_method  VARCHAR2(20)  NOT NULL UNIQUE,
    is_online       CHAR(1)       NOT NULL CHECK (is_online IN ('Y', 'N'))
);

INSERT INTO dim_payment_method (payment_method, is_online) VALUES ('CREDIT_CARD', 'Y');
INSERT INTO dim_payment_method (payment_method, is_online) VALUES ('BANK_TRANSFER', 'Y');
INSERT INTO dim_payment_method (payment_method, is_online) VALUES ('WALLET', 'Y');
INSERT INTO dim_payment_method (payment_method, is_online) VALUES ('CASH_ON_DELIVERY', 'N');
COMMIT;
