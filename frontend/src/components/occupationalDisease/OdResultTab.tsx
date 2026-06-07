import { useQuery } from '@tanstack/react-query'
import {
  Box, Grid, Paper, Chip, CircularProgress, Typography,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, LinearProgress,
} from '@mui/material'
import { planApi, odStatsApi, workerApi } from '../../api/occupationalDiseaseApi'
import StatCard from '../legalCompliance/StatCard'

const halfColor = (h: string): 'primary' | 'secondary' | 'warning' | 'default' => {
  switch (h) { case '상반기': return 'primary'; case '하반기': return 'secondary'; case '수시': return 'warning'; default: return 'default' }
}
const statusColor = (s: string): 'success' | 'info' | 'warning' | 'error' | 'default' => {
  switch (s) { case '완료': return 'success'; case '계획': return 'info'; case '진행중': return 'warning'; case '취소': return 'error'; default: return 'default' }
}

const OdResultTab: React.FC = () => {
  const { data: plans = [], isLoading } = useQuery({ queryKey: ['odPlans'], queryFn: planApi.list })
  const { data: workers = [] } = useQuery({ queryKey: ['odWorkers'], queryFn: workerApi.list })
  const { data: stats } = useQuery({ queryKey: ['odStats'], queryFn: odStatsApi.get })

  const totalTargets = plans.reduce((s, p) => s + (p.targetCount || 0), 0)
  const completedPlans = plans.filter(p => p.status === '완료')
  const completedTargets = completedPlans.reduce((s, p) => s + (p.targetCount || 0), 0)
  const cd = (stats?.workerCCount ?? 0) + (stats?.workerD1Count ?? 0) + (stats?.workerD2Count ?? 0)
  const cdRate = (stats?.workerCompletedCount ?? 0) > 0 ? Math.round(cd / (stats?.workerCompletedCount ?? 1) * 1000) / 10 : 0

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={2.4}><StatCard color="blue"   value={completedPlans.length}             label="검진 완료 회차" /></Grid>
        <Grid item xs={6} sm={2.4}><StatCard color="green"  value={completedTargets}                  label="누적 완료 인원" sub={`${plans.filter(p => p.half).map(p => p.half).filter((v, i, a) => a.indexOf(v) === i).join(' · ')}`} /></Grid>
        <Grid item xs={6} sm={2.4}><StatCard color="yellow" value={cd}                                 label="C·D 판정자" sub={`이상소견율 ${cdRate}%`} /></Grid>
        <Grid item xs={6} sm={2.4}><StatCard color="red"    value={stats?.workerD1Count ?? 0}        label="D1 직업병" /></Grid>
        <Grid item xs={6} sm={2.4}><StatCard color="purple" value={totalTargets}                       label="계획 누계 인원" /></Grid>
      </Grid>

      {isLoading ? <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box> : (
        <>
        {/* PC 테이블 */}
        <Paper variant="outlined" sx={{ display: { xs: 'none', md: 'block' } }}>
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell align="center">구분</TableCell><TableCell>검진기관</TableCell><TableCell align="center">검진방법</TableCell>
                <TableCell align="center">검진기간</TableCell><TableCell align="right">대상</TableCell>
                <TableCell align="right">완료</TableCell><TableCell align="center">완료율</TableCell>
                <TableCell>유해인자</TableCell><TableCell align="center">담당자</TableCell><TableCell align="center">상태</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {plans.map(p => {
                  const completed = workers.filter(w => w.examOrg && p.orgName.includes(w.examOrg.split(' ')[0])).length
                  const rate = p.targetCount > 0 ? Math.round(completed / p.targetCount * 100) : 0
                  return (
                    <TableRow key={p.id} hover>
                      <TableCell align="center"><Chip size="small" label={p.half} color={halfColor(p.half)} /></TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{p.orgName}</TableCell>
                      <TableCell align="center"><Chip size="small" label={p.method} variant="outlined" /></TableCell>
                      <TableCell align="center" sx={{ color: 'text.secondary' }}>{p.startDate} ~ {p.endDate}</TableCell>
                      <TableCell align="right">{p.targetCount}명</TableCell>
                      <TableCell align="right" sx={{ color: 'success.main', fontWeight: 700 }}>{completed}명</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress variant="determinate" value={Math.min(rate, 100)} color={rate >= 90 ? 'success' : rate >= 60 ? 'warning' : 'error'} sx={{ width: 60, height: 5, borderRadius: 1 }} />
                          <Box component="span">{rate}%</Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{p.hazardFactors}</TableCell>
                      <TableCell align="center">{p.mgr}</TableCell>
                      <TableCell align="center"><Chip size="small" label={p.status} color={statusColor(p.status)} /></TableCell>
                    </TableRow>
                  )
                })}
                {plans.length === 0 && <TableRow><TableCell colSpan={10} align="center" sx={{ color: 'text.disabled', py: 6 }}>검진 결과가 없습니다</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* 모바일 카드 */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1 }}>
          {plans.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', color: 'text.disabled' }}>검진 결과가 없습니다</Paper>
          ) : plans.map(p => {
            const completed = workers.filter(w => w.examOrg && p.orgName.includes(w.examOrg.split(' ')[0])).length
            const rate = p.targetCount > 0 ? Math.round(completed / p.targetCount * 100) : 0
            return (
              <Paper key={p.id} variant="outlined" sx={{ p: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.orgName}
                  </Typography>
                  <Chip size="small" label={p.status} color={statusColor(p.status)} />
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 0.5 }}>
                  <Chip size="small" label={p.half} color={halfColor(p.half)} />
                  <Chip size="small" variant="outlined" label={p.method} />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {p.startDate} ~ {p.endDate} · 대상 {p.targetCount}명 / 완료 <Box component="span" sx={{ color: 'success.main', fontWeight: 700 }}>{completed}명</Box>
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Box sx={{ flex: 1 }}>
                    <LinearProgress variant="determinate" value={Math.min(rate, 100)} color={rate >= 90 ? 'success' : rate >= 60 ? 'warning' : 'error'} sx={{ height: 6, borderRadius: 1 }} />
                  </Box>
                  <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'right', fontFamily: 'monospace' }}>{rate}%</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  담당: {p.mgr || '-'} · {p.hazardFactors || '-'}
                </Typography>
              </Paper>
            )
          })}
        </Box>
        </>
      )}
    </Box>
  )
}

export default OdResultTab
