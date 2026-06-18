import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Tabs, Tab, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useMenuRule } from '../hooks/useMenuRule'
import WemDashboardTab from '../components/workEnvMeasurement/WemDashboardTab'
import WemFactorTab from '../components/workEnvMeasurement/WemFactorTab'
import WemPlanTab from '../components/workEnvMeasurement/WemPlanTab'
import WemResultTab from '../components/workEnvMeasurement/WemResultTab'
import WemImprovementTab from '../components/workEnvMeasurement/WemImprovementTab'
import WemReportTab from '../components/workEnvMeasurement/WemReportTab'
import FlowChartButton from '../components/common/FlowChartButton'

const WorkEnvMeasurementPage: React.FC = () => {
  const { t } = useTranslation()
  const { isMenuHidden } = useMenuRule()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(0)

  const tabs = useMemo(() => [
    { menuKey: 'wem.tab.dashboard', label: t('common.dashboard', '대시보드'), component: <WemDashboardTab key="dashboard" /> },
    { menuKey: 'wem.factorTab',     label: t('wem.factorTab', '유해인자'),    component: <WemFactorTab key="factor" /> },
    { menuKey: 'wem.planTab',       label: t('wem.planTab', '측정 계획'),     component: <WemPlanTab key="plan" /> },
    { menuKey: 'wem.resultTab',     label: t('wem.resultTab', '측정 결과'),   component: <WemResultTab key="result" /> },
    { menuKey: 'wem.improveTab',    label: t('wem.improveTab', '개선 조치'),  component: <WemImprovementTab key="improve" /> },
    { menuKey: 'wem.tab.report',    label: t('common.report', '레포트'),      component: <WemReportTab key="report" /> },
  ].filter(tab => !isMenuHidden(tab.menuKey)), [t, isMenuHidden])

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
    setSearchParams({ tab: String(newValue) })
  }

  useEffect(() => {
    const tab = parseInt(searchParams.get('tab') || '0', 10)
    setActiveTab(Math.min(Math.max(0, tab), Math.max(0, tabs.length - 1)))
  }, [searchParams, tabs.length])

  useEffect(() => {
    if (activeTab >= tabs.length && tabs.length > 0) setActiveTab(0)
  }, [tabs.length, activeTab])

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
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
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">{tabs[activeTab]?.label}</Typography>
        {activeTab === 0 && <FlowChartButton flowKey="workEnvMeasure" />}
      </Box>
      {tabs[activeTab]?.component}
    </Box>
  )
}

export default WorkEnvMeasurementPage
