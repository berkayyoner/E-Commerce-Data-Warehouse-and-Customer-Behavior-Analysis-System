import { translate } from '../../hooks/useT'
import {
  buildCreatePayload,
  buildUpdatePayload,
  customerIdentifier,
  initialValues,
  validateCustomerForm,
} from './customerForm'

const t = (key, params) => translate('en', key, params)

const VALID = {
  warehouseId: '2',
  districtId: '9',
  firstName: 'Ayse',
  lastName: 'Demir',
  email: 'ayse@example.test',
  city: 'Istanbul',
  region: 'Marmara',
}

test('a customer is identified by warehouse, district and customer number', () => {
  expect(customerIdentifier({ warehouseId: 1, districtId: 3, customerId: 120 })).toBe('1-3-120')
})

test('the district must be a whole number from 1 to 10 when creating', () => {
  expect(validateCustomerForm({ ...VALID, districtId: '0' }, { isCreate: true }, t).districtId).toBe(
    'Use a district number from 1 to 10.',
  )
  expect(validateCustomerForm({ ...VALID, districtId: '2.5' }, { isCreate: true }, t).districtId).toBe(
    'Use a district number from 1 to 10.',
  )
  expect(validateCustomerForm({ ...VALID, districtId: '10' }, { isCreate: true }, t)).toEqual({})
})

test('names are limited to 16 characters and the e-mail address must be valid and at most 60 characters', () => {
  const errors = validateCustomerForm(
    { ...VALID, firstName: 'A'.repeat(17), email: 'not-an-address' },
    { isCreate: true },
    t,
  )

  expect(errors.firstName).toBe('Use at most 16 characters.')
  expect(errors.email).toBe('Enter a valid e-mail address.')
})

test('editing does not check the warehouse or the district', () => {
  const values = initialValues({ warehouseId: 1, districtId: 3, customerId: 120, ...VALID })

  expect(validateCustomerForm({ ...values, warehouseId: '', districtId: '' }, { isCreate: false }, t)).toEqual({})
})

test('the create payload carries the key as numbers and the trimmed details', () => {
  const payload = buildCreatePayload({ ...VALID, firstName: ' Zeynep ', districtId: '5' })

  expect(payload).toEqual({
    warehouseId: 2,
    districtId: 5,
    firstName: 'Zeynep',
    lastName: 'Demir',
    email: 'ayse@example.test',
    city: 'Istanbul',
    region: 'Marmara',
  })
})

test('the update payload never includes the warehouse or the district', () => {
  expect(Object.keys(buildUpdatePayload(VALID))).toEqual(['firstName', 'lastName', 'email', 'city', 'region'])
})
