import enAnalytics from './en/analytics.json'
import enAuth from './en/auth.json'
import enCommon from './en/common.json'
import enCustomers from './en/customers.json'
import enDashboard from './en/dashboard.json'
import enEtl from './en/etl.json'
import enNavigation from './en/navigation.json'
import enOrders from './en/orders.json'
import enProducts from './en/products.json'
import enSearch from './en/search.json'
import enSegments from './en/segments.json'
import enShop from './en/shop.json'
import enUsers from './en/users.json'
import enWarehouses from './en/warehouses.json'

import trAnalytics from './tr/analytics.json'
import trAuth from './tr/auth.json'
import trCommon from './tr/common.json'
import trCustomers from './tr/customers.json'
import trDashboard from './tr/dashboard.json'
import trEtl from './tr/etl.json'
import trNavigation from './tr/navigation.json'
import trOrders from './tr/orders.json'
import trProducts from './tr/products.json'
import trSearch from './tr/search.json'
import trSegments from './tr/segments.json'
import trShop from './tr/shop.json'
import trUsers from './tr/users.json'
import trWarehouses from './tr/warehouses.json'

/**
 * One entry per language, with the same namespaces in each. English is the default and the fallback for
 * a missing key. To add a language, create the JSON files and add one entry here.
 */
const locales = {
  en: {
    common: enCommon,
    auth: enAuth,
    navigation: enNavigation,
    dashboard: enDashboard,
    users: enUsers,
    etl: enEtl,
    shop: enShop,
    customers: enCustomers,
    warehouses: enWarehouses,
    products: enProducts,
    orders: enOrders,
    segments: enSegments,
    analytics: enAnalytics,
    search: enSearch,
  },
  tr: {
    common: trCommon,
    auth: trAuth,
    navigation: trNavigation,
    dashboard: trDashboard,
    users: trUsers,
    etl: trEtl,
    shop: trShop,
    customers: trCustomers,
    warehouses: trWarehouses,
    products: trProducts,
    orders: trOrders,
    segments: trSegments,
    analytics: trAnalytics,
    search: trSearch,
  },
}

export default locales
