package edu.yildiz.ecommerce.shop.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import edu.yildiz.ecommerce.shop.domain.Customer;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Request and response shapes of the customer API. */
public final class CustomerDtos {

    private CustomerDtos() {
    }

    public record CustomerView(long warehouseId, long districtId, long customerId, String firstName,
                               String lastName, String email, String city, String state, String region,
                               LocalDate since, String credit, BigDecimal creditLimit, BigDecimal balance,
                               BigDecimal discount) {

        public static CustomerView of(Customer customer) {
            return new CustomerView(customer.getWarehouseId(), customer.getDistrictId(), customer.getCustomerId(),
                    customer.getFirstName(), customer.getLastName(), customer.getEmail(), customer.getCity(),
                    customer.getState(), customer.getRegion(), customer.getSince(), customer.getCredit(),
                    customer.getCreditLimit(), customer.getBalance(), customer.getDiscount());
        }
    }

    public record CreateCustomerRequest(
            @NotNull Long warehouseId,
            @NotNull @Min(1) @Max(10) Long districtId,
            @NotBlank @Size(max = 16) String firstName,
            @NotBlank @Size(max = 16) String lastName,
            @NotBlank @Email @Size(max = 60) String email,
            @NotBlank @Size(max = 20) String city,
            @NotBlank @Size(max = 30) String region) {
    }

    public record UpdateCustomerRequest(
            @NotBlank @Size(max = 16) String firstName,
            @NotBlank @Size(max = 16) String lastName,
            @NotBlank @Email @Size(max = 60) String email,
            @NotBlank @Size(max = 20) String city,
            @NotBlank @Size(max = 30) String region) {
    }
}
