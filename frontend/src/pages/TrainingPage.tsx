import { useState, useMemo, useEffect } from 'react'
import { isEhsManager } from '../utils/auth'
import { Box, Tabs, Tab, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useMenuRule } from '../hooks/useMenuRule'
import FlowChartButton from '../components/common/FlowChartButton'
import TrainingDashboardTab from '../components/ehs/TrainingDashboardTab'
import TrainingApplyTab from '../components/ehs/TrainingApplyTab'
import TrainingStatusTab from '../components/ehs/TrainingStatusTab'
import TrainingHistoryTab from '../components/ehs/TrainingHistoryTab'
import TrainingCourseTab from '../components/ehs/TrainingCourseTab'
import TrainingReportTab from '../components/ehs/TrainingReportTab'

const TrainingPage: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { isMenuHidden } = useMenuRule()
  const isAdmin = isEhsManager(user)
  const [activeTab, setActiveTab] = useState(0)

  const tabs = useMemo(() => [
    { menuKey: 'training.tab.dashboard',    label: t('common.dashboard', '대시보드'),          component: <TrainingDashboardTab /> },
    { menuKey: 'training.tabs.apply',       label: t('training.tabs.apply', '교육 신청'),      component: <TrainingApplyTab /> },
    { menuKey: 'training.tabs.statusAdmin', label: t('training.tabs.statusAdmin', '교육현황'), component: <TrainingStatusTab /> },
    { menuKey: 'training.tabs.history',     label: t('training.tabs.history', '교육 이력'),    component: <TrainingHistoryTab /> },
    ...(isAdmin ? [{ menuKey: 'training.tabs.course', label: t('training.tabs.course', '교육 과정 관리'), component: <TrainingCourseTab /> }] : []),
    { menuKey: 'training.tab.report',       label: t('common.report', '레포트'),               component: <TrainingReportTab /> },
  ].filter(tab => !isMenuHidden(tab.menuKey)), [t, isAdmin, isMenuHidden])

  useEffect(() => {
    if (activeTab >= tabs.length && tabs.length > 0) setActiveTab(0)
  }, [tabs.length, activeTab])

  return (
    <Box>
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto"
        sx={{ mb: 2, '& .MuiTab-root': { minWidth: 'auto', px: 2, fontSize: '0.85rem' } }}>
        {tabs.map((tab, idx) => <Tab key={idx} label={tab.label} />)}
      </Tabs>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">{tabs[activeTab]?.label}</Typography>
        {activeTab === 0 && <FlowChartButton flowKey="training" />}
      </Box>
      {tabs[activeTab]?.component}
    </Box>
  )
}

export default TrainingPage
