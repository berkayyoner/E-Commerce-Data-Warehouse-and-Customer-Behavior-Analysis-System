/** Loads the configuration module fresh, so that the runtime values of this test are read. */
function loadConfig() {
  let config
  jest.isolateModules(() => {
    config = require('./env').default
  })
  return config
}

afterEach(() => {
  delete window.__DWH_CONFIG__
})

test('each service defaults to its local development address', () => {
  expect(loadConfig().services).toEqual({
    auth: 'http://localhost:9000',
    analytics: 'http://localhost:8083',
    shop: 'http://localhost:8082',
  })
})

test('the portal uses the public client id and the read scope', () => {
  const config = loadConfig()

  expect(config.clientId).toBe('analytics-portal')
  expect(config.scopes).toBe('openid profile dwh.read')
})

test('a runtime address overrides one service and drops its trailing slash', () => {
  window.__DWH_CONFIG__ = { analyticsUrl: 'https://analytics.example.test/' }

  const config = loadConfig()

  expect(config.services.analytics).toBe('https://analytics.example.test')
  expect(config.services.auth).toBe('http://localhost:9000')
})

test('a gateway address replaces the address of every service', () => {
  window.__DWH_CONFIG__ = { gatewayUrl: 'https://gateway.example.test/' }

  const config = loadConfig()

  expect(config.gatewayUrl).toBe('https://gateway.example.test')
  expect(Object.values(config.services)).toEqual(Array(3).fill('https://gateway.example.test'))
})
