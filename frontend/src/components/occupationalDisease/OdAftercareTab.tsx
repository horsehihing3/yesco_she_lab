import { useState } from 'react'
import { isEhsManager } from '../../utils/auth'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Grid, Paper, Stack, TextField, MenuItem, Button, Chip, Alert, Typography,
  CircularProgress,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { aftercareApi, fitnessApi, odStatsApi } from '../../api/occupationalDiseaseApi'
import type { OdAftercare, OdFitness } from '../../types/occupationalDisease.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import { useButtonRules } from '../../hooks/useButtonRules'

const JUDGES = ['C1', 'C2', 'D1', 'D2']
const STATUSES = ['진행중', '추적관찰', '산재진행', '완결']
const FIT_RESULTS = ['현재 업무 적합', '조건부 적합', '일시적 부적합', '영구적 부적합']

type ViewMode = 'list' | 'aftercare-detail' | 'aftercare-create' | 'aftercare-edit' | 'fitness-detail' | 'fitness-create' | 'fitness-edit'

const judgeColor = (j?: string): 'warning' | 'error' | 'default' => {
  if (j?.startsWith('D')) return 'error'
  if (j?.startsWith('C')) return 'warning'
  return 'default'
}
const statusColor = (s?: string): 'info' | 'success' | 'secondary' | 'warning' | 'default' => {
  switch (s) { case '진행중': return 'info'; case '완결': return 'success'; case '산재진행': return 'secondary'; case '추적관찰': return 'warning'; default: return 'default' }
}

const emptyAft: Partial<OdAftercare> = { judge: 'D1', status: '진행중', urgent: false }
const emptyFit: Partial<OdFitness> = { evalResult: '조건부 적합', doneStatus: '이행중' }

const MENU = '보건 관리 › 직업병 관리 › 사후관리'

const OdAftercareTab: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showConfirm } = useAlert()
  const { user } = useAuth()
  const { canSee } = useButtonRules()
  const isAdmin = isEhsManager(user)
  const myRoles: string[] = ['guest', ...(user?.role === 'SYSTEM_ADMIN' ? ['superAdmin'] : (user?.role ? [user.role] : []))]
  const getRoles = (item: { createdByUserId?: number | null }): string[] => {
    const roles = [...myRoles]
    if (item.createdByUserId != null && user?.id != null && item.createdByUserId === user.id) roles.push('writer')
    return roles
  }
  const { data: items = [], isLoading } = useQuery({ queryKey: ['odAftercare'], queryFn: aftercareApi.list })
  const { data: stats } = useQuery({ queryKey: ['odStats'], queryFn: odStatsApi.get })
  const { data: fits = [] } = useQuery({ queryKey: ['odFitness'], queryFn: fitnessApi.list })

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedAft, setSelectedAft] = useState<OdAftercare | null>(null)
  const [form, setForm] = useState<Partial<OdAftercare>>(emptyAft)
  const [selectedFit, setSelectedFit] = useState<OdFitness | null>(null)
  const [fitForm, setFitForm] = useState<Partial<OdFitness>>(emptyFit)

  const handleBackToList = () => { setViewMode('list'); setSelectedAft(null); setSelectedFit(null); setForm(emptyAft); setFitForm(emptyFit) }

  const createMut = useMutation({ mutationFn: (e: Partial<OdAftercare>) => aftercareApi.create(e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['odAftercare'] }); qc.invalidateQueries({ queryKey: ['odStats'] }); handleBackToList() } })
  const updateMut = useMutation({ mutationFn: ({ id, e }: { id: number; e: Partial<OdAftercare> }) => aftercareApi.update(id, e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['odAftercare'] }); qc.invalidateQueries({ queryKey: ['odStats'] }); handleBackToList() } })
  const deleteMut = useMutation({ mutationFn: (id: number) => aftercareApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['odAftercare'] }); qc.invalidateQueries({ queryKey: ['odStats'] }); handleBackToList() } })

  const createFitMut = useMutation({ mutationFn: (e: Partial<OdFitness>) => fitnessApi.create(e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['odFitness'] }); handleBackToList() } })
  const updateFitMut = useMutation({ mutationFn: ({ id, e }: { id: number; e: Partial<OdFitness> }) => fitnessApi.update(id, e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['odFitness'] }); handleBackToList() } })
  const deleteFitMut = useMutation({ mutationFn: (id: number) => fitnessApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['odFitness'] }); handleBackToList() } })

  // Aftercare handlers
  const handleAftClick = (a: OdAftercare) => { setSelectedAft(a); setViewMode('aftercare-detail') }
  const handleAftAddClick = () => { setSelectedAft(null); setForm({ ...emptyAft, dueDate: todayStr() }); setViewMode('aftercare-create') }
  const handleAftEditClick = () => { if (selectedAft) { setForm({ ...selectedAft }); setViewMode('aftercare-edit') } }
  const handleAftDeleteClick = async () => {
    if (!selectedAft) return
    if (await showConfirm(t('odAftercareTab.msg1', '삭제하시겠습니까?'))) deleteMut.mutate(selectedAft.id)
  }
  const handleAftSave = () => {
    if (!form.workerName) return
    if (viewMode === 'aftercare-edit' && selectedAft) updateMut.mutate({ id: selectedAft.id, e: form })
    else createMut.mutate(form)
  }

  // Fitness handlers
  const handleFitClick = (f: OdFitness) => { setSelectedFit(f); setViewMode('fitness-detail') }
  const handleFitAddClick = () => { setSelectedFit(null); setFitForm(emptyFit); setViewMode('fitness-create') }
  const handleFitEditClick = () => { if (selectedFit) { setFitForm({ ...selectedFit }); setViewMode('fitness-edit') } }
  const handleFitDeleteClick = async () => {
    if (!selectedFit) return
    if (await showConfirm(t('odAftercareTab.msg2', '삭제하시겠습니까?'))) deleteFitMut.mutate(selectedFit.id)
  }
  const handleFitSave = () => {
    if (!fitForm.workerName) return
    if (viewMode === 'fitness-edit' && selectedFit) updateFitMut.mutate({ id: selectedFit.id, e: fitForm })
    else createFitMut.mutate(fitForm)
  }

  const urgentList = items.filter(a => a.urgent)

  // ─── Aftercare DETAIL ───
  if (viewMode === 'aftercare-detail' && selectedAft) {
    const actions = (selectedAft.actionsText || '').split('\n').filter(Boolean)
    return (
      <Box>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>{t('odAftercareTab.section1', '사후관리 조치 상세')}</Typography>
        <FormTable>
          <FormRow><FormLabel>대상자</FormLabel><FormCell borderRight><Typography variant="body2" fontWeight={600}>{selectedAft.workerName}</Typography></FormCell><FormLabel>부서</FormLabel><FormCell><Typography variant="body2">{selectedAft.dept || ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>검진 판정</FormLabel><FormCell borderRight><Chip size="small" label={selectedAft.judge} color={judgeColor(selectedAft.judge)} /></FormCell><FormLabel>유해인자</FormLabel><FormCell><Typography variant="body2">{selectedAft.factor || ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>질환/소견</FormLabel><FormCell><Typography variant="body2">{selectedAft.disease || ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>조치 내역</FormLabel><FormCell>
            {actions.length > 0 ? (
              <Stack spacing={0.5}>
                {actions.map((ac, i) => (
                  <Stack key={i} direction="row" spacing={1} alignItems="center">
                    <CheckCircleIcon color={i < actions.length - 1 ? 'success' : 'info'} sx={{ fontSize: 16 }} />
                    <span>{ac}</span>
                  </Stack>
                ))}
              </Stack>
            ) : <Typography variant="body2" color="text.disabled">-</Typography>}
          </FormCell></FormRow>
          <FormRow><FormLabel>상태</FormLabel><FormCell borderRight><Chip size="small" label={selectedAft.status} color={statusColor(selectedAft.status)} /></FormCell><FormLabel>조치 기한</FormLabel><FormCell><Typography variant="body2" fontFamily="monospace">{selectedAft.dueDate || ''}</Typography></FormCell></FormRow>
          <FormRow last><FormLabel>긴급 여부</FormLabel><FormCell><Chip size="small" label={selectedAft.urgent ? '긴급' : '일반'} color={selectedAft.urgent ? 'error' : 'default'} /></FormCell></FormRow>
        </FormTable>
        <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' }, gap: 1, mt: 2 }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>목록</Button>
          {canSee(MENU, 'DETAIL', '수정', getRoles(selected ?? {})) && (
            <Button variant="contained" onClick={handleAftEditClick} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>수정</Button>
          )}
          {canSee(MENU, 'DETAIL', '삭제', getRoles(selected ?? {})) && (
            <Button variant="contained" color="error" onClick={handleAftDeleteClick} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>삭제</Button>
          )}
        </Box>
      </Box>
    )
  }

  // ─── Aftercare CREATE / EDIT ───
  if (viewMode === 'aftercare-create' || viewMode === 'aftercare-edit') {
    return (
      <Box>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>{viewMode === 'aftercare-edit' ? '사후관리 조치 수정' : '사후관리 조치 등록'}</Typography>
        <FormTable>
          <FormRow>
            <FormLabel required>대상자</FormLabel>
            <FormCell borderRight><TextField fullWidth size="small" value={form.workerName || ''} onChange={e => setForm({ ...form, workerName: e.target.value })} /></FormCell>
            <FormLabel>부서</FormLabel>
            <FormCell><TextField fullWidth size="small" value={form.dept || ''} onChange={e => setForm({ ...form, dept: e.target.value })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>검진 판정</FormLabel>
            <FormCell borderRight><TextField select fullWidth size="small" value={form.judge || 'D1'} onChange={e => setForm({ ...form, judge: e.target.value })}>
              <MenuItem value="">선택하세요</MenuItem>{JUDGES.map(j => <MenuItem key={j} value={j}>{j}</MenuItem>)}</TextField></FormCell>
            <FormLabel>유해인자</FormLabel>
            <FormCell><TextField fullWidth size="small" value={form.factor || ''} onChange={e => setForm({ ...form, factor: e.target.value })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>질환/소견</FormLabel>
            <FormCell><TextField fullWidth size="small" value={form.disease || ''} onChange={e => setForm({ ...form, disease: e.target.value })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>조치 내역</FormLabel>
            <FormCell><TextField fullWidth size="small" multiline minRows={4} placeholder="한 줄에 하나씩 입력&#10;예) 업무전환 실시(5/10)" value={form.actionsText || ''} onChange={e => setForm({ ...form, actionsText: e.target.value })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>상태</FormLabel>
            <FormCell borderRight><TextField select fullWidth size="small" value={form.status || ''} onChange={e => setForm({ ...form, status: e.target.value })}>
              <MenuItem value="">선택하세요</MenuItem>{STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></FormCell>
            <FormLabel>조치 기한</FormLabel>
            <FormCell><DatePickerField value={form.dueDate || null} onChange={d => setForm({ ...form, dueDate: d })} /></FormCell>
          </FormRow>
          <FormRow last>
            <FormLabel>긴급 여부</FormLabel>
            <FormCell><TextField select fullWidth size="small" value={form.urgent ? '1' : '0'} onChange={e => setForm({ ...form, urgent: e.target.value === '1' })}>
              <MenuItem value="">선택하세요</MenuItem><MenuItem value="0">일반</MenuItem><MenuItem value="1">긴급</MenuItem></TextField></FormCell>
          </FormRow>
        </FormTable>
        <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' }, gap: 1, mt: 2 }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>취소</Button>
          {canSee(MENU, 'DETAIL', '저장', getRoles(selected ?? {})) && (
            <Button variant="contained" onClick={handleAftSave} disabled={!form.workerName} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>저장</Button>
          )}
        </Box>
      </Box>
    )
  }

  // ─── Fitness DETAIL ───
  if (viewMode === 'fitness-detail' && selectedFit) {
    return (
      <Box>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>{t('odAftercareTab.section2', '업무적합성 평가 상세')}</Typography>
        <FormTable>
          <FormRow><FormLabel>대상자</FormLabel><FormCell><Typography variant="body2" fontWeight={600}>{selectedFit.workerName}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>부서</FormLabel><FormCell borderRight><Typography variant="body2">{selectedFit.dept || ''}</Typography></FormCell><FormLabel>질환명</FormLabel><FormCell><Typography variant="body2">{selectedFit.disease || ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>평가기관</FormLabel><FormCell borderRight><Typography variant="body2">{selectedFit.evalOrg || ''}</Typography></FormCell><FormLabel>평가일</FormLabel><FormCell><Typography variant="body2" fontFamily="monospace">{selectedFit.evalDate || ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>평가결과</FormLabel><FormCell borderRight><Chip size="small" label={selectedFit.evalResult || '-'} color={selectedFit.evalResult?.includes('영구') ? 'error' : selectedFit.evalResult?.includes('일시') ? 'warning' : 'success'} /></FormCell><FormLabel>이행 상태</FormLabel><FormCell><Typography variant="body2">{selectedFit.doneStatus || ''}</Typography></FormCell></FormRow>
          <FormRow last><FormLabel>권고사항</FormLabel><FormCell><Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selectedFit.recommendation || ''}</Typography></FormCell></FormRow>
        </FormTable>
        <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' }, gap: 1, mt: 2 }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>목록</Button>
          {canSee(MENU, 'DETAIL', '수정', getRoles(selected ?? {})) && (
            <Button variant="contained" onClick={handleFitEditClick} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>수정</Button>
          )}
          {canSee(MENU, 'DETAIL', '삭제', getRoles(selected ?? {})) && (
            <Button variant="contained" color="error" onClick={handleFitDeleteClick} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>삭제</Button>
          )}
        </Box>
      </Box>
    )
  }

  // ─── Fitness CREATE / EDIT ───
  if (viewMode === 'fitness-create' || viewMode === 'fitness-edit') {
    return (
      <Box>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>{viewMode === 'fitness-edit' ? '업무적합성 평가 수정' : '업무적합성 평가 등록'}</Typography>
        <FormTable>
          <FormRow>
            <FormLabel required>대상자</FormLabel>
            <FormCell><TextField fullWidth size="small" value={fitForm.workerName || ''} onChange={e => setFitForm({ ...fitForm, workerName: e.target.value })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>부서</FormLabel>
            <FormCell borderRight><TextField fullWidth size="small" value={fitForm.dept || ''} onChange={e => setFitForm({ ...fitForm, dept: e.target.value })} /></FormCell>
            <FormLabel>질환명</FormLabel>
            <FormCell><TextField fullWidth size="small" value={fitForm.disease || ''} onChange={e => setFitForm({ ...fitForm, disease: e.target.value })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>평가기관</FormLabel>
            <FormCell borderRight><TextField fullWidth size="small" value={fitForm.evalOrg || ''} onChange={e => setFitForm({ ...fitForm, evalOrg: e.target.value })} /></FormCell>
            <FormLabel>평가일</FormLabel>
            <FormCell><DatePickerField value={fitForm.evalDate || null} onChange={d => setFitForm({ ...fitForm, evalDate: d })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>평가결과</FormLabel>
            <FormCell borderRight><TextField select fullWidth size="small" value={fitForm.evalResult || ''} onChange={e => setFitForm({ ...fitForm, evalResult: e.target.value })}>
              <MenuItem value="">선택하세요</MenuItem>{FIT_RESULTS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}</TextField></FormCell>
            <FormLabel>이행 상태</FormLabel>
            <FormCell><TextField fullWidth size="small" placeholder="이행중/완료/산재처리" value={fitForm.doneStatus || ''} onChange={e => setFitForm({ ...fitForm, doneStatus: e.target.value })} /></FormCell>
          </FormRow>
          <FormRow last>
            <FormLabel>권고사항</FormLabel>
            <FormCell><TextField fullWidth size="small" multiline minRows={2} value={fitForm.recommendation || ''} onChange={e => setFitForm({ ...fitForm, recommendation: e.target.value })} /></FormCell>
          </FormRow>
        </FormTable>
        <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' }, gap: 1, mt: 2 }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>취소</Button>
          {canSee(MENU, 'DETAIL', '저장', getRoles(selected ?? {})) && (
            <Button variant="contained" onClick={handleFitSave} disabled={!fitForm.workerName} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>저장</Button>
          )}
        </Box>
      </Box>
    )
  }

  // ─── LIST ───
  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}><StatCard color="red"    value={stats?.aftercareUrgentCount ?? 0} label={t('odAftercareTab.label1', '즉시 조치 필요')} sub="D1·C2 판정자" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="yellow" value={items.filter(a => !a.urgent).length} label={t('odAftercareTab.label2', '요관찰 (추적)')} /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="blue"   value={fits.length}                       label={t('odAftercareTab.label3', '적합성 평가')} /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="green"  value={stats?.aftercareDoneCount ?? 0}    label={t('odAftercareTab.label4', '사후관리 완결')} /></Grid>
      </Grid>

      {urgentList.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <strong>D1 판정자 {urgentList.length}명 — 즉각적 업무 전환 / 산재 신청 검토 요망</strong>
          {' · '}{urgentList.map(a => `${a.workerName}(${a.dept})`).join(' · ')}
        </Alert>
      )}

      <Stack direction="row" sx={{ mb: 2 }} justifyContent="flex-end">
        {canSee(MENU, 'LIST', '신규 등록', myRoles) && (
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAftAddClick}>New</Button>
        )}
      </Stack>

      {isLoading ? <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box> : (
        <Stack spacing={1.5} sx={{ mb: 3 }}>
          {items.map(a => {
            const actions = (a.actionsText || '').split('\n').filter(Boolean)
            return (
              <Paper key={a.id} variant="outlined" sx={{ p: 2, cursor: 'pointer', borderColor: a.urgent ? 'error.light' : undefined, '&:hover': { borderColor: 'primary.main' } }} onClick={() => handleAftClick(a)}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="flex-start" spacing={1} sx={{ mb: 1.5 }}>
                  <Box>
                    <Typography fontWeight={700} fontSize={15}>{a.workerName} <Typography component="span" variant="caption" color="text.secondary"> · {a.dept}</Typography></Typography>
                    <Typography variant="caption" color="text.secondary" display="block">{a.disease} · 주요노출: {a.factor}</Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip size="small" label={`${a.judge} 판정`} color={judgeColor(a.judge)} />
                    <Chip size="small" label={a.status} color={statusColor(a.status)} />
                  </Stack>
                </Stack>
                {actions.length > 0 && (
                  <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'action.hover' }}>
                    <Typography variant="caption" color="text.disabled" sx={{ mb: 0.5, display: 'block' }}>조치 이행 현황</Typography>
                    <Stack spacing={0.5}>
                      {actions.map((ac, i) => (
                        <Stack key={i} direction="row" spacing={1} alignItems="center">
                          <CheckCircleIcon color={i < actions.length - 1 ? 'success' : 'info'} sx={{ fontSize: 16 }} />
                          <span>{ac}</span>
                        </Stack>
                      ))}
                    </Stack>
                  </Paper>
                )}
              </Paper>
            )
          })}
        </Stack>
      )}

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 2, mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={700}>{t('odAftercareTab.section3', '업무적합성 평가 현황')}</Typography>
        {canSee(MENU, 'LIST', '신규 등록', myRoles) && (
          <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={handleFitAddClick}>New</Button>
        )}
      </Stack>
      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead><TableRow>
              <TableCell>성명</TableCell><TableCell>부서</TableCell><TableCell>질환명</TableCell>
              <TableCell>평가일</TableCell><TableCell>평가기관</TableCell><TableCell>결과</TableCell><TableCell>권고사항</TableCell><TableCell>이행</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {fits.map(f => (
                <TableRow key={f.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleFitClick(f)}>
                  <TableCell sx={{ fontWeight: 700 }}>{f.workerName}</TableCell>
                  <TableCell>{f.dept}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{f.disease}</TableCell>
                  <TableCell>{f.evalDate}</TableCell>
                  <TableCell>{f.evalOrg}</TableCell>
                  <TableCell><Chip size="small" label={f.evalResult} color={f.evalResult?.includes('영구') ? 'error' : f.evalResult?.includes('일시') ? 'warning' : 'success'} /></TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{f.recommendation}</TableCell>
                  <TableCell><Chip size="small" label={f.doneStatus} variant="outlined" /></TableCell>
                </TableRow>
              ))}
              {fits.length === 0 && <TableRow><TableCell colSpan={8} align="center" sx={{ color: 'text.disabled', py: 4 }}>평가 기록이 없습니다</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  )
}

export default OdAftercareTab
