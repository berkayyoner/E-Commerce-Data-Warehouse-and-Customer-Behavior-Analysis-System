package edu.yildiz.ecommerce.shop.domain;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** A warehouse of the OLTP schema, stored in the WAREHOUSE table. */
@Entity
@Table(name = "WAREHOUSE")
public class Warehouse {

    private static final String PLACEHOLDER = "-";

    @Id
    @Column(name = "W_ID")
    private Long id;

    @Column(name = "W_YTD", precision = 12, scale = 2)
    private BigDecimal ytd;

    @Column(name = "W_TAX", precision = 4, scale = 4)
    private BigDecimal tax;

    @Column(name = "W_NAME", length = 10)
    private String name;

    @Column(name = "W_STREET_1", length = 20)
    private String street1;

    @Column(name = "W_STREET_2", length = 20)
    private String street2;

    @Column(name = "W_CITY", length = 20)
    private String city;

    @Column(name = "W_STATE", length = 2)
    private String state;

    @Column(name = "W_ZIP", length = 9)
    private String zip;

    @Column(name = "W_REGION", length = 30)
    private String region;

    protected Warehouse() {
    }

    /** A warehouse created through the API: the address fields and the tax rate get neutral defaults. */
    public Warehouse(Long id, String name, String city, String region) {
        this.id = id;
        this.name = name;
        this.street1 = PLACEHOLDER;
        this.street2 = PLACEHOLDER;
        this.city = city;
        this.state = "TR";
        this.zip = "000000000";
        this.region = region;
        this.tax = new BigDecimal("0.1000");
        this.ytd = BigDecimal.ZERO;
    }

    public void change(String name, String city, String region) {
        this.name = name;
        this.city = city;
        this.region = region;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getCity() {
        return city;
    }

    public String getState() {
        return state;
    }

    public String getRegion() {
        return region;
    }

    public BigDecimal getTax() {
        return tax;
    }

    public BigDecimal getYtd() {
        return ytd;
    }
}
