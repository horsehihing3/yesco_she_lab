import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Tabs, Tab, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import FacilityEquipmentTab from '../components/legalFacility/FacilityEquipmentTab'
import FacilityStatusTab from '../components/legalFacility/FacilityStatusTab'
import FacilityInspectionTab from '../components/legalFacility/FacilityInspectionTab'
import FacilityWatchTab from '../components/legalFacility/FacilityWatchTab'

const LegalFacilityPage: React.FC = () => {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = parseInt(searchParams.get('tab') || '0', 10)
  const [activeTab, setActiveTab] = useState(tabParam)

  useEffect(() => {
    const tab = parseInt(searchParams.get('tab') || '0', 10)
    setActiveTab(tab)
  }, [searchParams])

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
    setSearchParams({ tab: String(newValue) })
  }

  const tabs = [
    { label: t('lf.tabs.equipment'),  component: <FacilityEquipmentTab /> },
    { label: t('lf.tabs.status'),     component: <FacilityStatusTab /> },
    { label: t('lf.tabs.inspection'), component: <FacilityInspectionTab /> },
    { label: t('lf.tabs.watch'),      component: <FacilityWatchTab /> },
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

export default LegalFacilityPage
