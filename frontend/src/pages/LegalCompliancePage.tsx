import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Tabs, Tab, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import LegalLawTab from '../components/legalCompliance/LegalLawTab'
import AuditPlanTab from '../components/ehs/AuditPlanTab'
import AuditExecutionTab from '../components/ehs/AuditExecutionTab'
import AuditFindingTab from '../components/ehs/AuditFindingTab'
import AuditCorrectiveTab from '../components/ehs/AuditCorrectiveTab'

const LegalCompliancePage: React.FC = () => {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = parseInt(searchParams.get('tab') || '0', 10)
  const [activeTab, setActiveTab] = useState(tabParam)

  useEffect(() => {
    const tab = parseInt(searchParams.get('tab') || '0', 10)
    setActiveTab(tab)
  }, [searchParams])

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
    setSearchParams({ tab: String(newValue) })
  }

  const tabs = [
    { label: t('lc.tabs.law', '법규검토시스템'), component: <LegalLawTab /> },
    { label: t('lc.tabs.plan', '법규 대응 계획'),      component: <AuditPlanTab      menuPath="EHS경영 › 법규 대응 › 법규 대응 계획" /> },
    { label: t('lc.tabs.execution', '법규 대응 실시'), component: <AuditExecutionTab menuPath="EHS경영 › 법규 대응 › 법규 대응 실시" /> },
    { label: t('audit.tabs.findings', '부적합 사항'), component: <AuditFindingTab /> },
    { label: t('audit.tabs.corrective', '시정 조치'), component: <AuditCorrectiveTab /> },
  ]

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
