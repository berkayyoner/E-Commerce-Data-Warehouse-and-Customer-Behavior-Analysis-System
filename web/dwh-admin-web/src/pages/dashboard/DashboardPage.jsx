import PageTitle from '../../components/layout/PageTitle'
import useT from '../../hooks/useT'
import CategoryShares from './CategoryShares'
import KpiCards from './KpiCards'
import LastRunCard from './LastRunCard'
import MonthlyRevenueChart from './MonthlyRevenueChart'
import SegmentCards from './SegmentCards'

/** Landing page after sign-in. Every widget loads on its own and fails on its own. */
export default function DashboardPage() {
  const { t } = useT()
  return (
    <div className="page">
      <PageTitle title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />
      <div className="dashboard-grid">
        <KpiCards />
        <MonthlyRevenueChart />
        <CategoryShares />
        <SegmentCards />
        <LastRunCard />
      </div>
    </div>
  )
}
