import { useState, useMemo } from 'react'
import { isSystemAdmin } from '../../utils/auth'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Grid, Paper, Stack, TextField, MenuItem, Button, Chip, CircularProgress, Typography,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, IconButton,
} from '@mui/material'
import ListSearchBar from '../common/ListSearchBar'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import { workerApi, odStatsApi } from '../../api/occupationalDiseaseApi'
import type { OdWorker } from '../../types/occupationalDisease.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import { useButtonRules } from '../../hooks/useButtonRules'

const DIVISIONS = ['정기', '수시', '배치전', '미수검']
const JUDGES = ['A', 'B', 'C1', 'C2', 'D1', 'D2']
const AFTER_ACTIONS = ['추적관찰', '업무전환', '근로단축', '근로금지', '산재신청', '직업병의뢰', '재검권고', '해당없음', '-']
const ACTION_DONE = ['완료', '진행중', '-']
const GENDERS = ['남', '여']
const JOBS = ['사무직', '비사무직']

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const judgeColor = (j?: string): 'success' | 'info' | 'warning' | 'error' | 'default' => {
  if (j === 'A') return 'success'
  if (j === 'B') return 'info'
  if (j === 'C1' || j === 'C2') return 'warning'
  if (j === 'D1' || j === 'D2') return 'error'
  return 'default'
}
const divColor = (d: string): 'primary' | 'warning' | 'error' | 'success' | 'default' => {
  switch (d) { case '정기': return 'primary'; case '수시': return 'warning'; case '미수검': return 'error'; case '배치전': return 'success'; default: return 'default' }
}

const emptyForm: Partial<OdWorker> = { division: '정기', gender: '남', job: '비사무직' }

const MENU = '보건 관리 › 직업병 관리 › 검진현황'

const OdStatusTab: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showConfirm } = useAlert()
  const { user } = useAuth()
  const { canSee } = useButtonRules()
  const myRoles: string[] = ['guest', ...(isSystemAdmin(user) ? ['superAdmin'] : (user?.role ? [user.role] : []))]
  const getRoles = (item: { createdByUserId?: number | null }): string[] => {
    const roles = [...myRoles]
    if (item.createdByUserId != null && user?.id != null && item.createdByUserId === user.id) roles.push('writer')
    return roles
  }
  const { data: items = [], isLoading } = useQuery({ queryKey: ['odWorkers'], queryFn: workerApi.list })
  const { data: stats } = useQuery({ queryKey: ['odStats'], queryFn: odStatsApi.get })

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selected, setSelected] = useState<OdWorker | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [judgeFilter, setJudgeFilter] = useState('')
  const [divFilter, setDivFilter] = useState('')
  const [form, setForm] = useState<Partial<OdWorker>>(emptyForm)

  const applySearch = () => setSearch(searchInput)
  const handleResetSearch = () => { setSearchInput(''); setSearch(''); setJudgeFilter(''); setDivFilter('') }

  const handleBackToList = () => { setViewMode('list'); setSelected(null); setForm(emptyForm) }

  const createMut = useMutation({ mutationFn: (e: Partial<OdWorker>) => workerApi.create(e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['odWorkers'] }); qc.invalidateQueries({ queryKey: ['odStats'] }); handleBackToList() } })
  const updateMut = useMutation({ mutationFn: ({ id, e }: { id: number; e: Partial<OdWorker> }) => workerApi.update(id, e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['odWorkers'] }); qc.invalidateQueries({ queryKey: ['odStats'] }); handleBackToList() } })
  const deleteMut = useMutation({ mutationFn: (id: number) => workerApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['odWorkers'] }); qc.invalidateQueries({ queryKey: ['odStats'] }); handleBackToList() } })

  const handleRowClick = (w: OdWorker) => { setSelected(w); setViewMode('detail') }
  const handleAddClick = () => { setSelected(null); setForm({ ...emptyForm, examDate: todayStr() }); setViewMode('create') }
  const handleEditClick = () => { if (selected) { setForm({ ...selected }); setViewMode('edit') } }
  const handleDeleteClick = async () => {
    if (!selected) return
    if (await showConfirm(t('odStatusTab.msg1', '삭제하시겠습니까?'))) deleteMut.mutate(selected.id)
  }
  const handleSave = () => {
    if (!form.name || !form.employeeNo) return
    if (viewMode === 'edit' && selected) updateMut.mutate({ id: selected.id, e: form })
    else createMut.mutate(form)
  }

  const filtered = useMemo(() => items.filter(w => {
    if (judgeFilter && w.judge !== judgeFilter) return false
    if (divFilter && w.division !== divFilter) return false
    if (search && !w.name.includes(search) && !w.employeeNo.includes(search) && !(w.dept || '').includes(search) && !(w.factor || '').includes(search)) return false
    return true
  }), [items, judgeFilter, divFilter, search])

  // 부서별 게이지
  const byDept = useMemo(() => {
    const m: Record<string, { total: number; done: number; d: number }> = {}
    items.forEach(w => {
      const k = w.dept || '기타'
      if (!m[k]) m[k] = { total: 0, done: 0, d: 0 }
      m[k].total += 1
      if (w.examDate) m[k].done += 1
      if (w.judge?.startsWith('D')) m[k].d += 1
    })
    return Object.entries(m).map(([dept, v]) => ({ dept, total: v.total, done: v.done, d: v.d, pct: v.total > 0 ? Math.round(v.done / v.total * 100) : 0 }))
  }, [items])

  // ─── DETAIL ───
  if (viewMode === 'detail' && selected) {
    return (
      <Box>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>{t('odStatusTab.section1', '대상자 상세')}</Typography>
        <FormTable>
          <FormRow><FormLabel>사번</FormLabel><FormCell borderRight><Typography variant="body2" fontFamily="monospace">{selected.employeeNo}</Typography></FormCell><FormLabel>성명</FormLabel><FormCell><Typography variant="body2" fontWeight={600}>{selected.name}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>부서</FormLabel><FormCell borderRight><Typography variant="body2">{selected.dept || ''}</Typography></FormCell><FormLabel>직종</FormLabel><FormCell><Typography variant="body2">{selected.job || ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>성별</FormLabel><FormCell borderRight><Typography variant="body2">{selected.gender || ''}</Typography></FormCell><FormLabel>생년월일</FormLabel><FormCell><Typography variant="body2" fontFamily="monospace">{selected.birthDate || ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>검진 구분</FormLabel><FormCell borderRight><Chip size="small" label={selected.division} color={divColor(selected.division)} /></FormCell><FormLabel>유해인자</FormLabel><FormCell><Typography variant="body2">{selected.factor || ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>발암성</FormLabel><FormCell borderRight><Typography variant="body2">{selected.carcinogenicity || ''}</Typography></FormCell><FormLabel>노출기간</FormLabel><FormCell><Typography variant="body2">{selected.exposurePeriod || ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>검진기관</FormLabel><FormCell borderRight><Typography variant="body2">{selected.examOrg || ''}</Typography></FormCell><FormLabel>검진일</FormLabel><FormCell><Typography variant="body2" fontFamily="monospace">{selected.examDate || ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>판정</FormLabel><FormCell borderRight>{selected.judge ? <Chip size="small" label={selected.judge} color={judgeColor(selected.judge)} sx={{ fontWeight: 700 }} /> : '-'}</FormCell><FormLabel>사후조치</FormLabel><FormCell><Typography variant="body2">{selected.afterAction || ''}</Typography></FormCell></FormRow>
          <FormRow last><FormLabel>이행 여부</FormLabel><FormCell><Typography variant="body2" fontWeight={700} sx={{ color: selected.actionDone === '완료' ? 'success.main' : selected.actionDone === '진행중' ? 'warning.main' : 'text.disabled' }}>{selected.actionDone || ''}</Typography></FormCell></FormRow>
        </FormTable>
        <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' }, gap: 1, mt: 2 }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>목록</Button>
          {canSee(MENU, 'DETAIL', '수정', getRoles(selected ?? {})) && (
            <Button variant="contained" onClick={handleEditClick} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>수정</Button>
          )}
          {canSee(MENU, 'DETAIL', '삭제', getRoles(selected ?? {})) && (
            <Button variant="contained" color="error" onClick={handleDeleteClick} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>삭제</Button>
          )}
        </Box>
      </Box>
    )
  }

  // ─── CREATE / EDIT ───
  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <Box>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>{viewMode === 'edit' ? '대상자 수정' : '대상자 추가'}</Typography>
        <FormTable>
          <FormRow>
            <FormLabel required>사번</FormLabel>
            <FormCell borderRight><TextField fullWidth size="small" value={form.employeeNo || ''} onChange={e => setForm({ ...form, employeeNo: e.target.value })} /></FormCell>
            <FormLabel required>성명</FormLabel>
            <FormCell><TextField fullWidth size="small" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>부서</FormLabel>
            <FormCell borderRight><TextField fullWidth size="small" value={form.dept || ''} onChange={e => setForm({ ...form, dept: e.target.value })} /></FormCell>
            <FormLabel>직종</FormLabel>
            <FormCell><TextField select fullWidth size="small" value={form.job || ''} onChange={e => setForm({ ...form, job: e.target.value })}>
              <MenuItem value="">선택하세요</MenuItem>{JOBS.map(j => <MenuItem key={j} value={j}>{j}</MenuItem>)}</TextField></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>성별</FormLabel>
            <FormCell borderRight><TextField select fullWidth size="small" value={form.gender || ''} onChange={e => setForm({ ...form, gender: e.target.value })}>
              <MenuItem value="">선택하세요</MenuItem>{GENDERS.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}</TextField></FormCell>
            <FormLabel>생년월일</FormLabel>
            <FormCell><DatePickerField value={form.birthDate || null} onChange={d => setForm({ ...form, birthDate: d })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>검진 구분</FormLabel>
            <FormCell borderRight><TextField select fullWidth size="small" value={form.division || '정기'} onChange={e => setForm({ ...form, division: e.target.value })}>
              <MenuItem value="">선택하세요</MenuItem>{DIVISIONS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}</TextField></FormCell>
            <FormLabel>유해인자</FormLabel>
            <FormCell><TextField fullWidth size="small" value={form.factor || ''} onChange={e => setForm({ ...form, factor: e.target.value })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>발암성</FormLabel>
            <FormCell borderRight><TextField fullWidth size="small" value={form.carcinogenicity || ''} onChange={e => setForm({ ...form, carcinogenicity: e.target.value })} placeholder="없음/1A군/1B군/2군" /></FormCell>
            <FormLabel>노출기간</FormLabel>
            <FormCell><TextField fullWidth size="small" value={form.exposurePeriod || ''} onChange={e => setForm({ ...form, exposurePeriod: e.target.value })} placeholder="예) 5년 3개월" /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>검진기관</FormLabel>
            <FormCell borderRight><TextField fullWidth size="small" value={form.examOrg || ''} onChange={e => setForm({ ...form, examOrg: e.target.value })} /></FormCell>
            <FormLabel>검진일</FormLabel>
            <FormCell><DatePickerField value={form.examDate || null} onChange={d => setForm({ ...form, examDate: d })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>판정</FormLabel>
            <FormCell borderRight><TextField select fullWidth size="small" value={form.judge || ''} onChange={e => setForm({ ...form, judge: e.target.value })} SelectProps={{ displayEmpty: true }}><MenuItem value="">선택하세요</MenuItem>{JUDGES.map(j => <MenuItem key={j} value={j}>{j}</MenuItem>)}</TextField></FormCell>
            <FormLabel>사후조치</FormLabel>
            <FormCell><TextField select fullWidth size="small" value={form.afterAction || ''} onChange={e => setForm({ ...form, afterAction: e.target.value })} SelectProps={{ displayEmpty: true }}><MenuItem value="">선택하세요</MenuItem>{AFTER_ACTIONS.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}</TextField></FormCell>
          </FormRow>
          <FormRow last>
            <FormLabel>이행 여부</FormLabel>
            <FormCell><TextField select fullWidth size="small" value={form.actionDone || ''} onChange={e => setForm({ ...form, actionDone: e.target.value })} SelectProps={{ displayEmpty: true }}><MenuItem value="">선택하세요</MenuItem>{ACTION_DONE.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}</TextField></FormCell>
          </FormRow>
        </FormTable>
        <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' }, gap: 1, mt: 2 }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>취소</Button>
          {canSee(MENU, 'DETAIL', '저장', getRoles(selected ?? {})) && (
            <Button variant="contained" onClick={handleSave} disabled={!form.name || !form.employeeNo} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{viewMode === 'edit' ? '수정' : '추가'}</Button>
          )}
        </Box>
      </Box>
    )
  }

  // ─── LIST ───
  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={2.4}><StatCard color="blue"   value={stats?.workerTotal ?? 0}        label={t('odStatusTab.label1', '검진 대상자')} sub={`완료 ${stats?.workerCompletedCount ?? 0}`} /></Grid>
        <Grid item xs={6} sm={2.4}><StatCard color="green"  value={stats?.workerCompletedCount ?? 0} label={t('odStatusTab.label2', '검진 완료')} /></Grid>
        <Grid item xs={6} sm={2.4}><StatCard color="yellow" value={stats?.workerCCount ?? 0}       label="C판정 (요관찰)" /></Grid>
        <Grid item xs={6} sm={2.4}><StatCard color="red"    value={stats?.workerD1Count ?? 0}     label="D1판정 (직업병)" /></Grid>
        <Grid item xs={6} sm={2.4}><StatCard color="purple" value={stats?.workerMissedCount ?? 0} label={t('odStatusTab.label3', '미수검')} /></Grid>
      </Grid>

      <Box sx={{ mb: 2 }}>
        <Box sx={{ fontWeight: 700, fontSize: 14, mb: 1 }}>부서별 검진현황</Box>
        <Grid container spacing={1.5}>
          {byDept.map(d => (
            <Grid item xs={6} sm={4} md={2} key={d.dept}>
              <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                <Box sx={{ position: 'relative', width: 56, height: 56, mx: 'auto', mb: 1, lineHeight: 0 }}>
                  <CircularProgress variant="determinate" value={100} size={56} thickness={5} sx={{ color: 'action.hover', position: 'absolute', top: 0, left: 0, display: 'block' }} />
                  <CircularProgress variant="determinate" value={d.pct} size={56} thickness={5} sx={{ color: d.pct >= 90 ? 'success.main' : d.pct >= 70 ? 'warning.main' : 'error.main', position: 'absolute', top: 0, left: 0, display: 'block' }} />
                  <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{d.pct}%</Box>
                </Box>
                <Typography variant="body2" fontWeight={600} color="text.secondary">{d.dept}</Typography>
                <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>{d.done}/{d.total}명 · D{d.d}건</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2, justifyContent: 'flex-start' }} alignItems="center">
        <ListSearchBar placeholder="성명/사번/부서/유해인자" value={searchInput} onChange={setSearchInput} onSearch={applySearch}
          sx={{ width: { xs: '100%', sm: 240 } }} />
        <TextField select size="small" sx={{ minWidth: 130 }} value={judgeFilter} onChange={e => setJudgeFilter(e.target.value)}
          SelectProps={{ displayEmpty: true }}>
          <MenuItem value="">판정 전체</MenuItem>
          {JUDGES.map(j => <MenuItem key={j} value={j}>{j}</MenuItem>)}
        </TextField>
        <TextField select size="small" sx={{ minWidth: 130 }} value={divFilter} onChange={e => setDivFilter(e.target.value)}
          SelectProps={{ displayEmpty: true }}>
          <MenuItem value="">검진구분 전체</MenuItem>
          {DIVISIONS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
        </TextField>
        <IconButton onClick={handleResetSearch} size="small"><RefreshIcon /></IconButton>
        <Box sx={{ flex: 1 }} />
        {canSee(MENU, 'LIST', 'New', myRoles) && (
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddClick} sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>New</Button>
        )}
      </Stack>

      <Paper variant="outlined">
        {isLoading ? <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box> : (
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell align="center">성명</TableCell><TableCell align="center">사번</TableCell><TableCell>부서</TableCell>
                <TableCell>직종</TableCell><TableCell>성별</TableCell><TableCell>구분</TableCell>
                <TableCell>유해인자</TableCell><TableCell align="center">발암성</TableCell><TableCell align="center">노출기간</TableCell>
                <TableCell>검진기관</TableCell><TableCell align="center">검진일</TableCell>
                <TableCell align="center">판정</TableCell><TableCell>사후조치</TableCell><TableCell align="center">이행</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {filtered.map(w => (
                  <TableRow key={w.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(w)}>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>{w.name}</TableCell>
                    <TableCell align="center">{w.employeeNo}</TableCell>
                    <TableCell>{w.dept}</TableCell>
                    <TableCell>{w.job}</TableCell>
                    <TableCell align="center">{w.gender}</TableCell>
                    <TableCell><Chip size="small" label={w.division} color={divColor(w.division)} /></TableCell>
                    <TableCell>{w.factor}</TableCell>
                    <TableCell align="center">{w.carcinogenicity && w.carcinogenicity !== '없음'
                      ? <Chip size="small" label={w.carcinogenicity} color="error" />
                      : <Box component="span" sx={{ color: 'text.disabled' }}>없음</Box>}</TableCell>
                    <TableCell align="center">{w.exposurePeriod}</TableCell>
                    <TableCell>{w.examOrg}</TableCell>
                    <TableCell align="center">{w.examDate}</TableCell>
                    <TableCell align="center">{w.judge ? <Chip size="small" label={w.judge} color={judgeColor(w.judge)} sx={{ fontWeight: 700 }} /> : '-'}</TableCell>
                    <TableCell>{w.afterAction}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: w.actionDone === '완료' ? 'success.main' : w.actionDone === '진행중' ? 'warning.main' : 'text.disabled' }}>{w.actionDone}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={14} align="center" sx={{ color: 'text.disabled', py: 6 }}>등록된 대상자가 없습니다</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  )
}

export default OdStatusTab
