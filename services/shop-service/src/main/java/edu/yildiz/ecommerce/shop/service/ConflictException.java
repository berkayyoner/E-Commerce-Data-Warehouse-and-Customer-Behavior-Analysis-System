package edu.yildiz.ecommerce.shop.service;

/** Raised when a change would break a relation that other rows depend on. Answered with 409. */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
