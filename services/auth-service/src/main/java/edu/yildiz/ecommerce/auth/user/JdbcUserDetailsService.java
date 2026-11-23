package edu.yildiz.ecommerce.auth.user;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/** Lets Spring Security sign users in with the rows of the app_user table. */
@Service
public class JdbcUserDetailsService implements UserDetailsService {

    private final UserRepository users;

    public JdbcUserDetailsService(UserRepository users) {
        this.users = users;
    }

    @Override
    public UserDetails loadUserByUsername(String username) {
        AppUser user = users.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Unknown user"));
        return User.withUsername(user.username())
                .password(user.passwordHash())
                .authorities(new SimpleGrantedAuthority("ROLE_" + user.role().name()))
                .disabled(!user.enabled())
                .build();
    }
}
