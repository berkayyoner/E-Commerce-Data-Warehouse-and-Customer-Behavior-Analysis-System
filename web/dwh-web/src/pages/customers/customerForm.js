import { checkEmail, checkText } from '../shop/shopValidation'

export const DISTRICT_MIN = 1
export const DISTRICT_MAX = 10

/** The identifier shown to people: warehouse-district-customer, for example 3-7-1204. */
export function customerIdentifier(customer) {
  return `${customer.warehouseId}-${customer.districtId}-${customer.customerId}`
}

/** Form values for a new customer (customer is null) or for an existing one. */
export function initialValues(customer) {
  return {
    warehouseId: customer ? String(customer.warehouseId) : '',
    districtId: customer ? String(customer.districtId) : '',
    firstName: customer ? customer.firstName : '',
    lastName: customer ? customer.lastName : '',
    email: customer ? customer.email : '',
    city: customer ? customer.city : '',
    region: customer ? customer.region : '',
  }
}

/** Messages keyed by field name. An empty object means the form can be sent. */
export function validateCustomerForm(values, { isCreate }, t) {
  const errors = {}

  if (isCreate) {
    if (!values.warehouseId) {
      errors.warehouseId = t('common.validation.required')
    }
    const district = Number(values.districtId)
    if (!String(values.districtId).trim()) {
      errors.districtId = t('common.validation.required')
    } else if (!Number.isInteger(district) || district < DISTRICT_MIN || district > DISTRICT_MAX) {
      errors.districtId = t('customers.errors.district')
    }
  }

  checkText(errors, 'firstName', values.firstName, 16, t)
  checkText(errors, 'lastName', values.lastName, 16, t)
  checkEmail(errors, 'email', values.email, 60, t)
  checkText(errors, 'city', values.city, 20, t)
  checkText(errors, 'region', values.region, 30, t)
  return errors
}

/** Body of POST /api/shop/customers. The key is chosen by the service. */
export function buildCreatePayload(values) {
  return {
    warehouseId: Number(values.warehouseId),
    districtId: Number(values.districtId),
    ...buildUpdatePayload(values),
  }
}

/** Body of PUT /api/shop/customers/{warehouse}/{district}/{customer}. The key does not change. */
export function buildUpdatePayload(values) {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email.trim(),
    city: values.city.trim(),
    region: values.region.trim(),
  }
}
