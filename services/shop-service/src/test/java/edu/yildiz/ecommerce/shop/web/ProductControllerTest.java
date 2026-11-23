package edu.yildiz.ecommerce.shop.web;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.util.List;

import edu.yildiz.ecommerce.shop.dto.ProductDtos.ProductRequest;
import edu.yildiz.ecommerce.shop.dto.ProductDtos.ProductView;
import edu.yildiz.ecommerce.shop.model.PageResult;
import edu.yildiz.ecommerce.shop.service.ConflictException;
import edu.yildiz.ecommerce.shop.service.NotFoundException;
import edu.yildiz.ecommerce.shop.service.ProductService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class ProductControllerTest {

    private final ProductService service = mock(ProductService.class);
    private MockMvc mvc;

    private static ProductView lamp(long id) {
        return new ProductView(id, "Desk Lamp", new BigDecimal("24.50"), "Home", "Lumen");
    }

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(new ProductController(service))
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
    }

    @Test
    void listReturnsAPage() throws Exception {
        when(service.search("", "id", "asc", 0, 20)).thenReturn(new PageResult<>(List.of(lamp(1)), 1, 0, 20));

        mvc.perform(get("/api/shop/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.content[0].name").value("Desk Lamp"));
    }

    @Test
    void createAnswersWithCreatedAndTheLocation() throws Exception {
        when(service.create(new ProductRequest("Desk Lamp", new BigDecimal("24.50"), "Home", "Lumen")))
                .thenReturn(lamp(5001));

        mvc.perform(post("/api/shop/products").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Desk Lamp\",\"price\":24.50,\"category\":\"Home\",\"brand\":\"Lumen\"}"))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/shop/products/5001"));
    }

    @Test
    void createRejectsAPriceBelowOneCent() throws Exception {
        mvc.perform(post("/api/shop/products").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Pen\",\"price\":0,\"category\":\"Office\",\"brand\":\"Ink\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail", containsString("price")));
    }

    @Test
    void getReportsAnUnknownProduct() throws Exception {
        when(service.get(404L)).thenThrow(new NotFoundException("Product 404 was not found"));

        mvc.perform(get("/api/shop/products/404")).andExpect(status().isNotFound());
    }

    @Test
    void deleteAnswersConflictWhenTheProductWasOrdered() throws Exception {
        doThrow(new ConflictException("Product 7 appears in order lines and cannot be deleted")).when(service)
                .delete(7L);

        mvc.perform(delete("/api/shop/products/7")).andExpect(status().isConflict());
    }

    @Test
    void deleteAnswersNoContentForAnUnorderedProduct() throws Exception {
        mvc.perform(delete("/api/shop/products/8")).andExpect(status().isNoContent());
    }
}
