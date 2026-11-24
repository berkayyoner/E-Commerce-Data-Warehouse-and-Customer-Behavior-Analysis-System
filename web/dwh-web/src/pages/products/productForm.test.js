import { translate } from '../../hooks/useT'
import { buildPayload, initialValues, isValidPrice, validateProductForm } from './productForm'

const t = (key, params) => translate('en', key, params)

test('a price is valid from 0.01 to 999.99 with at most two decimals', () => {
  expect(isValidPrice('0.01')).toBe(true)
  expect(isValidPrice('999.99')).toBe(true)
  expect(isValidPrice('12.5')).toBe(true)
  expect(isValidPrice('0')).toBe(false)
  expect(isValidPrice('1000')).toBe(false)
  expect(isValidPrice('1.999')).toBe(false)
  expect(isValidPrice('1e3')).toBe(false)
})

test('the name, category and brand have their length limits', () => {
  const errors = validateProductForm(
    { name: 'N'.repeat(25), price: '10', category: 'C'.repeat(31), brand: 'B'.repeat(31) },
    t,
  )

  expect(errors).toEqual({
    name: 'Use at most 24 characters.',
    category: 'Use at most 30 characters.',
    brand: 'Use at most 30 characters.',
  })
})

test('the price message is shown for a price that the service would refuse', () => {
  const errors = validateProductForm({ name: 'Kettle', price: '2.555', category: 'Kitchen', brand: 'Brewmaster' }, t)

  expect(errors.price).toBe('Enter a price from 0.01 to 999.99 with at most two decimals.')
})

test('the payload sends the price as a number and trims the texts', () => {
  expect(
    buildPayload({ name: ' Toaster ', price: ' 19.90 ', category: 'Kitchen ', brand: ' Mixwell' }),
  ).toEqual({ name: 'Toaster', price: 19.9, category: 'Kitchen', brand: 'Mixwell' })
  expect(initialValues({ name: 'Kettle', price: 19.9, category: 'Kitchen', brand: 'Brewmaster' }).price).toBe('19.9')
})
