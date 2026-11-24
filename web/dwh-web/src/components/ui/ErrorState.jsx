import useT from '../../hooks/useT'
import Icon from './Icon'

/** Shown in place of a section whose data could not be loaded, with a button that tries again. */
export default function ErrorState({ message, onRetry }) {
  const { t } = useT()
  return (
    <div className="error-state" role="alert">
      <Icon name="warning" size={20} />
      <p>{message}</p>
      <button type="button" className="button button-ghost" onClick={onRetry}>
        <Icon name="retry" size={16} />
        <span>{t('common.actions.retry')}</span>
      </button>
    </div>
  )
}
