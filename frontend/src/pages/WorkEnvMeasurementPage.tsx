import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Tabs, Tab, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import WemDashboardTab from '../components/workEnvMeasurement/WemDashboardTab'
import WemFactorTab from '../components/workEnvMeasurement/WemFactorTab'
import WemPlanTab from '../components/workEnvMeasurement/WemPlanTab'
import WemResultTab from '../components/workEnvMeasurement/WemResultTab'
import WemImprovementTab from '../components/workEnvMeasurement/WemImprovementTab'
import WemReportTab from '../components/workEnvMeasurement/WemReportTab'

const WorkEnvMeasurementPage: React.FC = () => {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = parseInt(searchParams.get('tab') || '0', 10)
  const [activeTab, setActiveTab] = useState(tabParam)

  useEffect(() => {
    const tab = parseInt(searchParams.get('tab') || '0', 10)
    setActiveTab(Math.min(Math.max(0, tab), 5))
  }, [searchParams])

  // 탭 구성: 대시보드 / 유해인자 / 측정 계획 / 측정 결과 / 개선 조치 / 레포트

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
    setSearchParams({ tab: String(newValue) })
  }

  const tabs = [
    { label: t('common.dashboard', '대시보드'), component: <WemDashboardTab key="dashboard" /> },
    { label: t('wem.factorTab', '유해인자'), component: <WemFactorTab key="factor" /> },
    { label: t('wem.planTab', '측정 계획'), component: <WemPlanTab key="plan" /> },
    { label: t('wem.resultTab', '측정 결과'), component: <WemResultTab key="result" /> },
    { label: t('wem.improveTab', '개선 조치'), component: <WemImprovementTab key="improve" /> },
    { label: t('common.report', '레포트'), component: <WemReportTab key="report" /> },
  ]

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
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
        {tabs[activeTab]?.label}
      </Typography>
      {tabs[activeTab]?.component}
    </Box>
  )
}

export default WorkEnvMeasurementPage
