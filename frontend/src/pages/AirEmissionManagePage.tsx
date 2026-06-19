import { useState } from 'react'
import { Box, Tabs, Tab, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import AirEmissionDashboardTab from '../components/environment/AirEmissionDashboardTab'
import AirEmissionTab from '../components/environment/AirEmissionTab'
import AirEmissionStandardTab from '../components/environment/AirEmissionStandardTab'
import AirEmissionReportTab from '../components/environment/AirEmissionReportTab'
import FlowChartButton from '../components/common/FlowChartButton'

const AirEmissionManagePage: React.FC = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState(0)

  const tabs = [
    { label: t('airEmission.tabs.dashboard'), component: <AirEmissionDashboardTab /> },
    { label: t('airEmission.tabs.measurement'), component: <AirEmissionTab /> },
    { label: t('airEmission.tabs.standard'), component: <AirEmissionStandardTab /> },
    { label: t('airEmission.tabs.report'), component: <AirEmissionReportTab /> },
  ]

  return (
    <Box>
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 2,
          '& .MuiTab-root': { minWidth: 'auto', px: 2, fontSize: '0.85rem' },
        }}
      >
        {tabs.map((tab, idx) => (
          <Tab key={idx} label={tab.label} />
        ))}
      </Tabs>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">{tabs[activeTab]?.label}</Typography>
        {activeTab === 0 && <FlowChartButton flowKey="airEmission" />}
      </Box>
      {tabs[activeTab]?.component}
    </Box>
  )
}

export default AirEmissionManagePage
