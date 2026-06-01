import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Box, Grid, Paper, Typography, CircularProgress, Chip, LinearProgress,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material'
import { equipmentApi } from '../../api/legalFacilityApi'
import StatCard from '../legalCompliance/StatCard'

const computeDday = (d?: string): number | null => {
  if (!d) return null
  return Math.floor((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

const ddayColor = (d: number | null): 'success' | 'warning' | 'error' | 'default' => {
  if (d === null) return 'default'
  if (d < 0) return 'error'
  if (d <= 30) return 'warning'
  return 'success'
}

const statusColor = (s: string): 'success' | 'warning' | 'error' | 'default' => {
  switch (s) { case '정상': return 'success'; case '임박': return 'warning'; case '만료': return 'error'; default: return 'default' }
}

const FacilityStatusTab: React.FC = () => {
  const { data: items = [], isLoading } = useQuery({ queryKey: ['facilityEquipments'], queryFn: equipmentApi.list })
  const { data: stats } = useQuery({ queryKey: ['facilityEquipmentsStats'], queryFn: equipmentApi.stats })

  // 분류별 준수율
  const byCategory = useMemo(() => {
    const m: Record<string, { total: number; ok: number }> = {}
    items.forEach(e => {
      const k = e.category || '기타'
      if (!m[k]) m[k] = { total: 0, ok: 0 }
      m[k].total += 1
      if (e.status === '정상') m[k].ok += 1
    })
    return Object.entries(m).map(([cat, v]) => ({ cat, total: v.total, ok: v.ok, pct: Math.round(v.ok / v.total * 100) }))
  }, [items])

  // 위치별 현황
  const byLocation = useMemo(() => {
    const m: Record<string, { total: number; ok: number; warn: number; exp: number }> = {}
    items.forEach(e => {
      const k = e.location || '기타'
      if (!m[k]) m[k] = { total: 0, ok: 0, warn: 0, exp: 0 }
      m[k].total += 1
      if (e.status === '정상') m[k].ok += 1
      else if (e.status === '임박') m[k].warn += 1
      else if (e.status === '만료') m[k].exp += 1
    })
    return Object.entries(m).map(([loc, v]) => ({ loc, ...v }))
  }, [items])

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={2.4}><StatCard color="yellow" value={stats?.totalCount ?? 0}        label="전체 관리 기구" sub="등록 대장 기준" /></Grid>
        <Grid item xs={6} sm={2.4}><StatCard color="blue"   value={`${stats?.complianceRate ?? 0}%`} label="전체 준수율"   sub={`정상 ${stats?.okCount ?? 0}/${stats?.totalCount ?? 0}`} /></Grid>
        <Grid item xs={6} sm={2.4}><StatCard color="green"  value={byCategory.length}            label="분류 종류"     sub="압력·크레인·화학 등" /></Grid>
        <Grid item xs={6} sm={2.4}><StatCard color="red"    value={stats?.expiredCount ?? 0}     label="만료 건수"     sub="즉시 조치 필요" /></Grid>
        <Grid item xs={6} sm={2.4}><StatCard color="purple" value={stats?.nearCount ?? 0}        label="D-30 임박"      sub="사전 일정 수립" /></Grid>
      </Grid>

      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1, mt: 2 }}>분류별 검사 준수율</Typography>
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        {byCategory.map(c => (
          <Grid item xs={6} sm={4} md={2} key={c.cat}>
            <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
              <Box sx={{ position: 'relative', width: 60, height: 60, mx: 'auto', mb: 1, lineHeight: 0 }}>
                <CircularProgress variant="determinate" value={100} size={60} thickness={5}
                  sx={{ color: 'action.hover', position: 'absolute', top: 0, left: 0, display: 'block' }} />
                <CircularProgress variant="determinate" value={c.pct} size={60} thickness={5}
                  sx={{ color: c.pct >= 80 ? 'success.main' : c.pct >= 50 ? 'warning.main' : 'error.main',
                        position: 'absolute', top: 0, left: 0, display: 'block' }} />
                <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700 }}>{c.pct}%</Box>
              </Box>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>{c.cat}</Typography>
              <Typography variant="caption" display="block" color="text.disabled">{c.ok}/{c.total}기 정상</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1, mt: 2 }}>설치위치별 기구 현황</Typography>
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        {byLocation.map(l => {
          const pct = Math.round(l.ok / l.total * 100)
          return (
            <Grid item xs={12} sm={6} md={4} key={l.loc}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box>
                    <Typography fontWeight={700}>{l.loc}</Typography>
                    <Typography variant="caption" color="text.secondary">{l.total}기 등록 · 준수율 {pct}%</Typography>
                  </Box>
                  <Chip size="small" label={pct >= 80 ? '양호' : pct >= 50 ? '주의' : '위험'}
                    color={pct >= 80 ? 'success' : pct >= 50 ? 'warning' : 'error'} />
                </Box>
                <LinearProgress variant="determinate" value={pct}
                  color={pct >= 80 ? 'success' : pct >= 50 ? 'warning' : 'error'}
                  sx={{ height: 6, borderRadius: 1, mb: 1 }} />
                <Grid container spacing={1} sx={{ pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Grid item xs={6}><Typography variant="caption" color="text.disabled">정상</Typography><Typography color="success.main" fontWeight={600}>{l.ok}기</Typography></Grid>
                  <Grid item xs={6}><Typography variant="caption" color="text.disabled">만료</Typography><Typography color="error.main" fontWeight={600}>{l.exp}기</Typography></Grid>
                  <Grid item xs={6}><Typography variant="caption" color="text.disabled">임박(D-30)</Typography><Typography color="warning.main" fontWeight={600}>{l.warn}기</Typography></Grid>
                  <Grid item xs={6}><Typography variant="caption" color="text.disabled">전체</Typography><Typography fontWeight={600}>{l.total}기</Typography></Grid>
                </Grid>
              </Paper>
            </Grid>
          )
        })}
      </Grid>

      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1, mt: 2 }}>전체 현황 리스트</Typography>
      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>관리번호</TableCell>
                <TableCell>기구 명칭</TableCell>
                <TableCell>분류</TableCell>
                <TableCell>설치위치</TableCell>
                <TableCell align="center">주기</TableCell>
                <TableCell>최근검사</TableCell>
                <TableCell>다음검사</TableCell>
                <TableCell>D-Day</TableCell>
                <TableCell>상태</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map(e => {
                const d = computeDday(e.nextInspectDate)
                return (
                  <TableRow key={e.id} hover>
                    <TableCell sx={{ color: 'info.main' }}>{e.mgmtNo}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{e.name}</TableCell>
                    <TableCell><Chip size="small" label={e.category} variant="outlined" /></TableCell>
                    <TableCell>{e.location}</TableCell>
                    <TableCell align="center">{e.inspectPeriod}</TableCell>
                    <TableCell>{e.lastInspectDate}</TableCell>
                    <TableCell>{e.nextInspectDate}</TableCell>
                    <TableCell>{d !== null && <Chip size="small" label={d >= 0 ? `D-${d}` : `D+${Math.abs(d)}`} color={ddayColor(d) === 'default' ? undefined : ddayColor(d)} />}</TableCell>
                    <TableCell><Chip size="small" label={e.status} color={statusColor(e.status)} /></TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  )
}

export default FacilityStatusTab
