import { checkText } from '../shop/shopValidation'

export const PRICE_MIN = 0.01
export const PRICE_MAX = 999.99
const PRICE_PATTERN = /^\d{1,3}(\.\d{1,2})?$/

/** Form values for a new product (product is null) or for an existing one. */
export function initialValues(product) {
  return {
    name: product ? product.name : '',
    price: product ? String(product.price) : '',
    category: product ? product.category : '',
    brand: product ? product.brand : '',
  }
}

/** True when the text is a price the service accepts: 0.01 to 999.99 with at most two decimals. */
export function isValidPrice(text) {
  if (!PRICE_PATTERN.test(text)) {
    return false
  }
  const value = Number(text)
  return value >= PRICE_MIN && value <= PRICE_MAX
}

/** Messages keyed by field name. An empty object means the form can be sent. */
export function validateProductForm(values, t) {
  const errors = {}
  checkText(errors, 'name', values.name, 24, t)

  const price = values.price.trim()
  if (!price) {
    errors.price = t('common.validation.required')
  } else if (!isValidPrice(price)) {
    errors.price = t('products.errors.price')
  }

  checkText(errors, 'category', values.category, 30, t)
  checkText(errors, 'brand', values.brand, 30, t)
  return errors
}

/** Body of POST and PUT /api/shop/products. */
export function buildPayload(values) {
  return {
    name: values.name.trim(),
    price: Number(values.price.trim()),
    category: values.category.trim(),
    brand: values.brand.trim(),
  }
}
