import { useEffect, useState } from 'react'

import { searchProducts } from '../../api/searchApi'

/**
 * Runs the product search for the given criteria. Every change of the criteria asks the service again; an answer
 * for criteria that have since changed is ignored. retry() repeats the last request.
 */
export default function useProductSearch(criteria) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    setState((previous) => ({ ...previous, status: 'loading', error: null }))
    searchProducts(criteria)
      .then((data) => {
        if (active) {
          setState({ status: 'ready', data, error: null })
        }
      })
      .catch((error) => {
        if (active) {
          setState({ status: 'error', data: null, error })
        }
      })
    return () => {
      active = false
    }
  }, [criteria, attempt])

  return { ...state, retry: () => setAttempt((value) => value + 1) }
}
