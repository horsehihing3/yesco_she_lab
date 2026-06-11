import { useState, useMemo } from 'react'
import { isEhsManager } from '../../utils/auth'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Grid, Paper, Stack, TextField, MenuItem, Button, Chip, Typography,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  IconButton, CircularProgress, LinearProgress,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import ListSearchBar from '../common/ListSearchBar'
import AddIcon from '@mui/icons-material/Add'
import { dpStressApi, dpMgmtStatsApi } from '../../api/diseasePreventionMgmtApi'
import type { DpStress } from '../../types/diseasePreventionMgmt.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import NumberField from '../common/NumberField'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import { useButtonRules } from '../../hooks/useButtonRules'

const RISKS = ['정상', '잠재', '고위험']
const DOMAINS: Array<[keyof DpStress, string]> = [
  ['physicalEnv', '물리환경'], ['jobDemand', '직무요구'], ['autonomy', '자율성'], ['relationship', '관계갈등'],
  ['jobInsecurity', '고용불안'], ['systemFairness', '체계불공정'], ['reward', '보상부족'], ['workCulture', '직장문화'],
]

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const riskColor = (r?: string): 'success' | 'warning' | 'error' | 'default' =>
  r === '고위험' ? 'error' : r === '잠재' ? 'warning' : r === '정상' ? 'success' : 'default'

const emptyForm: Partial<DpStress> = { riskLevel: '잠재', hasCounseling: false }

const MENU = '보건 관리 › 질병예방 관리 › 직무스트레스'

const DpStressTab: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showConfirm, showSuccess, showError } = useAlert()
  const { user } = useAuth()
  const { canSee } = useButtonRules()
  const isAdmin = isEhsManager(user)
  const myRoles: string[] = ['guest', ...(isAdmin ? ['superAdmin'] : []), ...(user?.role ? [user.role] : [])]

  const { data: list = [], isLoading } = useQuery({ queryKey: ['dpStress'], queryFn: dpStressApi.list })
  const { data: stats } = useQuery({ queryKey: ['dpMgmtStats'], queryFn: dpMgmtStatsApi.get })

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selected, setSelected] = useState<DpStress | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filterRisk, setFilterRisk] = useState('all')
  const [form, setForm] = useState<Partial<DpStress>>(emptyForm)

  const applySearch = () => setSearch(searchInput)
  const handleResetSearch = () => { setSearchInput(''); setSearch('') }

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['dpStress'] })
    qc.invalidateQueries({ queryKey: ['dpMgmtStats'] })
  }

  const createM = useMutation({ mutationFn: dpStressApi.create, onSuccess: () => { invalidate(); showSuccess(t('dpStressTab.msg1', '등록되었습니다')); handleBackToList() }, onError: () => showError(t('dpStressTab.msg2', '등록 실패')) })
  const updateM = useMutation({ mutationFn: ({ id, e }: { id: number; e: Partial<DpStress> }) => dpStressApi.update(id, e), onSuccess: () => { invalidate(); showSuccess(t('dpStressTab.msg3', '수정되었습니다')); handleBackToList() }, onError: () => showError(t('dpStressTab.msg4', '수정 실패')) })
  const deleteM = useMutation({ mutationFn: dpStressApi.remove, onSuccess: () => { invalidate(); showSuccess(t('dpStressTab.msg5', '삭제되었습니다')); handleBackToList() } })

  const filtered = useMemo(() => list.filter((x) => {
    if (filterRisk !== 'all' && x.riskLevel !== filterRisk) return false
    if (search && !`${x.workerName} ${x.department || ''}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [list, filterRisk, search])

  const handleBackToList = () => { setViewMode('list'); setSelected(null); setForm(emptyForm) }
  const handleRowClick = (item: DpStress) => { setSelected(item); setViewMode('detail') }
  const handleAddClick = () => { setSelected(null); setForm({ ...emptyForm, assessmentDate: todayStr() }); setViewMode('create') }
  const handleEditClick = () => { if (selected) { setForm({ ...selected }); setViewMode('edit') } }
  const handleDeleteClick = async () => {
    if (!selected) return
    if (await showConfirm(t('dpStressTab.msg6', '이 평가를 삭제하시겠습니까?'))) deleteM.mutate(selected.id)
  }
  const handleSave = () => {
    if (!form.workerName) { showError(t('dpStressTab.msg7', '근로자명을 입력해주세요')); return }
    if (viewMode === 'edit' && selected) updateM.mutate({ id: selected.id, e: form })
    else createM.mutate(form)
  }

  if (viewMode === 'detail' && selected) {
    const pct = Math.min(100, (selected.totalScore ?? 0))
    return (
      <Box>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>KOSS-26 평가 상세</Typography>
        <FormTable>
          <FormRow><FormLabel>근로자명</FormLabel><FormCell borderRight><Typography variant="body2" fontWeight={600}>{selected.workerName}</Typography></FormCell><FormLabel>부서</FormLabel><FormCell><Typography variant="body2">{selected.department || ''}</Typography></FormCell></FormRow>
          {DOMAINS.map(([k, label], i) => i % 2 === 0 ? (
            <FormRow key={k}>
              <FormLabel>{label}</FormLabel>
              <FormCell borderRight><Typography variant="body2" fontFamily="monospace">{(selected[k] as number) ?? ''}</Typography></FormCell>
              {DOMAINS[i + 1] && (
                <>
                  <FormLabel>{DOMAINS[i + 1][1]}</FormLabel>
                  <FormCell><Typography variant="body2" fontFamily="monospace">{(selected[DOMAINS[i + 1][0]] as number) ?? ''}</Typography></FormCell>
                </>
              )}
            </FormRow>
          ) : null)}
          <FormRow>
            <FormLabel>총점 (0~100)</FormLabel>
            <FormCell>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                <LinearProgress variant="determinate" value={pct} sx={{ flex: 1, height: 6, borderRadius: 1 }} />
                <Typography variant="caption" fontFamily="monospace" fontWeight={600}>{selected.totalScore ?? 0}/100</Typography>
              </Stack>
            </FormCell>
          </FormRow>
          <FormRow><FormLabel>위험도</FormLabel><FormCell borderRight><Chip size="small" label={selected.riskLevel || '-'} color={riskColor(selected.riskLevel)} /></FormCell><FormLabel>평가일</FormLabel><FormCell><Typography variant="body2" fontFamily="monospace">{selected.assessmentDate || ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>상담 진행</FormLabel><FormCell><Typography variant="body2">{selected.hasCounseling ? '진행 중' : '해당없음'}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>상담 메모</FormLabel><FormCell><Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selected.counselingNotes || ''}</Typography></FormCell></FormRow>
          <FormRow last><FormLabel>비고</FormLabel><FormCell><Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selected.notes || ''}</Typography></FormCell></FormRow>
        </FormTable>
        <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' }, gap: 1, mt: 2 }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>목록</Button>
          {canSee(MENU, 'DETAIL', '수정', myRoles) && (
            <Button variant="contained" onClick={handleEditClick} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>수정</Button>
          )}
          {canSee(MENU, 'DETAIL', '삭제', myRoles) && (
            <Button variant="contained" color="error" onClick={handleDeleteClick} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>삭제</Button>
          )}
        </Box>
      </Box>
    )
  }

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <Box>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>{viewMode === 'edit' ? 'KOSS-26 평가 수정' : 'KOSS-26 평가 등록'}</Typography>
        <FormTable>
          <FormRow>
            <FormLabel required>근로자명</FormLabel>
            <FormCell borderRight><TextField fullWidth size="small" value={form.workerName || ''} onChange={(e) => setForm({ ...form, workerName: e.target.value })} /></FormCell>
            <FormLabel>부서</FormLabel>
            <FormCell><TextField fullWidth size="small" value={form.department || ''} onChange={(e) => setForm({ ...form, department: e.target.value })} /></FormCell>
          </FormRow>
          {DOMAINS.map(([k, label], i) => i % 2 === 0 ? (
            <FormRow key={k}>
              <FormLabel>{label}</FormLabel>
              <FormCell borderRight><NumberField fullWidth value={(form[k] as number) ?? null} onChange={(v) => setForm({ ...form, [k]: v ?? undefined } as any)} min={0} max={25} thousandSeparator={false} /></FormCell>
              {DOMAINS[i + 1] && (
                <>
                  <FormLabel>{DOMAINS[i + 1][1]}</FormLabel>
                  <FormCell><NumberField fullWidth value={(form[DOMAINS[i + 1][0]] as number) ?? null} onChange={(v) => setForm({ ...form, [DOMAINS[i + 1][0]]: v ?? undefined } as any)} min={0} max={25} thousandSeparator={false} /></FormCell>
                </>
              )}
            </FormRow>
          ) : null)}
          <FormRow>
            <FormLabel>총점 (0~100)</FormLabel>
            <FormCell borderRight><NumberField fullWidth value={form.totalScore ?? null} onChange={(v) => setForm({ ...form, totalScore: v ?? undefined })} min={0} max={100} thousandSeparator={false} /></FormCell>
            <FormLabel>위험도</FormLabel>
            <FormCell>
              <TextField select fullWidth size="small" value={form.riskLevel || ''} onChange={(e) => setForm({ ...form, riskLevel: e.target.value })}>
                <MenuItem value="">선택하세요</MenuItem>
                {RISKS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </TextField>
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>평가일</FormLabel>
            <FormCell borderRight><DatePickerField value={form.assessmentDate || null} onChange={(d) => setForm({ ...form, assessmentDate: d || undefined })} /></FormCell>
            <FormLabel>상담 진행</FormLabel>
            <FormCell>
              <TextField select fullWidth size="small" value={form.hasCounseling ? 'true' : 'false'} onChange={(e) => setForm({ ...form, hasCounseling: e.target.value === 'true' })}>
                <MenuItem value="">선택하세요</MenuItem>
                <MenuItem value="false">해당없음</MenuItem>
                <MenuItem value="true">진행 중</MenuItem>
              </TextField>
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>상담 메모</FormLabel>
            <FormCell><TextField fullWidth size="small" multiline minRows={2} value={form.counselingNotes || ''} onChange={(e) => setForm({ ...form, counselingNotes: e.target.value })} /></FormCell>
          </FormRow>
          <FormRow last>
            <FormLabel>비고</FormLabel>
            <FormCell><TextField fullWidth size="small" multiline minRows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></FormCell>
          </FormRow>
        </FormTable>
        <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' }, gap: 1, mt: 2 }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>취소</Button>
          {canSee(MENU, 'DETAIL', '저장', myRoles) && (
            <Button variant="contained" onClick={handleSave} disabled={createM.isPending || updateM.isPending} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>저장</Button>
          )}
        </Box>
      </Box>
    )
  }

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}><StatCard color="blue"   value={stats?.stressTotal ?? 0} label={t('dpStressTab.label1', '평가 인원')} sub="KOSS-26 응답" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="green"  value={stats?.stressLow ?? 0}   label={t('dpStressTab.label2', '정상')} sub="스트레스 낮음" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="yellow" value={stats?.stressMid ?? 0}   label={t('dpStressTab.label3', '잠재 스트레스')} sub="관찰 필요" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="red"    value={stats?.stressHigh ?? 0}  label={t('dpStressTab.label4', '고위험')} sub="상담 연계" /></Grid>
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
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 120 }}>KOSS-26 총점</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 100 }}>위험도</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 120, whiteSpace: 'nowrap' }}>평가일</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 90 }}>상담</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.disabled' }}>평가 기록이 없습니다</TableCell></TableRow>
                ) : filtered.map((x) => {
                  const pct = Math.min(100, (x.totalScore ?? 0))
                  return (
                    <TableRow key={x.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(x)}>
                      <TableCell sx={{ fontWeight: 600 }}>{x.workerName}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{x.department || '-'}</TableCell>
                      <TableCell align="center" sx={{ minWidth: 120 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <LinearProgress variant="determinate" value={pct} sx={{ flex: 1, minWidth: 60, height: 5, borderRadius: 1 }} />
                          <Box sx={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600, minWidth: 40 }}>{x.totalScore ?? 0}/100</Box>
                        </Stack>
                      </TableCell>
                      <TableCell align="center"><Chip size="small" label={x.riskLevel || '-'} color={riskColor(x.riskLevel)} /></TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{x.assessmentDate || '-'}</TableCell>
                      <TableCell align="center">{x.hasCounseling ? <Chip size="small" label={t('dpStressTab.label5', '진행중')} color="info" /> : '-'}</TableCell>
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

export default DpStressTab
