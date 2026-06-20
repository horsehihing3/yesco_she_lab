import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Tabs, Tab } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useMenuRule } from '../hooks/useMenuRule'
import AuditPlanTab from '../components/ehs/AuditPlanTab'
import AuditExecutionTab from '../components/ehs/AuditExecutionTab'
import PageHeader from '../components/common/PageHeader'

const AuditInspectionPage: React.FC = () => {
  const { t } = useTranslation()
  const { isMenuHidden } = useMenuRule()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(0)

  const tabs = useMemo(() => [
    { menuKey: 'audit.tabs.plan',       label: t('audit.tabs.plan'),       component: <AuditPlanTab /> },
    { menuKey: 'audit.tabs.execution',  label: t('audit.tabs.execution'),  component: <AuditExecutionTab /> },
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
      title={t('nav.auditInspection')}
      flowKey={activeTab === 0 ? 'audit' : undefined}
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

export default AuditInspectionPage
