import { useState, useMemo, useEffect } from 'react'
import { Box, Tabs, Tab } from '@mui/material'
import { SiteSafetyPlanContent } from './SiteSafetyManagementPage'
import PartnerSafetyExecuteTab from '../components/partner/PartnerSafetyExecuteTab'
import PartnerSafetyHistoryTab from '../components/partner/PartnerSafetyHistoryTab'
import { useMenuRule } from '../hooks/useMenuRule'

// 협력 업체 안전 관리 — 현장 안전 관리 구조 재사용 (대시보드/레포트 제외)
const PartnerSafetyMgmtPage: React.FC = () => {
  const { isMenuHidden } = useMenuRule()
  const [activeTab, setActiveTab] = useState(0)

  const tabs = useMemo(() => [
    { menuKey: 'partner-safety.tab.manage',  label: '관리', component: <SiteSafetyPlanContent mode="plan" planType="PARTNER" /> },
    { menuKey: 'partner-safety.tab.execute', label: '실행', component: <PartnerSafetyExecuteTab /> },
    { menuKey: 'partner-safety.tab.view',    label: '조회', component: <PartnerSafetyHistoryTab /> },
  ].filter(tab => !isMenuHidden(tab.menuKey)), [isMenuHidden])

  useEffect(() => {
    if (activeTab >= tabs.length && tabs.length > 0) setActiveTab(0)
  }, [tabs.length, activeTab])

  return (
    <Box>
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto"
        sx={{ mb: 2, '& .MuiTab-root': { minWidth: 'auto', px: 2, fontSize: '0.85rem' } }}>
        {tabs.map((tab, idx) => <Tab key={idx} label={tab.label} />)}
      </Tabs>
      {tabs[activeTab]?.component}
    </Box>
  )
}

export default PartnerSafetyMgmtPage
