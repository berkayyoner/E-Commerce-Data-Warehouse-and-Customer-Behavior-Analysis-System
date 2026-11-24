package edu.yildiz.ecommerce.auth.token;

/** Too many failed sign in attempts for the same user and address. Answered with 429. */
class TooManyAttemptsException extends RuntimeException {

    TooManyAttemptsException() {
        super("too_many_requests");
    }
}
