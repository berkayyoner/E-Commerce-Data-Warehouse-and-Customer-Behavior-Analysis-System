/** Written by the web container at start-up (runtime-config.js); it wins over the build-time values. */
const runtime = (typeof window !== 'undefined' && window.__DWH_CONFIG__) || {}

const trimEnd = (value) => String(value || '').replace(/\/+$/, '')

const gatewayUrl = trimEnd(runtime.gatewayUrl || process.env.REACT_APP_GATEWAY_URL)

/**
 * Address of one back-end service. With a gateway every service shares its address; the /api/<service>
 * path prefixes in the requests tell the gateway where each call goes.
 */
function serviceAddress(runtimeKey, envName, fallback) {
  if (gatewayUrl) {
    return gatewayUrl
  }
  return trimEnd(runtime[runtimeKey] || process.env[envName] || fallback)
}

const config = Object.freeze({
  appEnv: process.env.REACT_APP_APP_ENV || 'local',
  defaultLanguage: process.env.REACT_APP_DEFAULT_LANGUAGE || 'en',
  gatewayUrl,
  services: Object.freeze({
    auth: serviceAddress('authUrl', 'REACT_APP_AUTH_URL', 'http://localhost:9000'),
    etl: serviceAddress('etlUrl', 'REACT_APP_ETL_URL', 'http://localhost:8081'),
    shop: serviceAddress('shopUrl', 'REACT_APP_SHOP_URL', 'http://localhost:8082'),
    analytics: serviceAddress('analyticsUrl', 'REACT_APP_ANALYTICS_URL', 'http://localhost:8083'),
    segmentation: serviceAddress('segmentationUrl', 'REACT_APP_SEGMENTATION_URL', 'http://localhost:8084'),
  }),
})

export default config
