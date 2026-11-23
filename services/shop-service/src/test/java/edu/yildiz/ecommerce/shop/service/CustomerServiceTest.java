package edu.yildiz.ecommerce.shop.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import edu.yildiz.ecommerce.shop.domain.Customer;
import edu.yildiz.ecommerce.shop.domain.CustomerId;
import edu.yildiz.ecommerce.shop.dto.CustomerDtos.CreateCustomerRequest;
import edu.yildiz.ecommerce.shop.dto.CustomerDtos.CustomerView;
import edu.yildiz.ecommerce.shop.dto.CustomerDtos.UpdateCustomerRequest;
import edu.yildiz.ecommerce.shop.model.PageResult;
import edu.yildiz.ecommerce.shop.repository.CustomerRepository;
import edu.yildiz.ecommerce.shop.repository.WarehouseRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

class CustomerServiceTest {

    private final CustomerRepository customers = mock(CustomerRepository.class);
    private final WarehouseRepository warehouses = mock(WarehouseRepository.class);
    private final CustomerService service = new CustomerService(customers, warehouses);

    private static CreateCustomerRequest newCustomer(long warehouseId, long districtId) {
        return new CreateCustomerRequest(warehouseId, districtId, "Ayse", "Demir", "ayse@example.com", "Ankara",
                "Central");
    }

    @Test
    void createNumbersTheNewCustomerAfterTheHighestInTheDistrict() {
        when(warehouses.existsById(3L)).thenReturn(true);
        when(customers.maxCustomerId(3L, 4L)).thenReturn(3000L);
        when(customers.save(any(Customer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CustomerView created = service.create(newCustomer(3L, 4L));

        assertThat(created.warehouseId()).isEqualTo(3L);
        assertThat(created.districtId()).isEqualTo(4L);
        assertThat(created.customerId()).isEqualTo(3001L);
    }

    @Test
    void createStartsAtOneInAnEmptyDistrict() {
        when(warehouses.existsById(1L)).thenReturn(true);
        when(customers.maxCustomerId(1L, 1L)).thenReturn(null);
        when(customers.save(any(Customer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CustomerView created = service.create(newCustomer(1L, 1L));

        assertThat(created.customerId()).isEqualTo(1L);
    }

    @Test
    void createFillsTheColumnsTheFormDoesNotAsk() {
        when(warehouses.existsById(2L)).thenReturn(true);
        when(customers.maxCustomerId(2L, 2L)).thenReturn(10L);
        when(customers.save(any(Customer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CustomerView created = service.create(newCustomer(2L, 2L));

        assertThat(created.credit()).isEqualTo("GC");
        assertThat(created.creditLimit()).isEqualByComparingTo(new BigDecimal("50000"));
        assertThat(created.balance()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(created.discount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(created.state()).isEqualTo("TR");
        assertThat(created.since()).isEqualTo(LocalDate.now());
    }

    @Test
    void createFailsForAnUnknownWarehouse() {
        when(warehouses.existsById(9L)).thenReturn(false);

        assertThatThrownBy(() -> service.create(newCustomer(9L, 1L))).isInstanceOf(NotFoundException.class);
        verify(customers, never()).save(any(Customer.class));
    }

    @Test
    void updateChangesTheContactFieldsAndKeepsTheCreditColumns() {
        Customer existing = new Customer(new CustomerId(1L, 1L, 5L), "Mert", "Kaya", "old@example.com", "Izmir",
                "Aegean", LocalDate.of(2026, 1, 1));
        when(customers.findById(new CustomerId(1L, 1L, 5L))).thenReturn(Optional.of(existing));

        CustomerView updated = service.update(1L, 1L, 5L,
                new UpdateCustomerRequest("Mehmet", "Kaya", "new@example.com", "Bursa", "Marmara"));

        assertThat(updated.firstName()).isEqualTo("Mehmet");
        assertThat(updated.city()).isEqualTo("Bursa");
        assertThat(updated.credit()).isEqualTo("GC");
    }

    @Test
    void getFailsForAnUnknownCustomer() {
        when(customers.findById(new CustomerId(1L, 1L, 999L))).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.get(1L, 1L, 999L)).isInstanceOf(NotFoundException.class);
    }

    @Test
    void searchClampsThePageSize() {
        when(customers.search(any(), anyString(), any(Pageable.class))).thenReturn(Page.empty());

        PageResult<CustomerView> result = service.search("", null, "lastName", "asc", 0, 1000);

        assertThat(result.size()).isEqualTo(100);
    }
}
