import { useState, useMemo } from 'react'
import { isSystemAdmin } from '../../utils/auth'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Grid, Paper, Stack, TextField, MenuItem, Button, Chip, Typography,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  IconButton, CircularProgress,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import ListSearchBar from '../common/ListSearchBar'
import AddIcon from '@mui/icons-material/Add'
import { dpCvdApi, dpMgmtStatsApi } from '../../api/diseasePreventionMgmtApi'
import type { DpCvd } from '../../types/diseasePreventionMgmt.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import NumberField from '../common/NumberField'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import { useButtonRules } from '../../hooks/useButtonRules'

const RISKS = ['저위험', '중위험', '고위험']
const SMOKING = ['비흡연', '금연 1년', '금연 5년 이상', '현재흡연']
const DRINKING = ['주 1회 미만', '주 1회', '주 2회', '주 3회 이상']
const EXERCISE = ['주 1회 미만', '주 1~2회', '주 2회', '주 3회 이상', '주 4회 이상']
const NIGHT_SHIFT = ['없음', '월 2~3회', '주 2회', '주 2~3회', '주 3회 이상']

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const riskColor = (r?: string): 'success' | 'warning' | 'error' | 'default' =>
  r === '고위험' ? 'error' : r === '중위험' ? 'warning' : r === '저위험' ? 'success' : 'default'

const emptyForm: Partial<DpCvd> = { riskLevel: '중위험', gender: '남' }

const MENU = '보건 관리 › 질병예방 관리 › 뇌심혈관'

const DpCvdTab: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showConfirm, showSuccess, showError } = useAlert()
  const { user } = useAuth()
  const { canSee } = useButtonRules()
  const isAdmin = isSystemAdmin(user)
  const myRoles: string[] = ['guest', ...(user?.role === 'SYSTEM_ADMIN' ? ['superAdmin'] : (user?.role ? [user.role] : []))]
  const getRoles = (item: { createdByUserId?: number | null }): string[] => {
    const roles = [...myRoles]
    if (item.createdByUserId != null && user?.id != null && item.createdByUserId === user.id) roles.push('writer')
    return roles
  }

  const { data: list = [], isLoading } = useQuery({ queryKey: ['dpCvd'], queryFn: dpCvdApi.list })
  const { data: stats } = useQuery({ queryKey: ['dpMgmtStats'], queryFn: dpMgmtStatsApi.get })

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selected, setSelected] = useState<DpCvd | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filterRisk, setFilterRisk] = useState('all')
  const [form, setForm] = useState<Partial<DpCvd>>(emptyForm)

  const applySearch = () => setSearch(searchInput)
  const handleResetSearch = () => { setSearchInput(''); setSearch('') }

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['dpCvd'] })
    qc.invalidateQueries({ queryKey: ['dpMgmtStats'] })
  }

  const createM = useMutation({ mutationFn: dpCvdApi.create, onSuccess: () => { invalidate(); showSuccess(t('dpCvdTab.msg1', '등록되었습니다')); handleBackToList() }, onError: () => showError(t('dpCvdTab.msg2', '등록 실패')) })
  const updateM = useMutation({ mutationFn: ({ id, e }: { id: number; e: Partial<DpCvd> }) => dpCvdApi.update(id, e), onSuccess: () => { invalidate(); showSuccess(t('dpCvdTab.msg3', '수정되었습니다')); handleBackToList() }, onError: () => showError(t('dpCvdTab.msg4', '수정 실패')) })
  const deleteM = useMutation({ mutationFn: dpCvdApi.remove, onSuccess: () => { invalidate(); showSuccess(t('dpCvdTab.msg5', '삭제되었습니다')); handleBackToList() } })

  const filtered = useMemo(() => list.filter((x) => {
    if (filterRisk !== 'all' && x.riskLevel !== filterRisk) return false
    if (search && !`${x.workerName} ${x.department || ''}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [list, filterRisk, search])

  const handleBackToList = () => { setViewMode('list'); setSelected(null); setForm(emptyForm) }
  const handleRowClick = (item: DpCvd) => { setSelected(item); setViewMode('detail') }
  const handleAddClick = () => { setSelected(null); setForm({ ...emptyForm, assessmentDate: todayStr(), nextCheckup: todayStr() }); setViewMode('create') }
  const handleEditClick = () => { if (selected) { setForm({ ...selected }); setViewMode('edit') } }
  const handleDeleteClick = async () => {
    if (!selected) return
    if (await showConfirm(t('dpCvdTab.msg6', '이 평가를 삭제하시겠습니까?'))) deleteM.mutate(selected.id)
  }
  const handleSave = () => {
    if (!form.workerName || !form.riskLevel || !form.assessmentDate) { showError(t('dpCvdTab.msg7', '근로자명·위험도·평가일 필수')); return }
    if (viewMode === 'edit' && selected) updateM.mutate({ id: selected.id, e: form })
    else createM.mutate(form)
  }

  // ─── DETAIL ───
  if (viewMode === 'detail' && selected) {
    return (
      <Box>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>{t('dpCvdTab.section1', '뇌심혈관 평가 상세')}</Typography>
        <FormTable>
          <FormRow><FormLabel>근로자명</FormLabel><FormCell borderRight><Typography variant="body2" fontWeight={600}>{selected.workerName}</Typography></FormCell><FormLabel>부서</FormLabel><FormCell><Typography variant="body2">{selected.department || ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>나이</FormLabel><FormCell borderRight><Typography variant="body2">{selected.age ?? ''}세</Typography></FormCell><FormLabel>성별</FormLabel><FormCell><Typography variant="body2">{selected.gender || ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>BMI</FormLabel><FormCell borderRight><Typography variant="body2" fontFamily="monospace">{selected.bmi || ''}</Typography></FormCell><FormLabel>혈압 (S/D)</FormLabel><FormCell><Typography variant="body2" fontFamily="monospace">{selected.bpSys}/{selected.bpDia}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>공복혈당</FormLabel><FormCell borderRight><Typography variant="body2" fontFamily="monospace">{selected.fastingGlucose ?? ''}</Typography></FormCell><FormLabel>LDL / HDL</FormLabel><FormCell><Typography variant="body2" fontFamily="monospace">{selected.ldl ?? ''} / {selected.hdl ?? ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>흡연</FormLabel><FormCell borderRight><Typography variant="body2">{selected.smoking || ''}</Typography></FormCell><FormLabel>음주</FormLabel><FormCell><Typography variant="body2">{selected.drinking || ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>운동</FormLabel><FormCell borderRight><Typography variant="body2">{selected.exercise || ''}</Typography></FormCell><FormLabel>야간작업</FormLabel><FormCell><Typography variant="body2">{selected.nightShift || ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>연장근로 (월)</FormLabel><FormCell><Typography variant="body2">{selected.overtime || ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>위험도</FormLabel><FormCell borderRight><Chip size="small" label={selected.riskLevel} color={riskColor(selected.riskLevel)} /></FormCell><FormLabel>평가일</FormLabel><FormCell><Typography variant="body2" fontFamily="monospace">{selected.assessmentDate || ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>평가자</FormLabel><FormCell borderRight><Typography variant="body2">{selected.assessor || ''}</Typography></FormCell><FormLabel>차기 평가일</FormLabel><FormCell><Typography variant="body2" fontFamily="monospace">{selected.nextCheckup || ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>관리계획</FormLabel><FormCell><Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selected.managementPlan || ''}</Typography></FormCell></FormRow>
          <FormRow last><FormLabel>비고</FormLabel><FormCell><Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selected.notes || ''}</Typography></FormCell></FormRow>
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
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>{viewMode === 'edit' ? '뇌심혈관 평가 수정' : '뇌심혈관 평가 등록'}</Typography>
        <FormTable>
          <FormRow>
            <FormLabel required>근로자명</FormLabel>
            <FormCell borderRight><TextField fullWidth size="small" value={form.workerName || ''} onChange={(e) => setForm({ ...form, workerName: e.target.value })} /></FormCell>
            <FormLabel>부서</FormLabel>
            <FormCell><TextField fullWidth size="small" value={form.department || ''} onChange={(e) => setForm({ ...form, department: e.target.value })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>나이</FormLabel>
            <FormCell borderRight><NumberField fullWidth value={form.age ?? null} onChange={(v) => setForm({ ...form, age: v ?? undefined })} thousandSeparator={false} /></FormCell>
            <FormLabel>성별</FormLabel>
            <FormCell>
              <TextField select fullWidth size="small" value={form.gender || ''} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <MenuItem value="">선택하세요</MenuItem>
                <MenuItem value="남">남</MenuItem>
                <MenuItem value="여">여</MenuItem>
              </TextField>
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>BMI</FormLabel>
            <FormCell borderRight><NumberField fullWidth value={form.bmi ?? null} onChange={(v) => setForm({ ...form, bmi: v ?? undefined })} thousandSeparator={false} step={0.1} /></FormCell>
            <FormLabel>혈압 (수축기/이완기)</FormLabel>
            <FormCell>
              <Stack direction="row" spacing={1}>
                <NumberField fullWidth value={form.bpSys ?? null} onChange={(v) => setForm({ ...form, bpSys: v ?? undefined })} thousandSeparator={false} placeholder="120" />
                <NumberField fullWidth value={form.bpDia ?? null} onChange={(v) => setForm({ ...form, bpDia: v ?? undefined })} thousandSeparator={false} placeholder="80" />
              </Stack>
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>공복혈당 (mg/dL)</FormLabel>
            <FormCell borderRight><NumberField fullWidth value={form.fastingGlucose ?? null} onChange={(v) => setForm({ ...form, fastingGlucose: v ?? undefined })} thousandSeparator={false} /></FormCell>
            <FormLabel>LDL / HDL</FormLabel>
            <FormCell>
              <Stack direction="row" spacing={1}>
                <NumberField fullWidth value={form.ldl ?? null} onChange={(v) => setForm({ ...form, ldl: v ?? undefined })} thousandSeparator={false} placeholder="LDL" />
                <NumberField fullWidth value={form.hdl ?? null} onChange={(v) => setForm({ ...form, hdl: v ?? undefined })} thousandSeparator={false} placeholder="HDL" />
              </Stack>
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>흡연</FormLabel>
            <FormCell borderRight>
              <TextField select fullWidth size="small" value={form.smoking || ''} onChange={(e) => setForm({ ...form, smoking: e.target.value })}>
                <MenuItem value="">선택하세요</MenuItem>
                {SMOKING.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </FormCell>
            <FormLabel>음주</FormLabel>
            <FormCell>
              <TextField select fullWidth size="small" value={form.drinking || ''} onChange={(e) => setForm({ ...form, drinking: e.target.value })}>
                <MenuItem value="">선택하세요</MenuItem>
                {DRINKING.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>운동</FormLabel>
            <FormCell borderRight>
              <TextField select fullWidth size="small" value={form.exercise || ''} onChange={(e) => setForm({ ...form, exercise: e.target.value })}>
                <MenuItem value="">선택하세요</MenuItem>
                {EXERCISE.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </FormCell>
            <FormLabel>야간작업</FormLabel>
            <FormCell>
              <TextField select fullWidth size="small" value={form.nightShift || ''} onChange={(e) => setForm({ ...form, nightShift: e.target.value })}>
                <MenuItem value="">선택하세요</MenuItem>
                {NIGHT_SHIFT.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>연장근로 (월)</FormLabel>
            <FormCell><TextField fullWidth size="small" value={form.overtime || ''} onChange={(e) => setForm({ ...form, overtime: e.target.value })} placeholder="예: 월 50시간 이상" /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel required>위험도</FormLabel>
            <FormCell borderRight>
              <TextField select fullWidth size="small" value={form.riskLevel || ''} onChange={(e) => setForm({ ...form, riskLevel: e.target.value })}>
                <MenuItem value="">선택하세요</MenuItem>
                {RISKS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </TextField>
            </FormCell>
            <FormLabel required>평가일</FormLabel>
            <FormCell><DatePickerField value={form.assessmentDate || null} onChange={(d) => setForm({ ...form, assessmentDate: d || undefined })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>평가자</FormLabel>
            <FormCell borderRight><TextField fullWidth size="small" value={form.assessor || ''} onChange={(e) => setForm({ ...form, assessor: e.target.value })} /></FormCell>
            <FormLabel>차기 평가일</FormLabel>
            <FormCell><DatePickerField value={form.nextCheckup || null} onChange={(d) => setForm({ ...form, nextCheckup: d || undefined })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>관리계획</FormLabel>
            <FormCell><TextField fullWidth size="small" multiline minRows={2} value={form.managementPlan || ''} onChange={(e) => setForm({ ...form, managementPlan: e.target.value })} /></FormCell>
          </FormRow>
          <FormRow last>
            <FormLabel>비고</FormLabel>
            <FormCell><TextField fullWidth size="small" multiline minRows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></FormCell>
          </FormRow>
        </FormTable>
        <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' }, gap: 1, mt: 2 }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>취소</Button>
          {canSee(MENU, 'DETAIL', '저장', getRoles(selected ?? {})) && (
            <Button variant="contained" onClick={handleSave} disabled={createM.isPending || updateM.isPending} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>저장</Button>
          )}
        </Box>
      </Box>
    )
  }

  // ─── LIST ───
  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}><StatCard color="blue"   value={stats?.cvdTotal ?? 0} label={t('dpCvdTab.label1', '평가 대상')} sub="전체 근로자" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="green"  value={stats?.cvdLow ?? 0}   label={t('dpCvdTab.label2', '저위험')} sub="일반 관리" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="yellow" value={stats?.cvdMid ?? 0}   label={t('dpCvdTab.label3', '중위험')} sub="생활습관 개선" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="red"    value={stats?.cvdHigh ?? 0}  label={t('dpCvdTab.label4', '고위험')} sub="전문의 진료" /></Grid>
      </Grid>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2, justifyContent: 'flex-start' }} alignItems="center">
        <ListSearchBar placeholder="근로자·부서 검색" value={searchInput} onChange={setSearchInput} onSearch={applySearch}
          sx={{ width: { xs: '100%', sm: 240 } }} />
        <TextField select size="small" value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)} sx={{ minWidth: 110 }}>
          <MenuItem value="all">전체</MenuItem>
          {RISKS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
        </TextField>
        <IconButton onClick={handleResetSearch} size="small"><RefreshIcon /></IconButton>
        <Box sx={{ flex: 1 }} />
        {canSee(MENU, 'LIST', '신규 등록', myRoles) && (
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddClick} sx={{ whiteSpace: 'nowrap' }}>New</Button>
        )}
      </Stack>

      <Paper variant="outlined" sx={{ mb: 2 }}>
        {isLoading ? <Box sx={{ p: 6, textAlign: 'center' }}><CircularProgress /></Box> : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>근로자</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>부서</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 80 }}>나이·성</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 100 }}>혈압 (S/D)</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 70 }}>BMI</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 100 }}>공복혈당</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 90 }}>위험도</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.disabled' }}>평가 기록이 없습니다</TableCell></TableRow>
                ) : filtered.map((x) => {
                  const bpAbn = (x.bpSys ?? 0) >= 140 || (x.bpDia ?? 0) >= 90
                  const bmiAbn = Number(x.bmi ?? 0) >= 25
                  const gluAbn = (x.fastingGlucose ?? 0) >= 126
                  return (
                    <TableRow key={x.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(x)}>
                      <TableCell sx={{ fontWeight: 600 }}>{x.workerName}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{x.department || '-'}</TableCell>
                      <TableCell align="center" sx={{ fontSize: '0.85rem' }}>{x.age ?? '-'}세 {x.gender || ''}</TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace', color: bpAbn ? 'error.main' : 'inherit', fontWeight: bpAbn ? 600 : 400 }}>{x.bpSys}/{x.bpDia}</TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace', color: bmiAbn ? 'warning.main' : 'inherit', fontWeight: bmiAbn ? 600 : 400 }}>{x.bmi}</TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace', color: gluAbn ? 'error.main' : 'inherit', fontWeight: gluAbn ? 600 : 400 }}>{x.fastingGlucose}</TableCell>
                      <TableCell align="center"><Chip size="small" label={x.riskLevel} color={riskColor(x.riskLevel)} /></TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  )
}

export default DpCvdTab
