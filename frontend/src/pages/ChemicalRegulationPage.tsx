import { useState } from 'react'
import { Box, Tabs, Tab, Typography } from '@mui/material'
import GhsTab from '../components/chemical/GhsTab'
import ReachTab from '../components/chemical/ReachTab'
import ClpTab from '../components/chemical/ClpTab'
import TscaTab from '../components/chemical/TscaTab'
import FlowChartButton from '../components/common/FlowChartButton'

const ChemicalRegulationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0)

  const tabs = [
    { label: 'GHS', component: <GhsTab /> },
    { label: 'EU REACH', component: <ReachTab /> },
    { label: 'EU CLP', component: <ClpTab /> },
    { label: 'TSCA', component: <TscaTab /> },
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
        {activeTab === 0 && <FlowChartButton flowKey="chemicalReg" />}
      </Box>
      {tabs[activeTab]?.component}
    </Box>
  )
}

export default ChemicalRegulationPage
