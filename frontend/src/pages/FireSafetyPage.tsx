import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Tabs, Tab, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useMenuRule } from '../hooks/useMenuRule'
import FireFacilityTab from '../components/fireSafety/FireFacilityTab'
import FireInspectionTab from '../components/fireSafety/FireInspectionTab'
import DisasterFacilityTab from '../components/fireSafety/DisasterFacilityTab'
import FireEmergencyTab from '../components/fireSafety/FireEmergencyTab'
import FireComplianceTab from '../components/fireSafety/FireComplianceTab'
import FlowChartButton from '../components/common/FlowChartButton'

const FireSafetyPage: React.FC = () => {
  const { t } = useTranslation()
  const { isMenuHidden } = useMenuRule()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(0)

  const tabs = useMemo(() => [
    { menuKey: 'fs.tabs.facility',   label: t('fs.tabs.facility'),   component: <FireFacilityTab /> },
    { menuKey: 'fs.tabs.inspection', label: t('fs.tabs.inspection'), component: <FireInspectionTab /> },
    { menuKey: 'fs.tabs.disaster',   label: t('fs.tabs.disaster'),   component: <DisasterFacilityTab /> },
    { menuKey: 'fs.tabs.emergency',  label: t('fs.tabs.emergency'),  component: <FireEmergencyTab /> },
    { menuKey: 'fs.tabs.compliance', label: t('fs.tabs.compliance'), component: <FireComplianceTab /> },
  ].filter(tab => !isMenuHidden(tab.menuKey)), [t, isMenuHidden])

  useEffect(() => {
    setActiveTab(Math.min(parseInt(searchParams.get('tab') || '0', 10), Math.max(0, tabs.length - 1)))
  }, [searchParams, tabs.length])

  useEffect(() => {
    if (activeTab >= tabs.length && tabs.length > 0) setActiveTab(0)
  }, [tabs.length, activeTab])

  const handleTabChange = (_: React.SyntheticEvent, v: number) => {
    setActiveTab(v); setSearchParams({ tab: String(v) })
  }

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
        {activeTab === 0 && <FlowChartButton flowKey="fireSafety" />}
      </Box>
      {tabs[activeTab]?.component}
    </Box>
  )
}

export default FireSafetyPage
