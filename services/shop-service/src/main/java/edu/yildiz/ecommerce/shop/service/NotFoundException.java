package edu.yildiz.ecommerce.shop.service;

/** Raised when a resource addressed by its key does not exist. Answered with 404. */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }
}
