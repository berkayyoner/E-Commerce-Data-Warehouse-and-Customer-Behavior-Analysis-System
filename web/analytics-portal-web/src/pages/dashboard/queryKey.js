/**
 * Cache key of a dashboard value: the report name, the date range and any extra parts. A null range (an invalid
 * period) gives a null key, which tells the cache hook that nothing should be loaded.
 */
export default function queryKey(name, range, ...parts) {
  if (!range) {
    return null
  }
  return [name, range.from || '-', range.to || '-', ...parts].join('|')
}
