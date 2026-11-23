package edu.yildiz.ecommerce.shop.repository;

import edu.yildiz.ecommerce.shop.domain.Customer;
import edu.yildiz.ecommerce.shop.domain.CustomerId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CustomerRepository extends JpaRepository<Customer, CustomerId> {

    @Query("select c from Customer c where (:warehouseId is null or c.warehouseId = :warehouseId) "
            + "and (lower(c.firstName) like :pattern escape '!' or lower(c.lastName) like :pattern escape '!' "
            + "or lower(c.email) like :pattern escape '!' or lower(c.city) like :pattern escape '!' "
            + "or lower(c.region) like :pattern escape '!')")
    Page<Customer> search(@Param("warehouseId") Long warehouseId, @Param("pattern") String pattern,
                          Pageable pageable);

    /** Highest customer number of a district, read inside the transaction that adds the next one. */
    @Query("select coalesce(max(c.customerId), 0) from Customer c "
            + "where c.warehouseId = :warehouseId and c.districtId = :districtId")
    Long maxCustomerId(@Param("warehouseId") Long warehouseId, @Param("districtId") Long districtId);

    boolean existsByWarehouseId(Long warehouseId);
}
