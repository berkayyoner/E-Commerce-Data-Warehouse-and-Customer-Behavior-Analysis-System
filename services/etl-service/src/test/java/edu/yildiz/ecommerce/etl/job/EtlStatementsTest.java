package edu.yildiz.ecommerce.etl.job;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import edu.yildiz.ecommerce.etl.config.EtlProperties;
import org.junit.jupiter.api.Test;

class EtlStatementsTest {

    private final EtlStatements statements = new EtlStatements(new EtlProperties("SHOP_OLTP"));

    @Test
    void sourceTablesAreReadFromTheConfiguredSchema() {
        assertThat(statements.loadFactSales()).contains("SHOP_OLTP.order_line", "SHOP_OLTP.oorder");
        assertThat(statements.loadFactOrders()).contains("SHOP_OLTP.oorder", "SHOP_OLTP.order_line");
        assertThat(statements.mergeProducts()).contains("SHOP_OLTP.item");
        assertThat(statements.loadInventorySnapshot()).contains("SHOP_OLTP.stock");
    }

    @Test
    void factLoadsOnlyTakeOrdersAfterTheWatermark() {
        assertThat(statements.loadFactOrders()).contains("o.o_entry_d > ?");
        assertThat(statements.loadFactSales()).contains("o.o_entry_d > ?");
        assertThat(statements.countSourceOrders()).contains("o.o_entry_d > ?");
    }

    @Test
    void everyQualityCheckHasTwoQueries() {
        assertThat(statements.qualityChecks()).hasSize(6).allSatisfy(check -> {
            assertThat(check.expectedSql()).startsWith("SELECT");
            assertThat(check.actualSql()).startsWith("SELECT");
        });
    }

    @Test
    void theSchemaNameMustBeAPlainIdentifier() {
        assertThatThrownBy(() -> new EtlProperties("SHOP; DROP TABLE x"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new EtlProperties(null)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new EtlProperties("1SCHEMA")).isInstanceOf(IllegalArgumentException.class);
    }
}
