import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Tabs, Tab, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useMenuRule } from '../hooks/useMenuRule'
import FacilityEquipmentTab from '../components/legalFacility/FacilityEquipmentTab'
import FacilityStatusTab from '../components/legalFacility/FacilityStatusTab'
import FacilityInspectionTab from '../components/legalFacility/FacilityInspectionTab'
import FacilityWatchTab from '../components/legalFacility/FacilityWatchTab'

const LegalFacilityPage: React.FC = () => {
  const { t } = useTranslation()
  const { isMenuHidden } = useMenuRule()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(0)

  const tabs = useMemo(() => [
    { menuKey: 'lf.tabs.equipment',  label: t('lf.tabs.equipment'),  component: <FacilityEquipmentTab /> },
    { menuKey: 'lf.tabs.status',     label: t('lf.tabs.status'),     component: <FacilityStatusTab /> },
    { menuKey: 'lf.tabs.inspection', label: t('lf.tabs.inspection'), component: <FacilityInspectionTab /> },
    { menuKey: 'lf.tabs.watch',      label: t('lf.tabs.watch'),      component: <FacilityWatchTab /> },
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

export default LegalFacilityPage
