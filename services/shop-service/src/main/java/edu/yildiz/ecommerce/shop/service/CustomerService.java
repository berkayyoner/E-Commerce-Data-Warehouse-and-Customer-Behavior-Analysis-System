package edu.yildiz.ecommerce.shop.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import edu.yildiz.ecommerce.shop.domain.Customer;
import edu.yildiz.ecommerce.shop.domain.CustomerId;
import edu.yildiz.ecommerce.shop.dto.CustomerDtos.CreateCustomerRequest;
import edu.yildiz.ecommerce.shop.dto.CustomerDtos.CustomerView;
import edu.yildiz.ecommerce.shop.dto.CustomerDtos.UpdateCustomerRequest;
import edu.yildiz.ecommerce.shop.model.PageResult;
import edu.yildiz.ecommerce.shop.repository.CustomerRepository;
import edu.yildiz.ecommerce.shop.repository.WarehouseRepository;
import edu.yildiz.ecommerce.shop.support.Paging;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomerService {

    private static final String DEFAULT_SORT = "lastName";

    private static final Map<String, List<String>> SORT_FIELDS = Map.of(
            "id", List.of("warehouseId", "districtId", "customerId"),
            "firstName", List.of("firstName"),
            "lastName", List.of("lastName"),
            "city", List.of("city"),
            "region", List.of("region"),
            "since", List.of("since"),
            "balance", List.of("balance"));

    private final CustomerRepository customers;
    private final WarehouseRepository warehouses;

    public CustomerService(CustomerRepository customers, WarehouseRepository warehouses) {
        this.customers = customers;
        this.warehouses = warehouses;
    }

    @Transactional(readOnly = true)
    public PageResult<CustomerView> search(String search, Long warehouseId, String sort, String direction, int page,
                                           int size) {
        int safePage = Paging.page(page);
        int safeSize = Paging.size(size);
        Sort order = Paging.sort(SORT_FIELDS, sort, DEFAULT_SORT, direction);
        Page<Customer> result = customers.search(warehouseId, Paging.containsPattern(search),
                PageRequest.of(safePage, safeSize, order));
        return new PageResult<>(result.map(CustomerView::of).getContent(), result.getTotalElements(), safePage,
                safeSize);
    }

    @Transactional(readOnly = true)
    public CustomerView get(long warehouseId, long districtId, long customerId) {
        return CustomerView.of(find(warehouseId, districtId, customerId));
    }

    /**
     * The new customer number is the highest one in the district plus one. The read and the insert run in the
     * same transaction, so the number is chosen from the rows that are visible at that moment.
     */
    @Transactional
    public CustomerView create(CreateCustomerRequest request) {
        long warehouseId = request.warehouseId();
        long districtId = request.districtId();
        if (!warehouses.existsById(warehouseId)) {
            throw new NotFoundException("Warehouse " + warehouseId + " was not found");
        }
        Long highest = customers.maxCustomerId(warehouseId, districtId);
        long customerId = (highest == null ? 0 : highest) + 1;
        Customer created = customers.save(new Customer(new CustomerId(warehouseId, districtId, customerId),
                request.firstName(), request.lastName(), request.email(), request.city(), request.region(),
                LocalDate.now()));
        return CustomerView.of(created);
    }

    @Transactional
    public CustomerView update(long warehouseId, long districtId, long customerId, UpdateCustomerRequest request) {
        Customer existing = find(warehouseId, districtId, customerId);
        existing.change(request.firstName(), request.lastName(), request.email(), request.city(), request.region());
        return CustomerView.of(existing);
    }

    private Customer find(long warehouseId, long districtId, long customerId) {
        return customers.findById(new CustomerId(warehouseId, districtId, customerId)).orElseThrow(
                () -> new NotFoundException(
                        "Customer " + warehouseId + "/" + districtId + "/" + customerId + " was not found"));
    }
}
