package edu.yildiz.ecommerce.shop.domain;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

/** A customer of the OLTP schema, stored in the CUSTOMER table under a warehouse and district. */
@Entity
@Table(name = "CUSTOMER")
@IdClass(CustomerId.class)
public class Customer {

    private static final String PLACEHOLDER = "-";

    @Id
    @Column(name = "C_W_ID")
    private Long warehouseId;

    @Id
    @Column(name = "C_D_ID")
    private Long districtId;

    @Id
    @Column(name = "C_ID")
    private Long customerId;

    @Column(name = "C_DISCOUNT", precision = 4, scale = 4)
    private BigDecimal discount;

    @Column(name = "C_CREDIT", length = 2)
    private String credit;

    @Column(name = "C_LAST", length = 16)
    private String lastName;

    @Column(name = "C_FIRST", length = 16)
    private String firstName;

    @Column(name = "C_CREDIT_LIM", precision = 12, scale = 2)
    private BigDecimal creditLimit;

    @Column(name = "C_BALANCE", precision = 12, scale = 2)
    private BigDecimal balance;

    @Column(name = "C_YTD_PAYMENT")
    private BigDecimal ytdPayment;

    @Column(name = "C_PAYMENT_CNT")
    private Integer paymentCount;

    @Column(name = "C_DELIVERY_CNT")
    private Integer deliveryCount;

    @Column(name = "C_STREET_1", length = 20)
    private String street1;

    @Column(name = "C_STREET_2", length = 20)
    private String street2;

    @Column(name = "C_CITY", length = 20)
    private String city;

    @Column(name = "C_STATE", length = 2)
    private String state;

    @Column(name = "C_ZIP", length = 9)
    private String zip;

    @Column(name = "C_PHONE", length = 16)
    private String phone;

    @Column(name = "C_SINCE")
    private LocalDate since;

    @Column(name = "C_MIDDLE", length = 2)
    private String middle;

    @Column(name = "C_DATA", length = 500)
    private String data;

    @Column(name = "C_REGION", length = 30)
    private String region;

    @Column(name = "C_EMAIL", length = 60)
    private String email;

    protected Customer() {
    }

    /** A customer created through the API: the columns the form does not ask for get neutral defaults. */
    public Customer(CustomerId id, String firstName, String lastName, String email, String city, String region,
                    LocalDate since) {
        this.warehouseId = id.getWarehouseId();
        this.districtId = id.getDistrictId();
        this.customerId = id.getCustomerId();
        this.firstName = firstName;
        this.middle = "OE";
        this.lastName = lastName;
        this.email = email;
        this.city = city;
        this.region = region;
        this.since = since;
        this.street1 = PLACEHOLDER;
        this.street2 = PLACEHOLDER;
        this.state = "TR";
        this.zip = "000000000";
        this.phone = "0000000000000000";
        this.credit = "GC";
        this.creditLimit = new BigDecimal("50000.00");
        this.discount = BigDecimal.ZERO;
        this.balance = BigDecimal.ZERO;
        this.ytdPayment = BigDecimal.ZERO;
        this.paymentCount = 0;
        this.deliveryCount = 0;
        this.data = PLACEHOLDER;
    }

    /** Only the contact fields can be changed; the credit and balance columns belong to the payment process. */
    public void change(String firstName, String lastName, String email, String city, String region) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.city = city;
        this.region = region;
    }

    public Long getWarehouseId() {
        return warehouseId;
    }

    public Long getDistrictId() {
        return districtId;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public String getEmail() {
        return email;
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

    public LocalDate getSince() {
        return since;
    }

    public String getCredit() {
        return credit;
    }

    public BigDecimal getCreditLimit() {
        return creditLimit;
    }

    public BigDecimal getBalance() {
        return balance;
    }

    public BigDecimal getDiscount() {
        return discount;
    }
}
