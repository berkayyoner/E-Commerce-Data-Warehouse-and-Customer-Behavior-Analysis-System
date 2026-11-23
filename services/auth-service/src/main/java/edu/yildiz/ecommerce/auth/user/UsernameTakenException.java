package edu.yildiz.ecommerce.auth.user;

public class UsernameTakenException extends RuntimeException {

    public UsernameTakenException(String username) {
        super("The user name '" + username + "' is already in use");
    }
}
