import { useEffect, useId, useState } from 'react'

import { searchApi } from '../../api/resources'
import Icon from '../../components/ui/Icon'
import useT from '../../hooks/useT'
import { SUGGESTION_COUNT, SUGGEST_DEBOUNCE_MS, stepIndex } from './smartSearch'

/**
 * Search box with typeahead. Suggestions load once typing pauses for 250 ms. The arrow keys move through them and
 * aria-activedescendant tells screen readers which one is highlighted; Enter picks the highlighted suggestion or runs
 * the search as typed; Escape closes the list.
 */
export default function SuggestBox({ lang, onSearch }) {
  const { t } = useT()
  const baseId = useId()
  const [text, setText] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)

  const listVisible = open && text.trim() !== '' && suggestions.length > 0
  const listId = `${baseId}-suggestions`
  const optionId = (index) => `${baseId}-option-${index}`

  useEffect(() => {
    const query = text.trim()
    if (!query) {
      return undefined
    }
    let current = true
    const timer = setTimeout(() => {
      searchApi
        .suggest({ q: query, lang, size: SUGGESTION_COUNT })
        .then((result) => {
          if (current) {
            setSuggestions(result)
          }
        })
        .catch(() => {
          if (current) {
            setSuggestions([])
          }
        })
    }, SUGGEST_DEBOUNCE_MS)
    return () => {
      current = false
      clearTimeout(timer)
    }
  }, [text, lang])

  function handleChange(event) {
    setText(event.target.value)
    setOpen(true)
    setHighlighted(-1)
  }

  function closeList() {
    setOpen(false)
    setHighlighted(-1)
  }

  function choose(suggestion) {
    setText(suggestion.text)
    closeList()
    onSearch(suggestion.text)
  }

  function handleSubmit(event) {
    event.preventDefault()
    closeList()
    onSearch(text.trim())
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape' && open) {
      closeList()
      return
    }
    if (!listVisible) {
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlighted(stepIndex(highlighted, event.key === 'ArrowDown' ? 1 : -1, suggestions.length))
    } else if (event.key === 'Enter' && highlighted >= 0) {
      event.preventDefault()
      choose(suggestions[highlighted])
    }
  }

  return (
    <div className="suggest-box">
      <form role="search" className="suggest-form" onSubmit={handleSubmit}>
        <div className="search-box suggest-field">
          <Icon name="search" size={16} />
          <input
            type="search"
            role="combobox"
            autoComplete="off"
            value={text}
            placeholder={t('products.smart.placeholder')}
            aria-label={t('products.smart.placeholder')}
            aria-autocomplete="list"
            aria-expanded={listVisible}
            aria-controls={listVisible ? listId : undefined}
            aria-activedescendant={listVisible && highlighted >= 0 ? optionId(highlighted) : undefined}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={closeList}
          />
        </div>
        <button type="submit" className="button button-primary">
          <span>{t('products.smart.submit')}</span>
        </button>
      </form>

      {listVisible && (
        <ul id={listId} role="listbox" className="suggest-list" aria-label={t('products.smart.suggestions')}>
          {suggestions.map((suggestion, index) => (
            <li
              key={`${suggestion.type}-${suggestion.text}`}
              id={optionId(index)}
              role="option"
              aria-selected={index === highlighted}
              className={`suggest-option${index === highlighted ? ' is-highlighted' : ''}`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(suggestion)}
            >
              <span>{suggestion.text}</span>
              <span className="suggest-type">{t(`products.smart.suggestionTypes.${suggestion.type}`)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
