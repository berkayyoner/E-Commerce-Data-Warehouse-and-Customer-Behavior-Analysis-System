package edu.yildiz.ecommerce.analytics.repository;

import java.util.List;

/**
 * A statement with its JDBC parameters, in the order of the question marks.
 *
 * @param sql       the statement text; it contains only fixed fragments and question marks
 * @param arguments the values bound to the question marks
 */
public record BoundSql(String sql, List<Object> arguments) {

    public BoundSql {
        arguments = List.copyOf(arguments);
    }
}
