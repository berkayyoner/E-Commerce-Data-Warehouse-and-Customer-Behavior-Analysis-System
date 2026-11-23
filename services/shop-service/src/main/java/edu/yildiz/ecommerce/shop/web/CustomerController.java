package edu.yildiz.ecommerce.shop.web;

import java.net.URI;

import edu.yildiz.ecommerce.shop.dto.CustomerDtos.CreateCustomerRequest;
import edu.yildiz.ecommerce.shop.dto.CustomerDtos.CustomerView;
import edu.yildiz.ecommerce.shop.dto.CustomerDtos.UpdateCustomerRequest;
import edu.yildiz.ecommerce.shop.model.PageResult;
import edu.yildiz.ecommerce.shop.service.CustomerService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/shop/customers")
public class CustomerController {

    private final CustomerService service;

    public CustomerController(CustomerService service) {
        this.service = service;
    }

    @GetMapping
    public PageResult<CustomerView> list(@RequestParam(defaultValue = "") String search,
                                         @RequestParam(required = false) Long warehouseId,
                                         @RequestParam(defaultValue = "lastName") String sort,
                                         @RequestParam(defaultValue = "asc") String direction,
                                         @RequestParam(defaultValue = "0") int page,
                                         @RequestParam(defaultValue = "20") int size) {
        return service.search(search, warehouseId, sort, direction, page, size);
    }

    @GetMapping("/{warehouseId}/{districtId}/{customerId}")
    public CustomerView get(@PathVariable long warehouseId, @PathVariable long districtId,
                            @PathVariable long customerId) {
        return service.get(warehouseId, districtId, customerId);
    }

    @PostMapping
    public ResponseEntity<CustomerView> create(@Valid @RequestBody CreateCustomerRequest request) {
        CustomerView created = service.create(request);
        return ResponseEntity.created(location(created)).body(created);
    }

    @PutMapping("/{warehouseId}/{districtId}/{customerId}")
    public CustomerView update(@PathVariable long warehouseId, @PathVariable long districtId,
                               @PathVariable long customerId, @Valid @RequestBody UpdateCustomerRequest request) {
        return service.update(warehouseId, districtId, customerId, request);
    }

    private static URI location(CustomerView customer) {
        return URI.create("/api/shop/customers/" + customer.warehouseId() + "/" + customer.districtId() + "/"
                + customer.customerId());
    }
}
