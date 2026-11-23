-- Pre-aggregated sales per month, category and warehouse. The report API reads it for the monthly
-- views, the ETL service refreshes it after every load. Run as DWH_OLAP after the facts exist.

CREATE MATERIALIZED VIEW mv_sales_monthly
    BUILD IMMEDIATE
    REFRESH COMPLETE ON DEMAND
AS
SELECT d.year_month,
       d.year_number,
       d.month_number,
       p.category,
       w.region    AS warehouse_region,
       w.city      AS warehouse_city,
       SUM(f.sales_amount) AS revenue,
       SUM(f.quantity)     AS units,
       COUNT(*)            AS line_count
  FROM fact_sales f
  JOIN dim_date d      ON d.date_key = f.order_date_key
  JOIN dim_product p   ON p.product_key = f.product_key
  JOIN dim_warehouse w ON w.warehouse_key = f.warehouse_key
 GROUP BY d.year_month, d.year_number, d.month_number, p.category, w.region, w.city;

CREATE INDEX idx_mv_sales_monthly_period ON mv_sales_monthly (year_month);
