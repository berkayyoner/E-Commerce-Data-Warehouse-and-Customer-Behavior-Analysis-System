import languageReducer, { SUPPORTED_LANGUAGES, setLanguage } from './languageSlice'

test('English and Turkish are the supported languages', () => {
  expect(SUPPORTED_LANGUAGES).toEqual(['en', 'tr'])
})

test('an unsupported language is ignored and a supported one is remembered', () => {
  const unchanged = languageReducer({ selectedLanguage: 'en' }, setLanguage('de'))
  expect(unchanged.selectedLanguage).toBe('en')

  const changed = languageReducer({ selectedLanguage: 'en' }, setLanguage('tr'))
  expect(changed.selectedLanguage).toBe('tr')
  expect(window.localStorage.getItem('dwh.console.language')).toBe('tr')
})
