package edu.yildiz.ecommerce.shop.service;

import java.util.List;
import java.util.Map;

import edu.yildiz.ecommerce.shop.domain.Product;
import edu.yildiz.ecommerce.shop.dto.ProductDtos.ProductRequest;
import edu.yildiz.ecommerce.shop.dto.ProductDtos.ProductView;
import edu.yildiz.ecommerce.shop.model.PageResult;
import edu.yildiz.ecommerce.shop.repository.OrderLineRepository;
import edu.yildiz.ecommerce.shop.repository.ProductRepository;
import edu.yildiz.ecommerce.shop.support.Paging;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductService {

    private static final String DEFAULT_SORT = "id";

    private static final Map<String, List<String>> SORT_FIELDS = Map.of(
            "id", List.of("id"),
            "name", List.of("name"),
            "category", List.of("category"),
            "brand", List.of("brand"),
            "price", List.of("price"));

    private final ProductRepository products;
    private final OrderLineRepository orderLines;

    public ProductService(ProductRepository products, OrderLineRepository orderLines) {
        this.products = products;
        this.orderLines = orderLines;
    }

    @Transactional(readOnly = true)
    public PageResult<ProductView> search(String search, String sort, String direction, int page, int size) {
        int safePage = Paging.page(page);
        int safeSize = Paging.size(size);
        Sort order = Paging.sort(SORT_FIELDS, sort, DEFAULT_SORT, direction);
        Page<Product> result = products.search(Paging.containsPattern(search),
                PageRequest.of(safePage, safeSize, order));
        return new PageResult<>(result.map(ProductView::of).getContent(), result.getTotalElements(), safePage,
                safeSize);
    }

    @Transactional(readOnly = true)
    public ProductView get(long id) {
        return ProductView.of(find(id));
    }

    /** The id comes from SEQ_ITEM_ID, the same sequence the OLTP schema uses for its items. */
    @Transactional
    public ProductView create(ProductRequest request) {
        long id = products.nextId().longValue();
        Product created = products.save(
                new Product(id, request.name(), request.price(), request.category(), request.brand()));
        return ProductView.of(created);
    }

    @Transactional
    public ProductView update(long id, ProductRequest request) {
        Product existing = find(id);
        existing.change(request.name(), request.price(), request.category(), request.brand());
        return ProductView.of(existing);
    }

    /** A product that appears in an order line is kept, because the order history still refers to it. */
    @Transactional
    public void delete(long id) {
        Product existing = find(id);
        if (orderLines.existsByItemId(id)) {
            throw new ConflictException("Product " + id + " appears in order lines and cannot be deleted");
        }
        products.delete(existing);
    }

    private Product find(long id) {
        return products.findById(id).orElseThrow(() -> new NotFoundException("Product " + id + " was not found"));
    }
}
