import Icon from '../../components/ui/Icon'
import useT from '../../hooks/useT'
import useReindex from './useReindex'
import { reindexMessage } from './smartSearch'

/** Administrators rebuild the search index from the catalog here; the progress is shown while it runs. */
export default function ReindexPanel() {
  const { t, language } = useT()
  const { status, busy, unreachable, start } = useReindex()
  const message = reindexMessage(status, unreachable, t, language)

  return (
    <div className="reindex-panel">
      <button type="button" className="button button-ghost" onClick={start} disabled={busy}>
        <Icon name="database" size={16} />
        <span>{t('products.smart.reindex.button')}</span>
      </button>
      {message && <p className="reindex-status" role="status">{message}</p>}
    </div>
  )
}
