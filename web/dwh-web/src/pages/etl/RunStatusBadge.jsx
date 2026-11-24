import useT from '../../hooks/useT'

const TONES = {
  SUCCESS: 'badge-success',
  FAILED: 'badge-danger',
  RUNNING: 'badge-info',
}

/** Run status as text with a colour cue; the colour never carries the meaning alone. */
export default function RunStatusBadge({ status }) {
  const { t } = useT()
  return <span className={`badge ${TONES[status] || 'badge-muted'}`}>{t(`etl.statuses.${status}`)}</span>
}
