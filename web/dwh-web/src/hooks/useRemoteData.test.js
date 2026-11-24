import { act, renderHook, waitFor } from '@testing-library/react'

import useRemoteData from './useRemoteData'

test('the value loads once, and reload asks the fetcher again', async () => {
  const fetcher = jest.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second')
  const { result } = renderHook(() => useRemoteData(fetcher))

  await waitFor(() => expect(result.current.data).toBe('first'))
  expect(fetcher).toHaveBeenCalledTimes(1)

  act(() => result.current.reload())

  await waitFor(() => expect(result.current.data).toBe('second'))
  expect(fetcher).toHaveBeenCalledTimes(2)
})

test('a failed load keeps the error and clears the data', async () => {
  const failure = new Error('service down')
  const fetcher = jest.fn().mockRejectedValue(failure)
  const { result } = renderHook(() => useRemoteData(fetcher))

  await waitFor(() => expect(result.current.error).toBe(failure))
  expect(result.current.data).toBeNull()
  expect(result.current.loading).toBe(false)
})

test('a change of the refresh token loads the value again', async () => {
  const fetcher = jest.fn().mockResolvedValue('value')
  const { result, rerender } = renderHook(({ token }) => useRemoteData(fetcher, token), {
    initialProps: { token: 0 },
  })
  await waitFor(() => expect(result.current.loading).toBe(false))

  rerender({ token: 1 })

  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2))
})
