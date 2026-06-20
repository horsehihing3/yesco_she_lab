import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Tabs, Tab } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useMenuRule } from '../hooks/useMenuRule'
import SafetyRulesTab from '../components/ehs/SafetyRulesTab'
import EhsPlanTab from '../components/ehs/EhsPlanTab'
import EhsManagerTab from '../components/ehs/EhsManagerTab'
import EhsMessageTab from '../components/ehs/EhsMessageTab'
import EhsAlertTab from '../components/ehs/EhsAlertTab'
import OshCommitteeTab from '../components/ehs/OshCommitteeTab'
import EmergencyNotificationTab from '../components/ehs/EmergencyNotificationTab'
import QnaTab from '../components/ehs/QnaTab'
import EmrContactTab from '../components/ehs/EmrContactTab'
import PageHeader from '../components/common/PageHeader'

const EhsPage: React.FC = () => {
  const { t } = useTranslation()
  const { isMenuHidden } = useMenuRule()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(0)

  const tabs = useMemo(() => [
    { menuKey: 'nav.ehsDocument',     label: t('nav.ehsDocument'),     component: <SafetyRulesTab /> },
    { menuKey: 'nav.ehsPlan',         label: t('nav.ehsPlan'),         component: <EhsPlanTab /> },
    { menuKey: 'nav.ehsOfficer',      label: t('nav.ehsOfficer'),      component: <EhsManagerTab /> },
    { menuKey: 'nav.ehsMessage',      label: t('nav.ehsMessage'),      component: <EhsMessageTab /> },
    { menuKey: 'nav.ehsAlert',        label: t('nav.ehsAlert'),        component: <EhsAlertTab /> },
    { menuKey: 'nav.ehsOshCommittee', label: t('nav.ehsOshCommittee'), component: <OshCommitteeTab /> },
    { menuKey: 'nav.ehsEmergency',    label: t('nav.ehsEmergency'),    component: <EmergencyNotificationTab /> },
    { menuKey: 'nav.ehsQna',          label: t('nav.ehsQna'),          component: <QnaTab /> },
    { menuKey: 'emr.tabs.contacts',   label: t('emr.tabs.contacts'),   component: <EmrContactTab /> },
  ].filter(tab => !isMenuHidden(tab.menuKey)), [t, isMenuHidden])

  useEffect(() => {
    // menuKey 쿼리가 있으면 인덱스 대신 menuKey 로 정확한 탭 매칭 — 메뉴 가시성 변동에도 안전
    const menuKeyParam = searchParams.get('menuKey')
    if (menuKeyParam) {
      const idx = tabs.findIndex(t => t.menuKey === menuKeyParam)
      if (idx >= 0) { setActiveTab(idx); return }
    }
    const tab = parseInt(searchParams.get('tab') || '0', 10) || 0
    setActiveTab(Math.min(tab, Math.max(0, tabs.length - 1)))
  }, [searchParams, tabs])

  useEffect(() => {
    if (activeTab >= tabs.length && tabs.length > 0) setActiveTab(0)
  }, [tabs.length, activeTab])

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
    setSearchParams({ tab: String(newValue) })
  }

  return (
    <PageHeader
      title={t('nav.ehsCommunication')}
      flowKey={activeTab === 0 ? 'ehs' : undefined}
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

export default EhsPage
