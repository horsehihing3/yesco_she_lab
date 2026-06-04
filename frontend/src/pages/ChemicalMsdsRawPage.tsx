import { useState, useMemo, useEffect } from 'react'
import { Box, Tabs, Tab, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useMenuRule } from '../hooks/useMenuRule'
import MsdsRawLatestTab from '../components/chemical/MsdsRawLatestTab'
import MsdsRawOldTab from '../components/chemical/MsdsRawOldTab'
import MsdsRawHistoryTab from '../components/chemical/MsdsRawHistoryTab'

const ChemicalMsdsRawPage: React.FC = () => {
  const { t } = useTranslation()
  const { isMenuHidden } = useMenuRule()
  const [activeTab, setActiveTab] = useState(0)

  const tabs = useMemo(() => [
    { menuKey: 'chem.nav.rawMsdsLatest', label: t('chem.nav.rawMsdsLatest'), component: <MsdsRawLatestTab /> },
    { menuKey: 'chem.nav.rawMsdsOld',   label: t('chem.nav.rawMsdsOld'),    component: <MsdsRawOldTab /> },
    { menuKey: 'chem.nav.rawMsdsHist',  label: t('chem.nav.rawMsdsHist'),   component: <MsdsRawHistoryTab /> },
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
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
        {tabs[activeTab]?.label}
      </Typography>
      {tabs[activeTab]?.component}
    </Box>
  )
}

export default ChemicalMsdsRawPage
