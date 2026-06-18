import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Tabs, Tab, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useMenuRule } from '../hooks/useMenuRule'
import EmrDashboardTab from '../components/ehs/EmrDashboardTab'
import EmrPlanTab from '../components/ehs/EmrPlanTab'
import EmrDrillTab from '../components/ehs/EmrDrillTab'
import EmrResourceTab from '../components/ehs/EmrResourceTab'
import EmrReportTab from '../components/ehs/EmrReportTab'
import FlowChartButton from '../components/common/FlowChartButton'

const EmergencyResponsePage: React.FC = () => {
  const { t } = useTranslation()
  const { isMenuHidden } = useMenuRule()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(0)

  const tabs = useMemo(() => [
    { menuKey: 'emr.tab.dashboard', label: t('common.dashboard', '대시보드'), component: <EmrDashboardTab /> },
    { menuKey: 'emr.tabs.plans',    label: t('emr.tabs.plans'),               component: <EmrPlanTab /> },
    { menuKey: 'emr.tabs.drills',   label: t('emr.tabs.drills'),              component: <EmrDrillTab /> },
    { menuKey: 'emr.tabs.resources',label: t('emr.tabs.resources'),           component: <EmrResourceTab /> },
    { menuKey: 'emr.tab.report',    label: t('common.report', '레포트'),      component: <EmrReportTab /> },
  ].filter(tab => !isMenuHidden(tab.menuKey)), [t, isMenuHidden])

  useEffect(() => {
    const tab = parseInt(searchParams.get('tab') || '0', 10) || 0
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
        {activeTab === 0 && <FlowChartButton flowKey="emr" />}
      </Box>
      {tabs[activeTab]?.component}
    </Box>
  )
}

export default EmergencyResponsePage
