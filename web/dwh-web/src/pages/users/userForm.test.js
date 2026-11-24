import { translate } from '../../hooks/useT'
import { buildCreatePayload, buildUpdatePayload, initialValues, validateUserForm } from './userForm'

const t = (key) => translate('en', key)

test('creating an account requires a username, a display name and a password', () => {
  const errors = validateUserForm(initialValues(null), { isCreate: true }, t)

  expect(errors).toEqual({
    username: 'This field is required.',
    displayName: 'This field is required.',
    password: 'This field is required.',
  })
})

test('a username must be 3 to 60 characters of letters, digits, dot, dash or underscore', () => {
  const base = { ...initialValues(null), displayName: 'Ayse', password: 'long-enough-password' }

  expect(validateUserForm({ ...base, username: 'ab' }, { isCreate: true }, t).username).toBe(
    'Use between 3 and 60 characters.',
  )
  expect(validateUserForm({ ...base, username: 'ayse demir' }, { isCreate: true }, t).username).toBe(
    'Use only letters, digits, dot, dash and underscore.',
  )
  expect(validateUserForm({ ...base, username: 'ayse.demir_1' }, { isCreate: true }, t)).toEqual({})
})

test('a password must be 8 to 72 characters and is optional when editing', () => {
  const values = initialValues({ id: 1, username: 'ayse', displayName: 'Ayse', email: '', role: 'ANALYST', enabled: true })

  expect(validateUserForm(values, { isCreate: false }, t)).toEqual({})
  expect(validateUserForm({ ...values, password: 'short' }, { isCreate: false }, t).password).toBe(
    'Use between 8 and 72 characters.',
  )
  expect(validateUserForm({ ...values, password: 'x'.repeat(73) }, { isCreate: false }, t).password).toBe(
    'Use between 8 and 72 characters.',
  )
})

test('the create payload leaves out an empty e-mail address and trims the names', () => {
  const payload = buildCreatePayload({
    ...initialValues(null),
    username: ' ayse ',
    displayName: ' Ayse Demir ',
    password: 'correct-horse-battery',
    role: 'ANALYST',
    email: '',
  })

  expect(payload).toEqual({
    username: 'ayse',
    password: 'correct-horse-battery',
    displayName: 'Ayse Demir',
    role: 'ANALYST',
  })
})

test('the update payload sends a null e-mail when it is cleared and no password unless one was typed', () => {
  const values = initialValues({ id: 1, username: 'ayse', displayName: 'Ayse', email: 'a@b.test', role: 'VIEWER', enabled: false })

  expect(buildUpdatePayload({ ...values, email: '' })).toEqual({
    displayName: 'Ayse',
    email: null,
    role: 'VIEWER',
    enabled: false,
  })
  expect(buildUpdatePayload({ ...values, password: 'new-password-1' })).toMatchObject({ password: 'new-password-1' })
})
