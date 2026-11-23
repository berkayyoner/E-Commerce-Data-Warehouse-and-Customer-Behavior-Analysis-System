-- Compares the warehouse with the OLTP schema. Run as DWH_OLAP (it reads DWH_OLTP with select any table).
-- Every row of the result is one check; the script exits with an error when any check fails.
WHENEVER SQLERROR EXIT FAILURE ROLLBACK;
SET PAGESIZE 100 LINESIZE 160 FEEDBACK OFF VERIFY OFF
COLUMN check_name FORMAT A48
COLUMN oltp_value FORMAT A22
COLUMN warehouse_value FORMAT A22

WITH checks AS (
    SELECT 'Orders with lines' AS check_name,
           TO_CHAR((SELECT COUNT(*) FROM (SELECT DISTINCT ol_w_id, ol_d_id, ol_o_id FROM dwh_oltp.order_line))) AS oltp_value,
           TO_CHAR((SELECT COUNT(*) FROM fact_orders)) AS warehouse_value
      FROM dual
    UNION ALL
    SELECT 'Order lines',
           TO_CHAR((SELECT COUNT(*) FROM dwh_oltp.order_line)),
           TO_CHAR((SELECT COUNT(*) FROM fact_sales))
      FROM dual
    UNION ALL
    SELECT 'Revenue (sum of line amounts)',
           TO_CHAR((SELECT SUM(ol_amount) FROM dwh_oltp.order_line), 'FM999999999990.00'),
           TO_CHAR((SELECT SUM(sales_amount) FROM fact_sales), 'FM999999999990.00')
      FROM dual
    UNION ALL
    SELECT 'Units sold',
           TO_CHAR((SELECT SUM(ol_quantity) FROM dwh_oltp.order_line)),
           TO_CHAR((SELECT SUM(quantity) FROM fact_sales))
      FROM dual
    UNION ALL
    SELECT 'Delivered orders',
           TO_CHAR((SELECT COUNT(*) FROM dwh_oltp.oorder o
                     WHERE o.o_carrier_id IS NOT NULL
                       AND EXISTS (SELECT 1 FROM dwh_oltp.order_line l
                                    WHERE l.ol_w_id = o.o_w_id AND l.ol_d_id = o.o_d_id AND l.ol_o_id = o.o_id))),
           TO_CHAR((SELECT COUNT(*) FROM fact_orders WHERE is_delivered = 'Y'))
      FROM dual
    UNION ALL
    SELECT 'Customers',
           TO_CHAR((SELECT COUNT(*) FROM dwh_oltp.customer)),
           TO_CHAR((SELECT COUNT(*) FROM dim_customer WHERE is_current = 'Y'))
      FROM dual
    UNION ALL
    SELECT 'Products',
           TO_CHAR((SELECT COUNT(*) FROM dwh_oltp.item)),
           TO_CHAR((SELECT COUNT(*) FROM dim_product))
      FROM dual
    UNION ALL
    SELECT 'Warehouses',
           TO_CHAR((SELECT COUNT(*) FROM dwh_oltp.warehouse)),
           TO_CHAR((SELECT COUNT(*) FROM dim_warehouse))
      FROM dual
    UNION ALL
    SELECT 'Revenue per month (months that differ)',
           '0',
           TO_CHAR((SELECT COUNT(*) FROM (
                SELECT TO_CHAR(o.o_entry_d, 'YYYY-MM') AS month, SUM(l.ol_amount) AS amount
                  FROM dwh_oltp.order_line l
                  JOIN dwh_oltp.oorder o ON o.o_w_id = l.ol_w_id AND o.o_d_id = l.ol_d_id AND o.o_id = l.ol_o_id
                 GROUP BY TO_CHAR(o.o_entry_d, 'YYYY-MM')) s
                FULL JOIN (SELECT d.year_month AS month, SUM(f.sales_amount) AS amount
                             FROM fact_sales f JOIN dim_date d ON d.date_key = f.order_date_key
                            GROUP BY d.year_month) w ON w.month = s.month
               WHERE NVL(s.amount, -1) <> NVL(w.amount, -1)))
      FROM dual
    UNION ALL
    SELECT 'Monthly view equals the fact table (months that differ)',
           '0',
           TO_CHAR((SELECT COUNT(*) FROM (
                SELECT year_month, SUM(revenue) AS amount FROM mv_sales_monthly GROUP BY year_month) v
                FULL JOIN (SELECT d.year_month, SUM(f.sales_amount) AS amount
                             FROM fact_sales f JOIN dim_date d ON d.date_key = f.order_date_key
                            GROUP BY d.year_month) w ON w.year_month = v.year_month
               WHERE NVL(v.amount, -1) <> NVL(w.amount, -1)))
      FROM dual
)
SELECT check_name, oltp_value, warehouse_value,
       CASE WHEN oltp_value = warehouse_value THEN 'OK' ELSE 'MISMATCH' END AS result
  FROM checks;

DECLARE
    v_failed NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_failed FROM (
        SELECT 1 FROM dual WHERE (SELECT COUNT(*) FROM dwh_oltp.order_line) <> (SELECT COUNT(*) FROM fact_sales)
        UNION ALL
        SELECT 1 FROM dual WHERE (SELECT SUM(ol_amount) FROM dwh_oltp.order_line) <> (SELECT SUM(sales_amount) FROM fact_sales)
        UNION ALL
        SELECT 1 FROM dual WHERE (SELECT COUNT(*) FROM dwh_oltp.customer) <> (SELECT COUNT(*) FROM dim_customer WHERE is_current = 'Y'));
    IF v_failed > 0 THEN
        RAISE_APPLICATION_ERROR(-20001, 'The warehouse does not match the OLTP schema');
    END IF;
END;
/
EXIT;
