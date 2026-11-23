export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Adds a message for a required text field that may be at most max characters long. */
export function checkText(errors, field, value, max, t) {
  const text = String(value || '').trim()
  if (!text) {
    errors[field] = t('common.validation.required')
  } else if (text.length > max) {
    errors[field] = t('common.validation.maxLength', { max })
  }
}

/** Adds a message for a required e-mail address of at most max characters. */
export function checkEmail(errors, field, value, max, t) {
  const text = String(value || '').trim()
  if (!text) {
    errors[field] = t('common.validation.required')
  } else if (!EMAIL_PATTERN.test(text) || text.length > max) {
    errors[field] = t('common.validation.email')
  }
}
