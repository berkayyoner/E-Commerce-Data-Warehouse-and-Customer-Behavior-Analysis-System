import { useEffect, useState } from 'react'

import { suggestProducts } from '../../api/searchApi'
import { MIN_SUGGEST_LENGTH, SUGGEST_DELAY_MS } from './searchState'

/**
 * Typeahead suggestions for the text typed in the search box. The request waits until the typing pauses, and an
 * answer that arrives after the text has changed again is dropped. A failed request simply shows no suggestions.
 */
export default function useSuggestions(text, language) {
  const trimmed = text.trim()
  const [result, setResult] = useState({ text: '', language: '', items: [] })

  useEffect(() => {
    if (trimmed.length < MIN_SUGGEST_LENGTH) {
      return undefined
    }
    let active = true
    const timer = setTimeout(() => {
      suggestProducts({ query: trimmed, language })
        .then((items) => {
          if (active) {
            setResult({ text: trimmed, language, items })
          }
        })
        .catch(() => {
          if (active) {
            setResult({ text: trimmed, language, items: [] })
          }
        })
    }, SUGGEST_DELAY_MS)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [trimmed, language])

  const current = result.text === trimmed && result.language === language
  return current && trimmed.length >= MIN_SUGGEST_LENGTH ? result.items : []
}
