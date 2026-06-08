import { useState } from 'react'
import { Box, Tab, Tabs, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import RiskAssessmentDashboardTab from '../components/ehs/RiskAssessmentDashboardTab'
import RiskAssessmentTab from '../components/ehs/RiskAssessmentTab'
// import RiskAssessmentOfficeWorkTab from '../components/ehs/RiskAssessmentOfficeWorkTab'
import RiskAssessmentReportTab from '../components/ehs/RiskAssessmentReportTab'

const RiskAssessmentPage: React.FC = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState(0)

  const tabTitles = [
    t('common.dashboard', '대시보드'),
    t('common.plan', '계획'),
    t('common.management', '관리'),
    t('riskAssessment.managementAdmin', '관리(관리자)'),
    // t('riskAssessment.officeWork', '사무업무'),
    t('common.report', '레포트'),
  ]

  return (
    <Box>
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{ mb: 2 }}
      >
        <Tab label={t('common.dashboard', '대시보드')} />
        <Tab label={t('common.plan', '계획')} />
        <Tab label={t('common.management', '관리')} />
        <Tab label={t('riskAssessment.managementAdmin', '관리(관리자)')} />
        {/* <Tab label={t('riskAssessment.officeWork', '사무업무')} /> */}
        <Tab label={t('common.report', '레포트')} />
      </Tabs>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
        {tabTitles[activeTab]}
      </Typography>
      {activeTab === 0 && <RiskAssessmentDashboardTab />}
      {activeTab === 1 && <RiskAssessmentTab mode="plan" />}
      {activeTab === 2 && <RiskAssessmentTab mode="management" />}
      {activeTab === 3 && <RiskAssessmentTab mode="admin" />}
      {/* {activeTab === 4 && <RiskAssessmentOfficeWorkTab />} */}
      {activeTab === 4 && <RiskAssessmentReportTab />}
    </Box>
  )
}

export default RiskAssessmentPage
