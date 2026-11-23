package edu.yildiz.ecommerce.shop.repository;

import java.util.List;

import edu.yildiz.ecommerce.shop.domain.OrderLine;
import edu.yildiz.ecommerce.shop.domain.OrderLineId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderLineRepository extends JpaRepository<OrderLine, OrderLineId> {

    boolean existsByItemId(Long itemId);

    List<OrderLine> findByWarehouseIdAndDistrictIdAndOrderIdOrderByLineNumberAsc(Long warehouseId, Long districtId,
                                                                                 Long orderId);
}
