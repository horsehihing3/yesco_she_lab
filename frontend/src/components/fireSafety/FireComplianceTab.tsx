import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Grid, Paper, Stack, TextField, MenuItem, Button, Chip, Alert,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, CircularProgress,
  Typography, LinearProgress, Card, CardContent,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningIcon from '@mui/icons-material/Warning'
import { fireComplianceApi, fireReportApi } from '../../api/fireSafetyApi'
import type { FireCompliance, FireReport } from '../../types/fireSafety.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import NumberField from '../common/NumberField'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import DevTestFillButton from '../common/DevTestFillButton'
import { todayStr, daysFromTodayStr } from '../../utils/dateDefaults'
import { useAlert } from '../../contexts/AlertContext'

const REPORT_STATUSES = ['완료', '예정', '계획']

const reportStatusColor = (s?: string): 'success' | 'warning' | 'info' | 'default' =>
  s === '완료' ? 'success' : s === '예정' ? 'warning' : s === '계획' ? 'info' : 'default'

const rateColor = (r: number): 'success' | 'warning' | 'error' =>
  r >= 95 ? 'success' : r >= 75 ? 'warning' : 'error'

const parseItems = (items?: string): { n: string; v: string; ok: boolean }[] => {
  if (!items) return []
  return items.split(';').map(seg => {
    const [n, v, ok] = seg.split('|')
    return { n: n || '', v: v || '', ok: ok === '1' }
  }).filter(i => i.n)
}

const emptyComp: Partial<FireCompliance> = { rate: 0 }
const emptyReport: Partial<FireReport> = { status: '계획' }

const FireComplianceTab: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showConfirm } = useAlert()
  const { data: comps = [], isLoading: l1 } = useQuery({ queryKey: ['fireCompliances'], queryFn: fireComplianceApi.list })
  const { data: reports = [], isLoading: l2 } = useQuery({ queryKey: ['fireReports'], queryFn: fireReportApi.list })

  // Compliance dialog
  const [cOpen, setCOpen] = useState(false)
  const [cEditing, setCEditing] = useState<FireCompliance | null>(null)
  const [cForm, setCForm] = useState<Partial<FireCompliance>>(emptyComp)
  const cCreate = useMutation({
    mutationFn: fireComplianceApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fireCompliances'] }); setCOpen(false) },
  })
  const cUpdate = useMutation({
    mutationFn: ({ id, e }: { id: number; e: Partial<FireCompliance> }) => fireComplianceApi.update(id, e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fireCompliances'] }); setCOpen(false) },
  })
  const cDelete = useMutation({
    mutationFn: fireComplianceApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fireCompliances'] }),
  })

  // Report dialog
  const [rOpen, setROpen] = useState(false)
  const [rEditing, setREditing] = useState<FireReport | null>(null)
  const [rForm, setRForm] = useState<Partial<FireReport>>(emptyReport)
  const rCreate = useMutation({
    mutationFn: fireReportApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fireReports'] }); setROpen(false) },
  })
  const rUpdate = useMutation({
    mutationFn: ({ id, e }: { id: number; e: Partial<FireReport> }) => fireReportApi.update(id, e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fireReports'] }); setROpen(false) },
  })
  const rDelete = useMutation({
    mutationFn: fireReportApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fireReports'] }),
  })

  // DEV ONLY — 비어있는 항목을 법령 준수 도메인 더미데이터로 채움 (입력값은 보존)
  const fillComp = () => setCForm(prev => ({
    ...prev,
    title: prev.title || '소방시설 자체점검 이행',
    lawBasis: prev.lawBasis || '화재예방법 §22, 소방시설법 §22',
    rate: prev.rate ?? 92,
    items: prev.items || '작동기능점검 연1회|2026-04 완료|1;종합정밀점검 연1회|2026-10 예정|0;소방안전관리자 선임|선임 완료|1',
  }))
  const fillReport = () => setRForm(prev => ({
    ...prev,
    reportType: prev.reportType || '소방시설 자체점검 결과 보고',
    lawBasis: prev.lawBasis || '소방시설법 §23',
    deadlineText: prev.deadlineText || '점검 종료일로부터 15일 이내',
    targetOrg: prev.targetOrg || '관할 소방서',
    lastSubmit: prev.lastSubmit || todayStr(),
    nextSubmit: prev.nextSubmit || daysFromTodayStr(365),
    status: prev.status || '계획',
    note: prev.note || '연간 정기 제출 건 (테스트 데이터)',
  }))

  const overallRate = useMemo(() => {
    if (comps.length === 0) return 0
    const avg = comps.reduce((s, c) => s + (c.rate || 0), 0) / comps.length
    return Math.round(avg * 10) / 10
  }, [comps])

  const okCount = comps.filter(c => (c.rate || 0) >= 95).length
  const partCount = comps.filter(c => (c.rate || 0) >= 75 && (c.rate || 0) < 95).length
  const ngCount = comps.filter(c => (c.rate || 0) < 75).length

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={2}><StatCard color="green"  value={`${overallRate}%`} label={t('fireComplianceTab.label1', '전체 준수율')} sub="종합" /></Grid>
        <Grid item xs={6} sm={2}><StatCard color="blue"   value={okCount}    label={t('fireComplianceTab.label2', '이행 완료')} sub="95% 이상" /></Grid>
        <Grid item xs={6} sm={2}><StatCard color="yellow" value={partCount}  label={t('fireComplianceTab.label3', '부분 이행')} sub="75~94%" /></Grid>
        <Grid item xs={6} sm={2}><StatCard color="red"    value={ngCount}    label={t('fireComplianceTab.label4', '미이행')} sub="75% 미만" /></Grid>
        <Grid item xs={6} sm={2}><StatCard color="purple" value={reports.filter(r => r.status === '예정').length} label={t('fireComplianceTab.label5', '제출 예정')} /></Grid>
        <Grid item xs={6} sm={2}><StatCard color="blue"   value={reports.filter(r => r.status === '완료').length} label={t('fireComplianceTab.label6', '제출 완료')} /></Grid>
      </Grid>

      <Alert severity={overallRate >= 95 ? 'success' : overallRate >= 75 ? 'warning' : 'error'} sx={{ mb: 2 }}>
        <strong>법령 준수 종합 평가 {overallRate}% — {overallRate >= 95 ? '우수' : overallRate >= 75 ? '보완 필요' : '미흡'}</strong>
        {' · '}소방시설법·화관법·산안법·물환경보전법 등 {comps.length}개 항목 종합 평가
      </Alert>

      {/* 전체 준수율 바 */}
      <Paper variant="outlined" sx={{ p: 2.5, mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={700}>{t('fireComplianceTab.section1', '전체 법령 준수율')}</Typography>
          <Typography variant="h5" fontWeight={900} color={overallRate >= 95 ? 'success.main' : overallRate >= 75 ? 'warning.main' : 'error.main'}>
            {overallRate}%
          </Typography>
        </Stack>
        <LinearProgress variant="determinate" value={Math.min(overallRate, 100)} color={rateColor(overallRate)} sx={{ height: 10, borderRadius: 1 }} />
      </Paper>

      {/* 준수 항목 카드 */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={700}>{t('fireComplianceTab.section2', '법령 준수 현황')}</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => { setCEditing(null); setCForm(emptyComp); setCOpen(true) }} sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>New</Button>
      </Stack>
      {l1 ? <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box> : (
        <Grid container spacing={1.5} sx={{ mb: 3 }}>
          {comps.map(c => {
            const parsedItems = parseItems(c.items)
            const rate = c.rate || 0
            return (
              <Grid item xs={12} sm={6} md={4} key={c.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                      <Typography variant="subtitle2" fontWeight={700}>{c.title}</Typography>
                      <Chip size="small" label={`${rate}%`} color={rateColor(rate)} sx={{ fontWeight: 700 }} />
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>{c.lawBasis || '-'}</Typography>
                    <LinearProgress variant="determinate" value={Math.min(rate, 100)} color={rateColor(rate)} sx={{ height: 6, borderRadius: 1, mb: 1.5 }} />
                    {parsedItems.map((it, idx) => (
                      <Stack key={idx} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.5, borderBottom: idx < parsedItems.length - 1 ? 1 : 0, borderColor: 'divider' }}>
                        <Typography variant="caption" sx={{ flex: 1 }}>{it.n}</Typography>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Typography variant="caption" color={it.ok ? 'success.main' : 'warning.main'} sx={{ fontWeight: 600 }}>{it.v}</Typography>
                          {it.ok ? <CheckCircleIcon fontSize="inherit" color="success" /> : <WarningIcon fontSize="inherit" color="warning" />}
                        </Stack>
                      </Stack>
                    ))}
                    <Stack direction="row" justifyContent="flex-end" spacing={0.5} sx={{ mt: 1 }}>
                      <IconButton size="small" onClick={() => { setCEditing(c); setCForm({ ...c }); setCOpen(true) }}><EditIcon fontSize="inherit" /></IconButton>
                      <IconButton size="small" onClick={async () => { if (await showConfirm(t('fireComplianceTab.msg1', '삭제하시겠습니까?'))) cDelete.mutate(c.id) }}><DeleteIcon fontSize="inherit" /></IconButton>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
          {comps.length === 0 && (
            <Grid item xs={12}><Paper variant="outlined" sx={{ py: 6, textAlign: 'center', color: 'text.disabled' }}>등록된 준수 항목이 없습니다</Paper></Grid>
          )}
        </Grid>
      )}

      {/* ===== Reports ===== */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={700}>{t('fireComplianceTab.section3', '법정 보고·제출 일정')}</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => { setREditing(null); setRForm({ ...emptyReport, lastSubmit: todayStr(), nextSubmit: daysFromTodayStr(365) }); setROpen(true) }} sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>New</Button>
      </Stack>
      {/* PC Table */}
      <Paper variant="outlined" sx={{ display: { xs: 'none', md: 'block' } }}>
        {l2 ? <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box> : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 1200, '& .MuiTableCell-root': { whiteSpace: 'nowrap' } }}>
              <TableHead><TableRow>
                <TableCell>보고 종류</TableCell>
                <TableCell align="center">근거 법령</TableCell>
                <TableCell align="center">제출 기한</TableCell>
                <TableCell>제출 대상</TableCell>
                <TableCell align="center">최근 제출</TableCell>
                <TableCell align="center">다음 제출</TableCell>
                <TableCell align="center">상태</TableCell>
                <TableCell>비고</TableCell>
                <TableCell align="center" sx={{ width: 80 }}>액션</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {reports.map(v => (
                  <TableRow key={v.id} hover>
                    <TableCell sx={{ fontWeight: 700 }}>{v.reportType}</TableCell>
                    <TableCell align="center">{v.lawBasis || '-'}</TableCell>
                    <TableCell align="center">{v.deadlineText || '-'}</TableCell>
                    <TableCell>{v.targetOrg || '-'}</TableCell>
                    <TableCell align="center">{v.lastSubmit || '-'}</TableCell>
                    <TableCell align="center">{v.nextSubmit || '-'}</TableCell>
                    <TableCell align="center"><Chip size="small" label={v.status} color={reportStatusColor(v.status)} /></TableCell>
                    <TableCell>{v.note || '-'}</TableCell>
                    <TableCell align="center" sx={{ width: 80, whiteSpace: 'nowrap', px: 0.5 }}>
                      <IconButton size="small" onClick={() => { setREditing(v); setRForm({ ...v }); setROpen(true) }}><EditIcon fontSize="inherit" /></IconButton>
                      <IconButton size="small" onClick={async () => { if (await showConfirm(t('fireComplianceTab.msg2', '삭제하시겠습니까?'))) rDelete.mutate(v.id) }}><DeleteIcon fontSize="inherit" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {reports.length === 0 && <TableRow><TableCell colSpan={9} align="center" sx={{ color: 'text.disabled', py: 6 }}>등록된 보고가 없습니다</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Mobile cards - 보고 일정 */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {l2 ? (
          <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
        ) : reports.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', color: 'text.disabled' }}>등록된 보고가 없습니다</Paper>
        ) : reports.map(v => (
          <Paper key={v.id} variant="outlined" sx={{ p: 1.5, mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight="bold">{v.reportType}</Typography>
                <Typography variant="caption" color="text.secondary">{v.lawBasis || '-'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.25, flexShrink: 0 }}>
                <IconButton size="small" onClick={() => { setREditing(v); setRForm({ ...v }); setROpen(true) }}><EditIcon fontSize="small" /></IconButton>
                <IconButton size="small" onClick={async () => { if (await showConfirm(t('fireComplianceTab.msg2', '삭제하시겠습니까?'))) rDelete.mutate(v.id) }}><DeleteIcon fontSize="small" /></IconButton>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 0.5 }}>
              {v.status && <Chip size="small" label={v.status} color={reportStatusColor(v.status)} />}
              {v.deadlineText && <Chip size="small" label={v.deadlineText} variant="outlined" />}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              제출 대상: {v.targetOrg || '-'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              최근: {v.lastSubmit || '-'} · 다음: {v.nextSubmit || '-'}
            </Typography>
            {v.note && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.note}</Typography>}
          </Paper>
        ))}
      </Box>

      {/* ===== Compliance dialog ===== */}
      <Dialog open={cOpen} onClose={() => setCOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{cEditing ? '준수 항목 수정' : '준수 항목 등록'}</DialogTitle>
        <DialogContent dividers>
          <FormTable>
            <FormRow>
              <FormLabel required>제목</FormLabel>
              <FormCell><TextField fullWidth size="small" value={cForm.title || ''} onChange={e => setCForm({ ...cForm, title: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>법령</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={cForm.lawBasis || ''} onChange={e => setCForm({ ...cForm, lawBasis: e.target.value })} /></FormCell>
              <FormLabel>준수율 (%)</FormLabel>
              <FormCell><NumberField fullWidth value={cForm.rate ?? null} onChange={v => setCForm({ ...cForm, rate: v ?? 0 })} min={0} max={100} thousandSeparator={false} /></FormCell>
            </FormRow>
            <FormRow last>
              <FormLabel>세부 항목</FormLabel>
              <FormCell>
                <TextField fullWidth size="small" multiline minRows={4}
                  placeholder="이름|값|1;이름|값|0&#10;(예: 작동기능점검 연1회|2026-07 완료|1;)"
                  value={cForm.items || ''}
                  onChange={e => setCForm({ ...cForm, items: e.target.value })} />
              </FormCell>
            </FormRow>
          </FormTable>
        </DialogContent>
        <DialogActions>
          {!cEditing && <DevTestFillButton onFill={fillComp} />}
          <Button variant="outlined" onClick={() => setCOpen(false)}>취소</Button>
          <Button variant="contained" onClick={() => cEditing ? cUpdate.mutate({ id: cEditing.id, e: cForm }) : cCreate.mutate(cForm)} disabled={!cForm.title}>저장</Button>
        </DialogActions>
      </Dialog>

      {/* ===== Report dialog ===== */}
      <Dialog open={rOpen} onClose={() => setROpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{rEditing ? '보고 일정 수정' : '보고 일정 등록'}</DialogTitle>
        <DialogContent dividers>
          <FormTable>
            <FormRow>
              <FormLabel required>보고 종류</FormLabel>
              <FormCell><TextField fullWidth size="small" value={rForm.reportType || ''} onChange={e => setRForm({ ...rForm, reportType: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>법령</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={rForm.lawBasis || ''} onChange={e => setRForm({ ...rForm, lawBasis: e.target.value })} /></FormCell>
              <FormLabel>제출 기한</FormLabel>
              <FormCell><TextField fullWidth size="small" placeholder="예) 매년 1월 31일" value={rForm.deadlineText || ''} onChange={e => setRForm({ ...rForm, deadlineText: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>제출 대상</FormLabel>
              <FormCell><TextField fullWidth size="small" value={rForm.targetOrg || ''} onChange={e => setRForm({ ...rForm, targetOrg: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>최근 제출일</FormLabel>
              <FormCell borderRight><DatePickerField value={rForm.lastSubmit || null} onChange={d => setRForm({ ...rForm, lastSubmit: d || undefined })} /></FormCell>
              <FormLabel>다음 제출일</FormLabel>
              <FormCell><DatePickerField value={rForm.nextSubmit || null} onChange={d => setRForm({ ...rForm, nextSubmit: d || undefined })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>상태</FormLabel>
              <FormCell><TextField select fullWidth size="small" value={rForm.status || ''} onChange={e => setRForm({ ...rForm, status: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{REPORT_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></FormCell>
            </FormRow>
            <FormRow last>
              <FormLabel>비고</FormLabel>
              <FormCell><TextField fullWidth size="small" multiline minRows={2} value={rForm.note || ''} onChange={e => setRForm({ ...rForm, note: e.target.value })} /></FormCell>
            </FormRow>
          </FormTable>
        </DialogContent>
        <DialogActions>
          {!rEditing && <DevTestFillButton onFill={fillReport} />}
          <Button variant="outlined" onClick={() => setROpen(false)}>취소</Button>
          <Button variant="contained" onClick={() => rEditing ? rUpdate.mutate({ id: rEditing.id, e: rForm }) : rCreate.mutate(rForm)} disabled={!rForm.reportType}>저장</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default FireComplianceTab
