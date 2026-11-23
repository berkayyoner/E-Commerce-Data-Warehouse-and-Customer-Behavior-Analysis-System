package edu.yildiz.ecommerce.auth.user;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;

import edu.yildiz.ecommerce.auth.user.UserDtos.CreateUserRequest;
import edu.yildiz.ecommerce.auth.user.UserDtos.PageResult;
import edu.yildiz.ecommerce.auth.user.UserDtos.UserView;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class UserControllerTest {

    private final UserService service = mock(UserService.class);
    private MockMvc mvc;

    private static UserView view(long id, String username) {
        return new UserView(id, username, username + " name", null, Role.ANALYST, true, Instant.parse("2026-11-23T10:00:00Z"));
    }

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(new UserController(service))
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
    }

    @Test
    void meListsTheRolesWithoutThePrefix() throws Exception {
        var authentication = new UsernamePasswordAuthenticationToken("admin", "n/a",
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"), new SimpleGrantedAuthority("FACTOR_BEARER")));

        mvc.perform(get("/api/auth/me").principal(authentication))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("admin"))
                .andExpect(jsonPath("$.roles[0]").value("ADMIN"))
                .andExpect(jsonPath("$.roles.length()").value(1));
    }

    @Test
    void listPassesSearchSortAndPaging() throws Exception {
        when(service.search("ay", "displayName", false, 1, 10))
                .thenReturn(new PageResult<>(List.of(view(1, "ayse")), 11, 1, 10));

        mvc.perform(get("/api/auth/users?search=ay&sort=displayName&direction=desc&page=1&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(11))
                .andExpect(jsonPath("$.content[0].username").value("ayse"));
    }

    @Test
    void createAnswersWithLocation() throws Exception {
        when(service.create(new CreateUserRequest("mert", "secret-pass", "Mert Kaya", null, Role.ANALYST)))
                .thenReturn(view(8, "mert"));

        mvc.perform(post("/api/auth/users").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"mert\",\"password\":\"secret-pass\",\"displayName\":\"Mert Kaya\",\"role\":\"ANALYST\"}"))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/auth/users/8"));
    }

    @Test
    void createRejectsAShortPassword() throws Exception {
        mvc.perform(post("/api/auth/users").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"mert\",\"password\":\"short\",\"displayName\":\"Mert\",\"role\":\"VIEWER\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createReportsATakenUsername() throws Exception {
        when(service.create(new CreateUserRequest("mert", "secret-pass", "Mert", null, Role.VIEWER)))
                .thenThrow(new UsernameTakenException("mert"));

        mvc.perform(post("/api/auth/users").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"mert\",\"password\":\"secret-pass\",\"displayName\":\"Mert\",\"role\":\"VIEWER\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    void getReportsAnUnknownUser() throws Exception {
        when(service.get(404)).thenThrow(new UserNotFoundException(404));

        mvc.perform(get("/api/auth/users/404")).andExpect(status().isNotFound());
    }
}
