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
    etl: 'http://localhost:8081',
    shop: 'http://localhost:8082',
    analytics: 'http://localhost:8083',
    segmentation: 'http://localhost:8084',
  })
})

test('a runtime address overrides one service and drops its trailing slash', () => {
  window.__DWH_CONFIG__ = { etlUrl: 'https://etl.example.test/' }

  const config = loadConfig()

  expect(config.services.etl).toBe('https://etl.example.test')
  expect(config.services.auth).toBe('http://localhost:9000')
})

test('a gateway address replaces the address of every service', () => {
  window.__DWH_CONFIG__ = { gatewayUrl: 'https://gateway.example.test/' }

  const config = loadConfig()

  expect(config.gatewayUrl).toBe('https://gateway.example.test')
  expect(Object.values(config.services)).toEqual(Array(5).fill('https://gateway.example.test'))
})
