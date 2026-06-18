import { useState } from 'react'
import { Box, Tabs, Tab } from '@mui/material'
import { useTranslation } from 'react-i18next'
import WaterDashboardTab from '../components/environment/WaterDashboardTab'
import WaterQualityTab from '../components/environment/WaterQualityTab'
import WaterWorkplaceTab from '../components/environment/WaterWorkplaceTab'
import WaterStandardTab from '../components/environment/WaterStandardTab'
import WaterReportTab from '../components/environment/WaterReportTab'
import FlowChartButton from '../components/common/FlowChartButton'

const WaterQualityManagePage: React.FC = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState(0)

  const tabs = [
    { label: t('water.tabs.dashboard'), component: <WaterDashboardTab /> },
    { label: t('water.tabs.measurement'), component: <WaterQualityTab /> },
    { label: t('water.tabs.workplace'), component: <WaterWorkplaceTab /> },
    { label: t('water.tabs.standard'), component: <WaterStandardTab /> },
    { label: t('water.tabs.report'), component: <WaterReportTab /> },
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
      {activeTab === 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1, mb: 2 }}>
          <FlowChartButton flowKey="waterQuality" />
        </Box>
      )}
      {tabs[activeTab]?.component}
    </Box>
  )
}

export default WaterQualityManagePage
