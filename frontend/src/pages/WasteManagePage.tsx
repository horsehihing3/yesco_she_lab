import { useState } from 'react'
import { Box, Tabs, Tab, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import WasteDashboardTab from '../components/environment/WasteDashboardTab'
import WasteManageTab from '../components/environment/WasteManageTab'
import WasteDisposalTab from '../components/environment/WasteDisposalTab'
import DisposalCompanyTab from '../components/environment/DisposalCompanyTab'
import WasteComplianceTab from '../components/environment/WasteComplianceTab'

const WasteManagePage: React.FC = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState(0)

  const tabs = [
    { label: t('waste.tabs.dashboard'), component: <WasteDashboardTab /> },
    { label: t('waste.tabs.inventory'), component: <WasteManageTab /> },
    { label: t('waste.tabs.disposal'), component: <WasteDisposalTab /> },
    { label: t('waste.tabs.company'), component: <DisposalCompanyTab /> },
    { label: t('waste.tabs.compliance'), component: <WasteComplianceTab /> },
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
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
        {tabs[activeTab]?.label}
      </Typography>
      {tabs[activeTab]?.component}
    </Box>
  )
}

export default WasteManagePage
