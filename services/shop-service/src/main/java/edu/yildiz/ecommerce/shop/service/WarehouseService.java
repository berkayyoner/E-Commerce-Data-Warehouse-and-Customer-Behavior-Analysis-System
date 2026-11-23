package edu.yildiz.ecommerce.shop.service;

import java.util.List;
import java.util.Map;

import edu.yildiz.ecommerce.shop.domain.Warehouse;
import edu.yildiz.ecommerce.shop.dto.WarehouseDtos.WarehouseRequest;
import edu.yildiz.ecommerce.shop.dto.WarehouseDtos.WarehouseView;
import edu.yildiz.ecommerce.shop.model.PageResult;
import edu.yildiz.ecommerce.shop.repository.CustomerOrderRepository;
import edu.yildiz.ecommerce.shop.repository.CustomerRepository;
import edu.yildiz.ecommerce.shop.repository.WarehouseRepository;
import edu.yildiz.ecommerce.shop.support.Paging;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WarehouseService {

    private static final String DEFAULT_SORT = "id";

    private static final Map<String, List<String>> SORT_FIELDS = Map.of(
            "id", List.of("id"),
            "name", List.of("name"),
            "city", List.of("city"),
            "region", List.of("region"));

    private final WarehouseRepository warehouses;
    private final CustomerRepository customers;
    private final CustomerOrderRepository orders;

    public WarehouseService(WarehouseRepository warehouses, CustomerRepository customers,
                            CustomerOrderRepository orders) {
        this.warehouses = warehouses;
        this.customers = customers;
        this.orders = orders;
    }

    @Transactional(readOnly = true)
    public PageResult<WarehouseView> search(String search, String sort, String direction, int page, int size) {
        int safePage = Paging.page(page);
        int safeSize = Paging.size(size);
        Sort order = Paging.sort(SORT_FIELDS, sort, DEFAULT_SORT, direction);
        Page<Warehouse> result = warehouses.search(Paging.containsPattern(search),
                PageRequest.of(safePage, safeSize, order));
        return new PageResult<>(result.map(WarehouseView::of).getContent(), result.getTotalElements(), safePage,
                safeSize);
    }

    @Transactional(readOnly = true)
    public WarehouseView get(long id) {
        return WarehouseView.of(find(id));
    }

    /** The id comes from SEQ_WAREHOUSE_ID. */
    @Transactional
    public WarehouseView create(WarehouseRequest request) {
        long id = warehouses.nextId().longValue();
        Warehouse created = warehouses.save(new Warehouse(id, request.name(), request.city(), request.region()));
        return WarehouseView.of(created);
    }

    @Transactional
    public WarehouseView update(long id, WarehouseRequest request) {
        Warehouse existing = find(id);
        existing.change(request.name(), request.city(), request.region());
        return WarehouseView.of(existing);
    }

    /** A warehouse with customers or orders cannot be removed, the rows that point to it would be left dangling. */
    @Transactional
    public void delete(long id) {
        Warehouse existing = find(id);
        if (customers.existsByWarehouseId(id) || orders.existsByWarehouseId(id)) {
            throw new ConflictException("Warehouse " + id + " has customers or orders and cannot be deleted");
        }
        warehouses.delete(existing);
    }

    private Warehouse find(long id) {
        return warehouses.findById(id).orElseThrow(() -> new NotFoundException("Warehouse " + id + " was not found"));
    }
}
