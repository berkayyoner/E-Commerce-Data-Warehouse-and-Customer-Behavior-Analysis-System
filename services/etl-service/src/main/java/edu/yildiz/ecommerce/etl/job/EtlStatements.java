package edu.yildiz.ecommerce.etl.job;

import java.util.List;

import edu.yildiz.ecommerce.etl.config.EtlProperties;
import org.springframework.stereotype.Component;

/**
 * SQL of the ETL job. The job runs inside Oracle as the warehouse user, which can read the OLTP schema,
 * so every step is one set based statement instead of a row by row copy.
 */
@Component
public class EtlStatements {

    /** A reconciliation check: both queries return one number and the numbers must be equal. */
    public record QualityCheck(String name, String expectedSql, String actualSql) {
    }

    private final String oltp;

    public EtlStatements(EtlProperties properties) {
        this.oltp = properties.oltpSchema();
    }

    public String truncateFactSales() {
        return "TRUNCATE TABLE fact_sales";
    }

    public String truncateFactOrders() {
        return "TRUNCATE TABLE fact_orders";
    }

    public String mergeWarehouses() {
        return """
                MERGE INTO dim_warehouse d
                USING (SELECT w_id, w_name, w_city, NVL(w_region, 'Unknown') AS w_region FROM %s.warehouse) s
                   ON (d.source_w_id = s.w_id)
                 WHEN MATCHED THEN UPDATE SET
                      d.warehouse_name = s.w_name, d.city = s.w_city, d.region = s.w_region
                      WHERE d.warehouse_name <> s.w_name OR d.city <> s.w_city OR d.region <> s.w_region
                 WHEN NOT MATCHED THEN INSERT (source_w_id, warehouse_name, city, region)
                      VALUES (s.w_id, s.w_name, s.w_city, s.w_region)
                """.formatted(oltp);
    }

    public String mergeProducts() {
        return """
                MERGE INTO dim_product d
                USING (SELECT i_id, i_name, i_price,
                              NVL(i_category, 'Uncategorized') AS category,
                              NVL(i_brand, 'Unbranded') AS brand,
                              CASE WHEN i_price < 30 THEN 'Budget' WHEN i_price < 70 THEN 'Standard' ELSE 'Premium' END AS band
                         FROM %s.item) s
                   ON (d.source_item_id = s.i_id)
                 WHEN MATCHED THEN UPDATE SET
                      d.product_name = s.i_name, d.category = s.category, d.brand = s.brand,
                      d.list_price = s.i_price, d.price_band = s.band
                      WHERE d.product_name <> s.i_name OR d.category <> s.category OR d.brand <> s.brand
                         OR d.list_price <> s.i_price
                 WHEN NOT MATCHED THEN INSERT (source_item_id, product_name, category, brand, list_price, price_band)
                      VALUES (s.i_id, s.i_name, s.category, s.brand, s.i_price, s.band)
                """.formatted(oltp);
    }

    /** Type 2 history, part one: close the current row of every customer whose city or region changed. */
    public String closeChangedCustomers() {
        return """
                UPDATE dim_customer d
                   SET d.valid_to = TRUNC(SYSDATE), d.is_current = 'N'
                 WHERE d.is_current = 'Y'
                   AND EXISTS (SELECT 1 FROM %s.customer c
                                WHERE c.c_w_id = d.source_w_id AND c.c_d_id = d.source_d_id AND c.c_id = d.source_c_id
                                  AND (NVL(c.c_city, '~') <> NVL(d.city, '~')
                                       OR NVL(c.c_region, 'Unknown') <> d.region))
                """.formatted(oltp);
    }

    /**
     * Type 2 history, part two: add a current row for new customers and for customers that were just closed.
     * The first row of a customer is valid from the beginning of time so that every order finds a row.
     */
    public String insertCurrentCustomers() {
        return """
                INSERT INTO dim_customer (source_w_id, source_d_id, source_c_id, first_name, last_name, email,
                                          city, region, credit_rating, registered_date, valid_from)
                SELECT c.c_w_id, c.c_d_id, c.c_id, c.c_first, c.c_last, c.c_email,
                       c.c_city, NVL(c.c_region, 'Unknown'), c.c_credit, c.c_since,
                       CASE WHEN EXISTS (SELECT 1 FROM dim_customer p
                                          WHERE p.source_w_id = c.c_w_id AND p.source_d_id = c.c_d_id
                                            AND p.source_c_id = c.c_id)
                            THEN TRUNC(SYSDATE) ELSE DATE '1900-01-01' END
                  FROM %s.customer c
                 WHERE NOT EXISTS (SELECT 1 FROM dim_customer d
                                    WHERE d.source_w_id = c.c_w_id AND d.source_d_id = c.c_d_id
                                      AND d.source_c_id = c.c_id AND d.is_current = 'Y')
                """.formatted(oltp);
    }

    /** Counts the orders that the order fact load will look at. The only bind value is the watermark. */
    public String countSourceOrders() {
        return "SELECT COUNT(*) FROM %s.oorder o WHERE o.o_entry_d > ?".formatted(oltp);
    }

    public String countSourceOrderLines() {
        return """
                SELECT COUNT(*) FROM %s.order_line ol
                  JOIN %s.oorder o ON o.o_w_id = ol.ol_w_id AND o.o_d_id = ol.ol_d_id AND o.o_id = ol.ol_o_id
                 WHERE o.o_entry_d > ?
                """.formatted(oltp, oltp);
    }

    /** One row per order. The only bind value is the watermark: orders up to that time are already loaded. */
    public String loadFactOrders() {
        return """
                INSERT INTO fact_orders (order_date_key, customer_key, warehouse_key, payment_key,
                                         order_w_id, order_d_id, order_id, line_count, item_quantity,
                                         order_amount, is_delivered)
                SELECT TO_NUMBER(TO_CHAR(o.o_entry_d, 'YYYYMMDD')), dc.customer_key, dw.warehouse_key, dp.payment_key,
                       o.o_w_id, o.o_d_id, o.o_id, t.line_count, t.item_quantity, t.order_amount,
                       CASE WHEN o.o_carrier_id IS NULL THEN 'N' ELSE 'Y' END
                  FROM %s.oorder o
                  JOIN (SELECT ol_w_id, ol_d_id, ol_o_id, COUNT(*) AS line_count,
                               SUM(ol_quantity) AS item_quantity, SUM(ol_amount) AS order_amount
                          FROM %s.order_line
                         GROUP BY ol_w_id, ol_d_id, ol_o_id) t
                    ON t.ol_w_id = o.o_w_id AND t.ol_d_id = o.o_d_id AND t.ol_o_id = o.o_id
                  JOIN dim_customer dc
                    ON dc.source_w_id = o.o_w_id AND dc.source_d_id = o.o_d_id AND dc.source_c_id = o.o_c_id
                   AND TRUNC(o.o_entry_d) >= dc.valid_from AND TRUNC(o.o_entry_d) < dc.valid_to
                  JOIN dim_warehouse dw ON dw.source_w_id = o.o_w_id
                  JOIN dim_payment_method dp ON dp.payment_method = NVL(o.o_payment_method, 'CREDIT_CARD')
                 WHERE o.o_entry_d > ?
                """.formatted(oltp, oltp);
    }

    /** One row per order line. The only bind value is the watermark. */
    public String loadFactSales() {
        return """
                INSERT INTO fact_sales (order_date_key, delivery_date_key, customer_key, product_key, warehouse_key,
                                        payment_key, order_w_id, order_d_id, order_id, line_number, quantity,
                                        sales_amount, delivery_days)
                SELECT TO_NUMBER(TO_CHAR(o.o_entry_d, 'YYYYMMDD')),
                       TO_NUMBER(TO_CHAR(ol.ol_delivery_d, 'YYYYMMDD')),
                       dc.customer_key, dpr.product_key, dw.warehouse_key, dp.payment_key,
                       ol.ol_w_id, ol.ol_d_id, ol.ol_o_id, ol.ol_number, ol.ol_quantity, ol.ol_amount,
                       TRUNC(ol.ol_delivery_d) - TRUNC(o.o_entry_d)
                  FROM %s.order_line ol
                  JOIN %s.oorder o ON o.o_w_id = ol.ol_w_id AND o.o_d_id = ol.ol_d_id AND o.o_id = ol.ol_o_id
                  JOIN dim_customer dc
                    ON dc.source_w_id = o.o_w_id AND dc.source_d_id = o.o_d_id AND dc.source_c_id = o.o_c_id
                   AND TRUNC(o.o_entry_d) >= dc.valid_from AND TRUNC(o.o_entry_d) < dc.valid_to
                  JOIN dim_product dpr ON dpr.source_item_id = ol.ol_i_id
                  JOIN dim_warehouse dw ON dw.source_w_id = o.o_w_id
                  JOIN dim_payment_method dp ON dp.payment_method = NVL(o.o_payment_method, 'CREDIT_CARD')
                 WHERE o.o_entry_d > ?
                """.formatted(oltp, oltp);
    }

    /** Orders that were delivered after they had been loaded get their delivery status. */
    public String refreshOrderDelivery() {
        return """
                UPDATE fact_orders f
                   SET f.is_delivered = 'Y'
                 WHERE f.is_delivered = 'N'
                   AND EXISTS (SELECT 1 FROM %s.oorder o
                                WHERE o.o_w_id = f.order_w_id AND o.o_d_id = f.order_d_id AND o.o_id = f.order_id
                                  AND o.o_carrier_id IS NOT NULL)
                """.formatted(oltp);
    }

    /** Order lines that were delivered after they had been loaded get their delivery date. */
    public String refreshLineDelivery() {
        return """
                UPDATE fact_sales f
                   SET (f.delivery_date_key, f.delivery_days) =
                       (SELECT TO_NUMBER(TO_CHAR(ol.ol_delivery_d, 'YYYYMMDD')),
                               TRUNC(ol.ol_delivery_d) - TO_DATE(TO_CHAR(f.order_date_key), 'YYYYMMDD')
                          FROM %s.order_line ol
                         WHERE ol.ol_w_id = f.order_w_id AND ol.ol_d_id = f.order_d_id
                           AND ol.ol_o_id = f.order_id AND ol.ol_number = f.line_number)
                 WHERE f.delivery_date_key IS NULL
                   AND EXISTS (SELECT 1 FROM %s.order_line ol
                                WHERE ol.ol_w_id = f.order_w_id AND ol.ol_d_id = f.order_d_id
                                  AND ol.ol_o_id = f.order_id AND ol.ol_number = f.line_number
                                  AND ol.ol_delivery_d IS NOT NULL)
                """.formatted(oltp, oltp);
    }

    /** Rebuilds the pre-aggregated monthly sales that the report API reads. */
    public String refreshMonthlySales() {
        return "BEGIN DBMS_MVIEW.REFRESH('MV_SALES_MONTHLY', 'C'); END;";
    }

    /** The only bind value is the snapshot date key. */
    public String deleteInventorySnapshot() {
        return "DELETE FROM fact_inventory_snapshot WHERE snapshot_date_key = ?";
    }

    /** The only bind value is the snapshot date key. */
    public String loadInventorySnapshot() {
        return """
                INSERT INTO fact_inventory_snapshot (snapshot_date_key, product_key, warehouse_key,
                                                     quantity_on_hand, units_sold_ytd, order_count)
                SELECT ?, dp.product_key, dw.warehouse_key, st.s_quantity, st.s_ytd, st.s_order_cnt
                  FROM %s.stock st
                  JOIN dim_product dp ON dp.source_item_id = st.s_i_id
                  JOIN dim_warehouse dw ON dw.source_w_id = st.s_w_id
                """.formatted(oltp);
    }

    public String latestSourceOrderTime() {
        return "SELECT MAX(o_entry_d) FROM %s.oorder".formatted(oltp);
    }

    /** Reconciliation of the warehouse with the OLTP schema. */
    public List<QualityCheck> qualityChecks() {
        return List.of(
                new QualityCheck("Order count matches OLTP",
                        "SELECT COUNT(*) FROM (SELECT DISTINCT ol_w_id, ol_d_id, ol_o_id FROM %s.order_line)"
                                .formatted(oltp),
                        "SELECT COUNT(*) FROM fact_orders"),
                new QualityCheck("Order line count matches OLTP",
                        "SELECT COUNT(*) FROM %s.order_line".formatted(oltp),
                        "SELECT COUNT(*) FROM fact_sales"),
                new QualityCheck("Sales amount matches OLTP",
                        "SELECT NVL(SUM(ol_amount), 0) FROM %s.order_line".formatted(oltp),
                        "SELECT NVL(SUM(sales_amount), 0) FROM fact_sales"),
                new QualityCheck("Order amounts add up to sales amounts",
                        "SELECT NVL(SUM(sales_amount), 0) FROM fact_sales",
                        "SELECT NVL(SUM(order_amount), 0) FROM fact_orders"),
                new QualityCheck("Every customer has one current row",
                        "SELECT COUNT(*) FROM %s.customer".formatted(oltp),
                        "SELECT COUNT(*) FROM dim_customer WHERE is_current = 'Y'"),
                new QualityCheck("No customer has two current rows",
                        "SELECT 0 FROM dual",
                        "SELECT COUNT(*) FROM (SELECT 1 FROM dim_customer WHERE is_current = 'Y' "
                                + "GROUP BY source_w_id, source_d_id, source_c_id HAVING COUNT(*) > 1)"));
    }
}
