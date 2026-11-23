import { translate } from '../hooks/useT'
import locales from './index'

/** Every dotted key of a translation tree, such as "common.actions.save". */
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

test('translate falls back to English for a key that Turkish lacks, and returns the key when nothing matches', () => {
  expect(translate('tr', 'common.actions.cancel')).toBe('Vazgeç')
  expect(translate('en', 'common.actions.cancel')).toBe('Cancel')
  expect(translate('tr', 'common.unknown.key')).toBe('common.unknown.key')
})
