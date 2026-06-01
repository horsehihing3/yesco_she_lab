import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { Box, CircularProgress, Typography } from '@mui/material'

// Layout
import Layout from './components/common/Layout'

// Pages
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import GeneralDashboard from './pages/GeneralDashboard'
import EhsPage from './pages/EhsPage'
import RiskAssessmentPage from './pages/RiskAssessmentPage'
import ProcessActivityWorkPage from './pages/ProcessActivityWorkPage'
import NearMissPage from './pages/NearMissPage'
import SafetyWorkPage from './pages/SafetyWorkPage'
import HealthCheckupPage from './pages/HealthCheckupPage'
import OccupationalExposurePage from './pages/OccupationalExposurePage'
import WorkplaceDrawingsPage from './pages/WorkplaceDrawingsPage'
import WorkplaceDrawingsViewPage from './pages/WorkplaceDrawingsViewPage'
import AdminPage from './pages/AdminPage'
import SystemManagePage from './pages/SystemManagePage'
import ApprovalPage from './pages/ApprovalPage'
import ChecklistPage from './pages/ChecklistPage'
import WasteManagePage from './pages/WasteManagePage'
import CarbonManagePage from './pages/CarbonManagePage'
import MyHealthCheckupPage from './pages/MyHealthCheckupPage'
import WaterQualityManagePage from './pages/WaterQualityManagePage'
import AirEmissionManagePage from './pages/AirEmissionManagePage'
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
import ComingSoonPage from './pages/ComingSoonPage'
import PermitToWorkPage from './pages/PermitToWorkPage'
import ContractorManagementPage from './pages/ContractorManagementPage'
import SiteSafetyManagementPage from './pages/SiteSafetyManagementPage'
import AuditInspectionPage from './pages/AuditInspectionPage'
import ErgonomicsPage from './pages/ErgonomicsPage'
import KpiDashboardPage from './pages/KpiDashboardPage'
import PpeEquipmentPage from './pages/PpeEquipmentPage'
import EnvMonitoringPage from './pages/EnvMonitoringPage'
import ChemicalMasterPage from './pages/ChemicalMasterPage'
import ChemicalMsdsRawPage from './pages/ChemicalMsdsRawPage'
import ChemicalMsdsProductPage from './pages/ChemicalMsdsProductPage'
import ChemicalLifecyclePage from './pages/ChemicalLifecyclePage'
import ChemicalRegulationPage from './pages/ChemicalRegulationPage'
import LegalCompliancePage from './pages/LegalCompliancePage'
import EhsBudgetPage from './pages/EhsBudgetPage'
import EhsKpiPlanPage from './pages/EhsKpiPlanPage'
import DiseasePreventionPage from './pages/DiseasePreventionPage'
import PlanKpiGoalPage from './pages/PlanKpiGoalPage'
import TrainingPage from './pages/TrainingPage'
import WorkplaceMeasurementPage from './pages/WorkplaceMeasurementPage'
import WorkEnvMeasurementPage from './pages/WorkEnvMeasurementPage'
import OccupationalDiseasePage from './pages/OccupationalDiseasePage'
import LegalFacilityPage from './pages/LegalFacilityPage'
import PartnerMgmtPage from './pages/PartnerMgmtPage'
import PartnerOshCommitteePage from './pages/PartnerOshCommitteePage'
import PartnerPermitPage from './pages/PartnerPermitPage'
import PartnerSafetyMgmtPage from './pages/PartnerSafetyMgmtPage'
import PartnerSafetyExecutePage from './pages/PartnerSafetyExecutePage'
import RadiationMgmtPage from './pages/RadiationMgmtPage'
import FireSafetyPage from './pages/FireSafetyPage'
import IncidentResponsePage from './pages/IncidentResponsePage'
import PermitLifecyclePage from './pages/PermitLifecyclePage'
import DiseasePreventionMgmtPage from './pages/DiseasePreventionMgmtPage'
import ContractorRegistrationPage from './pages/ContractorRegistrationPage'

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

// Role-based Route Guard
const RoleRoute: React.FC<{ children: React.ReactNode; requiredRole: string }> = ({ children, requiredRole }) => {
  const { user } = useAuth()

  if (user?.role !== requiredRole) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
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
        <Route index element={<Dashboard />} />
        <Route path="dashboard/general" element={<GeneralDashboard />} />
        <Route path="ehs" element={<Navigate to="/ehs/communication" replace />} />
        <Route path="ehs/communication" element={<EhsPage />} />
        <Route path="process-activity-work" element={<ProcessActivityWorkPage />} />
        <Route path="risk-assessment" element={<RiskAssessmentPage />} />
        <Route path="near-miss" element={<NearMissPage />} />
        <Route path="safety-work" element={<PermitToWorkPage />} />
        <Route path="contractor" element={<ContractorManagementPage />} />
        <Route path="site-safety-mgmt" element={<SiteSafetyManagementPage />} />
        <Route path="health-checkup/admin" element={<HealthCheckupPage />} />
        <Route path="health-checkup/my" element={<MyHealthCheckupPage />} />
        <Route path="occupational-exposure" element={<OccupationalExposurePage />} />
        <Route path="workplace-drawings" element={<WorkplaceDrawingsPage />} />
        <Route path="workplace-drawings/view" element={<PageWithTitle titleKey="nav.workplaceDrawingsView"><WorkplaceDrawingsViewPage /></PageWithTitle>} />
        <Route path="approval" element={<ApprovalPage />} />
        <Route path="checklist" element={<ChecklistPage />} />
        <Route path="environment" element={<Navigate to="/environment/waste" replace />} />
        <Route path="environment/waste" element={<WasteManagePage />} />
        <Route path="environment/carbon" element={<CarbonManagePage />} />
        <Route path="environment/water" element={<WaterQualityManagePage />} />
        <Route path="environment/water-quality" element={<WaterQualityManagePage />} />
        <Route path="environment/air-emission" element={<AirEmissionManagePage />} />
        <Route path="environment/air-water" element={<WaterQualityManagePage />} />
        <Route path="environment/monitoring" element={<EnvMonitoringPage />} />
        <Route path="chemical/master" element={<ChemicalMasterPage />} />
        <Route path="chemical/msds-raw" element={<ChemicalMsdsRawPage />} />
        <Route path="chemical/msds-product" element={<ChemicalMsdsProductPage />} />
        <Route path="chemical/regulation" element={<ChemicalRegulationPage />} />
        <Route path="chemical/lifecycle" element={<ChemicalLifecyclePage />} />
        {/* Coming Soon pages */}
        <Route path="audit-inspection" element={<AuditInspectionPage />} />
        <Route path="ppe-equipment" element={<PpeEquipmentPage />} />
        <Route path="training" element={<TrainingPage />} />
        <Route path="legal-compliance" element={<LegalCompliancePage />} />
        <Route path="environment/compliance" element={<Navigate to="/legal-compliance" replace />} />
        <Route path="ehs-budget" element={<EhsBudgetPage />} />
        <Route path="work-environment" element={<WorkplaceMeasurementPage />} />
        <Route path="work-env-measurement" element={<WorkEnvMeasurementPage />} />
        <Route path="ergonomics" element={<Navigate to="/disease-prevention" replace />} />
        <Route path="occupational-disease" element={<OccupationalDiseasePage />} />
        <Route path="legal-facility" element={<LegalFacilityPage />} />
        <Route path="partner-mgmt" element={<PartnerMgmtPage />} />
        <Route path="partner-osh-committee" element={<PageWithTitle titleKey="nav.partnerOshCommittee"><PartnerOshCommitteePage /></PageWithTitle>} />
        <Route path="partner-permit" element={<PageWithTitle titleKey="nav.partnerPermit"><PartnerPermitPage /></PageWithTitle>} />
        <Route path="partner-safety-mgmt" element={<PageWithTitle titleKey="nav.partnerSafetyMgmt"><PartnerSafetyMgmtPage /></PageWithTitle>} />
        <Route path="contractor-registration" element={<PageWithTitle titleKey="nav.partnerRegistration"><ContractorRegistrationPage /></PageWithTitle>} />
        <Route path="radiation-mgmt" element={<RadiationMgmtPage />} />
        <Route path="fire-safety" element={<FireSafetyPage />} />
        <Route path="incident-response" element={<PageWithTitle titleKey="nav.incidentResponse"><IncidentResponsePage /></PageWithTitle>} />
        <Route path="permit-lifecycle" element={<PermitLifecyclePage />} />
        <Route path="disease-prevention-mgmt" element={<DiseasePreventionMgmtPage />} />
        <Route path="disease-prevention" element={<DiseasePreventionPage />} />
        <Route path="ehs/kpi" element={<EhsKpiPlanPage />} />
        <Route path="plan-kpi-goal" element={<PlanKpiGoalPage />} />
        <Route path="contractor-safety" element={<PageWithTitle titleKey="nav.contractorSafety"><Box><Typography color="text.secondary" sx={{ py: 8, textAlign: 'center' }}>Coming Soon</Typography></Box></PageWithTitle>} />
        <Route path="outsourcing-mgmt" element={<PageWithTitle titleKey="nav.outsourcingMgmt"><Box><Typography color="text.secondary" sx={{ py: 8, textAlign: 'center' }}>Coming Soon</Typography></Box></PageWithTitle>} />
        <Route path="emergency-response" element={<EmergencyResponsePage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="system-manage" element={<Navigate to="/system-manage/code" replace />} />
        <Route path="system-manage/code" element={<PageWithTitle titleKey="nav.codeManage"><CodeManagePage /></PageWithTitle>} />
        <Route path="system-manage/role" element={<PageWithTitle titleKey="nav.roleManage"><RoleManageTab /></PageWithTitle>} />
        <Route path="system-manage/auth" element={<PageWithTitle titleKey="nav.authManage"><AuthManageTab /></PageWithTitle>} />
        <Route path="system-manage/drawings" element={<PageWithTitle titleKey="nav.floorDrawings"><WorkplaceDrawingsPage /></PageWithTitle>} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
