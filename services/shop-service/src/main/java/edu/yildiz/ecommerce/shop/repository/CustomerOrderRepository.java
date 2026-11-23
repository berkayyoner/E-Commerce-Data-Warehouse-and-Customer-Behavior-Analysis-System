package edu.yildiz.ecommerce.shop.repository;

import edu.yildiz.ecommerce.shop.domain.CustomerOrder;
import edu.yildiz.ecommerce.shop.domain.OrderId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, OrderId> {

    boolean existsByWarehouseId(Long warehouseId);
}
