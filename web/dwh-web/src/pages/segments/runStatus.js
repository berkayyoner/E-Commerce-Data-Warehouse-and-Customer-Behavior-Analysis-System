import { formatNumber } from '../../utils/format'

/** Status line of a segmentation run: running, finished with the scored count, or failed with the reason. */
export function runMessage(run, t, language) {
  if (!run) {
    return null
  }
  if (run.status === 'RUNNING') {
    return t('segments.run.running', { id: run.id })
  }
  if (run.status === 'SUCCESS') {
    return t('segments.run.finished', { id: run.id, count: formatNumber(run.customersScored, language) })
  }
  return t('segments.run.failed', { id: run.id, message: run.errorMessage || '-' })
}
