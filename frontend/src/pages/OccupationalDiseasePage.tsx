import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Tabs, Tab, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useMenuRule } from '../hooks/useMenuRule'
import OdPlanTab from '../components/occupationalDisease/OdPlanTab'
import OdStatusTab from '../components/occupationalDisease/OdStatusTab'
import OdManageTab from '../components/occupationalDisease/OdManageTab'
import OdExposureTab from '../components/occupationalDisease/OdExposureTab'
import OdAftercareTab from '../components/occupationalDisease/OdAftercareTab'
import OdmAccidentClaimTab from '../components/occupationalDisease/OdmAccidentClaimTab'
import OdResultTab from '../components/occupationalDisease/OdResultTab'

const OccupationalDiseasePage: React.FC = () => {
  const { t } = useTranslation()
  const { isMenuHidden } = useMenuRule()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(0)

  const tabs = useMemo(() => [
    { menuKey: 'od.tabs.plan',      label: t('od.tabs.plan'),      component: <OdPlanTab /> },
    { menuKey: 'od.tabs.status',    label: t('od.tabs.status'),    component: <OdStatusTab /> },
    { menuKey: 'od.tabs.manage',    label: t('od.tabs.manage'),    component: <OdManageTab /> },
    { menuKey: 'od.tabs.exposure',  label: t('od.tabs.exposure'),  component: <OdExposureTab /> },
    { menuKey: 'od.tabs.aftercare', label: t('od.tabs.aftercare'), component: <OdAftercareTab /> },
    { menuKey: 'od.tabs.sanjae',    label: t('od.tabs.sanjae'),    component: <OdmAccidentClaimTab /> },
    { menuKey: 'od.tabs.result',    label: t('od.tabs.result'),    component: <OdResultTab /> },
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
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>{tabs[activeTab]?.label}</Typography>
      {tabs[activeTab]?.component}
    </Box>
  )
}

export default OccupationalDiseasePage
