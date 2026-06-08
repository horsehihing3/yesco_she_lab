import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Chip, CircularProgress, Alert, Grid,
} from '@mui/material'
import { psmApi } from '../../api/psmApi'
import type { PsmHazop, PsmHazopItem } from '../../types/psm.types'

const LIKELIHOOD: Record<string, number> = { '낮음': 2, '중간': 3, '높음': 4 }
const SEVERITY: Record<string, number> = { '낮음': 2, '중간': 3, '높음': 4 }

const cellColor = (l: number, s: number) => {
  const r = l * s
  if (r >= 9) return 'rgba(239,68,68,.72)'
  if (r >= 5) return 'rgba(245,158,11,.72)'
  return 'rgba(34,197,94,.55)'
}
const gradeLabel = (r: number) => r >= 9 ? '고위험' : r >= 5 ? '중위험' : '저위험'
const gradeColor = (r: number): 'error' | 'warning' | 'success' => r >= 9 ? 'error' : r >= 5 ? 'warning' : 'success'

interface RiskItem {
  source: string  // 'HAZOP HZ-2026-012 #1'
  label: string   // deviation
  l: number
  s: number
  hazopNo: string
  itemNo?: number
}

const PsmMatrixTab: React.FC = () => {
  const { t } = useTranslation()
  const { data: hazopList, isLoading } = useQuery({ queryKey: ['psm-hazop'], queryFn: () => psmApi.listHazop(0, 200) })

  // 각 HAZOP의 items까지 detail로 조회
  const ids = (hazopList?.content || []).map(h => h.id)
  const details = useQuery({
    queryKey: ['psm-hazop-details', ids],
    queryFn: async () => {
      const results = await Promise.all(ids.map(id => psmApi.getHazop(id)))
      return results
    },
    enabled: ids.length > 0,
  })

  const items = useMemo<RiskItem[]>(() => {
    if (!details.data) return []
    const arr: RiskItem[] = []
    details.data.forEach((h: PsmHazop) => {
      (h.items || []).forEach((it: PsmHazopItem) => {
        const l = LIKELIHOOD[it.likelihood || '낮음'] ?? 2
        const s = SEVERITY[it.severity || '낮음'] ?? 2
        // 1~5 스케일로 맞춤
        arr.push({
          source: `${h.hazopNo} #${it.itemNo}`,
          label: it.deviation || '',
          l: Math.min(5, Math.max(1, l)),
          s: Math.min(5, Math.max(1, s)),
          hazopNo: h.hazopNo,
          itemNo: it.itemNo,
        })
      })
    })
    return arr
  }, [details.data])

  if (isLoading || details.isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
  }
  if (items.length === 0) {
    return <Alert severity="info">{t('common.noData', 'HAZOP 데이터가 없습니다. HAZOP 탭에서 먼저 워크시트를 작성해 주세요.')}</Alert>
  }

  // 5x5 grid: rows = S (5 top → 1 bottom), cols = L (1 left → 5 right)
  const grid: Record<string, RiskItem[]> = {}
  items.forEach(it => {
    const key = `${it.l}-${it.s}`
    if (!grid[key]) grid[key] = []
    grid[key].push(it)
  })

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>{t('psmMatrixTab.section1', '위험성 매트릭스 (5×5)')}</Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '40px repeat(5, 1fr)', gridTemplateRows: 'repeat(5, 56px) 32px', gap: 0.5 }}>
              {/* 5x5 cells: S desc 5→1, L asc 1→5 */}
              {([5, 4, 3, 2, 1] as const).map(s => (
                <>
                  <Box key={`label-s-${s}`} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', pr: 1, fontSize: '0.8rem', color: 'text.secondary', fontFamily: 'monospace' }}>S{s}</Box>
                  {([1, 2, 3, 4, 5] as const).map(l => {
                    const its = grid[`${l}-${s}`] || []
                    const rv = l * s
                    return (
                      <Box key={`cell-${l}-${s}`} title={its.map(x => `${x.source}: ${x.label}`).join('\n') || `L${l}×S${s}=${rv}`}
                        sx={{ background: cellColor(l, s), borderRadius: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 0.25, p: 0.5, color: '#fff', position: 'relative' }}>
                        {its.slice(0, 6).map((_, i) => (
                          <Box key={i} sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.95)' }} />
                        ))}
                        <Typography sx={{ position: 'absolute', top: 2, right: 4, fontSize: '0.7rem', fontWeight: 700 }}>{rv}</Typography>
                      </Box>
                    )
                  })}
                </>
              ))}
              {/* L축 라벨 */}
              <Box></Box>
              {[1, 2, 3, 4, 5].map(l => (
                <Box key={`label-l-${l}`} sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', pt: 0.5, fontSize: '0.8rem', color: 'text.secondary', fontFamily: 'monospace' }}>L{l}</Box>
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: '#EF4444' }} /><Typography variant="caption">고위험 (9이상)</Typography></Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: '#F59E0B' }} /><Typography variant="caption">중위험 (5~8)</Typography></Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: '#22C55E' }} /><Typography variant="caption">저위험 (1~4)</Typography></Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper variant="outlined">
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>출처</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>이탈</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: 50 }} align="center">L</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: 50 }} align="center">S</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: 70 }} align="center">위험도</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((it, idx) => {
                    const r = it.l * it.s
                    return (
                      <TableRow key={idx} hover>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{it.source}</TableCell>
                        <TableCell sx={{ fontSize: '0.85rem' }}>{it.label}</TableCell>
                        <TableCell align="center">{it.l}</TableCell>
                        <TableCell align="center">{it.s}</TableCell>
                        <TableCell align="center"><Chip size="small" label={`${r} (${gradeLabel(r)})`} color={gradeColor(r)} /></TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default PsmMatrixTab
