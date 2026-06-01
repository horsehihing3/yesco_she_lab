import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Tabs, Tab, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import EmrDashboardTab from '../components/ehs/EmrDashboardTab'
import EmrPlanTab from '../components/ehs/EmrPlanTab'
import EmrDrillTab from '../components/ehs/EmrDrillTab'
import EmrResourceTab from '../components/ehs/EmrResourceTab'
import EmrReportTab from '../components/ehs/EmrReportTab'

const EmergencyResponsePage: React.FC = () => {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()

  const tabs = [
    { label: t('common.dashboard', '대시보드'), component: <EmrDashboardTab /> },
    { label: t('emr.tabs.plans'), component: <EmrPlanTab /> },
    { label: t('emr.tabs.drills'), component: <EmrDrillTab /> },
    { label: t('emr.tabs.resources'), component: <EmrResourceTab /> },
    { label: t('common.report', '레포트'), component: <EmrReportTab /> },
  ]

  const clampTab = (n: number) => Math.min(Math.max(0, n), tabs.length - 1)
  const tabParam = clampTab(parseInt(searchParams.get('tab') || '0', 10) || 0)
  const [activeTab, setActiveTab] = useState(tabParam)

  useEffect(() => {
    const tab = clampTab(parseInt(searchParams.get('tab') || '0', 10) || 0)
    setActiveTab(tab)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
    setSearchParams({ tab: String(newValue) })
  }

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

export default EmergencyResponsePage
