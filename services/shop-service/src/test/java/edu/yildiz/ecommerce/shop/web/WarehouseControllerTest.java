package edu.yildiz.ecommerce.shop.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.util.List;

import edu.yildiz.ecommerce.shop.dto.WarehouseDtos.WarehouseRequest;
import edu.yildiz.ecommerce.shop.dto.WarehouseDtos.WarehouseView;
import edu.yildiz.ecommerce.shop.model.PageResult;
import edu.yildiz.ecommerce.shop.service.WarehouseService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class WarehouseControllerTest {

    private final WarehouseService service = mock(WarehouseService.class);
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(new WarehouseController(service))
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
    }

    @Test
    void listReturnsAPageOfWarehouses() throws Exception {
        WarehouseView view = new WarehouseView(1L, "Main", "Istanbul", "TR", "Marmara", new BigDecimal("0.1"),
                BigDecimal.ZERO);
        when(service.search("", "id", "asc", 0, 20)).thenReturn(new PageResult<>(List.of(view), 1, 0, 20));

        mvc.perform(get("/api/shop/warehouses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].city").value("Istanbul"))
                .andExpect(jsonPath("$.total").value(1));
    }

    @Test
    void createAnswersWithCreatedAndTheLocation() throws Exception {
        WarehouseView created = new WarehouseView(11L, "North", "Ankara", "TR", "Central", new BigDecimal("0.1"),
                BigDecimal.ZERO);
        when(service.create(any(WarehouseRequest.class))).thenReturn(created);

        mvc.perform(post("/api/shop/warehouses").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"North\",\"city\":\"Ankara\",\"region\":\"Central\"}"))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/shop/warehouses/11"));
    }

    @Test
    void createRejectsAMissingRegion() throws Exception {
        mvc.perform(post("/api/shop/warehouses").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"North\",\"city\":\"Ankara\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Invalid request: region: must not be blank"));
    }
}
