package edu.yildiz.ecommerce.auth.user;

public class UserNotFoundException extends RuntimeException {

    public UserNotFoundException(long id) {
        super("User " + id + " does not exist");
    }
}
