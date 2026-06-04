import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Tabs, Tab, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useMenuRule } from '../hooks/useMenuRule'
import LegalLawTab from '../components/legalCompliance/LegalLawTab'
import AuditPlanTab from '../components/ehs/AuditPlanTab'
import AuditExecutionTab from '../components/ehs/AuditExecutionTab'
import AuditFindingTab from '../components/ehs/AuditFindingTab'
import AuditCorrectiveTab from '../components/ehs/AuditCorrectiveTab'

const LegalCompliancePage: React.FC = () => {
  const { t } = useTranslation()
  const { isMenuHidden } = useMenuRule()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(0)

  const tabs = useMemo(() => [
    { menuKey: 'lc.tabs.law',       label: t('lc.tabs.law', '법규검토시스템'),        component: <LegalLawTab /> },
    { menuKey: 'lc.tabs.plan',      label: t('lc.tabs.plan', '법규 대응 계획'),       component: <AuditPlanTab      variant="legal-compliance" menuPath="EHS경영 › 법규 대응 › 법규 대응 계획" /> },
    { menuKey: 'lc.tabs.execution', label: t('lc.tabs.execution', '법규 대응 실시'),  component: <AuditExecutionTab variant="legal-compliance" menuPath="EHS경영 › 법규 대응 › 법규 대응 실시" /> },
    { menuKey: 'lc.tabs.findings',  label: t('audit.tabs.findings', '부적합 사항'),   component: <AuditFindingTab /> },
    { menuKey: 'lc.tabs.corrective',label: t('audit.tabs.corrective', '시정 조치'),   component: <AuditCorrectiveTab /> },
  ].filter(tab => !isMenuHidden(tab.menuKey)), [t, isMenuHidden])

  useEffect(() => {
    const tab = parseInt(searchParams.get('tab') || '0', 10)
    setActiveTab(Math.min(tab, Math.max(0, tabs.length - 1)))
  }, [searchParams, tabs.length])

  useEffect(() => {
    if (activeTab >= tabs.length && tabs.length > 0) setActiveTab(0)
  }, [tabs.length, activeTab])

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
    setSearchParams({ tab: String(newValue) })
  }

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              minWidth: 'auto',
              px: 2,
              fontSize: '0.85rem',
            },
          }}
        >
          {tabs.map((tab, idx) => (
            <Tab key={idx} label={tab.label} />
          ))}
        </Tabs>
      </Box>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
        {tabs[activeTab]?.label}
      </Typography>
      {tabs[activeTab]?.component}
    </Box>
  )
}

export default LegalCompliancePage
