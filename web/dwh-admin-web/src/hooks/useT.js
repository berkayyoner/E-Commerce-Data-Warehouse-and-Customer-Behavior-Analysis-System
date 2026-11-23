import { useCallback } from 'react'
import { useSelector } from 'react-redux'

import locales from '../locales'

const FALLBACK_LANGUAGE = 'en'

function lookup(tree, path) {
  return path.split('.').reduce((node, part) => (node && typeof node === 'object' ? node[part] : undefined), tree)
}

function interpolate(template, params) {
  if (!params) {
    return template
  }
  return template.replace(/\{(\w+)\}/g, (match, name) => (params[name] === undefined ? match : String(params[name])))
}

/** Resolves a key such as "common.toast.saved" in one language, falling back to English. */
export function translate(language, key, params) {
  const found = lookup(locales[language], key)
  const value = typeof found === 'string' ? found : lookup(locales[FALLBACK_LANGUAGE], key)
  return typeof value === 'string' ? interpolate(value, params) : key
}

export default function useT() {
  const language = useSelector((state) => state.language.selectedLanguage)
  const t = useCallback((key, params) => translate(language, key, params), [language])
  return { t, language }
}
