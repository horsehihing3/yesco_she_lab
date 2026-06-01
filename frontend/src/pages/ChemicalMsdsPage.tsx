import { useState } from 'react'
import { Box, Tabs, Tab } from '@mui/material'
import { useTranslation } from 'react-i18next'
import MsdsRawLatestTab from '../components/chemical/MsdsRawLatestTab'
import MsdsRawOldTab from '../components/chemical/MsdsRawOldTab'
import MsdsRawHistoryTab from '../components/chemical/MsdsRawHistoryTab'
import MsdsProductLatestTab from '../components/chemical/MsdsProductLatestTab'
import MsdsProductOldTab from '../components/chemical/MsdsProductOldTab'
import MsdsProductHistoryTab from '../components/chemical/MsdsProductHistoryTab'

const ChemicalMsdsPage: React.FC = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState(0)

  const tabs = [
    { label: t('chem.nav.rawMsdsLatest'), component: <MsdsRawLatestTab /> },
    { label: t('chem.nav.rawMsdsOld'), component: <MsdsRawOldTab /> },
    { label: t('chem.nav.rawMsdsHist'), component: <MsdsRawHistoryTab /> },
    { label: t('chem.nav.prodMsdsLatest'), component: <MsdsProductLatestTab /> },
    { label: t('chem.nav.prodMsdsOld'), component: <MsdsProductOldTab /> },
    { label: t('chem.nav.prodMsdsHist'), component: <MsdsProductHistoryTab /> },
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
      {tabs[activeTab]?.component}
    </Box>
  )
}

export default ChemicalMsdsPage
