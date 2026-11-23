package edu.yildiz.ecommerce.shop.repository;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import edu.yildiz.ecommerce.shop.dto.OrderDtos.OrderSummaryView;
import edu.yildiz.ecommerce.shop.support.Paging;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.springframework.stereotype.Repository;

/**
 * Native query behind the order list. The total of an order is a correlated sum over its lines, so only the
 * lines of the orders on the requested page are read. The sort columns are chosen by the service from a whitelist,
 * which is the only text that is placed into the SQL besides the constants below.
 */
@Repository
public class OrderSummaryQuery {

    private static final String FROM_AND_JOIN = """
            FROM OORDER o
            JOIN CUSTOMER c ON c.C_W_ID = o.O_W_ID AND c.C_D_ID = o.O_D_ID AND c.C_ID = o.O_C_ID
            """;

    private static final String PAGE_SELECT = """
            SELECT o.O_W_ID, o.O_D_ID, o.O_ID, o.O_C_ID, c.C_FIRST, c.C_LAST, o.O_ENTRY_D,
                   o.O_PAYMENT_METHOD, o.O_OL_CNT, o.O_CARRIER_ID,
                   (SELECT SUM(l.OL_AMOUNT) FROM ORDER_LINE l
                     WHERE l.OL_W_ID = o.O_W_ID AND l.OL_D_ID = o.O_D_ID AND l.OL_O_ID = o.O_ID) AS total_amount
            """;

    private static final String COUNT_SELECT = "SELECT COUNT(*) ";

    private final EntityManager entityManager;

    public OrderSummaryQuery(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    /**
     * @param warehouseId optional warehouse number
     * @param from        optional first order date (inclusive)
     * @param toExclusive optional end of the order date range (exclusive)
     * @param search      optional text matched against the first and last name of the customer
     */
    public record Filter(String search, Long warehouseId, LocalDateTime from, LocalDateTime toExclusive) {
    }

    public List<OrderSummaryView> findPage(Filter filter, List<String> sortColumns, boolean ascending,
                                           long offset, int limit) {
        Map<String, Object> parameters = new LinkedHashMap<>();
        String sql = PAGE_SELECT + FROM_AND_JOIN + whereClause(filter, parameters)
                + " ORDER BY " + orderBy(sortColumns, ascending)
                + " OFFSET :rowOffset ROWS FETCH NEXT :pageSize ROWS ONLY";
        parameters.put("rowOffset", offset);
        parameters.put("pageSize", limit);
        Query query = entityManager.createNativeQuery(sql);
        parameters.forEach((name, value) -> query.setParameter(name, value));

        List<OrderSummaryView> summaries = new ArrayList<>();
        for (Object row : query.getResultList()) {
            summaries.add(toView((Object[]) row));
        }
        return summaries;
    }

    public long count(Filter filter) {
        Map<String, Object> parameters = new LinkedHashMap<>();
        String sql = COUNT_SELECT + FROM_AND_JOIN + whereClause(filter, parameters);
        Query query = entityManager.createNativeQuery(sql);
        parameters.forEach((name, value) -> query.setParameter(name, value));
        return ((Number) query.getSingleResult()).longValue();
    }

    private static String whereClause(Filter filter, Map<String, Object> parameters) {
        List<String> conditions = new ArrayList<>();
        if (filter.warehouseId() != null) {
            conditions.add("o.O_W_ID = :warehouseId");
            parameters.put("warehouseId", filter.warehouseId());
        }
        if (filter.from() != null) {
            conditions.add("o.O_ENTRY_D >= :fromDate");
            parameters.put("fromDate", filter.from());
        }
        if (filter.toExclusive() != null) {
            conditions.add("o.O_ENTRY_D < :toDate");
            parameters.put("toDate", filter.toExclusive());
        }
        if (filter.search() != null && !filter.search().isBlank()) {
            conditions.add("(LOWER(c.C_FIRST) LIKE :search ESCAPE '!' OR LOWER(c.C_LAST) LIKE :search ESCAPE '!')");
            parameters.put("search", Paging.containsPattern(filter.search()));
        }
        return conditions.isEmpty() ? "" : " WHERE " + String.join(" AND ", conditions);
    }

    /** The order columns in the requested direction, then the key of the order as a stable tie breaker. */
    private static String orderBy(List<String> columns, boolean ascending) {
        String direction = ascending ? " ASC" : " DESC";
        List<String> terms = new ArrayList<>();
        for (String column : columns) {
            terms.add(column + direction);
        }
        terms.add("o.O_W_ID ASC");
        terms.add("o.O_D_ID ASC");
        terms.add("o.O_ID ASC");
        return String.join(", ", terms);
    }

    private static OrderSummaryView toView(Object[] row) {
        return new OrderSummaryView(
                number(row[0]).longValue(),
                number(row[1]).longValue(),
                number(row[2]).longValue(),
                number(row[3]).longValue(),
                row[4] + " " + row[5],
                timestamp(row[6]),
                (String) row[7],
                number(row[8]).intValue(),
                amount(row[10]),
                row[9] != null);
    }

    private static Number number(Object value) {
        return (Number) value;
    }

    private static LocalDateTime timestamp(Object value) {
        if (value instanceof Timestamp timestamp) {
            return timestamp.toLocalDateTime();
        }
        return (LocalDateTime) value;
    }

    private static BigDecimal amount(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        return new BigDecimal(value.toString());
    }
}
