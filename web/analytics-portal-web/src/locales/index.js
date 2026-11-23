import enAuth from './en/auth.json'
import enCommon from './en/common.json'
import enDashboard from './en/dashboard.json'
import enNavigation from './en/navigation.json'
import enSearch from './en/search.json'

import trAuth from './tr/auth.json'
import trCommon from './tr/common.json'
import trDashboard from './tr/dashboard.json'
import trNavigation from './tr/navigation.json'
import trSearch from './tr/search.json'

/**
 * One entry per language, with the same namespaces in each. English is the default and the fallback for a missing
 * key. To add a language, create the JSON files and add one entry here.
 */
const locales = {
  en: {
    common: enCommon,
    auth: enAuth,
    navigation: enNavigation,
    dashboard: enDashboard,
    search: enSearch,
  },
  tr: {
    common: trCommon,
    auth: trAuth,
    navigation: trNavigation,
    dashboard: trDashboard,
    search: trSearch,
  },
}

export default locales
