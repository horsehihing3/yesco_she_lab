import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Grid, Paper, Stack, TextField, MenuItem, Button, Chip, Alert, LinearProgress, Typography,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, CircularProgress,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { exposureApi, odStatsApi } from '../../api/occupationalDiseaseApi'
import type { OdExposure } from '../../types/occupationalDisease.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import NumberField from '../common/NumberField'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import { useButtonRules } from '../../hooks/useButtonRules'

const CLASSES = ['화학적', '물리적', '생물학적']
const STATUSES = [
  { code: 'danger', label: '초과', color: 'error' as const },
  { code: 'warn', label: '주의', color: 'warning' as const },
  { code: 'ok', label: '정상', color: 'success' as const },
]
const DEPTS = ['생산1팀', '생산2팀', '도장팀', '도금팀', '용접팀', '화학실험실']

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const statusInfo = (s?: string) => STATUSES.find(x => x.code === s) || STATUSES[2]

const emptyForm: Partial<OdExposure> = { factorClass: '화학적', status: 'ok', exposureRatio: 0 }

const MENU = '보건 관리 › 직업병 관리 › 노출관리'

const OdExposureTab: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showConfirm } = useAlert()
  const { user } = useAuth()
  const { canSee } = useButtonRules()
  const isAdmin = user?.role === 'SYSTEM_ADMIN'
  const myRoles: string[] = ['guest', ...(isAdmin ? ['superAdmin'] : []), ...(user?.role ? [user.role] : [])]
  const { data: items = [], isLoading } = useQuery({ queryKey: ['odExposures'], queryFn: exposureApi.list })
  const { data: stats } = useQuery({ queryKey: ['odStats'], queryFn: odStatsApi.get })

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selected, setSelected] = useState<OdExposure | null>(null)
  const [form, setForm] = useState<Partial<OdExposure>>(emptyForm)

  const handleBackToList = () => { setViewMode('list'); setSelected(null); setForm(emptyForm) }

  const createMut = useMutation({ mutationFn: (e: Partial<OdExposure>) => exposureApi.create(e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['odExposures'] }); qc.invalidateQueries({ queryKey: ['odStats'] }); handleBackToList() } })
  const updateMut = useMutation({ mutationFn: ({ id, e }: { id: number; e: Partial<OdExposure> }) => exposureApi.update(id, e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['odExposures'] }); qc.invalidateQueries({ queryKey: ['odStats'] }); handleBackToList() } })
  const deleteMut = useMutation({ mutationFn: (id: number) => exposureApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['odExposures'] }); qc.invalidateQueries({ queryKey: ['odStats'] }); handleBackToList() } })

  const handleRowClick = (e: OdExposure) => { setSelected(e); setViewMode('detail') }
  const handleAddClick = () => { setSelected(null); setForm({ ...emptyForm, measureDate: todayStr() }); setViewMode('create') }
  const handleEditClick = () => { if (selected) { setForm({ ...selected }); setViewMode('edit') } }
  const handleDeleteClick = async () => {
    if (!selected) return
    if (await showConfirm(t('odExposureTab.msg1', '삭제하시겠습니까?'))) deleteMut.mutate(selected.id)
  }
  const handleSave = () => {
    if (!form.factorName) return
    if (viewMode === 'edit' && selected) updateMut.mutate({ id: selected.id, e: form })
    else createMut.mutate(form)
  }

  const dangerList = items.filter(e => e.status === 'danger')

  if (viewMode === 'detail' && selected) {
    const s = statusInfo(selected.status)
    return (
      <Box>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>{t('odExposureTab.section1', '노출기록 상세')}</Typography>
        <FormTable>
          <FormRow><FormLabel>분류</FormLabel><FormCell borderRight><Typography variant="body2">{selected.factorClass || ''}</Typography></FormCell><FormLabel>유해인자명</FormLabel><FormCell><Typography variant="body2" fontWeight={600}>{selected.factorName}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>노출 부서</FormLabel><FormCell borderRight><Typography variant="body2">{selected.dept || ''}</Typography></FormCell><FormLabel>공정명</FormLabel><FormCell><Typography variant="body2">{selected.processName || ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>측정값</FormLabel><FormCell borderRight><Typography variant="body2" fontFamily="monospace">{selected.measuredValue || ''}</Typography></FormCell><FormLabel>TWA</FormLabel><FormCell><Typography variant="body2" fontFamily="monospace">{selected.twaStandard || ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>노출비율 (%)</FormLabel><FormCell borderRight><Typography variant="body2" fontFamily="monospace">{selected.exposureRatio ?? 0}%</Typography></FormCell><FormLabel>측정일</FormLabel><FormCell><Typography variant="body2" fontFamily="monospace">{selected.measureDate || ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>노출 근로자</FormLabel><FormCell borderRight><Typography variant="body2" fontFamily="monospace">{selected.workerCount ?? 0}명</Typography></FormCell><FormLabel>상태</FormLabel><FormCell><Chip size="small" label={s.label} color={s.color} /></FormCell></FormRow>
          <FormRow last><FormLabel>개선 내용</FormLabel><FormCell><Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selected.action || ''}</Typography></FormCell></FormRow>
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
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>{viewMode === 'edit' ? '노출기록 수정' : '노출기록 등록'}</Typography>
        <FormTable>
          <FormRow>
            <FormLabel>분류</FormLabel>
            <FormCell borderRight><TextField select fullWidth size="small" value={form.factorClass || ''} onChange={e => setForm({ ...form, factorClass: e.target.value })}>
              <MenuItem value="">선택하세요</MenuItem>{CLASSES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}</TextField></FormCell>
            <FormLabel required>유해인자명</FormLabel>
            <FormCell><TextField fullWidth size="small" value={form.factorName || ''} onChange={e => setForm({ ...form, factorName: e.target.value })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>노출 부서</FormLabel>
            <FormCell borderRight><TextField select fullWidth size="small" value={form.dept || ''} onChange={e => setForm({ ...form, dept: e.target.value })}>
              <MenuItem value="">선택하세요</MenuItem>{DEPTS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}</TextField></FormCell>
            <FormLabel>공정명</FormLabel>
            <FormCell><TextField fullWidth size="small" value={form.processName || ''} onChange={e => setForm({ ...form, processName: e.target.value })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>측정값</FormLabel>
            <FormCell borderRight><TextField fullWidth size="small" placeholder="예) 120 ppm" value={form.measuredValue || ''} onChange={e => setForm({ ...form, measuredValue: e.target.value })} /></FormCell>
            <FormLabel>TWA</FormLabel>
            <FormCell><TextField fullWidth size="small" placeholder="예) 100 ppm" value={form.twaStandard || ''} onChange={e => setForm({ ...form, twaStandard: e.target.value })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>노출비율 (%)</FormLabel>
            <FormCell borderRight><NumberField fullWidth size="small" value={form.exposureRatio ?? null} onChange={v => setForm({ ...form, exposureRatio: v ?? 0 })} min={0} max={500} /></FormCell>
            <FormLabel>측정일</FormLabel>
            <FormCell><DatePickerField value={form.measureDate || null} onChange={d => setForm({ ...form, measureDate: d })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>노출 근로자</FormLabel>
            <FormCell borderRight><NumberField fullWidth size="small" value={form.workerCount ?? null} onChange={v => setForm({ ...form, workerCount: v ?? 0 })} min={0} /></FormCell>
            <FormLabel>상태</FormLabel>
            <FormCell><TextField select fullWidth size="small" value={form.status || 'ok'} onChange={e => setForm({ ...form, status: e.target.value })}>
              <MenuItem value="">선택하세요</MenuItem>{STATUSES.map(s => <MenuItem key={s.code} value={s.code}>{s.label}</MenuItem>)}</TextField></FormCell>
          </FormRow>
          <FormRow last>
            <FormLabel>개선 내용</FormLabel>
            <FormCell><TextField fullWidth size="small" multiline minRows={2} value={form.action || ''} onChange={e => setForm({ ...form, action: e.target.value })} /></FormCell>
          </FormRow>
        </FormTable>
        <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' }, gap: 1, mt: 2 }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>취소</Button>
          {canSee(MENU, 'DETAIL', '저장', myRoles) && (
            <Button variant="contained" onClick={handleSave} disabled={!form.factorName} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>저장</Button>
          )}
        </Box>
      </Box>
    )
  }

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}><StatCard color="red"    value={stats?.exposureDangerCount ?? 0} label={t('odExposureTab.label1', '노출기준 초과')} sub="즉시 개선" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="yellow" value={stats?.exposureWarnCount ?? 0}   label="50% 이상 노출" sub="주의 관리" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="green"  value={stats?.exposureOkCount ?? 0}     label={t('odExposureTab.label2', '정상 범위')} sub="50% 미만" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="blue"   value={items.length}                     label={t('odExposureTab.label3', '측정 항목')} /></Grid>
      </Grid>

      {dangerList.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <strong>노출기준 초과 {dangerList.length}개 항목 — 즉시 공학적 개선 필요</strong>
          {' · '}{dangerList.map(d => `${d.factorName}(${d.dept})`).join(' · ')}
        </Alert>
      )}

      <Stack direction="row" sx={{ mb: 2 }} justifyContent="flex-end">
        {canSee(MENU, 'LIST', '신규 등록', myRoles) && (
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddClick}>New</Button>
        )}
      </Stack>

      <Paper variant="outlined">
        {isLoading ? <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box> : (
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>유해인자</TableCell><TableCell align="center">분류</TableCell><TableCell>부서</TableCell><TableCell>공정</TableCell>
                <TableCell>측정값</TableCell><TableCell>TWA</TableCell><TableCell>노출비율</TableCell>
                <TableCell align="center">측정일</TableCell><TableCell align="center">근로자</TableCell><TableCell align="center">상태</TableCell><TableCell>개선조치</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {items.map(e => {
                  const s = statusInfo(e.status)
                  return (
                    <TableRow key={e.id} hover sx={{ cursor: 'pointer', borderLeft: '3px solid', borderLeftColor: e.status === 'danger' ? 'error.main' : e.status === 'warn' ? 'warning.main' : 'success.main' }} onClick={() => handleRowClick(e)}>
                      <TableCell sx={{ fontWeight: 700 }}>{e.factorName}</TableCell>
                      <TableCell align="center"><Chip size="small" label={e.factorClass} variant="outlined" /></TableCell>
                      <TableCell>{e.dept}</TableCell>
                      <TableCell>{e.processName}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: e.status === 'danger' ? 'error.main' : e.status === 'warn' ? 'warning.main' : 'success.main' }}>{e.measuredValue}</TableCell>
                      <TableCell>{e.twaStandard}</TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <LinearProgress variant="determinate" value={Math.min(e.exposureRatio || 0, 100)}
                            color={(e.exposureRatio || 0) > 100 ? 'error' : (e.exposureRatio || 0) > 80 ? 'warning' : 'success'}
                            sx={{ width: 60, height: 5, borderRadius: 1 }} />
                          <Box component="span">{e.exposureRatio}%</Box>
                        </Stack>
                      </TableCell>
                      <TableCell align="center">{e.measureDate}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>{e.workerCount}명</TableCell>
                      <TableCell align="center"><Chip size="small" label={s.label} color={s.color} /></TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{e.action}</TableCell>
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

export default OdExposureTab
