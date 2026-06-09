import { useState, useMemo, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Paper, Typography, List, ListItemButton, ListItemText,
  Checkbox, TextField, InputAdornment, CircularProgress, Button,
  Chip, Collapse, IconButton, Tooltip, Divider,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import SaveIcon from '@mui/icons-material/Save'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import MenuIcon from '@mui/icons-material/Menu'
import { useThemeMode } from '../../context/ThemeContext'
import { useAlert } from '../../contexts/AlertContext'
import { fetchMenuRules, saveMenuRules, MenuRuleItem } from '../../api/menuRuleApi'

// ── 역할 목록 ────────────────────────────────────────────────────────────────
const ROLES = [
  { value: 'SYSTEM_ADMIN',         label: '시스템 관리자',              group: 'system' },
  { value: 'EHS_ADMIN',            label: '회사 EHS 담당자',            group: 'system' },
  { value: 'TEAM_ADMIN',           label: '팀 EHS 담당자',              group: 'system' },
  { value: 'TEAM_MEMBER',          label: '팀 구성원',                  group: 'system' },
  { value: 'RISK_ASSESS_ADMIN',    label: '위험성 평가 관리자',          group: 'safety' },
  { value: 'NEAR_MISS_ADMIN',      label: '사고/아차사고 관리자',        group: 'safety' },
  { value: 'AUDIT_ADMIN',          label: '감사 및 점검 관리자',         group: 'safety' },
  { value: 'PERMIT_ADMIN',         label: '작업 허가 관리자',            group: 'safety' },
  { value: 'PPE_ADMIN',            label: '보호구 장비 관리자',          group: 'safety' },
  { value: 'TRAINING_ADMIN',       label: '교육·훈련 관리자',            group: 'safety' },
  { value: 'EMERGENCY_ADMIN',      label: '비상대응 관리자',             group: 'safety' },
  { value: 'HEALTH_ADMIN',         label: '검진 관리자',                 group: 'health' },
  { value: 'OCCUPATIONAL_ADMIN',   label: '직업건강 관리자',             group: 'health' },
  { value: 'WORK_ENV_ADMIN',       label: '작업환경측정 관리자',         group: 'health' },
  { value: 'ERGONOMICS_ADMIN',     label: '인체공학 관리자',             group: 'health' },
  { value: 'CHEM_MASTER_ADMIN',    label: '화학물질 마스터 관리자',      group: 'chemical' },
  { value: 'CHEM_MSDS_RAW_ADMIN',  label: '원료 MSDS 관리자',           group: 'chemical' },
  { value: 'CHEM_MSDS_PROD_ADMIN', label: '제품 MSDS 관리자',           group: 'chemical' },
  { value: 'CHEM_REG_ADMIN',       label: '해외 법규 관리자',            group: 'chemical' },
  { value: 'CHEM_LIFECYCLE_ADMIN', label: '화학물질 Life-Cycle 관리자', group: 'chemical' },
  { value: 'ENV_MONITORING_ADMIN', label: '환경 모니터링 관리자',        group: 'env' },
  { value: 'WASTE_ADMIN',          label: '폐기물 관리자',               group: 'env' },
  { value: 'AIR_WATER_ADMIN',      label: '대기·수질 관리자',            group: 'env' },
  { value: 'CARBON_ADMIN',         label: '탄소 관리자',                 group: 'env' },
  { value: 'COMPLIANCE_ADMIN',     label: '법규 준수 관리자',            group: 'env' },
  { value: 'QNA_ADMIN',            label: 'Q&A 관리자',                  group: 'ehs' },
]

// ── 3단계 메뉴 트리 ───────────────────────────────────────────────────────────
// depth 0: 그룹, depth 1: 페이지, depth 2: 탭
interface MenuNode {
  key: string
  label: string
  children?: MenuNode[]
}

const MENU_TREE: MenuNode[] = [
  { key: 'nav.dashboard', label: 'Dashboard', children: [
    { key: 'nav.mapDashboard',      label: '지도형 대시보드' },
    { key: 'nav.generalDashboard',  label: '일반 대시보드' },
  ]},
  { key: 'nav.ehs', label: 'EHS 경영', children: [
    { key: 'nav.ehsCommunication', label: '커뮤니케이션', children: [
      { key: 'nav.ehsDocument',     label: 'EHS 문서' },
      { key: 'nav.ehsPlan',         label: 'EHS Plan' },
      { key: 'nav.ehsOfficer',      label: 'EHS 직책자 명단' },
      { key: 'nav.ehsMessage',      label: 'EHS 메시지' },
      { key: 'nav.ehsAlert',        label: 'EHS 알림' },
      { key: 'nav.ehsOshCommittee', label: '산업안전보건 위원회' },
      { key: 'nav.ehsEmergency',    label: '긴급 메일/문자 발송' },
      { key: 'nav.ehsQna',          label: 'Q&A' },
      { key: 'emr.tabs.contacts',   label: '비상 연락망' },
    ]},
    { key: 'nav.planKpiGoal', label: 'KPI목표', children: [
      { key: 'pkg.overview',   label: '대시보드' },
      { key: 'pkg.annualPlan', label: '연간 계획' },
      { key: 'pkg.kpiStatus',  label: 'KPI 현황' },
      { key: 'pkg.reportTab',  label: '레포트' },
    ]},
    { key: 'nav.auditInspection', label: '내부 감사', children: [
      { key: 'audit.tabs.plan',       label: '감사 계획' },
      { key: 'audit.tabs.execution',  label: '감사 실시' },
    ]},
    { key: 'nav.trainingMgmt', label: '교육·훈련', children: [
      { key: 'training.tab.dashboard',    label: '대시보드' },
      { key: 'training.tabs.apply',       label: '교육 신청' },
      { key: 'training.tabs.statusAdmin', label: '교육현황(관리자)' },
      { key: 'training.tabs.history',     label: '교육 이력' },
      { key: 'training.tabs.course',      label: '교육 과정 관리' },
      { key: 'training.tab.report',       label: '레포트' },
    ]},
    { key: 'nav.emergencyResponse', label: '비상 훈련', children: [
      { key: 'emr.tab.dashboard', label: '대시보드' },
      { key: 'emr.tabs.plans',    label: '비상 계획' },
      { key: 'emr.tabs.drills',   label: '훈련 관리' },
      { key: 'emr.tabs.resources',label: '자원·장비' },
      { key: 'emr.tab.report',    label: '레포트' },
    ]},
    { key: 'nav.complianceMgmt', label: '법규 대응', children: [
      { key: 'lc.tabs.law',       label: '법규검토시스템' },
      { key: 'lc.tabs.plan',      label: '법규 대응 계획' },
      { key: 'lc.tabs.execution', label: '법규 대응 실시' },
    ]},
    { key: 'nav.ehsBudget', label: 'EHS 예산', children: [
      { key: 'budget.tab.dashboard', label: '대시보드' },
      { key: 'budget.tab.plan',      label: '예산수립' },
      { key: 'budget.tab.expense',   label: '실예산 사용입력' },
      { key: 'budget.tab.report',    label: '레포트' },
    ]},
    { key: 'nav.incidentResponse',      label: '사고 대응 관리' },
    { key: 'nav.workplaceDrawingsView', label: '사업장 도면' },
  ]},
  { key: 'nav.safetyManage', label: '안전 관리', children: [
    { key: 'nav.processActivityWork', label: '공정/활동별 작업내용' },
    { key: 'nav.riskAssessment', label: '위험성 평가', children: [
      { key: 'riskAssessment.tab.dashboard',   label: '대시보드' },
      { key: 'riskAssessment.tab.plan',        label: '계획' },
      { key: 'riskAssessment.tab.management',  label: '관리' },
      { key: 'riskAssessment.tab.admin',       label: '관리(관리자)' },
      { key: 'riskAssessment.tab.officeWork',  label: '사무업무' },
      { key: 'riskAssessment.tab.report',      label: '레포트' },
    ]},
    { key: 'nav.siteSafetyMgmt', label: '현장 안전 관리', children: [
      { key: 'site-safety.tab.dashboard', label: '대시보드' },
      { key: 'site-safety.tab.plan',      label: '계획' },
      { key: 'site-safety.tab.review',    label: '평가서조회 담당승인자' },
      { key: 'site-safety.tab.admin',     label: '전체조회 (어드민)' },
      { key: 'site-safety.tab.report',    label: '레포트' },
    ]},
    { key: 'nav.nearMiss', label: '사고/아차사고 관리', children: [
      { key: 'near-miss.tab.dashboard', label: '대시보드' },
      { key: 'near-miss.tab.near-miss', label: '아차사고' },
      { key: 'near-miss.tab.accident',  label: '사고' },
      { key: 'near-miss.tab.report',    label: '레포트' },
    ]},
    { key: 'nav.permitToWork', label: '작업 허가' },
    { key: 'nav.ppeEquipment', label: '보호구·장비', children: [
      { key: 'ppe.tabs.inventory', label: '보호구 재고' },
      { key: 'ppe.tabs.request',   label: '지급 신청' },
    ]},
  ]},
  { key: 'nav.partnerGroupMgmt', label: '협력 업체 관리', children: [
    { key: 'nav.partnerSafetyMgmt', label: '협력 업체 안전 관리', children: [
      { key: 'partner-safety.tab.manage',  label: '관리' },
      { key: 'partner-safety.tab.execute', label: '실행' },
      { key: 'partner-safety.tab.view',    label: '조회' },
    ]},
    { key: 'nav.partnerRiskAssessment', label: '협력 업체 위험성 평가' },
    { key: 'nav.partnerPermit',         label: '협력 업체 작업 허가' },
    { key: 'nav.partnerEval',           label: '협력 업체 평가' },
    { key: 'nav.partnerOshCommittee',   label: 'EHS 협의체' },
    { key: 'nav.partnerRegistration',   label: '협력 업체 등록' },
  ]},
  { key: 'nav.healthManage', label: '보건 관리', children: [
    { key: 'nav.healthScreening', label: '건강 검진 관리', children: [
      { key: 'healthCheckup.tabs.plan',    label: '검진 계획' },
      { key: 'healthCheckup.tabs.admin',   label: '검진 관리 (담당자)' },
      { key: 'healthCheckup.tabs.status',  label: '검진 현황' },
      { key: 'healthCheckup.tabs.report',  label: '리포트' },
      { key: 'healthCheckup.tabs.records', label: '임직원 건강검진 사후관리' },
      { key: 'healthCheckup.tabs.my',      label: '내 검진 이력' },
    ]},
    { key: 'nav.workEnvMeasurement', label: '작업환경 측정', children: [
      { key: 'wem.tab.dashboard', label: '대시보드' },
      { key: 'wem.factorTab',     label: '유해인자' },
      { key: 'wem.planTab',       label: '측정 계획' },
      { key: 'wem.resultTab',     label: '측정 결과' },
      { key: 'wem.improveTab',    label: '개선 조치' },
      { key: 'wem.tab.report',    label: '레포트' },
    ]},
    { key: 'nav.occupationalDiseaseMgmt', label: '직업병 관리', children: [
      { key: 'od.tabs.plan',      label: '검진계획' },
      { key: 'od.tabs.status',    label: '검진현황' },
      { key: 'od.tabs.manage',    label: '검진관리' },
      { key: 'od.tabs.exposure',  label: '노출관리' },
      { key: 'od.tabs.aftercare', label: '사후관리' },
      { key: 'od.tabs.sanjae',    label: '산재신청' },
      { key: 'od.tabs.result',    label: '결과' },
    ]},
    { key: 'nav.diseasePreventionMgmt', label: '질병예방 관리', children: [
      { key: 'disease-prev.tab.dashboard', label: '대시보드' },
      { key: 'disease-prev.tab.msd',       label: '근골격계' },
      { key: 'disease-prev.tab.cvd',       label: '뇌심혈관' },
      { key: 'disease-prev.tab.stress',    label: '직무스트레스' },
      { key: 'disease-prev.tab.resp',      label: '호흡기·피부' },
      { key: 'disease-prev.tab.hearing',   label: '청력보존' },
      { key: 'disease-prev.tab.thermal',   label: '온열·한랭' },
      { key: 'disease-prev.tab.infect',    label: '감염병' },
    ]},
  ]},
  { key: 'nav.envManage', label: '환경 관리', children: [
    { key: 'nav.envMonitoring', label: '환경 모니터링' },
    { key: 'nav.envWaste', label: '폐기물', children: [
      { key: 'waste.tabs.dashboard',   label: '대시보드' },
      { key: 'waste.tabs.inventory',   label: '폐기물 현황' },
      { key: 'waste.tabs.disposal',    label: '처리 관리' },
      { key: 'waste.tabs.company',     label: '처리업체 관리' },
      { key: 'waste.tabs.compliance',  label: '법규 준수 관리' },
    ]},
    { key: 'nav.envAirWater', label: '대기·수질 관리' },
    { key: 'nav.envCarbon', label: '탄소 관리', children: [
      { key: 'carbon.tabs.dashboard',    label: '대시보드' },
      { key: 'carbon.tabs.emission',     label: '배출량 입력' },
      { key: 'carbon.tabs.source',       label: '배출원 관리' },
      { key: 'carbon.tabs.scopeAnalysis',label: 'Scope 분석' },
      { key: 'carbon.tabs.factor',       label: '배출계수 관리' },
      { key: 'carbon.tabs.report',       label: '환경 보고서' },
    ]},
    { key: 'nav.radiationMgmt', label: '방사선관리' },
    { key: 'nav.fireMgmt', label: '소방/방제 시설 관리', children: [
      { key: 'fs.tabs.facility',    label: '시설 대장' },
      { key: 'fs.tabs.inspection',  label: '점검 관리' },
      { key: 'fs.tabs.disaster',    label: '방제시설' },
      { key: 'fs.tabs.emergency',   label: '비상 연계' },
      { key: 'fs.tabs.compliance',  label: '법령 준수' },
    ]},
    { key: 'nav.legalFacility', label: '법정시설관리', children: [
      { key: 'lf.tabs.equipment',  label: '법정기구 관리' },
      { key: 'lf.tabs.status',     label: '법정기구 현황' },
      { key: 'lf.tabs.inspection', label: '법정기구 검사' },
      { key: 'lf.tabs.watch',      label: '관심시설 현황' },
    ]},
    { key: 'nav.permitLifecycle', label: '인허가 관리', children: [
      { key: 'permit-lc.tab.register',  label: '식별·등록' },
      { key: 'permit-lc.tab.ledger',    label: '대장 관리' },
      { key: 'permit-lc.tab.renew',     label: '갱신·만료' },
      { key: 'permit-lc.tab.change',    label: '변경관리' },
      { key: 'permit-lc.tab.selfcheck', label: '자체점검' },
      { key: 'permit-lc.tab.report',    label: '보고·신고' },
      { key: 'permit-lc.tab.evidence',  label: '증빙·기록' },
    ]},
  ]},
  { key: 'nav.chemicalMgmt', label: '화학물질 관리', children: [
    { key: 'nav.chemMaster', label: '마스터 · 규제', children: [
      { key: 'chem.nav.chemList',  label: '화학물질 목록' },
      { key: 'chem.nav.erpItem',   label: 'ERP 자재 관리' },
      { key: 'chem.nav.vendor',    label: '협력사(Vendor) 목록' },
      { key: 'chem.nav.regRule',   label: '관리 규제' },
      { key: 'chem.nav.regCheck',  label: '점검 목록' },
    ]},
    { key: 'nav.chemMsdsRaw', label: '원료 MSDS', children: [
      { key: 'chem.nav.rawMsdsLatest', label: '원료 MSDS → 최신본' },
      { key: 'chem.nav.rawMsdsOld',   label: '원료 MSDS → 구 버전' },
      { key: 'chem.nav.rawMsdsHist',  label: '원료 MSDS → 이력관리' },
    ]},
    { key: 'nav.chemMsdsProduct', label: '제품 MSDS', children: [
      { key: 'chem.nav.prodMsdsLatest', label: '제품 MSDS → 최신본' },
      { key: 'chem.nav.prodMsdsOld',    label: '제품 MSDS → 구 버전' },
      { key: 'chem.nav.prodMsdsHist',   label: '제품 MSDS → 이력관리' },
    ]},
    { key: 'nav.chemRegulation', label: '해외 법규' },
    { key: 'nav.chemLifecycle',  label: 'Life-Cycle' },
  ]},
  { key: 'nav.approval', label: '승인', children: [
    { key: 'approval.myApproval',    label: '내 결재' },
    { key: 'approval.approvalLine',  label: '승인 라인' },
    { key: 'approval.allApprovals',  label: '전체 결재 현황' },
  ]},
  { key: 'nav.checklist', label: '체크리스트 관리' },
  { key: 'nav.environmentManage', label: '설정', children: [
    { key: 'nav.codeManage',   label: '코드 관리' },
    { key: 'nav.roleManage',   label: '권한 관리' },
    { key: 'nav.menuManage',   label: '메뉴 관리' },
    { key: 'nav.authManage',   label: '인증 관리' },
    { key: 'nav.floorDrawings',label: '도면 관리' },
    { key: 'nav.buttonManage', label: '버튼 관리' },
  ]},
]

// ── 유틸 ─────────────────────────────────────────────────────────────────────
const hiddenKey = (roleKey: string, menuKey: string) => `${roleKey}|${menuKey}`

function getAllDescendantKeys(node: MenuNode): string[] {
  const keys: string[] = []
  node.children?.forEach(c => {
    keys.push(c.key)
    keys.push(...getAllDescendantKeys(c))
  })
  return keys
}

function buildHiddenSet(rules: MenuRuleItem[]): Set<string> {
  return new Set(rules.map(r => hiddenKey(r.roleKey, r.menuKey)))
}

function buildRulesToSave(hiddenSet: Set<string>): MenuRuleItem[] {
  return Array.from(hiddenSet).map(k => {
    const idx = k.indexOf('|')
    return { roleKey: k.slice(0, idx), menuKey: k.slice(idx + 1) }
  })
}

const GROUP_COLORS: Record<string, string> = {
  system: '#1976d2', safety: '#e65100', health: '#2e7d32',
  chemical: '#6a1b9a', env: '#00695c', ehs: '#c62828',
}

// depth별 스타일
const DEPTH_STYLES = [
  { pl: 1,   fontSize: '0.85rem', fontWeight: 'bold',   bgKey: 'group' },
  { pl: 3,   fontSize: '0.82rem', fontWeight: 'normal', bgKey: 'page' },
  { pl: 5.5, fontSize: '0.78rem', fontWeight: 'normal', bgKey: 'tab' },
]

const MenuManageTab: React.FC = () => {
  const { t } = useTranslation()
  const { isDarkMode } = useThemeMode()
  const { showSuccess, showError } = useAlert()
  const queryClient = useQueryClient()

  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [roleSearch, setRoleSearch]     = useState('')
  const [expandedSet, setExpandedSet]   = useState<Set<string>>(
    () => new Set(MENU_TREE.map(n => n.key))   // 기본: 1단계만 펼침
  )
  const [hiddenSet, setHiddenSet] = useState<Set<string>>(new Set())

  const paperBg = isDarkMode ? '#18181b' : 'background.paper'

  const { data: dbRules, isLoading } = useQuery({
    queryKey: ['menuRules'],
    queryFn: fetchMenuRules,
  })

  const savedHiddenSet = useMemo(() => buildHiddenSet(dbRules ?? []), [dbRules])

  // SYSTEM_ADMIN이 숨긴 메뉴 키 집합 (다른 역할의 강제 숨김 기준)
  const sysAdminHiddenSet = useMemo(() => {
    return new Set(
      Array.from(hiddenSet)
        .filter(k => k.startsWith('SYSTEM_ADMIN|'))
        .map(k => k.slice('SYSTEM_ADMIN|'.length))
    )
  }, [hiddenSet])

  useEffect(() => {
    if (dbRules !== undefined) setHiddenSet(buildHiddenSet(dbRules))
  }, [dbRules])

  const saveMutation = useMutation({
    mutationFn: () => saveMenuRules(buildRulesToSave(hiddenSet)),
    onSuccess: () => {
      showSuccess(t('menuManageTab.msg1', '저장되었습니다.'))
      queryClient.invalidateQueries({ queryKey: ['menuRules'] })
    },
    onError: () => showError(t('menuManageTab.msg2', '저장 중 오류가 발생했습니다.')),
  })

  const filteredRoles = useMemo(() => {
    if (!roleSearch.trim()) return ROLES
    const q = roleSearch.toLowerCase()
    return ROLES.filter(r => r.label.toLowerCase().includes(q) || r.value.toLowerCase().includes(q))
  }, [roleSearch])

  const isHidden = useCallback((menuKey: string) => {
    if (!selectedRole) return false
    if (selectedRole !== 'SYSTEM_ADMIN' && sysAdminHiddenSet.has(menuKey)) return true
    return hiddenSet.has(hiddenKey(selectedRole, menuKey))
  }, [hiddenSet, selectedRole, sysAdminHiddenSet])

  // 노드 체크박스 상태 계산 (재귀)
  const getNodeState = useCallback((node: MenuNode): 'checked' | 'unchecked' | 'indeterminate' => {
    if (!selectedRole) return 'checked'
    if (selectedRole !== 'SYSTEM_ADMIN' && sysAdminHiddenSet.has(node.key)) return 'unchecked'
    if (hiddenSet.has(hiddenKey(selectedRole, node.key))) return 'unchecked'
    if (!node.children?.length) return 'checked'
    const descendantKeys = getAllDescendantKeys(node)
    const hiddenCount = descendantKeys.filter(k =>
      hiddenSet.has(hiddenKey(selectedRole, k)) ||
      (selectedRole !== 'SYSTEM_ADMIN' && sysAdminHiddenSet.has(k))
    ).length
    if (hiddenCount === 0) return 'checked'
    return 'indeterminate'
  }, [hiddenSet, selectedRole, sysAdminHiddenSet])

  // 노드 토글 (자신 + 모든 하위)
  const toggleNode = useCallback((node: MenuNode) => {
    if (!selectedRole) return
    if (selectedRole !== 'SYSTEM_ADMIN' && sysAdminHiddenSet.has(node.key)) return
    setHiddenSet(prev => {
      const next = new Set(prev)
      const selfKey = hiddenKey(selectedRole, node.key)
      const allKeys = [node.key, ...getAllDescendantKeys(node)].map(k => hiddenKey(selectedRole, k))
      const currentlyHidden = prev.has(selfKey)
      if (currentlyHidden) {
        allKeys.forEach(k => next.delete(k))
      } else {
        allKeys.forEach(k => next.add(k))
      }
      return next
    })
  }, [selectedRole])

  const toggleExpand = (key: string) =>
    setExpandedSet(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })

  const changedCount = useMemo(() => {
    let diff = 0
    hiddenSet.forEach(k => { if (!savedHiddenSet.has(k)) diff++ })
    savedHiddenSet.forEach(k => { if (!hiddenSet.has(k)) diff++ })
    return diff
  }, [hiddenSet, savedHiddenSet])

  const resetToSaved = () => setHiddenSet(new Set(savedHiddenSet))

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
  }

  const selectedRoleMeta = ROLES.find(r => r.value === selectedRole)
  const isSysAdmin = selectedRole === 'SYSTEM_ADMIN'

  // ── 재귀 렌더러 ─────────────────────────────────────────────────────────
  const renderNode = (node: MenuNode, depth: number): React.ReactNode => {
    const hasChildren   = !!(node.children?.length)
    const isExpanded    = expandedSet.has(node.key)
    const selfHidden    = isHidden(node.key)
    const nodeState     = getNodeState(node)
    const style         = DEPTH_STYLES[Math.min(depth, 2)]
    const isForcedHidden = selectedRole !== 'SYSTEM_ADMIN' && sysAdminHiddenSet.has(node.key)

    const rowBg = (() => {
      if (depth === 0) return isDarkMode ? 'rgba(255,255,255,0.05)' : '#f5f5f5'
      if (depth === 1) return isDarkMode ? 'rgba(255,255,255,0.02)' : '#fafafa'
      return 'transparent'
    })()

    return (
      <Box key={node.key} sx={{ mb: depth === 0 ? 1 : 0 }}>
        <Box
          sx={{
            display: 'flex', alignItems: 'center',
            pl: style.pl, pr: 1, py: depth === 0 ? 0.6 : 0.3,
            bgcolor: rowBg,
            borderRadius: depth === 0 ? 1 : 0,
            border: depth === 0 ? 1 : 0,
            borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'grey.200',
            '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.07)' : 'grey.100' },
          }}
        >
          <Checkbox
            size="small"
            checked={nodeState === 'checked'}
            indeterminate={nodeState === 'indeterminate'}
            onChange={() => toggleNode(node)}
            disabled={isForcedHidden}
            sx={{ p: 0.4, mr: 0.5, flexShrink: 0 }}
          />
          <Typography
            sx={{
              flex: 1,
              fontSize: style.fontSize,
              fontWeight: style.fontWeight,
              opacity: selfHidden ? 0.38 : 1,
              cursor: hasChildren ? 'pointer' : 'default',
              userSelect: 'none',
            }}
            onClick={() => hasChildren && toggleExpand(node.key)}
          >
            {node.label}
            {depth === 2 && (
              <Typography component="span" sx={{ fontSize: '0.68rem', color: 'text.disabled', ml: 0.5 }}>
                탭
              </Typography>
            )}
          </Typography>
          {isForcedHidden && (
            <Chip
              label={t('menuManageTab.label1', '전체숨김')} size="small"
              sx={{ mr: 0.5, fontSize: '0.6rem', height: 16, bgcolor: 'error.light', color: 'error.dark' }}
            />
          )}
          {!isForcedHidden && selfHidden && (
            <Chip
              label={t('menuManageTab.label2', '숨김')} size="small"
              sx={{ mr: 0.5, fontSize: '0.6rem', height: 16, bgcolor: 'warning.light', color: 'warning.dark' }}
            />
          )}
          {hasChildren && (
            <IconButton size="small" onClick={() => toggleExpand(node.key)} sx={{ p: 0.25 }}>
              {isExpanded ? <ExpandLess sx={{ fontSize: 16 }} /> : <ExpandMore sx={{ fontSize: 16 }} />}
            </IconButton>
          )}
        </Box>

        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Box sx={{ borderLeft: depth < 2 ? 2 : 0, borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'grey.200', ml: style.pl + 1.5 }}>
              {node.children!.map(child => renderNode(child, depth + 1))}
            </Box>
          </Collapse>
        )}
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', gap: 2, height: '100%', minHeight: 0 }}>

      {/* ── 왼쪽: 역할 목록 ──────────────────────────────────────────────── */}
      <Paper sx={{ width: '25%', minWidth: 230, p: 2, bgcolor: paperBg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>{t('menuManageTab.section1', '역할 선택')}</Typography>
        <TextField
          size="small" fullWidth placeholder="역할 검색"
          value={roleSearch} onChange={e => setRoleSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          sx={{ mb: 1 }}
        />
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          <List dense disablePadding>
            {filteredRoles.map(r => {
              const isSelected  = selectedRole === r.value
              const hiddenCount = Array.from(hiddenSet).filter(k => k.startsWith(r.value + '|')).length
              return (
                <ListItemButton key={r.value} selected={isSelected}
                  onClick={() => setSelectedRole(r.value)}
                  sx={{ borderRadius: 1, mb: 0.5, py: 0.6 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', mr: 1, flexShrink: 0,
                    bgcolor: GROUP_COLORS[r.group] ?? 'grey.400' }} />
                  <ListItemText
                    primary={r.label}
                    primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: isSelected ? 'bold' : 'normal' }}
                  />
                  {r.value === 'SYSTEM_ADMIN'
                    ? <Chip label={t('menuManageTab.label3', '전체')} size="small" color="primary" sx={{ fontSize: '0.6rem', height: 18 }} />
                    : hiddenCount > 0
                      ? <Chip label={`${hiddenCount}숨김`} size="small" color="warning" sx={{ fontSize: '0.6rem', height: 18 }} />
                      : null
                  }
                </ListItemButton>
              )
            })}
          </List>
        </Box>
      </Paper>

      {/* ── 오른쪽: 메뉴 트리 ───────────────────────────────────────────── */}
      <Paper sx={{ flex: 1, p: 2, bgcolor: paperBg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!selectedRole ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'text.secondary' }}>
            <MenuIcon sx={{ fontSize: 48, mb: 1, opacity: 0.35 }} />
            <Typography variant="body2">역할을 선택하면 메뉴·탭 접근 권한을 설정할 수 있습니다</Typography>
            <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5 }}>
              그룹 › 페이지 › 탭 3단계로 관리됩니다
            </Typography>
          </Box>
        ) : (
          <>
            {/* 헤더 */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexShrink: 0 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', mr: 1,
                bgcolor: GROUP_COLORS[selectedRoleMeta?.group ?? ''] ?? 'grey.400' }} />
              <Typography variant="subtitle2" fontWeight="bold">{selectedRoleMeta?.label}</Typography>
              {isSysAdmin && (
                <Chip label={t('menuManageTab.label4', '항상 모든 메뉴 접근')} color="primary" size="small" sx={{ ml: 1, fontSize: '0.7rem' }} />
              )}
              <Box sx={{ flex: 1 }} />
              {changedCount > 0 && (
                <>
                  <Chip label={`${changedCount}개 변경`} size="small"
                    sx={{ mr: 1, bgcolor: 'warning.light', color: 'warning.dark', fontSize: '0.7rem' }} />
                  <Tooltip title="저장된 상태로 되돌리기">
                    <IconButton size="small" onClick={resetToSaved} sx={{ mr: 0.5 }}>
                      <RestartAltIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              )}
              <Button variant="contained" size="small" startIcon={<SaveIcon />}
                onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending && <CircularProgress size={12} sx={{ mr: 0.5 }} />}
                저장
              </Button>
            </Box>

            {/* 범례 */}
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 1, flexShrink: 0 }}>
              <Typography variant="caption" color="text.disabled">
                ☑ 체크 = 노출 &nbsp;/&nbsp; □ 해제 = 숨김 &nbsp;/&nbsp; — 부모 숨김 시 하위 전체 자동 숨김
              </Typography>
            </Box>
            <Divider sx={{ mb: 1.5, flexShrink: 0 }} />

            <Box sx={{ flex: 1, overflowY: 'auto', pr: 0.5 }}>
              {MENU_TREE.map(node => renderNode(node, 0))}
            </Box>
          </>
        )}
      </Paper>
    </Box>
  )
}

export default MenuManageTab
