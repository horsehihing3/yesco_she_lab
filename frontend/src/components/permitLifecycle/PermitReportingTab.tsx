import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Grid, Paper, Stack, TextField, MenuItem, Button, Chip, Typography,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, CircularProgress,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import ListSearchBar from '../common/ListSearchBar'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { permitReportingApi, permitLifecycleStatsApi } from '../../api/permitLifecycleApi'
import type { PermitReporting } from '../../types/permitLifecycle.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import { useAlert } from '../../contexts/AlertContext'

const REPORT_TYPES = ['결과보고', '연간보고', '분기보고', '월간보고', '재해보고', '수시보고']
const FREQS = ['일', '주', '월', '분기', '반기', '연', '수시']
const STATUSES = ['제출완료', '준비중', '임박', '지연']

const daysUntil = (d?: string) => {
  if (!d) return Infinity
  return Math.ceil((new Date(d).getTime() - new Date(new Date().toDateString()).getTime()) / 86400000)
}

const statusColor = (s: string): 'success' | 'info' | 'warning' | 'error' =>
  s === '제출완료' ? 'success' : s === '준비중' ? 'info' : s === '임박' ? 'warning' : 'error'

const emptyForm: Partial<PermitReporting> = { status: '준비중', frequency: '연' }

const PermitReportingTab: React.FC = () => {
  const qc = useQueryClient()
  const { showConfirm, showSuccess, showError } = useAlert()

  const { data: list = [], isLoading } = useQuery({ queryKey: ['permitReporting'], queryFn: permitReportingApi.list })
  const { data: stats } = useQuery({ queryKey: ['permitLifecycleStats'], queryFn: permitLifecycleStatsApi.get })

  const [searchInput, setSearchInput] = useState('')

  const [search, setSearch] = useState('')

  const applySearch = () => setSearch(searchInput)

  const handleResetSearch = () => { setSearchInput(''); setSearch('') }
  const [filterStatus, setFilterStatus] = useState('all')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<PermitReporting | null>(null)
  const [form, setForm] = useState<Partial<PermitReporting>>(emptyForm)

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['permitReporting'] })
    qc.invalidateQueries({ queryKey: ['permitLifecycleStats'] })
  }

  const createM = useMutation({ mutationFn: permitReportingApi.create, onSuccess: () => { invalidate(); setOpen(false); showSuccess('등록되었습니다') }, onError: () => showError('등록 실패') })
  const updateM = useMutation({ mutationFn: ({ id, e }: { id: number; e: Partial<PermitReporting> }) => permitReportingApi.update(id, e), onSuccess: () => { invalidate(); setOpen(false); showSuccess('수정되었습니다') }, onError: () => showError('수정 실패') })
  const deleteM = useMutation({ mutationFn: permitReportingApi.remove, onSuccess: () => { invalidate(); showSuccess('삭제되었습니다') } })

  const filtered = useMemo(() => list.filter((x) => {
    if (filterStatus !== 'all' && x.status !== filterStatus) return false
    if (search && !`${x.reportName} ${x.regulatoryBody || ''}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [list, filterStatus, search])

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, lastSubmission: todayStr(), nextDeadline: todayStr() }); setOpen(true) }
  const openEdit = (item: PermitReporting) => { setEditing(item); setForm({ ...item }); setOpen(true) }
  const handleSave = () => {
    if (!form.reportName) { showError('보고서명을 입력해주세요'); return }
    if (editing) updateM.mutate({ id: editing.id, e: form })
    else createM.mutate(form)
  }

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}><StatCard color="purple" value={stats?.rpTotal ?? 0}   label="전체 보고서" sub="법정 보고" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="green"  value={stats?.rpDone ?? 0}    label="제출 완료" sub="금년 제출" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="yellow" value={stats?.rpNear ?? 0}    label="임박" sub="30일 이내" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="red"    value={stats?.rpOverdue ?? 0} label="지연" sub="기한 초과" /></Grid>
      </Grid>

      <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <ListSearchBar placeholder="보고서명·기관 검색" value={searchInput} onChange={setSearchInput} onSearch={applySearch} sx={{ flex: 1, minWidth: 200 }} />
          <TextField select size="small" label="상태" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} sx={{ minWidth: 120 }}>
            <MenuItem value="all">전체</MenuItem>
            {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
        <IconButton onClick={handleResetSearch} size="small"><RefreshIcon /></IconButton>
        </Stack>
      </Paper>

      {isLoading ? (
        <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', mb: 2 }}><CircularProgress /></Paper>
      ) : (
        <>
          {/* ─── 데스크탑(md+) : 테이블 ─── */}
          <Paper variant="outlined" sx={{ mb: 2, display: { xs: 'none', md: 'block' } }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>보고서명</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', width: 90 }}>주기</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>제출 기관</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', width: 110 }}>최근 제출</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', width: 110 }}>차기 마감</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', width: 100 }}>상태</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', width: 90 }}>작업</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.disabled' }}>보고서가 없습니다</TableCell></TableRow>
                  ) : filtered.map((x) => {
                    const d = daysUntil(x.nextDeadline)
                    return (
                      <TableRow key={x.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{x.reportName}</TableCell>
                        <TableCell align="center"><Chip size="small" label={x.frequency || '-'} variant="outlined" /></TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{x.regulatoryBody || '-'}</TableCell>
                        <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{x.lastSubmission || '-'}</TableCell>
                        <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: d < 0 ? 'error.main' : d <= 30 ? 'warning.main' : 'inherit' }}>
                          {x.nextDeadline || '-'}{x.nextDeadline && <Box sx={{ fontSize: '0.7rem', color: 'text.disabled' }}>D{d >= 0 ? '-' : '+'}{Math.abs(d)}</Box>}
                        </TableCell>
                        <TableCell align="center"><Chip size="small" label={x.status} color={statusColor(x.status)} /></TableCell>
                        <TableCell align="center" sx={{ whiteSpace: 'nowrap', px: 0.5 }}>
                          <IconButton size="small" onClick={() => openEdit(x)}><EditIcon fontSize="inherit" /></IconButton>
                          <IconButton size="small" onClick={async () => {
                            if (await showConfirm('이 보고서를 삭제하시겠습니까?')) deleteM.mutate(x.id)
                          }}><DeleteIcon fontSize="inherit" /></IconButton>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* ─── 모바일(xs/sm) : 카드 ─── */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
            {filtered.length === 0 && (
              <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', color: 'text.disabled', fontSize: '0.875rem' }}>
                보고서가 없습니다
              </Paper>
            )}
            {filtered.map((x) => {
              const d = daysUntil(x.nextDeadline)
              const deadlineColor = d < 0 ? 'error.main' : d <= 30 ? 'warning.main' : 'text.primary'
              return (
                <Paper key={x.id} variant="outlined" sx={{ p: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {x.reportName}
                    </Typography>
                    <Chip size="small" label={x.status} color={statusColor(x.status)} />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.75, flexWrap: 'wrap' }}>
                    <Chip size="small" label={x.frequency || '-'} variant="outlined" sx={{ height: 22 }} />
                    {x.regulatoryBody && (
                      <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>· {x.regulatoryBody}</Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, bgcolor: 'action.hover', borderRadius: 1, p: 1 }}>
                    <Box>
                      <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', lineHeight: 1 }}>최근 제출</Typography>
                      <Typography sx={{ fontFamily: 'monospace', fontSize: '0.8rem', mt: 0.25 }}>{x.lastSubmission || '-'}</Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', lineHeight: 1 }}>차기 마감</Typography>
                      <Typography sx={{ fontFamily: 'monospace', fontSize: '0.8rem', mt: 0.25, color: deadlineColor, fontWeight: x.nextDeadline ? 700 : 400 }}>
                        {x.nextDeadline || '-'}
                        {x.nextDeadline && <Typography component="span" sx={{ ml: 0.5, fontSize: '0.7rem', color: deadlineColor }}>(D{d >= 0 ? '-' : '+'}{Math.abs(d)})</Typography>}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button variant="outlined" size="small" fullWidth onClick={() => openEdit(x)}>수정</Button>
                    <Button variant="contained" color="error" size="small" fullWidth onClick={async () => {
                      if (await showConfirm('이 보고서를 삭제하시겠습니까?')) deleteM.mutate(x.id)
                    }}>삭제</Button>
                  </Box>
                </Paper>
              )
            })}
          </Box>
        </>
      )}

      <Stack direction="row" justifyContent={{ xs: 'stretch', md: 'flex-end' }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ width: { xs: '100%', md: 'auto' } }}>신규 등록</Button>
      </Stack>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? '보고서 수정' : '보고서 등록'}</DialogTitle>
        <DialogContent dividers>
          <FormTable>
            <FormRow>
              <FormLabel required>보고서명</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.reportName || ''} onChange={(e) => setForm({ ...form, reportName: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>보고 구분</FormLabel>
              <FormCell borderRight>
                <TextField select fullWidth size="small" value={form.reportType || ''} onChange={(e) => setForm({ ...form, reportType: e.target.value })}>
                  <MenuItem value="">선택</MenuItem>
                  {REPORT_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              </FormCell>
              <FormLabel>보고 주기</FormLabel>
              <FormCell>
                <TextField select fullWidth size="small" value={form.frequency || ''} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
                  <MenuItem value="">선택</MenuItem>
                  {FREQS.map((f) => <MenuItem key={f} value={f}>{f}</MenuItem>)}
                </TextField>
              </FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>제출 기관</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.regulatoryBody || ''} onChange={(e) => setForm({ ...form, regulatoryBody: e.target.value })} /></FormCell>
              <FormLabel>관련 법규</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.legalBasis || ''} onChange={(e) => setForm({ ...form, legalBasis: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>최근 제출일</FormLabel>
              <FormCell borderRight><DatePickerField value={form.lastSubmission || null} onChange={(d) => setForm({ ...form, lastSubmission: d || undefined })} /></FormCell>
              <FormLabel>차기 마감일</FormLabel>
              <FormCell><DatePickerField value={form.nextDeadline || null} onChange={(d) => setForm({ ...form, nextDeadline: d || undefined })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>담당자</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.assignee || ''} onChange={(e) => setForm({ ...form, assignee: e.target.value })} /></FormCell>
              <FormLabel>상태</FormLabel>
              <FormCell>
                <TextField select fullWidth size="small" value={form.status || ''} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <MenuItem value="">선택</MenuItem>
                  {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </FormCell>
            </FormRow>
            <FormRow last>
              <FormLabel>비고</FormLabel>
              <FormCell><TextField fullWidth size="small" multiline minRows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></FormCell>
            </FormRow>
          </FormTable>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setOpen(false)}>취소</Button>
          <Button variant="contained" onClick={handleSave} disabled={createM.isPending || updateM.isPending}>저장</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PermitReportingTab
