package edu.yildiz.ecommerce.auth.security;

import java.time.Clock;
import java.util.List;

import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import edu.yildiz.ecommerce.auth.config.AuthProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.settings.AuthorizationServerSettings;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final String ROLES_CLAIM = "roles";

    /** Only the paths of the token endpoint, the signing keys and the discovery document are served. */
    private static final String[] AUTHORIZATION_SERVER_PATHS = {"/oauth2/token", "/oauth2/jwks", "/.well-known/**"};

    /** The OAuth 2.0 token endpoint for the scheduler, the signing keys and the discovery documents. */
    @Bean
    @Order(1)
    SecurityFilterChain authorizationServerChain(HttpSecurity http) throws Exception {
        http.securityMatcher(AUTHORIZATION_SERVER_PATHS);
        http.oauth2AuthorizationServer(server -> server.oidc(Customizer.withDefaults()));
        http.authorizeHttpRequests(requests -> requests
                .requestMatchers("/oauth2/jwks", "/.well-known/**").permitAll()
                .anyRequest().authenticated());
        return http.build();
    }

    /** The JSON token API used by the React applications: sign in, refresh and sign out. */
    @Bean
    @Order(2)
    SecurityFilterChain tokenApiChain(HttpSecurity http) throws Exception {
        http.securityMatcher("/auth/**")
                .authorizeHttpRequests(requests -> requests.anyRequest().permitAll())
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
        return http.build();
    }

    /** The user and role API. It accepts the access tokens issued by this server. */
    @Bean
    @Order(3)
    SecurityFilterChain apiChain(HttpSecurity http) throws Exception {
        http.securityMatcher("/api/**")
                .authorizeHttpRequests(requests -> requests
                        .requestMatchers(HttpMethod.OPTIONS, "/api/**").permitAll()
                        .requestMatchers("/api/auth/me").authenticated()
                        .requestMatchers("/api/auth/users/**").hasRole("ADMIN")
                        .anyRequest().denyAll())
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .oauth2ResourceServer(resource -> resource.jwt(jwt -> jwt.jwtAuthenticationConverter(
                        jwtAuthenticationConverter())));
        return http.build();
    }

    /** The health checks. Everything else is refused. */
    @Bean
    @Order(4)
    SecurityFilterChain defaultChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(requests -> requests
                .requestMatchers("/actuator/health/**", "/actuator/info").permitAll()
                .anyRequest().denyAll());
        return http.build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    /** Checks the user name and password of the token API against the app_user table. */
    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    RegisteredClientRepository registeredClientRepository(AuthProperties properties, PasswordEncoder encoder) {
        return RegisteredClients.create(properties, encoder);
    }

    @Bean
    JWKSource<SecurityContext> jwkSource(AuthProperties properties) {
        return JwkSourceFactory.create(properties);
    }

    /** Signs the access tokens, both the user tokens of the token API and the scheduler's tokens. */
    @Bean
    JwtEncoder jwtEncoder(JWKSource<SecurityContext> jwkSource) {
        return new NimbusJwtEncoder(jwkSource);
    }

    @Bean
    AuthorizationServerSettings authorizationServerSettings(AuthProperties properties) {
        return AuthorizationServerSettings.builder().issuer(properties.issuer()).build();
    }

    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }

    /** Reads the role from the access token, where the resource services expect it. */
    @Bean
    JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            List<String> roles = jwt.getClaimAsStringList(ROLES_CLAIM);
            if (roles == null) {
                return List.of();
            }
            return roles.stream().<GrantedAuthority>map(role -> new SimpleGrantedAuthority("ROLE_" + role)).toList();
        });
        return converter;
    }

    /** The React applications call the token API from the browser, so their origins are allowed. */
    @Bean
    CorsConfigurationSource corsConfigurationSource(AuthProperties properties) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(properties.allowedOrigins());
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept-Language"));
        configuration.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/auth/**", configuration);
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }
}
