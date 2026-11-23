package edu.yildiz.ecommerce.shop.web;

import java.time.LocalDate;

import edu.yildiz.ecommerce.shop.dto.OrderDtos.OrderDetailView;
import edu.yildiz.ecommerce.shop.dto.OrderDtos.OrderSummaryView;
import edu.yildiz.ecommerce.shop.model.PageResult;
import edu.yildiz.ecommerce.shop.service.OrderService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/shop/orders")
public class OrderController {

    private final OrderService service;

    public OrderController(OrderService service) {
        this.service = service;
    }

    @GetMapping
    public PageResult<OrderSummaryView> list(@RequestParam(defaultValue = "") String search,
                                             @RequestParam(required = false) Long warehouseId,
                                             @RequestParam(required = false) LocalDate from,
                                             @RequestParam(required = false) LocalDate to,
                                             @RequestParam(defaultValue = "orderDate") String sort,
                                             @RequestParam(defaultValue = "desc") String direction,
                                             @RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "20") int size) {
        return service.search(search, warehouseId, from, to, sort, direction, page, size);
    }

    @GetMapping("/{warehouseId}/{districtId}/{orderId}")
    public OrderDetailView get(@PathVariable long warehouseId, @PathVariable long districtId,
                               @PathVariable long orderId) {
        return service.get(warehouseId, districtId, orderId);
    }
}
