import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Box, Paper, Typography, Grid, FormControl, Select, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, LinearProgress, Chip,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import axiosInstance from '../../api/axiosInstance'
import { HealthCheckupPlan } from '../../types/healthCheckupPlan.types'
import { ApiResponse, PageResponse } from '../../types/common.types'
import useCodeMap from '../../hooks/useCodeMap'

interface Props {
  allowedTypes: string[]
}

const TYPE_COLORS: Record<string, string> = {
  GENERAL: '#3b82f6',
  SPECIAL: '#0ea5e9',
  OCCUPATIONAL: '#ef4444',
}

const STATUS_COLORS: Record<string, 'default' | 'warning' | 'success' | 'error'> = {
  PLANNED: 'default',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'error',
}

const fetchAll = async (allowedTypes: string[], year: number): Promise<HealthCheckupPlan[]> => {
  const params = new URLSearchParams()
  params.set('page', '0')
  params.set('size', '500')
  params.set('planYear', String(year))
  if (allowedTypes.length === 1) params.set('checkupType', allowedTypes[0])
  const res = await axiosInstance.get<ApiResponse<PageResponse<HealthCheckupPlan>>>(
    `/health-checkup-plan?${params.toString()}`,
  )
  // 다중 타입 지원이 백엔드에 없으므로 클라이언트에서 필터
  return (res.data.data.content || []).filter(p => allowedTypes.includes(p.checkupType))
}

const HealthCheckupStatusTab: React.FC<Props> = ({ allowedTypes }) => {
  const { t } = useTranslation()
  const { getLabel: getTypeLabel } = useCodeMap('HEALTH_CHECKUP_TYPE')
  const { getLabel: getStatusLabel } = useCodeMap('HEALTH_CHECKUP_PLAN_STATUS')
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState<number>(currentYear)

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['healthCheckupStatus', allowedTypes.join(','), year],
    queryFn: () => fetchAll(allowedTypes, year),
  })

  const summary = useMemo(() => {
    const totalTarget = plans.reduce((s, p) => s + (p.targetCount || 0), 0)
    const totalCompleted = plans.reduce((s, p) => s + (p.completedCount || 0), 0)
    const rate = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0
    const planCount = plans.length
    const completedPlanCount = plans.filter(p => p.status === 'COMPLETED').length
    return { totalTarget, totalCompleted, rate, planCount, completedPlanCount }
  }, [plans])

  const byType = useMemo(() => {
    const map: Record<string, { target: number; completed: number; count: number }> = {}
    plans.forEach(p => {
      if (!map[p.checkupType]) map[p.checkupType] = { target: 0, completed: 0, count: 0 }
      map[p.checkupType].target += p.targetCount || 0
      map[p.checkupType].completed += p.completedCount || 0
      map[p.checkupType].count += 1
    })
    return Object.entries(map)
  }, [plans])

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography variant="body2">{t('common.year', '연도')}:</Typography>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <Select value={String(year)} onChange={(e) => setYear(parseInt(e.target.value, 10))} displayEmpty>
            <MenuItem value="" disabled>선택하세요</MenuItem>
            {[currentYear, currentYear - 1, currentYear - 2].map(y => (
              <MenuItem key={y} value={String(y)}>{y}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: t('healthCheckupStatus.totalPlans', '총 계획 수'),     value: summary.planCount,        color: '#6366f1' },
          { label: t('healthCheckupStatus.completedPlans', '완료 계획'),  value: summary.completedPlanCount, color: '#22c55e' },
          { label: t('healthCheckupStatus.totalTarget', '대상 인원 합계'), value: summary.totalTarget,      color: '#3b82f6' },
          { label: t('healthCheckupStatus.totalRate', '전체 수검률'),      value: `${summary.rate}%`,        color: '#f59e0b' },
        ].map((c, i) => (
          <Grid item xs={6} md={3} key={i}>
            <Paper sx={{ p: 2, borderLeft: 4, borderColor: c.color, borderLeftColor: c.color}}>
              <Typography variant="caption" color="text.secondary">{c.label}</Typography>
              <Typography variant="h5" fontWeight="bold">{c.value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* 종류별 진행률 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
          {t('healthCheckupStatus.byType', '검진 종류별 진행률')}
        </Typography>
        {byType.length === 0 ? (
          <Typography variant="body2" color="text.secondary">{t('common.noData', '데이터가 없습니다')}</Typography>
        ) : (
          byType.map(([type, v]) => {
            const rate = v.target > 0 ? Math.round((v.completed / v.target) * 100) : 0
            return (
              <Box key={type} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: TYPE_COLORS[type] }}>
                    {getTypeLabel(type) || type} ({v.count})
                  </Typography>
                  <Typography variant="body2">{v.completed} / {v.target} ({rate}%)</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={rate}
                  sx={{
                    height: 10, borderRadius: 1,
                    '& .MuiLinearProgress-bar': { backgroundColor: TYPE_COLORS[type] },
                  }}
                />
              </Box>
            )
          })
        )}
      </Paper>

      {/* 계획별 상세 테이블 */}
      <Paper sx={{ p: 0 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : (
          <>
          {/* PC 테이블 */}
          <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">{t('healthCheckupPlan.checkupType', '종류')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('healthCheckupPlan.planName', '계획명')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">{t('healthCheckupPlan.targetDept', '대상부서')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">{t('healthCheckupStatus.progress', '진행률')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">{t('healthCheckupPlan.status', '상태')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {plans.length === 0 ? (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}>{t('common.noData', '데이터가 없습니다')}</TableCell></TableRow>
                ) : plans.map(p => {
                  const rate = (p.targetCount || 0) > 0 ? Math.round(((p.completedCount || 0) / p.targetCount) * 100) : 0
                  return (
                    <TableRow key={p.id} hover>
                      <TableCell align="center">{getTypeLabel(p.checkupType) || p.checkupType}</TableCell>
                      <TableCell>{p.planName}</TableCell>
                      <TableCell align="center">{p.targetDept || ''}</TableCell>
                      <TableCell sx={{ minWidth: 180 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ flex: 1 }}>
                            <LinearProgress variant="determinate" value={rate}
                              sx={{ height: 8, borderRadius: 1,
                                '& .MuiLinearProgress-bar': { backgroundColor: TYPE_COLORS[p.checkupType] || '#6366f1' } }}/>
                          </Box>
                          <Typography variant="caption" sx={{ minWidth: 70, textAlign: 'right' }}>
                            {p.completedCount}/{p.targetCount} ({rate}%)
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={getStatusLabel(p.status) || p.status} color={STATUS_COLORS[p.status] || 'default'} size="small"/>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* 모바일 카드 */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, p: 1.5 }}>
            {plans.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>{t('common.noData', '데이터가 없습니다')}</Typography>
            ) : plans.map(p => {
              const rate = (p.targetCount || 0) > 0 ? Math.round(((p.completedCount || 0) / p.targetCount) * 100) : 0
              return (
                <Paper key={p.id} variant="outlined" sx={{ p: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.planName}
                    </Typography>
                    <Chip size="small" label={getStatusLabel(p.status) || p.status} color={STATUS_COLORS[p.status] || 'default'} />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    {getTypeLabel(p.checkupType) || p.checkupType} · {p.targetDept || '-'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <LinearProgress variant="determinate" value={rate}
                        sx={{ height: 8, borderRadius: 1,
                          '& .MuiLinearProgress-bar': { backgroundColor: TYPE_COLORS[p.checkupType] || '#6366f1' } }}/>
                    </Box>
                    <Typography variant="caption" sx={{ minWidth: 80, textAlign: 'right', fontFamily: 'monospace' }}>
                      {p.completedCount}/{p.targetCount} ({rate}%)
                    </Typography>
                  </Box>
                </Paper>
              )
            })}
          </Box>
          </>
        )}
      </Paper>
    </Box>
  )
}

export default HealthCheckupStatusTab
