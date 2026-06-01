import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Tabs, Tab, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import FireFacilityTab from '../components/fireSafety/FireFacilityTab'
import FireInspectionTab from '../components/fireSafety/FireInspectionTab'
import DisasterFacilityTab from '../components/fireSafety/DisasterFacilityTab'
import FireEmergencyTab from '../components/fireSafety/FireEmergencyTab'
import FireComplianceTab from '../components/fireSafety/FireComplianceTab'

const FireSafetyPage: React.FC = () => {
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
    { label: t('fs.tabs.facility'),    component: <FireFacilityTab /> },
    { label: t('fs.tabs.inspection'),  component: <FireInspectionTab /> },
    { label: t('fs.tabs.disaster'),    component: <DisasterFacilityTab /> },
    { label: t('fs.tabs.emergency'),   component: <FireEmergencyTab /> },
    { label: t('fs.tabs.compliance'),  component: <FireComplianceTab /> },
  ]

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto"
          sx={{ '& .MuiTab-root': { minWidth: 'auto', px: 2, fontSize: '0.85rem' } }}>
          {tabs.map((tab, idx) => <Tab key={idx} label={tab.label} />)}
        </Tabs>
      </Box>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>{tabs[activeTab]?.label}</Typography>
      {tabs[activeTab]?.component}
    </Box>
  )
}

export default FireSafetyPage
