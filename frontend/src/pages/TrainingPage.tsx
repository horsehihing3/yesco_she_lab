import { useState } from 'react'
import { Box, Tabs, Tab, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import TrainingDashboardTab from '../components/ehs/TrainingDashboardTab'
import TrainingApplyTab from '../components/ehs/TrainingApplyTab'
import TrainingStatusTab from '../components/ehs/TrainingStatusTab'
import TrainingHistoryTab from '../components/ehs/TrainingHistoryTab'
import TrainingCourseTab from '../components/ehs/TrainingCourseTab'
import TrainingReportTab from '../components/ehs/TrainingReportTab'

const TrainingPage: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const isAdmin = user?.role === 'SYSTEM_ADMIN' || user?.role === 'EHS_ADMIN' || user?.role === 'AUDIT_ADMIN'
  const [activeTab, setActiveTab] = useState(0)

  // PPT 슬라이드 6 + HTML mockup: 교육신청 / 교육현황 / 교육이력 / 교육과정관리
  // 교육과정관리는 관리자만 노출
  const tabs = [
    { label: t('common.dashboard', '대시보드'),         component: <TrainingDashboardTab /> },
    { label: t('training.tabs.apply', '교육 신청'),    component: <TrainingApplyTab /> },
    { label: t('training.tabs.statusAdmin', '교육현황(관리자)'),   component: <TrainingStatusTab /> },
    { label: t('training.tabs.history', '교육 이력'),  component: <TrainingHistoryTab /> },
    ...(isAdmin
      ? [{ label: t('training.tabs.course', '교육 과정 관리'), component: <TrainingCourseTab /> }]
      : []),
    { label: t('common.report', '레포트'),              component: <TrainingReportTab /> },
  ]

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

export default TrainingPage
