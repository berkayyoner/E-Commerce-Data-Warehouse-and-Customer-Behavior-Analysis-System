package edu.yildiz.ecommerce.shop.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;

import edu.yildiz.ecommerce.shop.domain.Warehouse;
import edu.yildiz.ecommerce.shop.dto.WarehouseDtos.WarehouseRequest;
import edu.yildiz.ecommerce.shop.dto.WarehouseDtos.WarehouseView;
import edu.yildiz.ecommerce.shop.repository.CustomerOrderRepository;
import edu.yildiz.ecommerce.shop.repository.CustomerRepository;
import edu.yildiz.ecommerce.shop.repository.WarehouseRepository;
import org.junit.jupiter.api.Test;

class WarehouseServiceTest {

    private final WarehouseRepository warehouses = mock(WarehouseRepository.class);
    private final CustomerRepository customers = mock(CustomerRepository.class);
    private final CustomerOrderRepository orders = mock(CustomerOrderRepository.class);
    private final WarehouseService service = new WarehouseService(warehouses, customers, orders);

    @Test
    void createTakesTheNextWarehouseNumberAndTheDefaultTaxRate() {
        when(warehouses.nextId()).thenReturn(3L);
        when(warehouses.save(any(Warehouse.class))).thenAnswer(invocation -> invocation.getArgument(0));

        WarehouseView created = service.create(new WarehouseRequest("North", "Ankara", "Central"));

        assertThat(created.id()).isEqualTo(3L);
        assertThat(created.state()).isEqualTo("TR");
        assertThat(created.tax()).isEqualByComparingTo(new BigDecimal("0.1"));
    }

    @Test
    void deleteRefusesAWarehouseThatHasCustomers() {
        when(warehouses.findById(2L)).thenReturn(Optional.of(new Warehouse(2L, "East", "Izmir", "Aegean")));
        when(customers.existsByWarehouseId(2L)).thenReturn(true);

        assertThatThrownBy(() -> service.delete(2L)).isInstanceOf(ConflictException.class);
        verify(warehouses, never()).delete(any(Warehouse.class));
    }

    @Test
    void deleteRefusesAWarehouseThatHasOrders() {
        when(warehouses.findById(2L)).thenReturn(Optional.of(new Warehouse(2L, "East", "Izmir", "Aegean")));
        when(orders.existsByWarehouseId(2L)).thenReturn(true);

        assertThatThrownBy(() -> service.delete(2L)).isInstanceOf(ConflictException.class);
        verify(warehouses, never()).delete(any(Warehouse.class));
    }

    @Test
    void deleteRemovesAWarehouseWithoutCustomersOrOrders() {
        Warehouse empty = new Warehouse(4L, "Spare", "Bursa", "Marmara");
        when(warehouses.findById(4L)).thenReturn(Optional.of(empty));

        service.delete(4L);

        verify(warehouses).delete(empty);
    }

    @Test
    void updateFailsForAnUnknownWarehouse() {
        when(warehouses.findById(77L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(77L, new WarehouseRequest("X", "Y", "Z")))
                .isInstanceOf(NotFoundException.class);
    }
}
