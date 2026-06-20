import { useState } from 'react'
import { Tab, Tabs } from '@mui/material'
import { useTranslation } from 'react-i18next'
import RiskAssessmentDashboardTab from '../components/ehs/RiskAssessmentDashboardTab'
import RiskAssessmentTab from '../components/ehs/RiskAssessmentTab'
// import RiskAssessmentOfficeWorkTab from '../components/ehs/RiskAssessmentOfficeWorkTab'
import RiskAssessmentReportTab from '../components/ehs/RiskAssessmentReportTab'
import PageHeader from '../components/common/PageHeader'

const RiskAssessmentPage: React.FC = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState(0)

  return (
    <PageHeader
      title={t('nav.riskAssessment')}
      flowKey={activeTab === 0 ? 'riskAssessment' : undefined}
      tabs={
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
        >
          <Tab label={t('common.dashboard', '대시보드')} />
          <Tab label={t('common.plan', '계획')} />
          <Tab label={t('common.management', '관리')} />
          <Tab label={t('riskAssessment.managementAdmin', '관리(관리자)')} />
          {/* <Tab label={t('riskAssessment.officeWork', '사무업무')} /> */}
          <Tab label={t('common.report', '레포트')} />
        </Tabs>
      }
    >
      {activeTab === 0 && <RiskAssessmentDashboardTab />}
      {activeTab === 1 && <RiskAssessmentTab mode="plan" />}
      {activeTab === 2 && <RiskAssessmentTab mode="management" />}
      {activeTab === 3 && <RiskAssessmentTab mode="admin" />}
      {/* {activeTab === 4 && <RiskAssessmentOfficeWorkTab />} */}
      {activeTab === 4 && <RiskAssessmentReportTab />}
    </PageHeader>
  )
}

export default RiskAssessmentPage
