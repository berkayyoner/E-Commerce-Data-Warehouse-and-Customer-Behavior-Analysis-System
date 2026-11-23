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
import java.time.LocalDate;
import java.util.List;

import edu.yildiz.ecommerce.shop.dto.CustomerDtos.CreateCustomerRequest;
import edu.yildiz.ecommerce.shop.dto.CustomerDtos.CustomerView;
import edu.yildiz.ecommerce.shop.model.PageResult;
import edu.yildiz.ecommerce.shop.service.CustomerService;
import edu.yildiz.ecommerce.shop.service.NotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class CustomerControllerTest {

    private final CustomerService service = mock(CustomerService.class);
    private MockMvc mvc;

    private static CustomerView ayse(long customerId) {
        return new CustomerView(2L, 4L, customerId, "Ayse", "Demir", "ayse@example.com", "Ankara", "TR", "Central",
                LocalDate.of(2026, 11, 23), "GC", new BigDecimal("50000"), BigDecimal.ZERO, BigDecimal.ZERO);
    }

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(new CustomerController(service))
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
    }

    @Test
    void listPassesTheWarehouseFilterToTheService() throws Exception {
        when(service.search("ayse", 2L, "lastName", "asc", 0, 20))
                .thenReturn(new PageResult<>(List.of(ayse(3001)), 1, 0, 20));

        mvc.perform(get("/api/shop/customers?search=ayse&warehouseId=2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].customerId").value(3001))
                .andExpect(jsonPath("$.total").value(1));
    }

    @Test
    void createAnswersWithCreatedAndTheCompositeLocation() throws Exception {
        when(service.create(any(CreateCustomerRequest.class))).thenReturn(ayse(3001));

        mvc.perform(post("/api/shop/customers").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"warehouseId\":2,\"districtId\":4,\"firstName\":\"Ayse\",\"lastName\":\"Demir\","
                                + "\"email\":\"ayse@example.com\",\"city\":\"Ankara\",\"region\":\"Central\"}"))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/shop/customers/2/4/3001"));
    }

    @Test
    void getReportsAnUnknownCustomer() throws Exception {
        when(service.get(2L, 4L, 1L)).thenThrow(new NotFoundException("Customer 2/4/1 was not found"));

        mvc.perform(get("/api/shop/customers/2/4/1")).andExpect(status().isNotFound());
    }
}
