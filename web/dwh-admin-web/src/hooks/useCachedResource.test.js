import { act, renderHook, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'

import { CACHE_TTL_MS } from '../store/cacheSlice'
import { createAppStore } from '../store/store'
import useCachedResource from './useCachedResource'

function wrapperFor(store) {
  return function Wrapper({ children }) {
    return <Provider store={store}>{children}</Provider>
  }
}

afterEach(() => {
  jest.restoreAllMocks()
})

test('a value loaded recently is reused and the service is not called again', async () => {
  const store = createAppStore()
  const fetcher = jest.fn().mockResolvedValue({ revenue: 10 })
  const first = renderHook(() => useCachedResource('overview', fetcher), { wrapper: wrapperFor(store) })
  await waitFor(() => expect(first.result.current.data).toEqual({ revenue: 10 }))
  first.unmount()

  const second = renderHook(() => useCachedResource('overview', fetcher), { wrapper: wrapperFor(store) })

  expect(second.result.current.data).toEqual({ revenue: 10 })
  expect(second.result.current.loading).toBe(false)
  expect(fetcher).toHaveBeenCalledTimes(1)
})

test('a value older than the cache lifetime is loaded again', async () => {
  const store = createAppStore()
  const fetcher = jest.fn().mockResolvedValue({ revenue: 10 })
  const now = jest.spyOn(Date, 'now').mockReturnValue(1000000)
  const first = renderHook(() => useCachedResource('overview', fetcher), { wrapper: wrapperFor(store) })
  await waitFor(() => expect(first.result.current.loading).toBe(false))
  first.unmount()

  now.mockReturnValue(1000000 + CACHE_TTL_MS + 1)
  renderHook(() => useCachedResource('overview', fetcher), { wrapper: wrapperFor(store) })

  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2))
})

test('retry asks the service again even when the value is fresh', async () => {
  const store = createAppStore()
  const fetcher = jest.fn().mockResolvedValue({ revenue: 10 })
  const { result } = renderHook(() => useCachedResource('overview', fetcher), { wrapper: wrapperFor(store) })
  await waitFor(() => expect(result.current.data).toEqual({ revenue: 10 }))

  act(() => result.current.retry())

  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2))
})
