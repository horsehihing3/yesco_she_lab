import { useState, useMemo, useEffect } from 'react'
import { Box, Tabs, Tab, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useMenuRule } from '../hooks/useMenuRule'
import CarbonDashboardTab from '../components/carbon/CarbonDashboardTab'
import CarbonEmissionTab from '../components/carbon/CarbonEmissionTab'
import EmissionSourceTab from '../components/carbon/EmissionSourceTab'
import ScopeAnalysisTab from '../components/carbon/ScopeAnalysisTab'
import EmissionFactorTab from '../components/carbon/EmissionFactorTab'
import CarbonReportTab from '../components/carbon/CarbonReportTab'

const CarbonManagePage: React.FC = () => {
  const { t } = useTranslation()
  const { isMenuHidden } = useMenuRule()
  const [activeTab, setActiveTab] = useState(0)

  const tabs = useMemo(() => [
    { menuKey: 'carbon.tabs.dashboard',    label: t('carbon.tabs.dashboard'),    component: <CarbonDashboardTab /> },
    { menuKey: 'carbon.tabs.emission',     label: t('carbon.tabs.emission'),     component: <CarbonEmissionTab /> },
    { menuKey: 'carbon.tabs.source',       label: t('carbon.tabs.source'),       component: <EmissionSourceTab /> },
    { menuKey: 'carbon.tabs.scopeAnalysis',label: t('carbon.tabs.scopeAnalysis'),component: <ScopeAnalysisTab /> },
    { menuKey: 'carbon.tabs.factor',       label: t('carbon.tabs.factor'),       component: <EmissionFactorTab /> },
    { menuKey: 'carbon.tabs.report',       label: t('carbon.tabs.report'),       component: <CarbonReportTab /> },
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

export default CarbonManagePage
