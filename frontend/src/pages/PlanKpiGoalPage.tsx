import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Tabs, Tab } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useMenuRule } from '../hooks/useMenuRule'
import PageHeader from '../components/common/PageHeader'
import PlanOverviewTab from '../components/planKpiGoal/PlanOverviewTab'
import AnnualPlanTab from '../components/planKpiGoal/AnnualPlanTab'
import KpiStatusTab from '../components/planKpiGoal/KpiStatusTab'
import PlanReportTab from '../components/planKpiGoal/PlanReportTab'

const PlanKpiGoalPage: React.FC = () => {
  const { t } = useTranslation()
  const { isMenuHidden } = useMenuRule()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(0)

  const tabs = useMemo(() => [
    { menuKey: 'pkg.overview',   label: t('pkg.overview'),          component: <PlanOverviewTab /> },
    { menuKey: 'pkg.annualPlan', label: t('pkg.annualPlan'),        component: <AnnualPlanTab /> },
    { menuKey: 'pkg.kpiStatus',  label: t('pkg.kpiStatus'),         component: <KpiStatusTab /> },
    { menuKey: 'pkg.reportTab',  label: t('pkg.reportTab', '보고서'), component: <PlanReportTab /> },
  ].filter(tab => !isMenuHidden(tab.menuKey)), [t, isMenuHidden])

  useEffect(() => {
    const tab = parseInt(searchParams.get('tab') || '0', 10)
    setActiveTab(Math.min(tab, Math.max(0, tabs.length - 1)))
  }, [searchParams, tabs.length])

  useEffect(() => {
    if (activeTab >= tabs.length && tabs.length > 0) setActiveTab(0)
  }, [tabs.length, activeTab])

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
    setSearchParams({ tab: String(newValue) })
  }

  return (
    <PageHeader
      title={t('nav.planKpiGoal')}
      flowKey={activeTab === 0 ? 'kpiGoal' : undefined}
      tabs={
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              minWidth: 'auto',
              px: 2,
              fontSize: '0.85rem',
            },
          }}
        >
          {tabs.map((tab, idx) => (
            <Tab key={idx} label={tab.label} />
          ))}
        </Tabs>
      }
    >
      {tabs[activeTab]?.component}
    </PageHeader>
  )
}

export default PlanKpiGoalPage
