import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Tabs, Tab, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import OdPlanTab from '../components/occupationalDisease/OdPlanTab'
import OdStatusTab from '../components/occupationalDisease/OdStatusTab'
import OdManageTab from '../components/occupationalDisease/OdManageTab'
import OdExposureTab from '../components/occupationalDisease/OdExposureTab'
import OdAftercareTab from '../components/occupationalDisease/OdAftercareTab'
import OdmAccidentClaimTab from '../components/occupationalDisease/OdmAccidentClaimTab'
import OdResultTab from '../components/occupationalDisease/OdResultTab'

const OccupationalDiseasePage: React.FC = () => {
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
    { label: t('od.tabs.plan'),      component: <OdPlanTab /> },
    { label: t('od.tabs.status'),    component: <OdStatusTab /> },
    { label: t('od.tabs.manage'),    component: <OdManageTab /> },
    { label: t('od.tabs.exposure'),  component: <OdExposureTab /> },
    { label: t('od.tabs.aftercare'), component: <OdAftercareTab /> },
    { label: t('od.tabs.sanjae'),    component: <OdmAccidentClaimTab /> },
    { label: t('od.tabs.result'),    component: <OdResultTab /> },
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

export default OccupationalDiseasePage
