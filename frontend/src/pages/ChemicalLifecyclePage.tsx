import { useState } from 'react'
import { Box, Tabs, Tab, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import FlowChartButton from '../components/common/FlowChartButton'
import WarehouseTab from '../components/chemical/WarehouseTab'
import IncomingUsageTab from '../components/chemical/IncomingUsageTab'
import LotTrackingTab from '../components/chemical/LotTrackingTab'
import UsageReportTab from '../components/chemical/UsageReportTab'
import HazardReportTab from '../components/chemical/HazardReportTab'

const ChemicalLifecyclePage: React.FC = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState(0)

  const tabs = [
    { label: t('chem.nav.warehouse'), component: <WarehouseTab /> },
    { label: t('chem.nav.incoming'), component: <IncomingUsageTab /> },
    { label: t('chem.nav.tracking'), component: <LotTrackingTab /> },
    { label: t('chem.nav.reportUsage'), component: <UsageReportTab /> },
    { label: t('chem.nav.reportHazard'), component: <HazardReportTab /> },
  ]

  return (
    <Box>
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2, '& .MuiTab-root': { minWidth: 'auto', px: 2, fontSize: '0.85rem' } }}
      >
        {tabs.map((tab, idx) => <Tab key={idx} label={tab.label} />)}
      </Tabs>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">{tabs[activeTab]?.label}</Typography>
        {activeTab === 0 && <FlowChartButton flowKey="chemicalLife" />}
      </Box>
      {tabs[activeTab]?.component}
    </Box>
  )
}

export default ChemicalLifecyclePage
