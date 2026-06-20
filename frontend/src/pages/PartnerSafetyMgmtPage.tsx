import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Tabs, Tab } from '@mui/material'
import { SiteSafetyPlanContent } from './SiteSafetyManagementPage'
import PartnerSafetyExecuteTab from '../components/partner/PartnerSafetyExecuteTab'
import PartnerSafetyHistoryTab from '../components/partner/PartnerSafetyHistoryTab'
import { useMenuRule } from '../hooks/useMenuRule'
import PageHeader from '../components/common/PageHeader'

// 협력 업체 안전 관리 — 현장 안전 관리 구조 재사용 (대시보드/레포트 제외)
const PartnerSafetyMgmtPage: React.FC = () => {
  const { t } = useTranslation()
  const { isMenuHidden } = useMenuRule()
  const [activeTab, setActiveTab] = useState(0)

  const tabs = useMemo(() => [
    { menuKey: 'partner-safety.tab.manage', label: t('partner-safety.tab.manage', '관리'), component: <SiteSafetyPlanContent mode="plan" planType="PARTNER" /> },
    { menuKey: 'partner-safety.tab.execute', label: t('partner-safety.tab.execute', '실행'), component: <PartnerSafetyExecuteTab /> },
    { menuKey: 'partner-safety.tab.view', label: t('partner-safety.tab.view', '조회'), component: <PartnerSafetyHistoryTab /> },
  ].filter(tab => !isMenuHidden(tab.menuKey)), [isMenuHidden])

  useEffect(() => {
    if (activeTab >= tabs.length && tabs.length > 0) setActiveTab(0)
  }, [tabs.length, activeTab])

  return (
    <PageHeader
      title={t('nav.partnerSafetyMgmt')}
      flowKey={activeTab === 0 ? 'partnerSafety' : undefined}
      tabs={
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto"
          sx={{ '& .MuiTab-root': { minWidth: 'auto', px: 2, fontSize: '0.85rem' } }}>
          {tabs.map((tab, idx) => <Tab key={idx} label={tab.label} />)}
        </Tabs>
      }
    >
      {tabs[activeTab]?.component}
    </PageHeader>
  )
}

export default PartnerSafetyMgmtPage
