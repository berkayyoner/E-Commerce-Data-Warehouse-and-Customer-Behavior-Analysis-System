package edu.yildiz.ecommerce.shop.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import edu.yildiz.ecommerce.shop.domain.Customer;
import edu.yildiz.ecommerce.shop.domain.CustomerId;
import edu.yildiz.ecommerce.shop.domain.CustomerOrder;
import edu.yildiz.ecommerce.shop.domain.OrderId;
import edu.yildiz.ecommerce.shop.domain.OrderLine;
import edu.yildiz.ecommerce.shop.domain.Product;
import edu.yildiz.ecommerce.shop.dto.OrderDtos.OrderDetailView;
import edu.yildiz.ecommerce.shop.dto.OrderDtos.OrderLineView;
import edu.yildiz.ecommerce.shop.dto.OrderDtos.OrderSummaryView;
import edu.yildiz.ecommerce.shop.model.PageResult;
import edu.yildiz.ecommerce.shop.repository.CustomerOrderRepository;
import edu.yildiz.ecommerce.shop.repository.CustomerRepository;
import edu.yildiz.ecommerce.shop.repository.OrderLineRepository;
import edu.yildiz.ecommerce.shop.repository.OrderSummaryQuery;
import edu.yildiz.ecommerce.shop.repository.OrderSummaryQuery.Filter;
import edu.yildiz.ecommerce.shop.repository.ProductRepository;
import edu.yildiz.ecommerce.shop.support.Paging;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Read only access to the orders. The totals are computed from the lines and never stored. */
@Service
public class OrderService {

    private static final String DEFAULT_SORT = "orderDate";

    /** SQL columns behind each sort key. The total is the alias of the correlated sum in the list query. */
    private static final Map<String, List<String>> SORT_COLUMNS = Map.of(
            "orderDate", List.of("o.O_ENTRY_D"),
            "totalAmount", List.of("total_amount"),
            "lineCount", List.of("o.O_OL_CNT"),
            "customerName", List.of("c.C_LAST", "c.C_FIRST"),
            "orderId", List.of("o.O_ID"));

    private final OrderSummaryQuery summaries;
    private final CustomerOrderRepository orders;
    private final CustomerRepository customers;
    private final OrderLineRepository orderLines;
    private final ProductRepository products;

    public OrderService(OrderSummaryQuery summaries, CustomerOrderRepository orders, CustomerRepository customers,
                        OrderLineRepository orderLines, ProductRepository products) {
        this.summaries = summaries;
        this.orders = orders;
        this.customers = customers;
        this.orderLines = orderLines;
        this.products = products;
    }

    /** Dates are whole days: {@code to} includes the whole day it names. */
    @Transactional(readOnly = true)
    public PageResult<OrderSummaryView> search(String search, Long warehouseId, LocalDate from, LocalDate to,
                                               String sort, String direction, int page, int size) {
        if (from != null && to != null && to.isBefore(from)) {
            throw new IllegalArgumentException("The to date must not be before the from date");
        }
        int safePage = Paging.page(page);
        int safeSize = Paging.size(size);
        Filter filter = new Filter(search, warehouseId,
                from == null ? null : from.atStartOfDay(),
                to == null ? null : to.plusDays(1).atStartOfDay());
        List<String> columns = Paging.columns(SORT_COLUMNS, sort, DEFAULT_SORT);
        List<OrderSummaryView> content = summaries.findPage(filter, columns, Paging.ascending(direction),
                (long) safePage * safeSize, safeSize);
        return new PageResult<>(content, summaries.count(filter), safePage, safeSize);
    }

    @Transactional(readOnly = true)
    public OrderDetailView get(long warehouseId, long districtId, long orderId) {
        CustomerOrder order = orders.findById(new OrderId(warehouseId, districtId, orderId)).orElseThrow(
                () -> new NotFoundException(
                        "Order " + warehouseId + "/" + districtId + "/" + orderId + " was not found"));
        String customerName = customers
                .findById(new CustomerId(warehouseId, districtId, order.getCustomerId()))
                .map(OrderService::customerName)
                .orElse("");

        List<OrderLine> lines = orderLines.findByWarehouseIdAndDistrictIdAndOrderIdOrderByLineNumberAsc(
                warehouseId, districtId, orderId);
        List<Long> itemIds = lines.stream().map(OrderLine::getItemId).distinct().toList();
        Map<Long, String> productNames = products.findAllById(itemIds).stream()
                .collect(Collectors.toMap(Product::getId, Product::getName));

        List<OrderLineView> lineViews = lines.stream()
                .map(line -> new OrderLineView(line.getLineNumber(), line.getItemId(),
                        productNames.getOrDefault(line.getItemId(), ""), line.getQuantity(), line.getAmount(),
                        line.getDeliveryDate()))
                .toList();
        BigDecimal total = lines.stream().map(OrderLine::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        return new OrderDetailView(order.getWarehouseId(), order.getDistrictId(), order.getOrderId(),
                order.getCustomerId(), customerName, order.getEntryDate(), order.getPaymentMethod(),
                order.getLineCount(), total, order.getCarrierId() != null, lineViews);
    }

    private static String customerName(Customer customer) {
        return customer.getFirstName() + " " + customer.getLastName();
    }
}
