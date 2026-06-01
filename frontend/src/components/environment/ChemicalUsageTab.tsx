import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, LinearProgress, CircularProgress } from '@mui/material'
import { chemicalApi } from '../../api/chemicalApi'
import useCodeMap from '../../hooks/useCodeMap'

const ChemicalUsageTab: React.FC = () => {
  const { t } = useTranslation()
  const { getLabel: getHazardLabel } = useCodeMap('CHEMICAL_HAZARD_CLASS')

  const { data, isLoading } = useQuery({
    queryKey: ['chemicalAll'],
    queryFn: () => chemicalApi.getAll(0, 100),
  })

  const items = data?.content || []

  const deptUsage = useMemo(() => {
    const map: Record<string, { chemicals: string[]; totalQty: number; hazardTypes: Set<string> }> = {}
    items.forEach(i => {
      const dept = i.department || '미지정'
      if (!map[dept]) map[dept] = { chemicals: [], totalQty: 0, hazardTypes: new Set() }
      map[dept].chemicals.push(i.chemicalNameKo)
      map[dept].totalQty += i.storageQuantity || 0
      map[dept].hazardTypes.add(i.hazardClass)
    })
    return Object.entries(map).map(([dept, v]) => ({ dept, count: v.chemicals.length, totalQty: v.totalQty, hazardTypes: Array.from(v.hazardTypes) }))
      .sort((a, b) => b.count - a.count)
  }, [items])

  const storageStatus = useMemo(() => {
    const locations: Record<string, { count: number; chemicals: string[] }> = {}
    items.forEach(i => {
      const loc = i.storageLocation || '미지정'
      if (!locations[loc]) locations[loc] = { count: 0, chemicals: [] }
      locations[loc].count++
      locations[loc].chemicals.push(i.chemicalNameKo)
    })
    return Object.entries(locations).map(([loc, v]) => ({ location: loc, count: v.count, chemicals: v.chemicals }))
      .sort((a, b) => b.count - a.count)
  }, [items])

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>

  const maxDeptCount = Math.max(...deptUsage.map(d => d.count), 1)

  return (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 3 }}>
        {/* 부서별 취급 현황 */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>{t('chem.usage.byDepartment')}</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {deptUsage.map(d => (
              <Box key={d.dept}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="body2" sx={{ width: 90, flexShrink: 0 }}>{d.dept}</Typography>
                  <LinearProgress variant="determinate" value={(d.count / maxDeptCount) * 100} sx={{ flex: 1, height: 8, borderRadius: 4 }} />
                  <Typography variant="body2" fontFamily="monospace" sx={{ width: 30, textAlign: 'right' }}>{d.count}</Typography>
                </Box>
                <Box sx={{ ml: '98px', display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {d.hazardTypes.map(h => <Chip key={h} label={getHazardLabel(h)} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 18 }} />)}
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>

        {/* 보관 위치별 현황 */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>{t('chem.usage.byStorage')}</Typography>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 480, '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'grey.300' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('chem.storageLocation')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">{t('chem.usage.chemCount')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('chem.usage.storedChemicals')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {storageStatus.map(s => (
                  <TableRow key={s.location} hover>
                    <TableCell><Typography variant="body2" fontWeight={600}>{s.location}</Typography></TableCell>
                    <TableCell align="center" sx={{ fontFamily: 'monospace' }}>{s.count}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {s.chemicals.slice(0, 3).map((c, i) => <Chip key={i} label={c} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />)}
                        {s.chemicals.length > 3 && <Chip label={`+${s.chemicals.length - 3}`} size="small" sx={{ fontSize: '0.7rem' }} />}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>

      {/* 전체 화학물질 상세 목록 */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>{t('chem.usage.detailList')}</Typography>
        {/* PC Table */}
        <TableContainer sx={{ display: { xs: 'none', md: 'block' }, overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 900, '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'grey.300' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>{t('chem.nameKo')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{t('chem.nameEn')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{t('chem.casNumber')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{t('chem.hazardClass')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">{t('chem.quantity')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{t('chem.department')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{t('chem.handler')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{t('chem.signalWord')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.id} hover>
                  <TableCell><Typography variant="body2" fontWeight={600}>{item.chemicalNameKo}</Typography></TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{item.chemicalNameEn || ''}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{item.casNumber || ''}</TableCell>
                  <TableCell><Chip label={getHazardLabel(item.hazardClass)} size="small" color="warning" variant="outlined" /></TableCell>
                  <TableCell align="center" sx={{ fontFamily: 'monospace' }}>{item.storageQuantity} {item.unit}</TableCell>
                  <TableCell>{item.department || ''}</TableCell>
                  <TableCell>{item.handler || ''}</TableCell>
                  <TableCell><Chip label={item.signalWord || ''} size="small" color={item.signalWord === '위험' ? 'error' : 'warning'} variant="outlined" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {/* Mobile Cards */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
          {items.map(item => (
            <Paper key={item.id} variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1, flexWrap: 'wrap' }}>
                <Chip label={getHazardLabel(item.hazardClass)} size="small" color="warning" variant="outlined" />
                <Box sx={{ flex: 1 }} />
                <Chip label={item.signalWord || ''} size="small" color={item.signalWord === '위험' ? 'error' : 'warning'} variant="outlined" />
              </Box>
              <Typography fontWeight="bold" color="primary" sx={{ mb: 0.25 }}>{item.chemicalNameKo}</Typography>
              {item.chemicalNameEn && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>{item.chemicalNameEn}</Typography>}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {item.casNumber && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 70 }}>{t('chem.casNumber')}</Typography>
                    <Typography variant="body2" fontFamily="monospace">{item.casNumber}</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 70 }}>{t('chem.quantity')}</Typography>
                  <Typography variant="body2" fontFamily="monospace">{item.storageQuantity} {item.unit}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 70 }}>{t('chem.department')}</Typography>
                  <Typography variant="body2">{item.department || ''}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 70 }}>{t('chem.handler')}</Typography>
                  <Typography variant="body2">{item.handler || ''}</Typography>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      </Paper>
    </Box>
  )
}

export default ChemicalUsageTab
