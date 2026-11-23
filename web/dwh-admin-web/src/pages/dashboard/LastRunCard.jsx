import { Link } from 'react-router-dom'

import { etlApi } from '../../api/resources'
import Icon from '../../components/ui/Icon'
import useCachedResource from '../../hooks/useCachedResource'
import useT from '../../hooks/useT'
import RunStatusBadge from '../etl/RunStatusBadge'
import { runDurationMs } from '../etl/etlRuns'
import { formatDateTime, formatDuration, formatNumber } from '../../utils/format'
import WidgetCard from './WidgetCard'

const loadLastRun = () =>
  etlApi.listRuns({ page: 0, size: 1 }).then((page) => (page.content && page.content.length > 0 ? page.content[0] : null))

/** The most recent ETL run, with a link to the full list. */
export default function LastRunCard() {
  const { t, language } = useT()
  const { data: run, error, loading, retry } = useCachedResource('lastRun', loadLastRun)

  return (
    <WidgetCard title={t('dashboard.lastRun.title')} loading={loading} error={error} onRetry={retry}>
      {run ? (
        <dl className="detail-list">
          <div>
            <dt>{t('etl.columns.runType')}</dt>
            <dd>{t(`etl.runTypes.${run.runType}`)}</dd>
          </div>
          <div>
            <dt>{t('etl.columns.status')}</dt>
            <dd>
              <RunStatusBadge status={run.status} />
            </dd>
          </div>
          <div>
            <dt>{t('dashboard.lastRun.started')}</dt>
            <dd>{formatDateTime(run.startedAt, language)}</dd>
          </div>
          <div>
            <dt>{t('dashboard.lastRun.duration')}</dt>
            <dd>{formatDuration(runDurationMs(run))}</dd>
          </div>
          <div>
            <dt>{t('dashboard.lastRun.rowsLoaded')}</dt>
            <dd>{formatNumber(run.rowsLoaded, language)}</dd>
          </div>
        </dl>
      ) : (
        !error && <p className="empty-note">{t('dashboard.lastRun.empty')}</p>
      )}
      <p className="widget-footer">
        <Link to="/etl" className="inline-link">
          <span>{t('dashboard.lastRun.viewAll')}</span>
          <Icon name="chevronRight" size={14} />
        </Link>
      </p>
    </WidgetCard>
  )
}
