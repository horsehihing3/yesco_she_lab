import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Tabs, Tab, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import RadSourceTab from '../components/radiation/RadSourceTab'
import RadWorkerTab from '../components/radiation/RadWorkerTab'
import RadDoseTab from '../components/radiation/RadDoseTab'
import RadZoneTab from '../components/radiation/RadZoneTab'
import RadMeasurementTab from '../components/radiation/RadMeasurementTab'
import RadHealthTab from '../components/radiation/RadHealthTab'
import RadAccidentTab from '../components/radiation/RadAccidentTab'
import FlowChartButton from '../components/common/FlowChartButton'

const RadiationMgmtPage: React.FC = () => {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = parseInt(searchParams.get('tab') || '0', 10)
  const [activeTab, setActiveTab] = useState(tabParam)

  useEffect(() => {
    setActiveTab(parseInt(searchParams.get('tab') || '0', 10))
  }, [searchParams])

  const handleTabChange = (_: React.SyntheticEvent, v: number) => {
    setActiveTab(v); setSearchParams({ tab: String(v) })
  }

  const tabs = [
    { label: t('rm.tabs.source'),      component: <RadSourceTab /> },
    { label: t('rm.tabs.worker'),      component: <RadWorkerTab /> },
    { label: t('rm.tabs.dose'),        component: <RadDoseTab /> },
    { label: t('rm.tabs.zone'),        component: <RadZoneTab /> },
    { label: t('rm.tabs.measurement'), component: <RadMeasurementTab /> },
    { label: t('rm.tabs.health'),      component: <RadHealthTab /> },
    { label: t('rm.tabs.accident'),    component: <RadAccidentTab /> },
  ]

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto"
          sx={{ '& .MuiTab-root': { minWidth: 'auto', px: 2, fontSize: '0.85rem' } }}>
          {tabs.map((tab, idx) => <Tab key={idx} label={tab.label} />)}
        </Tabs>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">{tabs[activeTab]?.label}</Typography>
        {activeTab === 0 && <FlowChartButton flowKey="radiation" />}
      </Box>
      {tabs[activeTab]?.component}
    </Box>
  )
}

export default RadiationMgmtPage
