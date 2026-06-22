import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { Box, CircularProgress, Typography } from '@mui/material'

// Layout
import Layout from './components/common/Layout'

// Pages
import LoginPage from './pages/LoginPage'
import GeneralDashboard from './pages/GeneralDashboard'
import EhsPage from './pages/EhsPage'
import RiskAssessmentPage from './pages/RiskAssessmentPage'
import ProcessActivityWorkPage from './pages/ProcessActivityWorkPage'
import SafetyHazardInfoPage from './pages/SafetyHazardInfoPage'
import SafetyAccidentInfoPage from './pages/SafetyAccidentInfoPage'
import NearMissPage from './pages/NearMissPage'
import HealthCheckupPage from './pages/HealthCheckupPage'
import WorkplaceDrawingsPage from './pages/WorkplaceDrawingsPage'
import WorkplaceDrawingsViewPage from './pages/WorkplaceDrawingsViewPage'
import AdminPage from './pages/AdminPage'
import ApprovalPage from './pages/ApprovalPage'
import ChecklistPage from './pages/ChecklistPage'
import NotFoundPage from './pages/NotFoundPage'
import CodeManagePage from './pages/CodeManagePage'
import RoleManageTab from './components/system/RoleManageTab'
import AuthManageTab from './components/system/AuthManageTab'
import { useTranslation } from 'react-i18next'

const PageWithTitle: React.FC<{ titleKey: string; children: React.ReactNode }> = ({ titleKey, children }) => {
  const { t } = useTranslation()
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, flexShrink: 0 }}>{t(titleKey)}</Typography>
      <Box sx={{ flex: 1, minHeight: 0 }}>{children}</Box>
    </Box>
  )
}
import EmergencyResponsePage from './pages/EmergencyResponsePage'
import PermitToWorkPage from './pages/PermitToWorkPage'
import ContractorManagementPage from './pages/ContractorManagementPage'
import SiteSafetyManagementPage from './pages/SiteSafetyManagementPage'
import AuditInspectionPage from './pages/AuditInspectionPage'
import PpeEquipmentPage from './pages/PpeEquipmentPage'
import EhsBudgetPage from './pages/EhsBudgetPage'
import PlanKpiGoalPage from './pages/PlanKpiGoalPage'
import TrainingPage from './pages/TrainingPage'
import WorkEnvMeasurementPage from './pages/WorkEnvMeasurementPage'
import OccupationalDiseasePage from './pages/OccupationalDiseasePage'
import PartnerMgmtPage from './pages/PartnerMgmtPage'
import PartnerOshCommitteePage from './pages/PartnerOshCommitteePage'
import PartnerPermitPage from './pages/PartnerPermitPage'
import PartnerSafetyMgmtPage from './pages/PartnerSafetyMgmtPage'
import PartnerSafetyExecutePage from './pages/PartnerSafetyExecutePage'
import LegalResponsePage from './pages/LegalResponsePage'
import DiseasePreventionMgmtPage from './pages/DiseasePreventionMgmtPage'
import ContractorRegistrationPage from './pages/ContractorRegistrationPage'
import ButtonManagePage from './pages/ButtonManagePage'
import MenuManageTab from './components/system/MenuManageTab'
import OshSignPage from './pages/OshSignPage'

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      {/* OSH 위원회 이메일 서명 (로그인 불필요) */}
      <Route path="/osh-sign/:token" element={<OshSignPage />} />
      {/* 협력 업체 안전 관리 실행 — 작업자용 새 창 (Layout/사이드바 없이 독립 페이지) */}
      <Route path="/partner-safety-execute/:planId" element={
        <ProtectedRoute>
          <PartnerSafetyExecutePage />
        </ProtectedRoute>
      } />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard/general" replace />} />
        <Route path="dashboard/general" element={<GeneralDashboard />} />
        <Route path="ehs" element={<Navigate to="/ehs/communication" replace />} />
        <Route path="ehs/communication" element={<EhsPage />} />
        <Route path="safety-hazard-info" element={<SafetyHazardInfoPage />} />
        <Route path="safety-accident-info" element={<SafetyAccidentInfoPage />} />
        <Route path="process-activity-work" element={<ProcessActivityWorkPage />} />
        <Route path="risk-assessment" element={<RiskAssessmentPage />} />
        <Route path="near-miss" element={<NearMissPage />} />
        <Route path="safety-work" element={<PermitToWorkPage />} />
        <Route path="contractor" element={<ContractorManagementPage />} />
        <Route path="site-safety-mgmt" element={<SiteSafetyManagementPage />} />
        <Route path="health-checkup/admin" element={<HealthCheckupPage />} />
        <Route path="workplace-drawings/view" element={<WorkplaceDrawingsViewPage />} />
        <Route path="approval" element={<ApprovalPage />} />
        <Route path="checklist" element={<ChecklistPage />} />
        {/* Coming Soon pages */}
        <Route path="audit-inspection" element={<AuditInspectionPage />} />
        <Route path="ppe-equipment" element={<PpeEquipmentPage />} />
        <Route path="training" element={<TrainingPage />} />
        <Route path="legal-compliance" element={<Navigate to="/legal-response" replace />} />
        <Route path="environment/compliance" element={<Navigate to="/legal-response" replace />} />
        <Route path="ehs-budget" element={<EhsBudgetPage />} />
        <Route path="work-env-measurement" element={<WorkEnvMeasurementPage />} />
        <Route path="ergonomics" element={<Navigate to="/disease-prevention-mgmt" replace />} />
        <Route path="occupational-disease" element={<OccupationalDiseasePage />} />
        <Route path="partner-mgmt" element={<PartnerMgmtPage />} />
        <Route path="partner-osh-committee" element={<PartnerOshCommitteePage />} />
        <Route path="partner-permit" element={<PartnerPermitPage />} />
        <Route path="partner-safety-mgmt" element={<PartnerSafetyMgmtPage />} />
        <Route path="contractor-registration" element={<ContractorRegistrationPage />} />
        <Route path="legal-response" element={<LegalResponsePage />} />
        <Route path="disease-prevention-mgmt" element={<DiseasePreventionMgmtPage />} />
        <Route path="plan-kpi-goal" element={<PlanKpiGoalPage />} />
        <Route path="emergency-response" element={<EmergencyResponsePage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="system-manage" element={<Navigate to="/system-manage/code" replace />} />
        <Route path="system-manage/code" element={<PageWithTitle titleKey="nav.codeManage"><CodeManagePage /></PageWithTitle>} />
        <Route path="system-manage/role" element={<PageWithTitle titleKey="nav.roleManage"><RoleManageTab /></PageWithTitle>} />
        <Route path="system-manage/auth" element={<PageWithTitle titleKey="nav.authManage"><AuthManageTab /></PageWithTitle>} />
        <Route path="system-manage/drawings" element={<PageWithTitle titleKey="nav.floorDrawings"><WorkplaceDrawingsPage /></PageWithTitle>} />
        <Route path="dev/button-manage" element={<PageWithTitle titleKey="nav.buttonManage"><ButtonManagePage /></PageWithTitle>} />
        <Route path="system-manage/menu" element={<PageWithTitle titleKey="nav.menuManage"><MenuManageTab /></PageWithTitle>} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
