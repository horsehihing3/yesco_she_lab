import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Box, Paper, Typography, Chip, LinearProgress, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import InventoryIcon from '@mui/icons-material/Inventory'
import ScienceIcon from '@mui/icons-material/Science'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import { chemicalApi } from '../../api/chemicalApi'
import useCodeMap from '../../hooks/useCodeMap'

const HAZARD_COLORS: Record<string, string> = {
  FLAMMABLE: '#ef4444', CORROSIVE: '#f97316', TOXIC: '#8b5cf6', OXIDIZING: '#3b82f6',
  EXPLOSIVE: '#dc2626', CARCINOGENIC: '#be185d', ENV_HAZARDOUS: '#059669',
}

const ChemicalDashboardTab: React.FC = () => {
  const { t } = useTranslation()
  const { getLabel: getHazardLabel } = useCodeMap('CHEMICAL_HAZARD_CLASS')
  const { getLabel: getStatusLabel } = useCodeMap('CHEMICAL_STATUS')

  const { data, isLoading } = useQuery({
    queryKey: ['chemicalAll'],
    queryFn: () => chemicalApi.getAll(0, 100),
  })

  const items = data?.content || []

  const stats = useMemo(() => {
    const total = items.length
    const inUse = items.filter(i => i.status === 'IN_USE').length
    const overLimit = items.filter(i => i.maxStorageLimit && i.storageQuantity > i.maxStorageLimit).length
    const needInspection = items.filter(i => i.nextInspectionDate && new Date(i.nextInspectionDate) <= new Date()).length

    const byHazard: Record<string, number> = {}
    items.forEach(i => { byHazard[i.hazardClass] = (byHazard[i.hazardClass] || 0) + 1 })

    const byStatus: Record<string, number> = {}
    items.forEach(i => { byStatus[i.status] = (byStatus[i.status] || 0) + 1 })

    return { total, inUse, overLimit, needInspection, byHazard, byStatus }
  }, [items])

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>

  return (
    <Box>
      {/* KPI Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <Paper sx={{ p: 2, borderTop: '3px solid', borderColor: 'primary.main' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <ScienceIcon color="primary" fontSize="small" />
            <Typography variant="caption" color="text.secondary">{t('chem.dashboard.totalChemicals')}</Typography>
          </Box>
          <Typography variant="h4" fontWeight="bold" color="primary">{stats.total}</Typography>
          <Typography variant="caption" color="text.secondary">{t('chem.dashboard.registeredItems')}</Typography>
        </Paper>
        <Paper sx={{ p: 2, borderTop: '3px solid', borderColor: 'success.main' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <InventoryIcon color="success" fontSize="small" />
            <Typography variant="caption" color="text.secondary">{t('chem.dashboard.inUse')}</Typography>
          </Box>
          <Typography variant="h4" fontWeight="bold" color="success.main">{stats.inUse}</Typography>
          <Typography variant="caption" color="text.secondary">{t('chem.dashboard.activeChemicals')}</Typography>
        </Paper>
        <Paper sx={{ p: 2, borderTop: '3px solid', borderColor: 'warning.main' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <WarningAmberIcon color="warning" fontSize="small" />
            <Typography variant="caption" color="text.secondary">{t('chem.dashboard.overLimit')}</Typography>
          </Box>
          <Typography variant="h4" fontWeight="bold" color="warning.main">{stats.overLimit}</Typography>
          <Typography variant="caption" color="text.secondary">{t('chem.dashboard.exceedStorage')}</Typography>
        </Paper>
        <Paper sx={{ p: 2, borderTop: '3px solid', borderColor: 'error.main' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <LocalFireDepartmentIcon color="error" fontSize="small" />
            <Typography variant="caption" color="text.secondary">{t('chem.dashboard.needInspection')}</Typography>
          </Box>
          <Typography variant="h4" fontWeight="bold" color="error.main">{stats.needInspection}</Typography>
          <Typography variant="caption" color="text.secondary">{t('chem.dashboard.inspectionOverdue')}</Typography>
        </Paper>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 3 }}>
        {/* 위험 분류별 현황 */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>{t('chem.dashboard.byHazardClass')}</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {Object.entries(stats.byHazard).map(([code, count]) => (
              <Box key={code} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ width: 100, flexShrink: 0 }}>{getHazardLabel(code)}</Typography>
                <LinearProgress variant="determinate" value={(count / stats.total) * 100} sx={{ flex: 1, height: 8, borderRadius: 4, '& .MuiLinearProgress-bar': { bgcolor: HAZARD_COLORS[code] || '#888' } }} />
                <Typography variant="body2" fontFamily="monospace" sx={{ width: 30, textAlign: 'right' }}>{count}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ width: 36, textAlign: 'right' }}>{Math.round((count / stats.total) * 100)}%</Typography>
              </Box>
            ))}
          </Box>
        </Paper>

        {/* 상태별 현황 */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>{t('chem.dashboard.byStatus')}</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {Object.entries(stats.byStatus).map(([code, count]) => (
              <Box key={code} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ width: 100, flexShrink: 0 }}>{getStatusLabel(code)}</Typography>
                <LinearProgress variant="determinate" value={(count / stats.total) * 100} sx={{ flex: 1, height: 8, borderRadius: 4 }} />
                <Typography variant="body2" fontFamily="monospace" sx={{ width: 30, textAlign: 'right' }}>{count}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>

      {/* 주의 필요 화학물질 */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>{t('chem.dashboard.attentionRequired')}</Typography>
        <TableContainer>
          <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>{t('chem.nameKo')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{t('chem.casNumber')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{t('chem.hazardClass')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">{t('chem.quantity')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{t('chem.storageLocation')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{t('chem.status')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.filter(i => i.status !== 'IN_USE' || (i.maxStorageLimit && i.storageQuantity > i.maxStorageLimit) || (i.nextInspectionDate && new Date(i.nextInspectionDate) <= new Date())).slice(0, 5).map(item => (
                <TableRow key={item.id} hover>
                  <TableCell><Typography variant="body2" fontWeight={600}>{item.chemicalNameKo}</Typography></TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{item.casNumber || ''}</TableCell>
                  <TableCell><Chip label={getHazardLabel(item.hazardClass)} size="small" sx={{ bgcolor: HAZARD_COLORS[item.hazardClass] + '20', color: HAZARD_COLORS[item.hazardClass], border: `1px solid ${HAZARD_COLORS[item.hazardClass]}40` }} /></TableCell>
                  <TableCell align="center" sx={{ fontFamily: 'monospace' }}>{item.storageQuantity} {item.unit}</TableCell>
                  <TableCell>{item.storageLocation || ''}</TableCell>
                  <TableCell><Chip label={getStatusLabel(item.status)} size="small" color={item.status === 'IN_USE' ? 'success' : item.status === 'PENDING_DISPOSAL' ? 'warning' : 'default'} /></TableCell>
                </TableRow>
              ))}
              {items.filter(i => i.status !== 'IN_USE').length === 0 && (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>{t('chem.dashboard.allNormal')}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  )
}

export default ChemicalDashboardTab
