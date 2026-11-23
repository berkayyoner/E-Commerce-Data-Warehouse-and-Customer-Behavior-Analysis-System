package edu.yildiz.ecommerce.auth.user;

import java.util.List;

import edu.yildiz.ecommerce.auth.user.UserDtos.CreateUserRequest;
import edu.yildiz.ecommerce.auth.user.UserDtos.PageResult;
import edu.yildiz.ecommerce.auth.user.UserDtos.UpdateUserRequest;
import edu.yildiz.ecommerce.auth.user.UserDtos.UserView;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private static final int MAX_PAGE_SIZE = 100;

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public PageResult<UserView> search(String text, String sort, boolean ascending, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        List<UserView> content = users.search(text, sort, ascending, safePage, safeSize).stream()
                .map(UserView::of).toList();
        return new PageResult<>(content, users.count(text), safePage, safeSize);
    }

    @Transactional(readOnly = true)
    public UserView get(long id) {
        return UserView.of(users.findById(id).orElseThrow(() -> new UserNotFoundException(id)));
    }

    @Transactional
    public UserView create(CreateUserRequest request) {
        String username = request.username().trim();
        if (users.findByUsername(username).isPresent()) {
            throw new UsernameTakenException(username);
        }
        try {
            long id = users.insert(username, passwordEncoder.encode(request.password()),
                    request.displayName().trim(), blankToNull(request.email()), request.role());
            return get(id);
        } catch (DuplicateKeyException e) {
            throw new UsernameTakenException(username);
        }
    }

    @Transactional
    public UserView update(long id, UpdateUserRequest request, String actingUsername) {
        AppUser existing = users.findById(id).orElseThrow(() -> new UserNotFoundException(id));
        boolean losesAdminRights = existing.role() == Role.ADMIN && existing.enabled()
                && (request.role() != Role.ADMIN || !request.enabled());
        if (losesAdminRights && isLastEnabledAdmin()) {
            throw new InvalidUserOperationException("The last active administrator cannot be demoted or disabled");
        }
        if (existing.username().equalsIgnoreCase(actingUsername) && !request.enabled()) {
            throw new InvalidUserOperationException("You cannot disable your own account");
        }
        String newHash = request.password() == null || request.password().isBlank()
                ? null : passwordEncoder.encode(request.password());
        users.update(id, request.displayName().trim(), blankToNull(request.email()), request.role(),
                request.enabled(), newHash);
        return get(id);
    }

    @Transactional
    public void delete(long id, String actingUsername) {
        AppUser existing = users.findById(id).orElseThrow(() -> new UserNotFoundException(id));
        if (existing.username().equalsIgnoreCase(actingUsername)) {
            throw new InvalidUserOperationException("You cannot delete your own account");
        }
        if (existing.role() == Role.ADMIN && existing.enabled() && isLastEnabledAdmin()) {
            throw new InvalidUserOperationException("The last active administrator cannot be deleted");
        }
        users.delete(id);
    }

    private boolean isLastEnabledAdmin() {
        return users.countEnabledAdmins() <= 1;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
