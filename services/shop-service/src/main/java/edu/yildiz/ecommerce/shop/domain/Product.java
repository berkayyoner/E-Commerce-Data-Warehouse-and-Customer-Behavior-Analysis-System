package edu.yildiz.ecommerce.shop.domain;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** A product of the shop, stored in the ITEM table of the OLTP schema. */
@Entity
@Table(name = "ITEM")
public class Product {

    /** Image number given to every product created through the API. */
    private static final long DEFAULT_IMAGE_ID = 1L;

    @Id
    @Column(name = "I_ID")
    private Long id;

    @Column(name = "I_NAME", length = 24)
    private String name;

    @Column(name = "I_PRICE", precision = 5, scale = 2)
    private BigDecimal price;

    @Column(name = "I_DATA", length = 50)
    private String data;

    @Column(name = "I_IM_ID")
    private Long imageId;

    @Column(name = "I_CATEGORY", length = 30)
    private String category;

    @Column(name = "I_BRAND", length = 30)
    private String brand;

    protected Product() {
    }

    public Product(Long id, String name, BigDecimal price, String category, String brand) {
        this.id = id;
        this.imageId = DEFAULT_IMAGE_ID;
        this.data = name;
        this.name = name;
        this.price = price;
        this.category = category;
        this.brand = brand;
    }

    public void change(String name, BigDecimal price, String category, String brand) {
        this.name = name;
        this.data = name;
        this.price = price;
        this.category = category;
        this.brand = brand;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public String getData() {
        return data;
    }

    public Long getImageId() {
        return imageId;
    }

    public String getCategory() {
        return category;
    }

    public String getBrand() {
        return brand;
    }
}
