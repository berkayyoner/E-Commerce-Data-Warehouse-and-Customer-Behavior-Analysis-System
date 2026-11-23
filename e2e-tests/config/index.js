const path = require('node:path')

const env = process.env

module.exports = Object.freeze({
  consoleUrl: env.E2E_CONSOLE_URL || 'http://localhost:3001',
  portalUrl: env.E2E_PORTAL_URL || 'http://localhost:3000',
  authUrl: env.E2E_AUTH_URL || 'http://localhost:9000',
  admin: {
    username: env.E2E_ADMIN_USER || 'admin',
    password: env.E2E_ADMIN_PASSWORD || 'Admin-Local-2026',
  },
  headed: env.E2E_HEADED === '1',
  window: { width: 1440, height: 900 },
  mobileWindow: { width: 375, height: 812 },
  tabletWindow: { width: 768, height: 1024 },
  timeouts: {
    element: 15000,
    page: 30000,
    login: 60000,
    poll: 250,
  },
  screenshotDir: path.resolve(__dirname, '..', 'screenshots'),
})
