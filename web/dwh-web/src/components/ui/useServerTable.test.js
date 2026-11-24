import { act, renderHook, waitFor } from '@testing-library/react'

import useServerTable from './useServerTable'

test('the search text is debounced before the server is asked', async () => {
  const fetcher = jest.fn().mockResolvedValue({ content: [], total: 0 })
  const { result } = renderHook(() => useServerTable(fetcher))
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))

  act(() => result.current.tableProps.onSearchChange('ay'))
  act(() => result.current.tableProps.onSearchChange('ayse'))

  await waitFor(() => expect(fetcher).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'ayse' })))
  expect(fetcher.mock.calls.some(([query]) => query.search === 'ay')).toBe(false)
})

test('changing the sort returns to the first page and passes the sort to the server', async () => {
  const fetcher = jest.fn().mockResolvedValue({ content: [], total: 100 })
  const { result } = renderHook(() => useServerTable(fetcher, { size: 20 }))
  await waitFor(() => expect(fetcher).toHaveBeenCalled())

  act(() => result.current.tableProps.onPageChange(2))
  await waitFor(() => expect(fetcher).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })))

  act(() => result.current.tableProps.onSortChange({ key: 'email', direction: 'desc' }))
  await waitFor(() =>
    expect(fetcher).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 0, sort: { key: 'email', direction: 'desc' } }),
    ),
  )
})

test('a response that arrives after a newer request is ignored', async () => {
  let resolveFirst
  const fetcher = jest
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFirst = resolve
        }),
    )
    .mockResolvedValueOnce({ content: [{ id: 2 }], total: 1 })
  const { result } = renderHook(() => useServerTable(fetcher))

  act(() => result.current.reload())
  await waitFor(() => expect(result.current.rows).toEqual([{ id: 2 }]))

  await act(async () => resolveFirst({ content: [{ id: 1 }], total: 1 }))
  expect(result.current.rows).toEqual([{ id: 2 }])
})

test('a failed request exposes the error and leaves no rows', async () => {
  const fetcher = jest.fn().mockRejectedValue(new Error('service unavailable'))
  const { result } = renderHook(() => useServerTable(fetcher))

  await waitFor(() => expect(result.current.error).toBeTruthy())
  expect(result.current.rows).toEqual([])
  expect(result.current.loading).toBe(false)
})
