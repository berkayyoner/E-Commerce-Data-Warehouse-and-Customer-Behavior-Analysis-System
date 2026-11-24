import { ROLES } from '../../auth/roles'

export const USERNAME_PATTERN = /^[A-Za-z0-9._-]+$/
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 72
export const ROLE_OPTIONS = [ROLES.ADMIN, ROLES.ANALYST, ROLES.VIEWER]

/** Form values for a new account (user is null) or for editing an existing one. */
export function initialValues(user) {
  return {
    username: user ? user.username : '',
    displayName: user ? user.displayName : '',
    email: user && user.email ? user.email : '',
    role: user ? user.role : ROLES.VIEWER,
    enabled: user ? Boolean(user.enabled) : true,
    password: '',
  }
}

/** Messages keyed by field name. An empty object means the form can be sent. */
export function validateUserForm(values, { isCreate }, t) {
  const errors = {}
  const required = t('common.validation.required')

  const username = values.username.trim()
  if (isCreate) {
    if (!username) {
      errors.username = required
    } else if (username.length < 3 || username.length > 60) {
      errors.username = t('users.errors.usernameLength')
    } else if (!USERNAME_PATTERN.test(username)) {
      errors.username = t('users.errors.usernamePattern')
    }
  }

  const displayName = values.displayName.trim()
  if (!displayName) {
    errors.displayName = required
  } else if (displayName.length > 120) {
    errors.displayName = t('users.errors.displayNameLength')
  }

  const email = values.email.trim()
  if (email && (!EMAIL_PATTERN.test(email) || email.length > 254)) {
    errors.email = t('common.validation.email')
  }

  if (isCreate && !values.password) {
    errors.password = required
  } else if (values.password && (values.password.length < PASSWORD_MIN || values.password.length > PASSWORD_MAX)) {
    errors.password = t('users.errors.passwordLength')
  }

  return errors
}

/** Body of POST /api/auth/users. The e-mail address is optional and left out when empty. */
export function buildCreatePayload(values) {
  const payload = {
    username: values.username.trim(),
    password: values.password,
    displayName: values.displayName.trim(),
    role: values.role,
  }
  const email = values.email.trim()
  if (email) {
    payload.email = email
  }
  return payload
}

/** Body of PUT /api/auth/users/{id}. The password is sent only when a new one was typed. */
export function buildUpdatePayload(values) {
  const payload = {
    displayName: values.displayName.trim(),
    email: values.email.trim() || null,
    role: values.role,
    enabled: values.enabled,
  }
  if (values.password) {
    payload.password = values.password
  }
  return payload
}
