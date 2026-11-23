-- Fact tables of the star schema. The sales and order facts are range partitioned by order date.
WHENEVER SQLERROR EXIT FAILURE ROLLBACK;

-- Grain: one row per order line.
CREATE TABLE fact_sales (
    order_date_key      NUMBER(8)    NOT NULL REFERENCES dim_date (date_key),
    delivery_date_key   NUMBER(8)    REFERENCES dim_date (date_key),
    customer_key        NUMBER       NOT NULL REFERENCES dim_customer (customer_key),
    product_key         NUMBER       NOT NULL REFERENCES dim_product (product_key),
    warehouse_key       NUMBER       NOT NULL REFERENCES dim_warehouse (warehouse_key),
    payment_key         NUMBER       NOT NULL REFERENCES dim_payment_method (payment_key),
    order_w_id          NUMBER       NOT NULL,           -- degenerate dimension: the order number
    order_d_id          NUMBER       NOT NULL,
    order_id            NUMBER       NOT NULL,
    line_number         NUMBER       NOT NULL,
    quantity            NUMBER(3)    NOT NULL,
    sales_amount        NUMBER(8,2)  NOT NULL,
    delivery_days       NUMBER(3),                       -- null while the order is not delivered
    CONSTRAINT pk_fact_sales PRIMARY KEY (order_w_id, order_d_id, order_id, line_number, order_date_key)
)
PARTITION BY RANGE (order_date_key) (
    PARTITION p_2024 VALUES LESS THAN (20250101),
    PARTITION p_2025 VALUES LESS THAN (20260101),
    PARTITION p_2026 VALUES LESS THAN (20270101),
    PARTITION p_future VALUES LESS THAN (MAXVALUE)
);
CREATE BITMAP INDEX bix_fact_sales_product ON fact_sales (product_key) LOCAL;
CREATE BITMAP INDEX bix_fact_sales_warehouse ON fact_sales (warehouse_key) LOCAL;
CREATE BITMAP INDEX bix_fact_sales_payment ON fact_sales (payment_key) LOCAL;
CREATE INDEX idx_fact_sales_customer ON fact_sales (customer_key) LOCAL;

-- Grain: one row per order.
CREATE TABLE fact_orders (
    order_date_key      NUMBER(8)    NOT NULL REFERENCES dim_date (date_key),
    customer_key        NUMBER       NOT NULL REFERENCES dim_customer (customer_key),
    warehouse_key       NUMBER       NOT NULL REFERENCES dim_warehouse (warehouse_key),
    payment_key         NUMBER       NOT NULL REFERENCES dim_payment_method (payment_key),
    order_w_id          NUMBER       NOT NULL,
    order_d_id          NUMBER       NOT NULL,
    order_id            NUMBER       NOT NULL,
    line_count          NUMBER(3)    NOT NULL,
    item_quantity       NUMBER(5)    NOT NULL,
    order_amount        NUMBER(10,2) NOT NULL,
    is_delivered        CHAR(1)      NOT NULL CHECK (is_delivered IN ('Y', 'N')),
    CONSTRAINT pk_fact_orders PRIMARY KEY (order_w_id, order_d_id, order_id, order_date_key)
)
PARTITION BY RANGE (order_date_key) (
    PARTITION p_2024 VALUES LESS THAN (20250101),
    PARTITION p_2025 VALUES LESS THAN (20260101),
    PARTITION p_2026 VALUES LESS THAN (20270101),
    PARTITION p_future VALUES LESS THAN (MAXVALUE)
);
CREATE INDEX idx_fact_orders_customer ON fact_orders (customer_key) LOCAL;

-- Stock levels per warehouse and product, loaded as a snapshot on every ETL run.
CREATE TABLE fact_inventory_snapshot (
    snapshot_date_key   NUMBER(8)    NOT NULL REFERENCES dim_date (date_key),
    product_key         NUMBER       NOT NULL REFERENCES dim_product (product_key),
    warehouse_key       NUMBER       NOT NULL REFERENCES dim_warehouse (warehouse_key),
    quantity_on_hand    NUMBER(5)    NOT NULL,
    units_sold_ytd      NUMBER(10,2) NOT NULL,
    order_count         NUMBER       NOT NULL,
    CONSTRAINT pk_fact_inventory PRIMARY KEY (snapshot_date_key, product_key, warehouse_key)
);
