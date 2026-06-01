import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Tabs, Tab, Typography } from '@mui/material'
import DpDashboardTab from '../components/diseasePreventionMgmt/DpDashboardTab'
import DpMsdTab from '../components/diseasePreventionMgmt/DpMsdTab'
import DpCvdTab from '../components/diseasePreventionMgmt/DpCvdTab'
import DpStressTab from '../components/diseasePreventionMgmt/DpStressTab'
import DpRespiTab from '../components/diseasePreventionMgmt/DpRespiTab'
import DpHearingTab from '../components/diseasePreventionMgmt/DpHearingTab'
import DpThermalTab from '../components/diseasePreventionMgmt/DpThermalTab'
import DpInfectTab from '../components/diseasePreventionMgmt/DpInfectTab'

const DiseasePreventionMgmtPage: React.FC = () => {
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
    { label: '대시보드',      component: <DpDashboardTab onGoTab={(t) => { setActiveTab(t); setSearchParams({ tab: String(t) }) }} /> },
    { label: '근골격계',      component: <DpMsdTab /> },
    { label: '뇌심혈관',      component: <DpCvdTab /> },
    { label: '직무스트레스',  component: <DpStressTab /> },
    { label: '호흡기·피부',  component: <DpRespiTab /> },
    { label: '청력보존',      component: <DpHearingTab /> },
    { label: '온열·한랭',    component: <DpThermalTab /> },
    { label: '감염병',        component: <DpInfectTab /> },
  ]

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto"
          sx={{ '& .MuiTab-root': { minWidth: 'auto', px: 2, fontSize: '0.85rem' } }}>
          {tabs.map((tab, idx) => <Tab key={idx} label={tab.label} />)}
        </Tabs>
      </Box>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
        {tabs[activeTab]?.label}
      </Typography>
      {tabs[activeTab]?.component}
    </Box>
  )
}

export default DiseasePreventionMgmtPage
