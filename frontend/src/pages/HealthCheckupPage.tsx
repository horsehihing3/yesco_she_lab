import { useState, useMemo, useEffect } from 'react'
import { Box, Tabs, Tab, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useMenuRule } from '../hooks/useMenuRule'
import MyHealthCheckupPage from './MyHealthCheckupPage'
import HealthCheckupAdminTab from '../components/ehs/HealthCheckupAdminTab'
import HealthCheckupRecordTab from '../components/ehs/HealthCheckupRecordTab'
import HealthCheckupPlanTab from '../components/ehs/HealthCheckupPlanTab'
import HealthCheckupStatusTab from '../components/ehs/HealthCheckupStatusTab'
import HealthCheckupReportTab from '../components/ehs/HealthCheckupReportTab'

const HealthCheckupPage: React.FC = () => {
  const { t } = useTranslation()
  const { isMenuHidden } = useMenuRule()
  const [activeTab, setActiveTab] = useState(0)

  const tabs = useMemo(() => {
    // 탭 노출은 메뉴관리(isMenuHidden)로만 제어한다. (역할 하드코딩 isEhsManager 제거)
    const all = [
      { menuKey: 'healthCheckup.tabs.plan',    label: t('healthCheckup.tabs.plan', '검진 계획'),   component: <HealthCheckupPlanTab allowedTypes={['GENERAL', 'SPECIAL']} /> },
      { menuKey: 'healthCheckup.tabs.admin',   label: t('healthCheckup.tabs.admin', '검진 관리'),  component: <HealthCheckupAdminTab /> },
      { menuKey: 'healthCheckup.tabs.status',  label: t('healthCheckup.tabs.status', '검진 현황'), component: <HealthCheckupStatusTab allowedTypes={['GENERAL', 'SPECIAL']} /> },
      { menuKey: 'healthCheckup.tabs.report',  label: t('healthCheckup.tabs.report', '리포트'),    component: <HealthCheckupReportTab allowedTypes={['GENERAL', 'SPECIAL']} /> },
      { menuKey: 'healthCheckup.tabs.records', label: t('healthCheckup.tabs.records', '사후관리'), component: <HealthCheckupRecordTab /> },
      { menuKey: 'healthCheckup.tabs.my',      label: t('healthCheckup.tabs.my', '내 검진 현황'), component: <MyHealthCheckupPage /> },
    ]
    return all.filter(tab => !isMenuHidden(tab.menuKey))
  }, [t, isMenuHidden])

  useEffect(() => {
    if (activeTab >= tabs.length && tabs.length > 0) setActiveTab(0)
  }, [tabs.length, activeTab])

  return (
    <Box>
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto"
        sx={{ mb: 2, '& .MuiTab-root': { minWidth: 'auto', px: 2, fontSize: '0.85rem' } }}>
        {tabs.map((tab, idx) => <Tab key={idx} label={tab.label} />)}
      </Tabs>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>{tabs[activeTab]?.label}</Typography>
      {tabs[activeTab]?.component}
    </Box>
  )
}

export default HealthCheckupPage
