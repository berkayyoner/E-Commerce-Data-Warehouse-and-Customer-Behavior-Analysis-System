package edu.yildiz.ecommerce.shop.repository;

import edu.yildiz.ecommerce.shop.domain.Warehouse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WarehouseRepository extends JpaRepository<Warehouse, Long> {

    @Query("select w from Warehouse w where lower(w.name) like :pattern escape '!' "
            + "or lower(w.city) like :pattern escape '!' or lower(w.region) like :pattern escape '!'")
    Page<Warehouse> search(@Param("pattern") String pattern, Pageable pageable);

    @Query(value = "SELECT SEQ_WAREHOUSE_ID.NEXTVAL FROM DUAL", nativeQuery = true)
    Number nextId();
}
