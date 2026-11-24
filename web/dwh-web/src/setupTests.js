// jest-dom adds matchers such as toBeInTheDocument() for DOM assertions.
import '@testing-library/jest-dom'
import { TextDecoder, TextEncoder } from 'util'

const { webcrypto } = require('crypto')

Object.assign(global, { TextDecoder, TextEncoder })

// jsdom has no Web Crypto implementation; Node's implementation has the same API (getRandomValues, subtle).
if (!global.crypto || !global.crypto.subtle) {
  Object.defineProperty(global, 'crypto', { value: webcrypto, configurable: true })
}

beforeEach(() => {
  window.sessionStorage.clear()
  window.localStorage.clear()
})
