import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Box, Typography, Paper, Grid, Chip, Card, CardContent,
  CircularProgress, LinearProgress, Stack, Divider,
} from '@mui/material'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import GavelIcon from '@mui/icons-material/Gavel'
import RuleIcon from '@mui/icons-material/Rule'
import axiosInstance from '../../api/axiosInstance'
import { ApiResponse, PageResponse } from '../../types/common.types'
import { WemPlan, WemResult, WemImprovement } from '../../types/workEnvMeasurement.types'

const fetchAll = async <T,>(url: string): Promise<T[]> => {
  const res = await axiosInstance.get<ApiResponse<PageResponse<T>>>(`${url}?page=0&size=1000`)
  return res.data.data.content || []
}

const dayDiff = (dateStr?: string | null) => {
  if (!dateStr) return null
  const target = new Date(dateStr).getTime()
  const today = new Date().setHours(0, 0, 0, 0)
  return Math.floor((target - today) / (1000 * 60 * 60 * 24))
}

const computeGrade = (exceedRate?: number | null): string => {
  const r = exceedRate ?? 0
  if (r <= 10) return 'Ⅰ'
  if (r <= 50) return 'Ⅱ'
  if (r <= 100) return 'Ⅲ'
  return 'Ⅳ'
}

const WemDashboardTab: React.FC = () => {
  const { data: plans = [] } = useQuery({
    queryKey: ['wemDashboardPlans'],
    queryFn: () => fetchAll<WemPlan>('/wem-plans'),
  })
  const { data: results = [] } = useQuery({
    queryKey: ['wemDashboardResults'],
    queryFn: () => fetchAll<WemResult>('/wem-results'),
  })
  const { data: improvements = [] } = useQuery({
    queryKey: ['wemDashboardImprovements'],
    queryFn: () => fetchAll<WemImprovement>('/wem-improvements'),
  })

  const stats = useMemo(() => {
    const totalSites = new Set(plans.map(p => p.processName)).size
    const overduePlans = plans.filter(p => {
      const d = dayDiff(p.nextMeasurementDate)
      return d !== null && d < 0
    }).length
    const upcomingPlans = plans.filter(p => {
      const d = dayDiff(p.nextMeasurementDate)
      return d !== null && d >= 0 && d <= 7
    }).length
    const exceedResults = results.filter(r => (r.exceedRate ?? 0) > 100).length
    const improvementsTotal = improvements.length
    const improvementsCompleted = improvements.filter(i => i.status === 'COMPLETED' || i.status === '완료').length

    const score = totalSites === 0 ? 100
      : Math.round(Math.max(0, 100 - overduePlans * 5 - exceedResults * 8))

    return {
      totalSites, overduePlans, upcomingPlans, exceedResults,
      improvementsTotal, improvementsCompleted, score,
    }
  }, [plans, results, improvements])

  const urgentItems = useMemo(() => {
    const items: Array<{ key: string; severity: 'danger' | 'warn'; title: string; sub: string; tail: string; tailLabel: string }> = []
    results.filter(r => (r.exceedRate ?? 0) > 100).slice(0, 3).forEach(r => {
      items.push({
        key: `r-${r.id}`,
        severity: 'danger',
        title: `${r.processName} ${r.factorName} 노출기준 초과`,
        sub: `측정값 ${r.measuredValue || ''} / 기준 ${r.exposureStandard || ''} · 초과율 ${r.exceedRate}%`,
        tail: '즉시',
        tailLabel: '조치 필요',
      })
    })
    plans.forEach(p => {
      const d = dayDiff(p.nextMeasurementDate)
      if (d !== null && d < 0 && items.length < 5) {
        items.push({
          key: `p-${p.id}`,
          severity: 'warn',
          title: `${p.processName} 측정 기한 초과`,
          sub: `최종측정 ${p.lastMeasurementDate || ''} · 주기 ${p.measurementCycle || ''}`,
          tail: '즉시',
          tailLabel: '측정 필요',
        })
      }
    })
    plans.forEach(p => {
      const d = dayDiff(p.nextMeasurementDate)
      if (d !== null && d >= 0 && d <= 7 && items.length < 6) {
        items.push({
          key: `pu-${p.id}`,
          severity: 'warn',
          title: `${p.processName} 측정 기한 임박`,
          sub: `다음 측정일 ${p.nextMeasurementDate} · ${p.hazardType || ''}`,
          tail: `D-${d}`,
          tailLabel: '측정 마감',
        })
      }
    })
    return items
  }, [plans, results])

  const gradeDist = useMemo(() => {
    const byProcess = new Map<string, number>()
    results.forEach(r => {
      const prev = byProcess.get(r.processName) ?? -1
      const rate = r.exceedRate ?? 0
      if (rate > prev) byProcess.set(r.processName, rate)
    })
    return Array.from(byProcess.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, rate]) => ({ name, rate, grade: computeGrade(rate) }))
  }, [results])

  const compliancePct = stats.score
  const complianceColor: 'success' | 'warning' | 'error' =
    compliancePct >= 90 ? 'success' : compliancePct >= 70 ? 'warning' : 'error'

  return (
    <Box>
      {/* 컴플라이언스 점수 */}
      <Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress
              variant="determinate"
              value={compliancePct}
              size={120}
              thickness={5}
              color={complianceColor}
            />
            <Box sx={{
              position: 'absolute', top: 0, left: 0, bottom: 0, right: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column',
            }}>
              <Typography variant="h4" fontWeight={700}>
                {compliancePct}
                <Typography component="span" variant="caption" sx={{ ml: 0.3 }}>%</Typography>
              </Typography>
              <Typography variant="caption" color="text.secondary">컴플라이언스 점수</Typography>
            </Box>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary">2026년 상반기 법적 컴플라이언스 현황</Typography>
            <Typography variant="h6" fontWeight={700}>
              {compliancePct >= 90 ? '양호' : compliancePct >= 70 ? '대체로 양호 · 일부 시정 필요' : '시정 조치 필요'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              총 {stats.totalSites}개 단위작업장소 중 {stats.overduePlans}개소 측정 기한 초과,
              {' '}{stats.exceedResults}건 노출기준 초과
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* KPI */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="caption" color="text.secondary">측정 대상</Typography>
              <Typography variant="h4" fontWeight={700} sx={{ mt: 0.5 }}>
                {stats.totalSites}<Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>개소</Typography>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="caption" color="text.secondary">기한 초과</Typography>
              <Typography variant="h4" fontWeight={700} color="error" sx={{ mt: 0.5 }}>
                {stats.overduePlans}<Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>개소</Typography>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="caption" color="text.secondary">노출기준 초과</Typography>
              <Typography variant="h4" fontWeight={700} color="warning.main" sx={{ mt: 0.5 }}>
                {stats.exceedResults}<Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>건</Typography>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="caption" color="text.secondary">개선조치</Typography>
              <Typography variant="h4" fontWeight={700} sx={{ mt: 0.5 }}>
                {stats.improvementsCompleted}<Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>/{stats.improvementsTotal}</Typography>
              </Typography>
              {stats.improvementsTotal > 0 && (
                <LinearProgress
                  variant="determinate"
                  value={(stats.improvementsCompleted / stats.improvementsTotal) * 100}
                  sx={{ mt: 1, height: 4, borderRadius: 2 }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 즉시 조치 필요 */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            즉시 조치 필요 ({urgentItems.length}건)
          </Typography>
        </Stack>
        {urgentItems.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
            현재 즉시 조치 필요 항목이 없습니다.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {urgentItems.map(it => (
              <Box key={it.key} sx={{
                display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
                border: 1, borderColor: 'divider', borderRadius: 1,
                bgcolor: it.severity === 'danger' ? 'error.lighter' : 'warning.lighter',
              }}>
                <Box sx={{
                  width: 40, height: 40, borderRadius: 1.25,
                  display: 'grid', placeItems: 'center',
                  bgcolor: it.severity === 'danger' ? 'error.light' : 'warning.light',
                  color: it.severity === 'danger' ? 'error.dark' : 'warning.dark',
                }}>
                  {it.severity === 'danger' ? <WarningAmberIcon /> : <AccessTimeIcon />}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600}>{it.title}</Typography>
                  <Typography variant="caption" color="text.secondary">{it.sub}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                  <Typography variant="body2" fontWeight={700}
                    color={it.severity === 'danger' ? 'error.main' : 'warning.main'}>{it.tail}</Typography>
                  <Typography variant="caption" color="text.secondary">{it.tailLabel}</Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        )}
      </Paper>

      {/* 단위작업장소별 노출 등급 */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
          단위작업장소별 노출 등급 분포
        </Typography>
        {gradeDist.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
            측정 결과가 없습니다.
          </Typography>
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 140, mt: 1 }}>
              {gradeDist.map(g => {
                const h = Math.min(100, Math.max(15, g.rate))
                const color = g.grade === 'Ⅳ' ? 'error.main' : g.grade === 'Ⅲ' ? 'warning.dark' : g.grade === 'Ⅱ' ? 'warning.main' : 'success.main'
                return (
                  <Box key={g.name} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: '100%', display: 'flex', alignItems: 'flex-end', height: 100 }}>
                      <Box sx={{ width: '100%', height: `${h}%`, bgcolor: color, borderRadius: '4px 4px 0 0', minHeight: 10 }} />
                    </Box>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                      {g.name.length > 6 ? g.name.substring(0, 6) : g.name}
                    </Typography>
                  </Box>
                )
              })}
            </Box>
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 1.5, flexWrap: 'wrap' }}>
              <Chip size="small" label="Ⅰ ≤10%" color="success" variant="outlined" />
              <Chip size="small" label="Ⅱ ≤50%" color="warning" variant="outlined" />
              <Chip size="small" label="Ⅲ ≤100%" color="warning" />
              <Chip size="small" label="Ⅳ >100%" color="error" />
            </Stack>
          </>
        )}
      </Paper>

      {/* 법적 근거 */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
          법적 근거
        </Typography>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <Box sx={{ p: 1, bgcolor: 'primary.light', color: 'primary.dark', borderRadius: 1 }}><GavelIcon fontSize="small" /></Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight={700}>산업안전보건법 제125조 — 작업환경측정 의무</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                사업주는 유해인자로부터 근로자의 건강을 보호하기 위해 인체에 해로운 작업을 하는 작업장에 대하여 작업환경측정을 하여야 하며, 결과를 기록·보존하고 근로자에게 알려야 한다.
              </Typography>
            </Box>
          </Stack>
          <Divider />
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <Box sx={{ p: 1, bgcolor: 'primary.light', color: 'primary.dark', borderRadius: 1 }}><RuleIcon fontSize="small" /></Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight={700}>시행규칙 제186조 — 측정 주기</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                정기측정 6개월 1회 이상. 발암성 인자·노출기준 2배 초과 시 3개월 1회. 신규·변경 작업은 작업개시 후 30일 이내 첫 측정.
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  )
}

export default WemDashboardTab
