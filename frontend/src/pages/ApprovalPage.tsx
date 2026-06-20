import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Tabs, Tab } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useMenuRule } from '../hooks/useMenuRule'
import PageHeader from '../components/common/PageHeader'
import MyApprovalTab from '../components/approval/MyApprovalTab'
import ApprovalLinePage from './ApprovalLinePage'
import ApprovalManagePage from './ApprovalManagePage'

const ApprovalPage: React.FC = () => {
  const { t } = useTranslation()
  const { isMenuHidden } = useMenuRule()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(0)

  const tabs = useMemo(() => [
    { menuKey: 'approval.myApproval',   label: t('approval.myApproval'),   component: <MyApprovalTab key="my" /> },
    { menuKey: 'approval.approvalLine', label: t('approval.approvalLine'), component: <ApprovalLinePage key="line" /> },
    { menuKey: 'approval.allApprovals', label: t('approval.allApprovals'), component: <ApprovalManagePage key="all" /> },
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
    <PageHeader
      title={t('nav.approval')}
      flowKey={activeTab === 0 ? 'approval' : undefined}
      tabs={
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
      }
    >
      {tabs[activeTab]?.component}
    </PageHeader>
  )
}

export default ApprovalPage
