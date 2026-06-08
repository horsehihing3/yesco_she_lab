import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress, Alert, List, ListItem, ListItemIcon, ListItemText } from '@mui/material'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import EventIcon from '@mui/icons-material/Event'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'
import { chemicalApi } from '../../api/chemicalApi'
import useCodeMap from '../../hooks/useCodeMap'

const ChemicalSafetyTab: React.FC = () => {
  const { t } = useTranslation()
  const { getLabel: getHazardLabel } = useCodeMap('CHEMICAL_HAZARD_CLASS')

  const { data, isLoading } = useQuery({
    queryKey: ['chemicalAll'],
    queryFn: () => chemicalApi.getAll(0, 100),
  })

  const items = data?.content || []

  const inspectionAlerts = useMemo(() => {
    const now = new Date()
    return items
      .filter(i => i.nextInspectionDate)
      .map(i => ({ ...i, daysLeft: Math.ceil((new Date(i.nextInspectionDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) }))
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 10)
  }, [items])

  const highRiskChemicals = useMemo(() => {
    return items.filter(i => ['TOXIC', 'CARCINOGENIC', 'EXPLOSIVE'].includes(i.hazardClass))
  }, [items])

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>

  return (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 3 }}>
        {/* 점검 일정 알림 */}
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <EventIcon color="warning" fontSize="small" />
            <Typography variant="subtitle2" fontWeight="bold">{t('chem.safety.inspectionSchedule')}</Typography>
            <Chip label={`${inspectionAlerts.length}${t('ppe.count')}`} size="small" color={inspectionAlerts.some(i => i.daysLeft <= 0) ? 'error' : 'warning'} />
          </Box>
          <List dense sx={{ maxHeight: 320, overflow: 'auto' }}>
            {inspectionAlerts.length === 0 ? (
              <ListItem><ListItemText secondary={t('chem.safety.noSchedule')} /></ListItem>
            ) : inspectionAlerts.map(item => (
              <ListItem key={item.id} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <ListItemIcon sx={{ minWidth: 24 }}>
                  <FiberManualRecordIcon sx={{ fontSize: 8, color: item.daysLeft <= 0 ? 'error.main' : item.daysLeft <= 14 ? 'warning.main' : 'success.main' }} />
                </ListItemIcon>
                <ListItemText
                  primary={<Typography variant="body2" fontWeight={500}>{item.chemicalNameKo}</Typography>}
                  secondary={`${item.storageLocation || ''} · ${getHazardLabel(item.hazardClass)}`}
                />
                <Chip
                  label={item.daysLeft <= 0 ? t('chem.safety.overdue') : `D-${item.daysLeft}`}
                  size="small"
                  color={item.daysLeft <= 0 ? 'error' : item.daysLeft <= 14 ? 'warning' : 'default'}
                />
              </ListItem>
            ))}
          </List>
        </Paper>

        {/* 고위험 화학물질 */}
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <WarningAmberIcon color="error" fontSize="small" />
            <Typography variant="subtitle2" fontWeight="bold">{t('chem.safety.highRisk')}</Typography>
            <Chip label={`${highRiskChemicals.length}${t('ppe.count')}`} size="small" color="error" />
          </Box>
          {highRiskChemicals.length === 0 ? (
            <Alert severity="success" sx={{ mt: 1 }}>{t('chem.safety.noHighRisk')}</Alert>
          ) : (
            <>
              <TableContainer sx={{ display: { xs: 'none', md: 'block' }, overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 500, '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>{t('chem.nameKo')}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{t('chem.hazardClass')}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{t('chem.signalWord')}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{t('chem.storageLocation')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {highRiskChemicals.map(item => (
                      <TableRow key={item.id} hover>
                        <TableCell><Typography variant="body2" fontWeight={600}>{item.chemicalNameKo}</Typography></TableCell>
                        <TableCell><Chip label={getHazardLabel(item.hazardClass)} size="small" color="error" variant="outlined" /></TableCell>
                        <TableCell><Chip label={item.signalWord || ''} size="small" color="error" /></TableCell>
                        <TableCell>{item.storageLocation || ''}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1 }}>
                {highRiskChemicals.map(item => (
                  <Paper key={item.id} variant="outlined" sx={{ p: 1.5 }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5, flexWrap: 'wrap' }}>
                      <Chip label={getHazardLabel(item.hazardClass)} size="small" color="error" variant="outlined" />
                      <Box sx={{ flex: 1 }} />
                      <Chip label={item.signalWord || ''} size="small" color="error" />
                    </Box>
                    <Typography fontWeight="bold" color="primary" sx={{ mb: 0.25 }}>{item.chemicalNameKo}</Typography>
                    <Typography variant="body2" color="text.secondary">{item.storageLocation || ''}</Typography>
                  </Paper>
                ))}
              </Box>
            </>
          )}
        </Paper>
      </Box>

      {/* 비상 대응 절차 */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>{t('chem.safety.emergencyProcedures')}</Typography>
        <TableContainer sx={{ display: { xs: 'none', md: 'block' }, overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 700, '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>{t('chem.nameKo')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{t('chem.hazardClass')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{t('chem.ghsPictogram')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>{t('chem.emergencyProcedure')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.filter(i => i.emergencyProcedure).map(item => (
                <TableRow key={item.id} hover>
                  <TableCell><Typography variant="body2" fontWeight={600}>{item.chemicalNameKo}</Typography></TableCell>
                  <TableCell><Chip label={getHazardLabel(item.hazardClass)} size="small" color="warning" variant="outlined" /></TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{item.ghsPictogram || ''}</TableCell>
                  <TableCell><Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>{item.emergencyProcedure}</Typography></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
          {items.filter(i => i.emergencyProcedure).map(item => (
            <Paper key={item.id} variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1, flexWrap: 'wrap' }}>
                <Chip label={getHazardLabel(item.hazardClass)} size="small" color="warning" variant="outlined" />
              </Box>
              <Typography fontWeight="bold" color="primary" sx={{ mb: 0.5 }}>{item.chemicalNameKo}</Typography>
              {item.ghsPictogram && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>{item.ghsPictogram}</Typography>}
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', mt: 0.5 }}>{item.emergencyProcedure}</Typography>
            </Paper>
          ))}
        </Box>
      </Paper>
    </Box>
  )
}

export default ChemicalSafetyTab
