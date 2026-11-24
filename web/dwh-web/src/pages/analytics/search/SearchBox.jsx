import { useId, useState } from 'react'

import Icon from '../../../components/ui/Icon'
import useT from '../../../hooks/useT'
import useSuggestions from './useSuggestions'

/**
 * Search field with a keyboard-operated typeahead (combobox pattern). Arrow keys move through the suggestions, Enter
 * picks the highlighted one or runs the search, Escape closes the list. A suggestion runs the search at once.
 */
export default function SearchBox({ value, onChange, onSearch }) {
  const { t, language } = useT()
  const suggestions = useSuggestions(value, language)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const inputId = useId()
  const listId = useId()

  const listVisible = open && suggestions.length > 0
  const activeIndex = active < suggestions.length ? active : -1

  function choose(suggestion) {
    onChange(suggestion.text)
    onSearch(suggestion.text.trim())
    setOpen(false)
    setActive(-1)
  }

  function handleChange(event) {
    onChange(event.target.value)
    setOpen(true)
    setActive(-1)
  }

  function handleKeyDown(event) {
    const count = suggestions.length
    if (event.key === 'ArrowDown' && count > 0) {
      event.preventDefault()
      setOpen(true)
      setActive((index) => (index + 1 >= count ? 0 : index + 1))
    } else if (event.key === 'ArrowUp' && count > 0) {
      event.preventDefault()
      setOpen(true)
      setActive((index) => (index <= 0 ? count - 1 : index - 1))
    } else if (event.key === 'Enter' && listVisible && activeIndex >= 0) {
      event.preventDefault()
      choose(suggestions[activeIndex])
    } else if (event.key === 'Escape' && listVisible) {
      event.preventDefault()
      setOpen(false)
      setActive(-1)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    setOpen(false)
    setActive(-1)
    onSearch(value.trim())
  }

  function clear() {
    onChange('')
    onSearch('')
    setOpen(false)
    setActive(-1)
  }

  return (
    <form role="search" className="search-form" onSubmit={handleSubmit}>
      <div className="search-field">
        <Icon name="search" size={20} className="search-field-icon" />
        <label htmlFor={inputId} className="sr-only">
          {t('search.box.label')}
        </label>
        <input
          id={inputId}
          type="search"
          role="combobox"
          autoComplete="off"
          value={value}
          placeholder={t('search.box.placeholder')}
          aria-expanded={listVisible}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
        />
        {value && (
          <button type="button" className="icon-button" onClick={clear} aria-label={t('search.box.clear')}>
            <Icon name="close" size={16} />
          </button>
        )}
      </div>
      <button type="submit" className="button button-primary search-submit">
        <span>{t('search.box.submit')}</span>
      </button>

      {listVisible && (
        <ul id={listId} role="listbox" aria-label={t('search.suggestions.label')} className="suggestions">
          {suggestions.map((suggestion, index) => (
            <li
              key={`${suggestion.type}-${suggestion.text}`}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              className={`suggestion${index === activeIndex ? ' is-active' : ''}`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(suggestion)}
            >
              <span className="suggestion-text">{suggestion.text}</span>
              <span className="suggestion-type">{t(`search.suggestions.types.${suggestion.type.toLowerCase()}`)}</span>
            </li>
          ))}
        </ul>
      )}
    </form>
  )
}
