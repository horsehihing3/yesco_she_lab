import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Collapse,
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PublicIcon from '@mui/icons-material/Public'
import BarChartIcon from '@mui/icons-material/BarChart'
import SecurityIcon from '@mui/icons-material/Security'
import AssessmentIcon from '@mui/icons-material/Assessment'
import ReportProblemIcon from '@mui/icons-material/ReportProblem'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import ApprovalIcon from '@mui/icons-material/FactCheck'
import FactCheckIcon from '@mui/icons-material/FactCheck'
import NatureIcon from '@mui/icons-material/Nature'
import SettingsIcon from '@mui/icons-material/Settings'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import ShieldIcon from '@mui/icons-material/Shield'
import SearchIcon from '@mui/icons-material/Search'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import AssignmentIcon from '@mui/icons-material/Assignment'
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety'
import ScienceIcon from '@mui/icons-material/Science'
import DeleteIcon from '@mui/icons-material/Delete'
import WaterDropIcon from '@mui/icons-material/WaterDrop'
import Co2Icon from '@mui/icons-material/Co2'
import GavelIcon from '@mui/icons-material/Gavel'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation'
import SensorsIcon from '@mui/icons-material/Sensors'
import TrackChangesIcon from '@mui/icons-material/TrackChanges'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import SchoolIcon from '@mui/icons-material/School'
import HandshakeIcon from '@mui/icons-material/Handshake'
import RadioactiveIcon from '@mui/icons-material/Bolt'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import AddBusinessIcon from '@mui/icons-material/AddBusiness'
import TuneIcon from '@mui/icons-material/Tune'
import { useThemeMode } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { useMenuRule } from '../../hooks/useMenuRule'
import { getYescoIcon } from './YescoSidebarIcons'

interface MenuItem {
  textKey: string
  icon: React.ReactNode
  path?: string
  children?: MenuItem[]
  requiredRole?: string
}

const menuItems: MenuItem[] = [
  {
    textKey: 'nav.dashboard',
    icon: <DashboardIcon />,
    children: [
      { textKey: 'nav.mapDashboard', icon: <PublicIcon />, path: '/' },
      { textKey: 'nav.generalDashboard', icon: <BarChartIcon />, path: '/dashboard/general' },
    ],
  },
  {
    textKey: 'nav.ehs',
    icon: <SecurityIcon />,
    children: [
      { textKey: 'nav.ehsCommunication', icon: <SecurityIcon />, path: '/ehs/communication' },
      { textKey: 'nav.planKpiGoal', icon: <TrackChangesIcon />, path: '/plan-kpi-goal' },
      { textKey: 'nav.auditInspection', icon: <SearchIcon />, path: '/audit-inspection' },
      { textKey: 'nav.trainingMgmt', icon: <SchoolIcon />, path: '/training' },
      { textKey: 'nav.emergencyResponse', icon: <WarningAmberIcon />, path: '/emergency-response' },
      { textKey: 'nav.legalResponse', icon: <GavelIcon />, path: '/legal-response' },
      { textKey: 'nav.ehsBudget', icon: <AccountBalanceIcon />, path: '/ehs-budget' },
      { textKey: 'nav.incidentResponse', icon: <WarningAmberIcon />, path: '/incident-response' },
      { textKey: 'nav.workplaceDrawingsView', icon: <PublicIcon />, path: '/workplace-drawings/view' },
    ],
  },
  {
    textKey: 'nav.safetyManage',
    icon: <ShieldIcon />,
    children: [
      { textKey: 'nav.safetyHazardInfo', icon: <AssessmentIcon />, path: '/safety-hazard-info' },
      { textKey: 'nav.safetyAccidentInfo', icon: <AssessmentIcon />, path: '/safety-accident-info' },
      { textKey: 'nav.processActivityWork', icon: <AssessmentIcon />, path: '/process-activity-work' },
      { textKey: 'nav.riskAssessment', icon: <AssessmentIcon />, path: '/risk-assessment' },
      { textKey: 'nav.siteSafetyMgmt', icon: <AssignmentIcon />, path: '/site-safety-mgmt' },
      { textKey: 'nav.nearMiss', icon: <ReportProblemIcon />, path: '/near-miss' },
      { textKey: 'nav.permitToWork', icon: <AssignmentIcon />, path: '/safety-work' },
      { textKey: 'nav.ppeEquipment', icon: <HealthAndSafetyIcon />, path: '/ppe-equipment' },
    ],
  },
  {
    textKey: 'nav.partnerGroupMgmt',
    icon: <HandshakeIcon />,
    children: [
      { textKey: 'nav.partnerSafetyMgmt', icon: <ShieldIcon />, path: '/partner-safety-mgmt' },
      { textKey: 'nav.partnerRiskAssessment', icon: <AssessmentIcon />, path: '/contractor' },
      { textKey: 'nav.partnerPermit', icon: <AssignmentIcon />, path: '/partner-permit' },
      { textKey: 'nav.partnerEval', icon: <FactCheckIcon />, path: '/partner-mgmt' },
      { textKey: 'nav.partnerOshCommittee', icon: <HandshakeIcon />, path: '/partner-osh-committee' },
      { textKey: 'nav.partnerRegistration', icon: <AddBusinessIcon />, path: '/contractor-registration' },
    ],
  },
  {
    textKey: 'nav.healthManage',
    icon: <LocalHospitalIcon />,
    children: [
      { textKey: 'nav.healthScreening', icon: <MedicalServicesIcon />, path: '/health-checkup/admin' },
      { textKey: 'nav.workEnvMeasurement', icon: <ScienceIcon />, path: '/work-env-measurement' },
      { textKey: 'nav.occupationalDiseaseMgmt', icon: <MedicalInformationIcon />, path: '/occupational-disease' },
      { textKey: 'nav.diseasePreventionMgmt', icon: <MedicalServicesIcon />, path: '/disease-prevention-mgmt' },
    ],
  },
  {
    textKey: 'nav.envManage',
    icon: <NatureIcon />,
    children: [
      { textKey: 'nav.envMonitoring', icon: <SensorsIcon />, path: '/environment/monitoring' },
      { textKey: 'nav.envWaste', icon: <DeleteIcon />, path: '/environment/waste' },
      { textKey: 'nav.envAirWater', icon: <WaterDropIcon />, path: '/environment/air-water' },
      { textKey: 'nav.envCarbon', icon: <Co2Icon />, path: '/environment/carbon' },
      { textKey: 'nav.radiationMgmt', icon: <RadioactiveIcon />, path: '/radiation-mgmt' },
      { textKey: 'nav.fireMgmt', icon: <LocalFireDepartmentIcon />, path: '/fire-safety' },
      { textKey: 'nav.legalFacility', icon: <GavelIcon />, path: '/legal-facility' },
      { textKey: 'nav.permitLifecycle', icon: <GavelIcon />, path: '/permit-lifecycle' },
    ],
  },
  {
    textKey: 'nav.chemicalMgmt',
    icon: <ScienceIcon />,
    children: [
      { textKey: 'nav.chemMaster', icon: <ScienceIcon />, path: '/chemical/master' },
      { textKey: 'nav.chemMsdsRaw', icon: <ScienceIcon />, path: '/chemical/msds-raw' },
      { textKey: 'nav.chemMsdsProduct', icon: <ScienceIcon />, path: '/chemical/msds-product' },
      { textKey: 'nav.chemRegulation', icon: <GavelIcon />, path: '/chemical/regulation' },
      { textKey: 'nav.chemLifecycle', icon: <ScienceIcon />, path: '/chemical/lifecycle' },
    ],
  },
  {
    textKey: 'nav.processSafetyMgmt',
    icon: <SettingsIcon />,
    path: '/psm',
  },
  {
    textKey: 'nav.approval',
    icon: <ApprovalIcon />,
    path: '/approval',
  },
  {
    textKey: 'nav.checklist',
    icon: <AssignmentIcon />,
    path: '/checklist',
  },
  {
    textKey: 'nav.environmentManage',
    icon: <SettingsIcon />,
    children: [
      { textKey: 'nav.codeManage', icon: <SettingsIcon />, path: '/system-manage/code' },
      { textKey: 'nav.roleManage', icon: <SettingsIcon />, path: '/system-manage/role' },
      { textKey: 'nav.authManage', icon: <SettingsIcon />, path: '/system-manage/auth' },
      { textKey: 'nav.floorDrawings', icon: <SettingsIcon />, path: '/system-manage/drawings' },
      { textKey: 'nav.buttonManage', icon: <TuneIcon />, path: '/dev/button-manage' },
      { textKey: 'nav.menuManage', icon: <SettingsIcon />, path: '/system-manage/menu' },
    ],
  },
]

interface SidebarProps {
  showLogo?: boolean
  onMenuClick?: () => void
  collapsed?: boolean
}

const Sidebar: React.FC<SidebarProps> = ({ showLogo = false, onMenuClick, collapsed = false }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const handleNavigate = (path: string, _labelKey: string) => {
    navigate(path)
  }

  const { isMenuHidden } = useMenuRule()

  const visibleMenuItems = menuItems
    .filter((item) => !item.requiredRole || user?.role === item.requiredRole)
    .filter((item) => !isMenuHidden(item.textKey))
    .map((item) => {
      if (!item.children) return item
      const visibleChildren = item.children.filter((c) => !isMenuHidden(c.textKey))
      return { ...item, children: visibleChildren }
    })
    .filter((item) => !item.children || item.children.length > 0)
  const { isDarkMode, isYescoMode } = useThemeMode()
  const [expandedMenus, setExpandedMenus] = useState<string[]>(() => {
    const isPathActiveStrict = (path: string) => {
      if (path === '/') return location.pathname === '/'
      if (location.pathname === path) return true
      return location.pathname.startsWith(path + '/')
    }
    const active = menuItems.find(
      (item) => item.children?.some((child) => child.path && isPathActiveStrict(child.path))
    )
    return active ? [active.textKey] : []
  })

  // Theme-aware colors
  // 예스코 모드: 깊은 네이비 사이드바 + LS Red active/hover + 흰색 아이콘 (lsyesco.com 패턴)
  const colors = isYescoMode
    ? {
        sidebar:           '#0F2147',
        sidebarBrand:      '#0A1733',
        sidebarHover:      'rgba(230,0,18,0.18)',
        activeBackground:  '#E60012',
        activeBorder:      '#FF334D',
        inactiveText:      '#c8d0e0',
        inactiveIcon:      '#ffffff',           // 흰색 아이콘 (YESCO 패턴)
        subMenuBg:         '#0A1733',
      }
    : {
        sidebar:           isDarkMode ? '#18181b' : '#1e293b',
        sidebarBrand:      isDarkMode ? '#09090b' : '#0f172a',
        sidebarHover:      isDarkMode ? '#27272a' : '#334155',
        activeBackground:  '#2563eb',
        activeBorder:      '#3b82f6',
        inactiveText:      isDarkMode ? '#71717a' : '#9ca3af',
        inactiveIcon:      isDarkMode ? '#71717a' : '#9ca3af',
        subMenuBg:         isDarkMode ? '#09090b' : '#0f172a',
      }

  const isPathActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    if (location.pathname === path) return true
    // 경로 segment 경계 매칭: /disease-prevention 이 /disease-prevention-mgmt 와 헷갈리지 않도록
    return location.pathname.startsWith(path + '/')
  }

  const isParentActive = (item: MenuItem) =>
    item.children?.some((child) => child.path && isPathActive(child.path)) ?? false

  const toggleExpand = (textKey: string) => {
    setExpandedMenus((prev) =>
      prev.includes(textKey) ? [] : [textKey]
    )
  }

  const renderMenuItem = (item: MenuItem) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedMenus.includes(item.textKey)
    const isActive = item.path ? isPathActive(item.path) : isParentActive(item)

    // YESCO 모드: 메뉴 textKey에 매핑된 커스텀 2-tone SVG 아이콘 사용
    const YescoCustomIcon = isYescoMode ? getYescoIcon(item.textKey) : null

    // YESCO 모드: 아이콘 컨테이너 = 둥근 사각 배지 (lsyesco.com 푸터 카드 패턴)
    const iconWrapSx = isYescoMode
      ? {
          position: 'relative' as const,
          width: 44, height: 44, mx: 'auto',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 1.5,
          bgcolor: isActive ? 'rgba(255,255,255,0.16)' : 'transparent',
          transition: 'all .18s',
          // 활성 시: 강조 글로우 + 하단 LS Red 받침
          ...(isActive && {
            boxShadow: '0 0 0 1.5px rgba(230,0,18,0.65), 0 0 14px -4px rgba(230,0,18,0.5)',
          }),
          // MUI 아이콘이 fallback 으로 들어가면 흰색 처리
          '& .MuiSvgIcon-root': {
            fontSize: 24,
            color: '#ffffff',
            transition: 'color .18s',
          },
        }
      : {}

    const button = (
      <ListItemButton
        onClick={() => {
          if (hasChildren) {
            toggleExpand(item.textKey)
          } else if (item.path) {
            handleNavigate(item.path, item.textKey)
            onMenuClick?.()
          }
        }}
        sx={{
          py: isYescoMode ? 1.75 : 1.5,
          px: collapsed ? 1.5 : 2,
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderLeft: isActive ? `4px solid ${colors.activeBorder}` : '4px solid transparent',
          borderBottom: isActive && hasChildren && isExpanded ? '1px solid rgba(255,255,255,0.3)' : 'none',
          backgroundColor: isActive ? colors.activeBackground : 'transparent',
          color: isActive ? 'white' : colors.inactiveText,
          ...(isYescoMode && isActive && {
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08), 0 0 18px -8px rgba(230,0,18,0.6)',
          }),
          '&:hover': {
            backgroundColor: isActive ? colors.activeBackground : colors.sidebarHover,
            ...(isYescoMode && !isActive && {
              '& .yesco-icon-wrap': { bgcolor: 'rgba(255,255,255,0.12)' },
            }),
          },
        }}
      >
        {isYescoMode ? (
          <Box className="yesco-icon-wrap" sx={{ ...iconWrapSx, mr: collapsed ? 0 : 1.5 }}>
            {YescoCustomIcon ? <YescoCustomIcon size={26} /> : item.icon}
          </Box>
        ) : (
          <ListItemIcon
            sx={{
              minWidth: collapsed ? 'auto' : 40,
              justifyContent: 'center',
              color: isActive ? 'white' : colors.inactiveIcon,
            }}
          >
            {item.icon}
          </ListItemIcon>
        )}
        {!collapsed && (
          <>
            <ListItemText
              primary={t(item.textKey)}
              primaryTypographyProps={{
                fontSize: isYescoMode ? '0.9rem' : '0.875rem',
                fontWeight: isActive ? (isYescoMode ? 700 : 600) : (isYescoMode ? 500 : 400),
                letterSpacing: isYescoMode ? '0.02em' : 'normal',
              }}
            />
            {hasChildren && (isExpanded ? <ExpandLess /> : <ExpandMore />)}
          </>
        )}
      </ListItemButton>
    )

    return (
      <Box key={item.textKey}>
        <ListItem disablePadding>
          {collapsed ? (
            <Tooltip title={t(item.textKey)} placement="right" arrow>
              {button}
            </Tooltip>
          ) : (
            button
          )}
        </ListItem>

        {/* 2-depth children */}
        {hasChildren && !collapsed && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List disablePadding sx={{ backgroundColor: colors.subMenuBg }}>
              {item.children!.map((child) => {
                const childActive = child.path ? isPathActive(child.path) : false
                return (
                  <ListItem key={child.textKey} disablePadding>
                    <ListItemButton
                      onClick={() => {
                        if (child.path) {
                          handleNavigate(child.path, child.textKey)
                          onMenuClick?.()
                        }
                      }}
                      sx={{
                        py: 1,
                        pl: 4,
                        pr: 2,
                        borderLeft: childActive ? `4px solid ${colors.activeBorder}` : '4px solid transparent',
                        backgroundColor: childActive ? colors.activeBackground : 'transparent',
                        color: childActive ? 'white' : colors.inactiveText,
                        ...(isYescoMode && childActive && {
                          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                        }),
                        '&:hover': {
                          backgroundColor: childActive ? colors.activeBackground : colors.sidebarHover,
                        },
                      }}
                    >
                      {isYescoMode && (
                        <Box sx={{
                          width: 6, height: 6, borderRadius: '50%',
                          bgcolor: childActive ? '#fff' : '#E60012',
                          mr: 1.25, flexShrink: 0,
                        }} />
                      )}
                      <ListItemText
                        primary={isYescoMode ? t(child.textKey) : `•  ${t(child.textKey)}`}
                        primaryTypographyProps={{
                          fontSize: '0.82rem',
                          fontWeight: childActive ? 700 : (isYescoMode ? 500 : 400),
                          letterSpacing: isYescoMode ? '0.02em' : 'normal',
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                )
              })}
            </List>
          </Collapse>
        )}
      </Box>
    )
  }

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: colors.sidebar,
      }}
    >
      {/* Logo - Brand Area */}
      {showLogo && (
        <Box
          onClick={() => navigate('/')}
          sx={{
            p: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            backgroundColor: colors.sidebarBrand,
            cursor: 'pointer',
            // YESCO 모드: 하단 LS Red 강조선 (브랜드 시그니처)
            ...(isYescoMode && {
              borderBottom: '3px solid #E60012',
              background: 'linear-gradient(135deg, #0A1733 0%, #112a55 100%)',
            }),
          }}
        >
          {/* 모드별 YESCO 로고: 다크·예스코 → logo_yesco.png(흰색 로고) / 라이트 → logo_yesco_on.png */}
          <Box component="img"
            src={(isDarkMode || isYescoMode) ? '/assets/logo_yesco.png' : '/assets/logo_yesco_on.png'}
            alt="YESCO SHE"
            sx={{ height: 36, width: 'auto', display: 'block' }} />
        </Box>
      )}

      {/* Navigation Menu */}
      <List sx={{ flex: 1, pt: 2, pb: 2, px: 0, overflowY: 'auto', overflowX: 'hidden' }}>
        {visibleMenuItems.map((item) => renderMenuItem(item))}
      </List>

    </Box>
  )
}

export default Sidebar
