import { useState } from 'react'
import { Box, Tabs, Tab, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import MyHealthCheckupPage from './MyHealthCheckupPage'
import HealthCheckupAdminTab from '../components/ehs/HealthCheckupAdminTab'
import HealthCheckupRecordTab from '../components/ehs/HealthCheckupRecordTab'
import HealthCheckupPlanTab from '../components/ehs/HealthCheckupPlanTab'
import HealthCheckupStatusTab from '../components/ehs/HealthCheckupStatusTab'
import HealthCheckupReportTab from '../components/ehs/HealthCheckupReportTab'
import { useAuth } from '../context/AuthContext'

const HealthCheckupPage: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const isAdmin = user?.role === 'SYSTEM_ADMIN' || user?.role === 'EHS_ADMIN' || user?.role === 'AUDIT_ADMIN'
  const [activeTab, setActiveTab] = useState(0)

  // 슬라이드 7: 검진계획 / 검진관리(관리자) / 검진현황 / 리포트 / 사후관리 (관리자) + 내 검진현황 (사용자)
  const adminOnlyTabs = [
    { label: t('healthCheckup.tabs.plan', '검진 계획'),    component: <HealthCheckupPlanTab allowedTypes={['GENERAL', 'SPECIAL']} /> },
    { label: t('healthCheckup.tabs.admin', '검진 관리'),   component: <HealthCheckupAdminTab /> },
    { label: t('healthCheckup.tabs.status', '검진 현황'),  component: <HealthCheckupStatusTab allowedTypes={['GENERAL', 'SPECIAL']} /> },
    { label: t('healthCheckup.tabs.report', '리포트'),     component: <HealthCheckupReportTab allowedTypes={['GENERAL', 'SPECIAL']} /> },
    { label: t('healthCheckup.tabs.records', '사후관리'),  component: <HealthCheckupRecordTab /> },
  ]
  const userTabs = [
    { label: t('healthCheckup.tabs.my', '내 검진 현황'),   component: <MyHealthCheckupPage /> },
  ]
  const tabs = isAdmin ? [...adminOnlyTabs, ...userTabs] : userTabs

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
