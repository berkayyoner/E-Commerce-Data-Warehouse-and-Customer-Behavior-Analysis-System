/** True when the service answered 409: the record is still used by other data and the change was refused. */
export function isConflict(error) {
  return Boolean(error && error.response && error.response.status === 409)
}
