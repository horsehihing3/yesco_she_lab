import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Box, Grid, Paper, Typography, CircularProgress } from '@mui/material'
import { dpMgmtStatsApi } from '../../api/diseasePreventionMgmtApi'
import StatCard from '../legalCompliance/StatCard'

const ANNUAL_CALENDAR: Record<number, string[]> = {
  1:  ['보건계획 수립', '한랭 대응'],
  2:  ['일반건강진단', '특수건강진단'],
  3:  ['특수건강진단', '작업환경측정', '온실가스 명세서'],
  4:  ['측정결과 보고', 'KOSS-26 평가', 'PRTR'],
  5:  ['보건교육', '근골격계 조사', '폭염 대응 시작'],
  6:  ['뇌심혈관 평가', '상반기 결산'],
  7:  ['청력보존', '폭염 대응'],
  8:  ['Fit Test', '폭염 대응'],
  9:  ['하반기 측정', '폭염 대응 종료'],
  10: ['측정·인플루엔자'],
  11: ['결핵검진', '한랭 대응 시작'],
  12: ['연간 결산', '차년도 계획'],
}

const PROGRAM_LIST = [
  { tab: 1, color: 'purple' as const, name: '근골격계',     key: 'msd' },
  { tab: 2, color: 'red' as const,    name: '뇌심혈관',     key: 'cvd' },
  { tab: 3, color: 'red' as const,    name: '직무스트레스', key: 'stress' },
  { tab: 4, color: 'blue' as const,   name: '호흡기·피부', key: 'respi' },
  { tab: 5, color: 'blue' as const,   name: '청력보존',     key: 'hearing' },
  { tab: 6, color: 'yellow' as const, name: '온열·한랭',   key: 'thermal' },
  { tab: 7, color: 'green' as const,  name: '감염병',       key: 'infect' },
]

const DpDashboardTab: React.FC<{ onGoTab?: (tab: number) => void }> = ({ onGoTab }) => {
  const { t } = useTranslation()
  const { data: stats, isLoading } = useQuery({ queryKey: ['dpMgmtStats'], queryFn: dpMgmtStatsApi.get })

  if (isLoading) return <Box sx={{ p: 6, textAlign: 'center' }}><CircularProgress /></Box>

  const totalWorkers = (stats?.msdTotal ?? 0) + (stats?.cvdTotal ?? 0) + (stats?.stressTotal ?? 0)
  const highRisk = (stats?.msdHigh ?? 0) + (stats?.cvdHigh ?? 0) + (stats?.stressHigh ?? 0) +
                   (stats?.respiAbnormal ?? 0) + (stats?.hearingD ?? 0)
  const midRisk = (stats?.msdMid ?? 0) + (stats?.cvdMid ?? 0) + (stats?.stressMid ?? 0) +
                  (stats?.respiWatch ?? 0) + (stats?.hearingSts ?? 0)
  const currentMonth = new Date().getMonth() + 1
  const monthEvents = ANNUAL_CALENDAR[currentMonth] || []

  const programCount: Record<string, number> = {
    msd: stats?.msdTotal ?? 0, cvd: stats?.cvdTotal ?? 0, stress: stats?.stressTotal ?? 0,
    respi: stats?.respiTotal ?? 0, hearing: stats?.hearingTotal ?? 0,
    thermal: stats?.thermalTotal ?? 0, infect: stats?.infectTotal ?? 0,
  }
  const programHigh: Record<string, number> = {
    msd: stats?.msdHigh ?? 0, cvd: stats?.cvdHigh ?? 0, stress: stats?.stressHigh ?? 0,
    respi: stats?.respiAbnormal ?? 0, hearing: stats?.hearingD ?? 0,
    thermal: stats?.thermalSevere ?? 0, infect: stats?.infectEvent ?? 0,
  }

  return (
    <Box>
      {/* KPI 5장 */}
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><StatCard color="blue"   value={totalWorkers}     label={t('dpDashboardTab.label1', '관리 대상자')} sub="전체 근로자" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="yellow" value={midRisk}          label={t('dpDashboardTab.label2', '중위험군')} sub="관찰·관리 필요" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="red"    value={highRisk}         label={t('dpDashboardTab.label3', '고위험군')} sub="즉시 개입" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="purple" value={monthEvents.length} label={t('dpDashboardTab.label4', '금월 활동')} sub="예정 프로그램" /></Grid>
      </Grid>

      {/* 7대 프로그램 카드 */}
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>7대 프로그램 현황</Typography>
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        {PROGRAM_LIST.map((p) => (
          <Grid item xs={6} sm={4} md={3} key={p.key}>
            <Paper
              variant="outlined"
              sx={{ p: 2, cursor: 'pointer', transition: 'all 0.15s', '&:hover': { boxShadow: 2, transform: 'translateY(-1px)' } }}
              onClick={() => onGoTab && onGoTab(p.tab)}
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>{p.name}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.5 }}>
                <Typography variant="h5" fontWeight={700} sx={{ fontFamily: 'JetBrains Mono, monospace' }}>{programCount[p.key]}</Typography>
                <Typography variant="caption" color="text.disabled">전체</Typography>
              </Box>
              {programHigh[p.key] > 0 && (
                <Box sx={{ mt: 0.5, fontSize: 11, color: 'error.main', fontWeight: 600 }}>
                  고위험·이슈 {programHigh[p.key]}건
                </Box>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* 연간 캘린더 */}
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>{t('dpDashboardTab.section1', '연간 보건관리 캘린더')}</Typography>
      <Grid container spacing={1}>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
          const evs = ANNUAL_CALENDAR[m] || []
          const isCurrent = m === currentMonth
          return (
            <Grid item xs={6} sm={4} md={2} key={m}>
              <Paper variant="outlined" sx={{
                p: 1.25, textAlign: 'center',
                border: isCurrent ? 2 : 1,
                borderColor: isCurrent ? 'primary.main' : 'divider',
                bgcolor: isCurrent ? 'primary.50' : 'background.paper',
              }}>
                <Typography variant="h6" fontWeight={700} color={isCurrent ? 'primary' : 'text.secondary'}>{m}월</Typography>
                <Box sx={{ mt: 0.75, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {evs.map((ev, i) => (
                    <Box key={i} sx={{ fontSize: 10, bgcolor: 'grey.100', px: 0.75, py: 0.25, borderRadius: 0.5, color: 'text.secondary' }}>{ev}</Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
          )
        })}
      </Grid>
    </Box>
  )
}

export default DpDashboardTab
