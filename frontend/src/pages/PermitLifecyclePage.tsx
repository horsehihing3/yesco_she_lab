import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Tabs, Tab, Typography } from '@mui/material'
import PermitIdentificationTab from '../components/permitLifecycle/PermitIdentificationTab'
import PermitRegistryTab from '../components/permitLifecycle/PermitRegistryTab'
import PermitRenewalTab from '../components/permitLifecycle/PermitRenewalTab'
import PermitChangeTab from '../components/permitLifecycle/PermitChangeTab'
import PermitInspectionTab from '../components/permitLifecycle/PermitInspectionTab'
import PermitReportingTab from '../components/permitLifecycle/PermitReportingTab'
import PermitDocumentTab from '../components/permitLifecycle/PermitDocumentTab'

const PermitLifecyclePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = parseInt(searchParams.get('tab') || '0', 10)
  const [activeTab, setActiveTab] = useState(tabParam)

  useEffect(() => {
    setActiveTab(parseInt(searchParams.get('tab') || '0', 10))
  }, [searchParams])

  const handleTabChange = (_: React.SyntheticEvent, v: number) => {
    setActiveTab(v); setSearchParams({ tab: String(v) })
  }

  const tabs = [
    { label: '식별·등록',  component: <PermitIdentificationTab /> },
    { label: '대장 관리',  component: <PermitRegistryTab /> },
    { label: '갱신·만료',  component: <PermitRenewalTab /> },
    { label: '변경관리',   component: <PermitChangeTab /> },
    { label: '자체점검',   component: <PermitInspectionTab /> },
    { label: '보고·신고',  component: <PermitReportingTab /> },
    { label: '증빙·기록',  component: <PermitDocumentTab /> },
  ]

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
