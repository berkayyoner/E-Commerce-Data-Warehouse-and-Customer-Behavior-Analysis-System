import { translate } from '../hooks/useT'
import locales from './index'

/** Every dotted key of a translation tree, such as "common.actions.signOut". */
function keysOf(tree, prefix = '') {
  return Object.entries(tree).flatMap(([key, value]) =>
    value && typeof value === 'object' ? keysOf(value, `${prefix}${key}.`) : [`${prefix}${key}`],
  )
}

function valuesOf(tree) {
  return Object.values(tree).flatMap((value) => (value && typeof value === 'object' ? valuesOf(value) : [value]))
}

test('English and Turkish define the same namespaces and the same keys', () => {
  expect(Object.keys(locales.tr).sort()).toEqual(Object.keys(locales.en).sort())
  Object.keys(locales.en).forEach((namespace) => {
    expect(keysOf(locales.tr[namespace]).sort()).toEqual(keysOf(locales.en[namespace]).sort())
  })
})

test('every translated value is a non-empty string', () => {
  Object.values(locales).forEach((language) => {
    Object.values(language).forEach((namespace) => {
      valuesOf(namespace).forEach((value) => {
        expect(typeof value).toBe('string')
        expect(value.trim().length).toBeGreaterThan(0)
      })
    })
  })
})

test('the locale files contain no emoji', () => {
  const emoji = /\p{Extended_Pictographic}/u
  expect(JSON.stringify(locales)).not.toMatch(emoji)
})

test('translate falls back to English for a missing key and returns the key when nothing matches', () => {
  expect(translate('tr', 'common.actions.signOut')).toBe('Çıkış yap')
  expect(translate('en', 'common.actions.signOut')).toBe('Sign out')
  expect(translate('tr', 'common.unknown.key')).toBe('common.unknown.key')
})

test('placeholders are replaced by the values given', () => {
  expect(translate('en', 'dashboard.filters.invalidRange')).toBe('The start date must not be after the end date.')
  expect(translate('en', 'common.user.signedInAs', { name: 'admin' })).toBe('Signed in as admin')
  expect(translate('tr', 'search.results.page', { page: 2, pages: 5 })).toBe('Sayfa 2 / 5')
})
