package edu.yildiz.ecommerce.auth.token;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import edu.yildiz.ecommerce.auth.token.TokenDtos.TokenResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class TokenControllerTest {

    private static final TokenResponse PAIR = new TokenResponse("access-jwt", "refresh-value", "Bearer", 900,
            "Alice Demir", "ANALYST");

    private final TokenService service = mock(TokenService.class);
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(new TokenController(service)).build();
    }

    @Test
    void loginAnswersWithTheTokenShape() throws Exception {
        when(service.login(eq("alice"), eq("secret-pass"), anyString())).thenReturn(PAIR);

        mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"alice\",\"password\":\"secret-pass\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.access_token").value("access-jwt"))
                .andExpect(jsonPath("$.refresh_token").value("refresh-value"))
                .andExpect(jsonPath("$.token_type").value("Bearer"))
                .andExpect(jsonPath("$.expires_in").value(900))
                .andExpect(jsonPath("$.display_name").value("Alice Demir"))
                .andExpect(jsonPath("$.role").value("ANALYST"));
    }

    @Test
    void wrongCredentialsAreAnsweredWithInvalidGrant() throws Exception {
        when(service.login(anyString(), anyString(), anyString())).thenThrow(new InvalidGrantException());

        mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"alice\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("invalid_grant"));
    }

    @Test
    void tooManyFailedAttemptsAreAnsweredWithTooManyRequests() throws Exception {
        when(service.login(anyString(), anyString(), anyString())).thenThrow(new TooManyAttemptsException());

        mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"alice\",\"password\":\"wrong\"}"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.error").value("too_many_requests"));
    }

    @Test
    void refreshAnswersWithANewPair() throws Exception {
        when(service.refresh("old-value")).thenReturn(PAIR);

        mvc.perform(post("/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refresh_token\":\"old-value\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.access_token").value("access-jwt"));
    }

    @Test
    void refreshWithAnInvalidTokenIsAnsweredWithInvalidGrant() throws Exception {
        when(service.refresh(any())).thenThrow(new InvalidGrantException());

        mvc.perform(post("/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refresh_token\":\"gone\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("invalid_grant"));
    }

    @Test
    void logoutAnswersWithNoContent() throws Exception {
        mvc.perform(post("/auth/logout").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refresh_token\":\"old-value\"}"))
                .andExpect(status().isNoContent());

        verify(service).logout("old-value");
    }

    @Test
    void logoutWithoutABodyStillAnswersWithNoContent() throws Exception {
        mvc.perform(post("/auth/logout")).andExpect(status().isNoContent());
    }
}
