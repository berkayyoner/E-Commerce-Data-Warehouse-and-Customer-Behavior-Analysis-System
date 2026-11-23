import Icon from '../../components/ui/Icon'
import useT from '../../hooks/useT'

/** Delivery state as an icon with its text, so the meaning does not rest on colour alone. */
export default function DeliveryBadge({ delivered }) {
  const { t } = useT()
  return (
    <span className={`badge badge-with-icon ${delivered ? 'badge-success' : 'badge-muted'}`}>
      <Icon name={delivered ? 'circleCheck' : 'clock'} size={14} />
      <span>{t(delivered ? 'orders.status.delivered' : 'orders.status.pending')}</span>
    </span>
  )
}
