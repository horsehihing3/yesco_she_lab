import { useState, useMemo, useEffect } from 'react'
import { Box, Tabs, Tab, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useMenuRule } from '../hooks/useMenuRule'
import ChemicalListTab from '../components/chemical/ChemicalListTab'
import ErpMaterialTab from '../components/chemical/ErpMaterialTab'
import VendorListTab from '../components/chemical/VendorListTab'
import RegulationTab from '../components/chemical/RegulationTab'
import RegulationCheckTab from '../components/chemical/RegulationCheckTab'
import FlowChartButton from '../components/common/FlowChartButton'

const ChemicalMasterPage: React.FC = () => {
  const { t } = useTranslation()
  const { isMenuHidden } = useMenuRule()
  const [activeTab, setActiveTab] = useState(0)

  const tabs = useMemo(() => [
    { menuKey: 'chem.nav.chemList', label: t('chem.nav.chemList'), component: <ChemicalListTab /> },
    { menuKey: 'chem.nav.erpItem',  label: t('chem.nav.erpItem'),  component: <ErpMaterialTab /> },
    { menuKey: 'chem.nav.vendor',   label: t('chem.nav.vendor'),   component: <VendorListTab /> },
    { menuKey: 'chem.nav.regRule',  label: t('chem.nav.regRule'),  component: <RegulationTab /> },
    { menuKey: 'chem.nav.regCheck', label: t('chem.nav.regCheck'), component: <RegulationCheckTab /> },
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
        {activeTab === 0 && <FlowChartButton flowKey="chemicalMaster" />}
      </Box>
      {tabs[activeTab]?.component}
    </Box>
  )
}

export default ChemicalMasterPage
