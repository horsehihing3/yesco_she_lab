import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Tabs, Tab, Typography } from '@mui/material'
import { useMenuRule } from '../hooks/useMenuRule'
import PermitIdentificationTab from '../components/permitLifecycle/PermitIdentificationTab'
import PermitRegistryTab from '../components/permitLifecycle/PermitRegistryTab'
import PermitRenewalTab from '../components/permitLifecycle/PermitRenewalTab'
import PermitChangeTab from '../components/permitLifecycle/PermitChangeTab'
import PermitInspectionTab from '../components/permitLifecycle/PermitInspectionTab'
import PermitReportingTab from '../components/permitLifecycle/PermitReportingTab'
import PermitDocumentTab from '../components/permitLifecycle/PermitDocumentTab'

const PermitLifecyclePage: React.FC = () => {
  const { isMenuHidden } = useMenuRule()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(0)

  const tabs = useMemo(() => [
    { menuKey: 'permit-lc.tab.register',  label: '식별·등록', component: <PermitIdentificationTab /> },
    { menuKey: 'permit-lc.tab.ledger',    label: '대장 관리', component: <PermitRegistryTab /> },
    { menuKey: 'permit-lc.tab.renew',     label: '갱신·만료', component: <PermitRenewalTab /> },
    { menuKey: 'permit-lc.tab.change',    label: '변경관리',  component: <PermitChangeTab /> },
    { menuKey: 'permit-lc.tab.selfcheck', label: '자체점검',  component: <PermitInspectionTab /> },
    { menuKey: 'permit-lc.tab.report',    label: '보고·신고', component: <PermitReportingTab /> },
    { menuKey: 'permit-lc.tab.evidence',  label: '증빙·기록', component: <PermitDocumentTab /> },
  ].filter(tab => !isMenuHidden(tab.menuKey)), [isMenuHidden])

  useEffect(() => {
    setActiveTab(Math.min(parseInt(searchParams.get('tab') || '0', 10), Math.max(0, tabs.length - 1)))
  }, [searchParams, tabs.length])

  useEffect(() => {
    if (activeTab >= tabs.length && tabs.length > 0) setActiveTab(0)
  }, [tabs.length, activeTab])

  const handleTabChange = (_: React.SyntheticEvent, v: number) => {
    setActiveTab(v); setSearchParams({ tab: String(v) })
  }

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto"
          sx={{ '& .MuiTab-root': { minWidth: 'auto', px: 2, fontSize: '0.85rem' } }}>
          {tabs.map((tab, idx) => <Tab key={idx} label={tab.label} />)}
        </Tabs>
      </Box>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
        {tabs[activeTab]?.label}
      </Typography>
      {tabs[activeTab]?.component}
    </Box>
  )
}

export default PermitLifecyclePage
