package edu.yildiz.ecommerce.shop.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.mockito.Mockito.when;

import java.util.List;

import edu.yildiz.ecommerce.shop.config.SecurityProperties;
import edu.yildiz.ecommerce.shop.dto.SearchDtos.ProductSearchResponse;
import edu.yildiz.ecommerce.shop.dto.SearchDtos.ReindexStatus;
import edu.yildiz.ecommerce.shop.model.PageResult;
import edu.yildiz.ecommerce.shop.search.ProductReindexService;
import edu.yildiz.ecommerce.shop.search.ProductSearchService;
import edu.yildiz.ecommerce.shop.security.SecurityConfig;
import edu.yildiz.ecommerce.shop.service.ProductService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = {SearchController.class, ProductController.class},
        properties = {
                "spring.security.oauth2.resourceserver.jwt.issuer-uri=http://localhost:9000",
                "security.allowed-origins=http://localhost:3000"})
@Import({SecurityConfig.class, SearchSecurityTest.SecurityPropertiesConfig.class})
class SearchSecurityTest {

    /** The application scans its configuration properties; a slice test has to register them itself. */
    @TestConfiguration
    @EnableConfigurationProperties(SecurityProperties.class)
    static class SecurityPropertiesConfig {
    }

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private ProductSearchService search;

    @MockitoBean
    private ProductReindexService reindex;

    @MockitoBean
    private ProductService products;

    private static org.springframework.test.web.servlet.request.RequestPostProcessor role(String role) {
        return jwt().authorities(new SimpleGrantedAuthority("ROLE_" + role));
    }

    @Test
    void searchNeedsAToken() throws Exception {
        mvc.perform(get("/api/shop/search/products")).andExpect(status().isUnauthorized());
    }

    @Test
    void everyReadRoleMaySearch() throws Exception {
        when(search.search(any())).thenReturn(new ProductSearchResponse(List.of(), 0, 0, 20, null));

        mvc.perform(get("/api/shop/search/products").with(role("VIEWER"))).andExpect(status().isOk());
        mvc.perform(get("/api/shop/search/products").with(role("ANALYST"))).andExpect(status().isOk());
        mvc.perform(get("/api/shop/search/suggest").with(role("VIEWER"))).andExpect(status().isOk());
    }

    @Test
    void onlyAdminsStartAReindex() throws Exception {
        when(reindex.start()).thenReturn(ReindexStatus.idle());

        mvc.perform(post("/api/shop/search/reindex").with(role("VIEWER"))).andExpect(status().isForbidden());
        mvc.perform(post("/api/shop/search/reindex").with(role("ANALYST"))).andExpect(status().isForbidden());
        mvc.perform(post("/api/shop/search/reindex").with(role("ADMIN"))).andExpect(status().isAccepted());
    }

    @Test
    void reindexStatusIsForAdminsAndAnalystsOnly() throws Exception {
        when(reindex.status()).thenReturn(ReindexStatus.idle());

        mvc.perform(get("/api/shop/search/reindex").with(role("VIEWER"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/shop/search/reindex").with(role("ANALYST"))).andExpect(status().isOk());
        mvc.perform(get("/api/shop/search/reindex").with(role("ADMIN"))).andExpect(status().isOk());
    }

    @Test
    void productReadsStillAllowEveryReadRole() throws Exception {
        when(products.search(anyString(), anyString(), anyString(), anyInt(), anyInt()))
                .thenReturn(new PageResult<>(List.of(), 0, 0, 20));

        mvc.perform(get("/api/shop/products").with(role("VIEWER"))).andExpect(status().isOk());
        mvc.perform(get("/api/shop/products").with(role("ANALYST"))).andExpect(status().isOk());
    }

    @Test
    void productWritesStayAdminOnly() throws Exception {
        mvc.perform(post("/api/shop/products").with(role("VIEWER"))).andExpect(status().isForbidden());
        mvc.perform(post("/api/shop/products").with(role("ANALYST"))).andExpect(status().isForbidden());
    }

    @Test
    void productReadsNeedAToken() throws Exception {
        mvc.perform(get("/api/shop/products")).andExpect(status().isUnauthorized());
    }
}
