package edu.yildiz.ecommerce.shop.web;

import java.net.URI;

import edu.yildiz.ecommerce.shop.dto.ProductDtos.ProductRequest;
import edu.yildiz.ecommerce.shop.dto.ProductDtos.ProductView;
import edu.yildiz.ecommerce.shop.model.PageResult;
import edu.yildiz.ecommerce.shop.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
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
@RequestMapping("/api/shop/products")
public class ProductController {

    private final ProductService service;

    public ProductController(ProductService service) {
        this.service = service;
    }

    @GetMapping
    public PageResult<ProductView> list(@RequestParam(defaultValue = "") String search,
                                        @RequestParam(defaultValue = "id") String sort,
                                        @RequestParam(defaultValue = "asc") String direction,
                                        @RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "20") int size) {
        return service.search(search, sort, direction, page, size);
    }

    @GetMapping("/{id}")
    public ProductView get(@PathVariable long id) {
        return service.get(id);
    }

    @PostMapping
    public ResponseEntity<ProductView> create(@Valid @RequestBody ProductRequest request) {
        ProductView created = service.create(request);
        return ResponseEntity.created(URI.create("/api/shop/products/" + created.id())).body(created);
    }

    @PutMapping("/{id}")
    public ProductView update(@PathVariable long id, @Valid @RequestBody ProductRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
