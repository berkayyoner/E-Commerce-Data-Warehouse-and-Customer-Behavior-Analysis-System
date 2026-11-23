import { formatDate, formatMonth } from '../../utils/format'

const WEEK = /^(\d{4})-W(\d{2})$/

/** Label of one trend period: a date, a month, "Week 11, 2026" or the year itself. */
export function periodLabel(period, granularity, language, t) {
  if (granularity === 'day') {
    return formatDate(period, language)
  }
  if (granularity === 'month') {
    return formatMonth(period, language)
  }
  if (granularity === 'week') {
    const match = WEEK.exec(period)
    return match ? t('dashboard.trend.weekLabel', { week: Number(match[2]), year: match[1] }) : period
  }
  return period
}
