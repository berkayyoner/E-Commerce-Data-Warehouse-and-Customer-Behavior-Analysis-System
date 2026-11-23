import { fireEvent, screen, waitFor, within } from '@testing-library/react'

import { usersApi } from '../../api/resources'
import { renderWithProviders } from '../../test-utils'
import UsersPage from './UsersPage'

jest.mock('../../api/resources', () => ({
  usersApi: { list: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn() },
}))

const USERS = [
  {
    id: 10,
    username: 'ayse',
    displayName: 'Ayse Demir',
    email: 'ayse@example.test',
    role: 'ADMIN',
    enabled: true,
    createdAt: '2026-10-01T09:30:00Z',
  },
  {
    id: 11,
    username: 'mehmet',
    displayName: 'Mehmet Kaya',
    email: null,
    role: 'VIEWER',
    enabled: false,
    createdAt: '2026-10-05T12:00:00Z',
  },
]

beforeEach(() => {
  usersApi.list.mockResolvedValue({ content: USERS, total: 2, page: 0, size: 20 })
  usersApi.create.mockResolvedValue({ id: 12 })
  usersApi.update.mockResolvedValue({})
  usersApi.remove.mockResolvedValue(undefined)
})

test('lists the accounts with their role and status written as text', async () => {
  renderWithProviders(<UsersPage />)
  await screen.findByText('ayse')

  const table = screen.getByRole('table')
  expect(within(table).getByText('Administrator')).toBeInTheDocument()
  expect(within(table).getByText('Disabled')).toBeInTheDocument()
})

test('clicking a column header asks the server for the sorted list', async () => {
  renderWithProviders(<UsersPage />)
  await screen.findByText('ayse')

  fireEvent.click(screen.getByRole('button', { name: 'Display name' }))

  await waitFor(() =>
    expect(usersApi.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ sort: { key: 'displayName', direction: 'asc' } }),
    ),
  )
})

test('the create form shows the required messages and does not send an empty account', async () => {
  renderWithProviders(<UsersPage />)
  await screen.findByText('ayse')

  fireEvent.click(screen.getByRole('button', { name: 'Create user' }))
  const dialog = await screen.findByRole('dialog', { name: 'New personnel account' })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Create' }))

  expect(await within(dialog).findAllByText('This field is required.')).toHaveLength(3)
  expect(usersApi.create).not.toHaveBeenCalled()
})

test('creating an account sends the entered values and the chosen role', async () => {
  renderWithProviders(<UsersPage />)
  await screen.findByText('ayse')

  fireEvent.click(screen.getByRole('button', { name: 'Create user' }))
  const dialog = await screen.findByRole('dialog', { name: 'New personnel account' })
  fireEvent.change(within(dialog).getByLabelText('Username'), { target: { value: 'new.user' } })
  fireEvent.change(within(dialog).getByLabelText('Display name'), { target: { value: 'New Person' } })
  fireEvent.change(within(dialog).getByLabelText('Password'), { target: { value: 'correct-horse-battery' } })
  fireEvent.change(within(dialog).getByLabelText('Role'), { target: { value: 'ANALYST' } })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Create' }))

  await waitFor(() =>
    expect(usersApi.create).toHaveBeenCalledWith({
      username: 'new.user',
      password: 'correct-horse-battery',
      displayName: 'New Person',
      role: 'ANALYST',
    }),
  )
})

test('deleting an account asks for confirmation before the request is sent', async () => {
  renderWithProviders(<UsersPage />)
  const row = (await screen.findByText('ayse')).closest('tr')

  fireEvent.click(within(row).getByRole('button', { name: 'Delete account' }))
  const dialog = await screen.findByRole('dialog', { name: 'Delete record' })
  expect(usersApi.remove).not.toHaveBeenCalled()

  fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }))
  await waitFor(() => expect(usersApi.remove).toHaveBeenCalledWith(10))
})
