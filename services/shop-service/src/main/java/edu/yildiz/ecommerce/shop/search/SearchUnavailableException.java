package edu.yildiz.ecommerce.shop.search;

/** Raised when Elasticsearch cannot be reached or an index the search needs is missing. Answered with 503. */
public class SearchUnavailableException extends RuntimeException {

    public SearchUnavailableException(String operation, Throwable cause) {
        super("Elasticsearch " + operation + " failed", cause);
    }
}
