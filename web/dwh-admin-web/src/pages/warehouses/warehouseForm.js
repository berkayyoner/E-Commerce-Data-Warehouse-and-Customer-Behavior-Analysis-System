import { checkText } from '../shop/shopValidation'

/** Form values for a new warehouse (warehouse is null) or for an existing one. */
export function initialValues(warehouse) {
  return {
    name: warehouse ? warehouse.name : '',
    city: warehouse ? warehouse.city : '',
    region: warehouse ? warehouse.region : '',
  }
}

/** Messages keyed by field name. An empty object means the form can be sent. */
export function validateWarehouseForm(values, t) {
  const errors = {}
  checkText(errors, 'name', values.name, 10, t)
  checkText(errors, 'city', values.city, 20, t)
  checkText(errors, 'region', values.region, 30, t)
  return errors
}

/** Body of POST and PUT /api/shop/warehouses. */
export function buildPayload(values) {
  return {
    name: values.name.trim(),
    city: values.city.trim(),
    region: values.region.trim(),
  }
}
