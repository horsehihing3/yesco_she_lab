import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Tabs, Tab, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import SafetyRulesTab from '../components/ehs/SafetyRulesTab'
import EhsPlanTab from '../components/ehs/EhsPlanTab'
import EhsManagerTab from '../components/ehs/EhsManagerTab'
import EhsMessageTab from '../components/ehs/EhsMessageTab'
import EhsAlertTab from '../components/ehs/EhsAlertTab'
import OshCommitteeTab from '../components/ehs/OshCommitteeTab'
import EmergencyNotificationTab from '../components/ehs/EmergencyNotificationTab'
import QnaTab from '../components/ehs/QnaTab'
import EmrContactTab from '../components/ehs/EmrContactTab'

const EhsPage: React.FC = () => {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()

  const tabs = [
    { label: t('nav.ehsDocument'), component: <SafetyRulesTab /> },
    { label: t('nav.ehsPlan'), component: <EhsPlanTab /> },
    { label: t('nav.ehsOfficer'), component: <EhsManagerTab /> },
    { label: t('nav.ehsMessage'), component: <EhsMessageTab /> },
    { label: t('nav.ehsAlert'), component: <EhsAlertTab /> },
    { label: t('nav.ehsOshCommittee'), component: <OshCommitteeTab /> },
    { label: t('nav.ehsEmergency'), component: <EmergencyNotificationTab /> },
    { label: t('nav.ehsQna'), component: <QnaTab /> },
    { label: t('emr.tabs.contacts'), component: <EmrContactTab /> },
  ]

  const clampTab = (n: number) => Math.min(Math.max(0, n), tabs.length - 1)
  const tabParam = clampTab(parseInt(searchParams.get('tab') || '0', 10) || 0)
  const [activeTab, setActiveTab] = useState(tabParam)

  useEffect(() => {
    const tab = clampTab(parseInt(searchParams.get('tab') || '0', 10) || 0)
    setActiveTab(tab)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

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

export default EhsPage
