/** A name that is unique per run, so repeated runs never collide with leftovers of earlier runs. */
function uniqueName(prefix) {
  const stamp = Date.now().toString(36)
  const random = Math.floor(Math.random() * 1000).toString(36)
  return `${prefix}-${stamp}${random}`
}

module.exports = { uniqueName }
