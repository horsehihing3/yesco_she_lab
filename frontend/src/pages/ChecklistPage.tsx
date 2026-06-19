import { useState } from 'react'
import { Box, Tabs, Tab } from '@mui/material'
import { useTranslation } from 'react-i18next'
import SafetyChecklistWrapper from '../components/checklist/SafetyChecklistWrapper'
import RiskAssessmentFormWrapper from '../components/checklist/RiskAssessmentFormWrapper'
import EvalSheetTab from '../components/checklist/EvalSheetTab'
import FlowChartButton from '../components/common/FlowChartButton'

const ChecklistPage: React.FC = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState(0)

  // 사이드바 메뉴 순서를 따라 정렬:
  //   [SHE 경영] 감사 → 비상 대응 → 법규 대응
  //   [안전 관리] 위험성 평가 → 위험성 평가2 → 협력사 관리(+모바일) → 작업 허가서
  //   그 외 메뉴와 직결되지 않는 일반 카테고리 / 유틸 탭은 뒤쪽으로
  const tabs = [
    // ── SHE 경영 ──
    { label: t('checklist.tabAudit', '감사'),                 component: <SafetyChecklistWrapper key="AUDIT" categoryType="AUDIT" /> },
    { label: t('checklist.tabEmergency', '비상 대응'),         component: <SafetyChecklistWrapper key="EMERGENCY" categoryType="EMERGENCY" /> },
    { label: t('checklist.tabCompliance', '법규 대응'),         component: <SafetyChecklistWrapper key="COMPLIANCE" categoryType="COMPLIANCE" /> },
    // ── 안전 관리 ──
    { label: t('checklist.tabRiskAssessment', '위험성 평가'),    component: <RiskAssessmentFormWrapper /> },
    { label: t('checklist.tabOfficeWork', '위험성 평가2'),       component: <SafetyChecklistWrapper key="OFFICE_WORK" categoryType="OFFICE_WORK" /> },
    { label: t('checklist.tabContractor', '협력사'),            component: <SafetyChecklistWrapper key="CONTRACTOR" categoryType="CONTRACTOR" /> },
    { label: t('checklist.tabContractorMobile', '협력사(모바일)'), component: <SafetyChecklistWrapper key="CONTRACTOR_MOBILE" categoryType="CONTRACTOR_MOBILE" /> },
    { label: t('checklist.tabWorkPermit', '작업 허가'),          component: <SafetyChecklistWrapper key="WORK_PERMIT" categoryType="WORK_PERMIT" /> },
    // ── 메뉴 직결되지 않는 일반 카테고리 ──
    { label: t('checklist.tabConstruction', '공사 현장'),        component: <SafetyChecklistWrapper key="CONSTRUCTION" categoryType="CONSTRUCTION" /> },
    // ── 유틸 ──
    { label: t('checklist.tabEvalSheet', '평가표'),             component: <EvalSheetTab key="EVAL_SHEET" /> },
  ]

  return (
    <Box>
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2, '& .MuiTab-root': { minWidth: 'auto', px: 2, fontSize: '0.85rem' } }}
      >
        {tabs.map((tab, idx) => <Tab key={idx} label={tab.label} />)}
      </Tabs>
      {activeTab === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <FlowChartButton flowKey="checklist" />
        </Box>
      )}
      {tabs[activeTab]?.component}
    </Box>
  )
}

export default ChecklistPage
