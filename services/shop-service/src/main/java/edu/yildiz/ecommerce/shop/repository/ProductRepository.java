package edu.yildiz.ecommerce.shop.repository;

import edu.yildiz.ecommerce.shop.domain.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Long> {

    @Query("select p from Product p where lower(p.name) like :pattern escape '!' "
            + "or lower(p.category) like :pattern escape '!' or lower(p.brand) like :pattern escape '!'")
    Page<Product> search(@Param("pattern") String pattern, Pageable pageable);

    @Query(value = "SELECT SEQ_ITEM_ID.NEXTVAL FROM DUAL", nativeQuery = true)
    Number nextId();
}
