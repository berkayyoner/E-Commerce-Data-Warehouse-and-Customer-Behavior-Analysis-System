import { segmentationApi } from '../../api/resources'
import useRoles from '../../auth/useRoles'
import PageTitle from '../../components/layout/PageTitle'
import Icon from '../../components/ui/Icon'
import useRemoteData from '../../hooks/useRemoteData'
import useT from '../../hooks/useT'
import ClusterSection from './ClusterSection'
import RfmHeatGrid from './RfmHeatGrid'
import SegmentCustomers from './SegmentCustomers'
import SegmentRevenueChart from './SegmentRevenueChart'
import SegmentSummaryTable from './SegmentSummaryTable'
import { runMessage } from './runStatus'
import useSegmentRun from './useSegmentRun'

const loadSegments = () => segmentationApi.segments()
const loadRfmGrid = () => segmentationApi.rfmGrid()
const loadClusters = () => segmentationApi.clusters()

/**
 * RFM segments and K-Means clusters. Administrators start a segmentation run; when it finishes every section loads
 * its data again. Analysts see the same results without the run button.
 */
export default function SegmentsPage() {
  const { t, language } = useT()
  const { isAdmin } = useRoles()
  const run = useSegmentRun()
  const segments = useRemoteData(loadSegments, run.finishedCount)
  const grid = useRemoteData(loadRfmGrid, run.finishedCount)
  const clusters = useRemoteData(loadClusters, run.finishedCount)
  const status = run.pollFailed ? t('common.error.page') : runMessage(run.run, t, language)

  return (
    <div className="page">
      <PageTitle title={t('segments.title')} subtitle={t('segments.subtitle')} />

      <div className="segments-toolbar">
        {status && <p className="run-status" role="status">{status}</p>}
        {isAdmin && (
          <button type="button" className="button button-primary" onClick={run.start} disabled={run.busy}>
            <Icon name="play" size={16} />
            <span>{t('segments.run.button')}</span>
          </button>
        )}
      </div>

      <div className="dashboard-grid">
        <SegmentSummaryTable resource={segments} />
        <SegmentRevenueChart resource={segments} />
        <RfmHeatGrid resource={grid} />
        <ClusterSection resource={clusters} />
      </div>

      <SegmentCustomers segments={segments} clusters={clusters} refreshToken={run.finishedCount} />
    </div>
  )
}
