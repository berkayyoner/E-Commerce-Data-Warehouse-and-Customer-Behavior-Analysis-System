import { screen } from '@testing-library/react'
import { Route, Routes, useLocation } from 'react-router-dom'

import { renderWithProviders } from '../test-utils'
import RequireAuth from './RequireAuth'

/** Shows the login page address and the page it was asked to return to. */
function LoginProbe() {
  const location = useLocation()
  return <p>{`login after ${location.state && location.state.from}`}</p>
}

function renderGuarded(user, route) {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginProbe />} />
      <Route element={<RequireAuth />}>
        <Route path="/customers" element={<p>Customer list</p>} />
      </Route>
    </Routes>,
    { user, route },
  )
}

test('a visitor is sent to the login page and remembers the address they asked for', () => {
  renderGuarded(null, '/customers?page=2')

  expect(screen.getByText('login after /customers?page=2')).toBeInTheDocument()
  expect(screen.queryByText('Customer list')).not.toBeInTheDocument()
})

test('a signed in person with a console role sees the page', () => {
  renderGuarded({ username: 'analyst', displayName: 'Analyst', roles: ['ANALYST'] }, '/customers')

  expect(screen.getByText('Customer list')).toBeInTheDocument()
})

test('a signed in person without any page role sees the no-access page instead', () => {
  renderGuarded({ username: 'nobody', displayName: 'Nobody', roles: [] }, '/customers')

  expect(screen.getByRole('heading', { name: 'No console access' })).toBeInTheDocument()
  expect(screen.queryByText('Customer list')).not.toBeInTheDocument()
})
