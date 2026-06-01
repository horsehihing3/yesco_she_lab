import { useState, useMemo } from 'react'
import {
  Box, ListItemButton, ListItemIcon, ListItemText, Typography, Divider,
  ListSubheader, useTheme, useMediaQuery, Drawer, IconButton
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import MenuIcon from '@mui/icons-material/Menu'
import ScienceIcon from '@mui/icons-material/Science'
import InventoryIcon from '@mui/icons-material/Inventory'
import BusinessIcon from '@mui/icons-material/Business'
import GavelIcon from '@mui/icons-material/Gavel'
import ChecklistIcon from '@mui/icons-material/Checklist'
import DescriptionIcon from '@mui/icons-material/Description'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import PublicIcon from '@mui/icons-material/Public'
import WarehouseIcon from '@mui/icons-material/Warehouse'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import TrackChangesIcon from '@mui/icons-material/TrackChanges'
import AssessmentIcon from '@mui/icons-material/Assessment'
import ReportProblemIcon from '@mui/icons-material/ReportProblem'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'

// Tab components
import ChemicalListTab from '../components/chemical/ChemicalListTab'
import ErpMaterialTab from '../components/chemical/ErpMaterialTab'
import VendorListTab from '../components/chemical/VendorListTab'
import RegulationTab from '../components/chemical/RegulationTab'
import RegulationCheckTab from '../components/chemical/RegulationCheckTab'
import MsdsRawLatestTab from '../components/chemical/MsdsRawLatestTab'
import MsdsRawOldTab from '../components/chemical/MsdsRawOldTab'
import MsdsRawHistoryTab from '../components/chemical/MsdsRawHistoryTab'
import MsdsProductLatestTab from '../components/chemical/MsdsProductLatestTab'
import MsdsProductOldTab from '../components/chemical/MsdsProductOldTab'
import MsdsProductHistoryTab from '../components/chemical/MsdsProductHistoryTab'
import GhsTab from '../components/chemical/GhsTab'
import ReachTab from '../components/chemical/ReachTab'
import ClpTab from '../components/chemical/ClpTab'
import TscaTab from '../components/chemical/TscaTab'
import WarehouseTab from '../components/chemical/WarehouseTab'
import IncomingUsageTab from '../components/chemical/IncomingUsageTab'
import LotTrackingTab from '../components/chemical/LotTrackingTab'
import UsageReportTab from '../components/chemical/UsageReportTab'
import HazardReportTab from '../components/chemical/HazardReportTab'

interface NavItem {
  key: string
  label: string
  icon: React.ReactNode
  group: string
}

const SIDEBAR_WIDTH = 240

const ChemicalManagePage: React.FC = () => {
  const { t } = useTranslation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [activePage, setActivePage] = useState('chem-list')
  const [drawerOpen, setDrawerOpen] = useState(false)

  const navItems: NavItem[] = useMemo(() => [
    // 마스터·규제
    { key: 'chem-list',  label: t('chem.nav.chemList'),      icon: <ScienceIcon fontSize="small" />,       group: t('chem.nav.groupMaster') },
    { key: 'erp-item',   label: t('chem.nav.erpItem'),       icon: <InventoryIcon fontSize="small" />,      group: t('chem.nav.groupMaster') },
    { key: 'vendor',     label: t('chem.nav.vendor'),        icon: <BusinessIcon fontSize="small" />,       group: t('chem.nav.groupMaster') },
    { key: 'reg-rule',   label: t('chem.nav.regRule'),       icon: <GavelIcon fontSize="small" />,          group: t('chem.nav.groupMaster') },
    { key: 'reg-check',  label: t('chem.nav.regCheck'),      icon: <ChecklistIcon fontSize="small" />,      group: t('chem.nav.groupMaster') },
    // MSDS 관리
    { key: 'raw-msds-latest',  label: t('chem.nav.rawMsdsLatest'),  icon: <DescriptionIcon fontSize="small" />,    group: t('chem.nav.groupMsds') },
    { key: 'raw-msds-old',    label: t('chem.nav.rawMsdsOld'),     icon: <DescriptionIcon fontSize="small" />,    group: t('chem.nav.groupMsds') },
    { key: 'raw-msds-hist',   label: t('chem.nav.rawMsdsHist'),    icon: <DescriptionIcon fontSize="small" />,    group: t('chem.nav.groupMsds') },
    { key: 'prod-msds-latest', label: t('chem.nav.prodMsdsLatest'), icon: <DescriptionIcon fontSize="small" />,    group: t('chem.nav.groupMsds') },
    { key: 'prod-msds-old',   label: t('chem.nav.prodMsdsOld'),    icon: <DescriptionIcon fontSize="small" />,    group: t('chem.nav.groupMsds') },
    { key: 'prod-msds-hist',  label: t('chem.nav.prodMsdsHist'),   icon: <DescriptionIcon fontSize="small" />,    group: t('chem.nav.groupMsds') },
    { key: 'ghs',        label: 'GHS',                             icon: <WarningAmberIcon fontSize="small" />,    group: t('chem.nav.groupMsds') },
    { key: 'eu-reach',   label: 'EU REACH',                        icon: <PublicIcon fontSize="small" />,          group: t('chem.nav.groupMsds') },
    { key: 'eu-clp',     label: 'EU CLP',                          icon: <PublicIcon fontSize="small" />,          group: t('chem.nav.groupMsds') },
    { key: 'tsca',        label: 'TSCA',                            icon: <PublicIcon fontSize="small" />,          group: t('chem.nav.groupMsds') },
    // Life-Cycle
    { key: 'warehouse',  label: t('chem.nav.warehouse'),     icon: <WarehouseIcon fontSize="small" />,      group: t('chem.nav.groupLifecycle') },
    { key: 'incoming',   label: t('chem.nav.incoming'),      icon: <LocalShippingIcon fontSize="small" />,  group: t('chem.nav.groupLifecycle') },
    { key: 'tracking',   label: t('chem.nav.tracking'),      icon: <TrackChangesIcon fontSize="small" />,   group: t('chem.nav.groupLifecycle') },
    { key: 'report-usage',  label: t('chem.nav.reportUsage'),    icon: <AssessmentIcon fontSize="small" />,   group: t('chem.nav.groupLifecycle') },
    { key: 'report-hazard', label: t('chem.nav.reportHazard'),   icon: <ReportProblemIcon fontSize="small" />, group: t('chem.nav.groupLifecycle') },
  ], [t])

  const activeItem = navItems.find(n => n.key === activePage)
  const activeGroup = activeItem?.group || ''

  const pageComponents: Record<string, React.ReactNode> = {
    'chem-list': <ChemicalListTab />,
    'erp-item': <ErpMaterialTab />,
    'vendor': <VendorListTab />,
    'reg-rule': <RegulationTab />,
    'reg-check': <RegulationCheckTab />,
    'raw-msds-latest': <MsdsRawLatestTab />,
    'raw-msds-old': <MsdsRawOldTab />,
    'raw-msds-hist': <MsdsRawHistoryTab />,
    'prod-msds-latest': <MsdsProductLatestTab />,
    'prod-msds-old': <MsdsProductOldTab />,
    'prod-msds-hist': <MsdsProductHistoryTab />,
    'ghs': <GhsTab />,
    'eu-reach': <ReachTab />,
    'eu-clp': <ClpTab />,
    'tsca': <TscaTab />,
    'warehouse': <WarehouseTab />,
    'incoming': <IncomingUsageTab />,
    'tracking': <LotTrackingTab />,
    'report-usage': <UsageReportTab />,
    'report-hazard': <HazardReportTab />,
  }

  const handleNav = (key: string) => {
    setActivePage(key)
    if (isMobile) setDrawerOpen(false)
  }

  const sidebarContent = (
    <Box sx={{ width: SIDEBAR_WIDTH, height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <ScienceIcon color="primary" />
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.65rem' }}>
            EHS System
          </Typography>
          <Typography variant="subtitle2" fontWeight="bold">
            {t('chem.title')}
          </Typography>
        </Box>
      </Box>
      <Divider />
      {(() => {
        let lastGroup = ''
        return navItems.map((item) => {
          const showHeader = item.group !== lastGroup
          lastGroup = item.group
          return (
            <Box key={item.key}>
              {showHeader && (
                <ListSubheader sx={{
                  fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
                  lineHeight: '32px', mt: 1, bgcolor: 'transparent', color: 'text.secondary'
                }}>
                  {item.group}
                </ListSubheader>
              )}
              <ListItemButton
                selected={activePage === item.key}
                onClick={() => handleNav(item.key)}
                sx={{
                  py: 0.5, px: 2, minHeight: 36,
                  '&.Mui-selected': { bgcolor: 'primary.main', color: '#fff', '&:hover': { bgcolor: 'primary.dark' }, '& .MuiListItemIcon-root': { color: '#fff' } },
                  borderRadius: 0
                }}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.78rem', noWrap: true }} />
              </ListItemButton>
            </Box>
          )
        })
      })()}
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 130px)', overflow: 'hidden' }}>
      {/* Sidebar */}
      {isMobile ? (
        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} variant="temporary">
          {sidebarContent}
        </Drawer>
      ) : (
        <Box sx={{
          width: SIDEBAR_WIDTH, flexShrink: 0, borderRight: 1, borderColor: 'divider',
          bgcolor: 'background.paper', overflowY: 'auto', overflowX: 'hidden'
        }}>
          {sidebarContent}
        </Box>
      )}

      {/* Main content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 1.5, md: 2.5 } }}>
        {/* Breadcrumb */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          {isMobile && (
            <IconButton size="small" onClick={() => setDrawerOpen(true)}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="body2" color="text.secondary">{activeGroup}</Typography>
          <NavigateNextIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
          <Typography variant="body2" fontWeight="bold">{activeItem?.label}</Typography>
        </Box>

        {/* Page content */}
        {pageComponents[activePage]}
      </Box>
    </Box>
  )
}

export default ChemicalManagePage
