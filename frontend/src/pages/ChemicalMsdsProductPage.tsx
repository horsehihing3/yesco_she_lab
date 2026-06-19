import { useState, useMemo, useEffect } from 'react'
import { Box, Tabs, Tab, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useMenuRule } from '../hooks/useMenuRule'
import MsdsProductLatestTab from '../components/chemical/MsdsProductLatestTab'
import MsdsProductOldTab from '../components/chemical/MsdsProductOldTab'
import MsdsProductHistoryTab from '../components/chemical/MsdsProductHistoryTab'
import FlowChartButton from '../components/common/FlowChartButton'

const ChemicalMsdsProductPage: React.FC = () => {
  const { t } = useTranslation()
  const { isMenuHidden } = useMenuRule()
  const [activeTab, setActiveTab] = useState(0)

  const tabs = useMemo(() => [
    { menuKey: 'chem.nav.prodMsdsLatest', label: t('chem.nav.prodMsdsLatest'), component: <MsdsProductLatestTab /> },
    { menuKey: 'chem.nav.prodMsdsOld',    label: t('chem.nav.prodMsdsOld'),    component: <MsdsProductOldTab /> },
    { menuKey: 'chem.nav.prodMsdsHist',   label: t('chem.nav.prodMsdsHist'),   component: <MsdsProductHistoryTab /> },
  ].filter(tab => !isMenuHidden(tab.menuKey)), [t, isMenuHidden])

  useEffect(() => {
    if (activeTab >= tabs.length && tabs.length > 0) setActiveTab(0)
  }, [tabs.length, activeTab])

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
        {activeTab === 0 && <FlowChartButton flowKey="chemicalMsdsProd" />}
      </Box>
      {tabs[activeTab]?.component}
    </Box>
  )
}

export default ChemicalMsdsProductPage
