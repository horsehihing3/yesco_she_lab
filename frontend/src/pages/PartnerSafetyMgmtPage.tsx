import { useState } from 'react'
import { Box, Tabs, Tab } from '@mui/material'
import { SiteSafetyPlanContent } from './SiteSafetyManagementPage'
import PartnerSafetyExecuteTab from '../components/partner/PartnerSafetyExecuteTab'

// 협력 업체 안전 관리 — 현장 안전 관리 구조 재사용 (대시보드/레포트 제외)
// 데이터는 plan_type='PARTNER' 로 격리 / 체크리스트는 협력사(모바일) 카테고리만 노출
const PartnerSafetyMgmtPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0)
  return (
    <Box>
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto"
        sx={{ mb: 2, '& .MuiTab-root': { minWidth: 'auto', px: 2, fontSize: '0.85rem' } }}>
        <Tab label="관리" />
        <Tab label="실행" />
        <Tab label="조회" />
      </Tabs>
      {activeTab === 0 && <SiteSafetyPlanContent mode="plan" planType="PARTNER" />}
      {activeTab === 1 && <PartnerSafetyExecuteTab />}
      {activeTab === 2 && <SiteSafetyPlanContent mode="admin" planType="PARTNER" />}
    </Box>
  )
}

export default PartnerSafetyMgmtPage
