import { useEffect, useState } from 'react'

function matches(query) {
  return typeof window.matchMedia === 'function' && window.matchMedia(query).matches
}

/** True while the media query matches, for example the narrow phone layout. Follows window resizes. */
export default function useMediaQuery(query) {
  const [current, setCurrent] = useState(() => matches(query))

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return undefined
    }
    const media = window.matchMedia(query)
    const onChange = () => setCurrent(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [query])

  return current
}
