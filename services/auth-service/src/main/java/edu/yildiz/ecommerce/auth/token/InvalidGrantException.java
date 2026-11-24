package edu.yildiz.ecommerce.auth.token;

/** The credentials or the refresh token are not valid. Answered with 401 and {@code invalid_grant}. */
class InvalidGrantException extends RuntimeException {

    InvalidGrantException() {
        super("invalid_grant");
    }
}
