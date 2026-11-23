package edu.yildiz.ecommerce.auth.user;

import java.net.URI;
import java.security.Principal;
import java.util.List;

import edu.yildiz.ecommerce.auth.user.UserDtos.CreateUserRequest;
import edu.yildiz.ecommerce.auth.user.UserDtos.CurrentUser;
import edu.yildiz.ecommerce.auth.user.UserDtos.PageResult;
import edu.yildiz.ecommerce.auth.user.UserDtos.UpdateUserRequest;
import edu.yildiz.ecommerce.auth.user.UserDtos.UserView;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class UserController {

    private final UserService service;

    public UserController(UserService service) {
        this.service = service;
    }

    /** The signed in user, as the front-ends need it to show the name and to hide pages. */
    @GetMapping("/me")
    public CurrentUser me(Authentication authentication) {
        List<String> roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(authority -> authority.startsWith("ROLE_"))
                .map(authority -> authority.substring("ROLE_".length()))
                .sorted()
                .toList();
        return new CurrentUser(authentication.getName(), roles);
    }

    @GetMapping("/users")
    public PageResult<UserView> list(@RequestParam(defaultValue = "") String search,
                                     @RequestParam(defaultValue = "username") String sort,
                                     @RequestParam(defaultValue = "asc") String direction,
                                     @RequestParam(defaultValue = "0") int page,
                                     @RequestParam(defaultValue = "20") int size) {
        return service.search(search, sort, !"desc".equalsIgnoreCase(direction), page, size);
    }

    @GetMapping("/users/{id}")
    public UserView get(@PathVariable long id) {
        return service.get(id);
    }

    @PostMapping("/users")
    public ResponseEntity<UserView> create(@Valid @RequestBody CreateUserRequest request) {
        UserView created = service.create(request);
        return ResponseEntity.created(URI.create("/api/auth/users/" + created.id())).body(created);
    }

    @PutMapping("/users/{id}")
    public UserView update(@PathVariable long id, @Valid @RequestBody UpdateUserRequest request,
                           Principal principal) {
        return service.update(id, request, principal.getName());
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id, Principal principal) {
        service.delete(id, principal.getName());
        return ResponseEntity.noContent().build();
    }
}
