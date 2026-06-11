import { useState } from 'react'
import { isSystemAdmin } from '../../utils/auth'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { todayStr, weekFromTodayStr } from '../../utils/dateDefaults'
import {
  Box, Grid, Paper, Stack, TextField, MenuItem, Button, Chip, CircularProgress, Typography,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import { planApi, odStatsApi } from '../../api/occupationalDiseaseApi'
import type { OdPlan } from '../../types/occupationalDisease.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import UserSelectModal, { UserInfo } from '../common/UserSelectModal'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import { useButtonRules } from '../../hooks/useButtonRules'
import axiosInstance from '../../api/axiosInstance'
import { ApiResponse, FileMetadata } from '../../types/common.types'

const FILE_ENTITY_TYPE = 'od_plan'
const fetchFiles = async (planId: number): Promise<FileMetadata[]> => {
  const res = await axiosInstance.get<ApiResponse<FileMetadata[]>>(`/files/by-entity/${FILE_ENTITY_TYPE}/${planId}`)
  return res.data.data || []
}
const uploadFile = async ({ file, planId }: { file: File; planId: number }): Promise<FileMetadata> => {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('entityType', FILE_ENTITY_TYPE)
  fd.append('entityId', String(planId))
  const res = await axiosInstance.post<ApiResponse<FileMetadata>>('/files/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  return res.data.data
}
const deleteFileApi = async (fileId: number): Promise<void> => {
  await axiosInstance.delete(`/files/${fileId}`)
}

const HALVES = ['상반기', '하반기', '수시']
const METHODS = ['내원검진', '출장검진']
const STATUSES = ['계획', '진행중', '완료', '취소']

const halfColor = (h: string): 'primary' | 'secondary' | 'warning' | 'default' => {
  switch (h) { case '상반기': return 'primary'; case '하반기': return 'secondary'; case '수시': return 'warning'; default: return 'default' }
}
const statusColor = (s: string): 'success' | 'info' | 'warning' | 'error' | 'default' => {
  switch (s) { case '완료': return 'success'; case '계획': return 'info'; case '진행중': return 'warning'; case '취소': return 'error'; default: return 'default' }
}

const emptyForm: Partial<OdPlan> = { half: '상반기', method: '내원검진', status: '계획', targetCount: 0 }

const MENU = '보건 관리 › 직업병 관리 › 검진계획'

const OdPlanTab: React.FC = () => {
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
  const { data: items = [], isLoading } = useQuery({ queryKey: ['odPlans'], queryFn: planApi.list })
  const { data: stats } = useQuery({ queryKey: ['odStats'], queryFn: odStatsApi.get })

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<OdPlan | null>(null)
  const [form, setForm] = useState<Partial<OdPlan>>(emptyForm)
  const [pickerOpen, setPickerOpen] = useState(false)
  // 등록 모드: plan id 가 없으니 client staging → submit 직후 일괄 업로드
  const [pendingFiles, setPendingFiles] = useState<File[]>([])

  const onPicked = (users: UserInfo[]) => {
    if (users[0]) setForm(f => ({ ...f, mgr: users[0].name }))
    setPickerOpen(false)
  }

  const createMut = useMutation({ mutationFn: (e: Partial<OdPlan>) => planApi.create(e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['odPlans'] }); qc.invalidateQueries({ queryKey: ['odStats'] }) } })
  const updateMut = useMutation({ mutationFn: ({ id, e }: { id: number; e: Partial<OdPlan> }) => planApi.update(id, e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['odPlans'] }); qc.invalidateQueries({ queryKey: ['odStats'] }); setOpen(false) } })
  const deleteMut = useMutation({ mutationFn: (id: number) => planApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['odPlans'] }); qc.invalidateQueries({ queryKey: ['odStats'] }) } })

  // 첨부파일 — 편집 중인 plan id 가 있을 때만 서버 조회
  const { data: files = [] } = useQuery({
    queryKey: ['odPlanFiles', editing?.id],
    queryFn: () => fetchFiles(editing!.id),
    enabled: !!editing?.id && open,
  })
  const uploadFileMut = useMutation({
    mutationFn: uploadFile,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['odPlanFiles'] }),
  })
  const deleteFileMut = useMutation({
    mutationFn: deleteFileApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['odPlanFiles'] }),
  })

  const closeDialog = () => { setOpen(false); setPendingFiles([]); setEditing(null); setForm(emptyForm) }
  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, startDate: todayStr(), endDate: weekFromTodayStr() }); setPendingFiles([]); setOpen(true) }
  const openEdit = (p: OdPlan) => { setEditing(p); setForm(p); setPendingFiles([]); setOpen(true) }
  const submit = async () => {
    if (editing) {
      updateMut.mutate({ id: editing.id, e: form })
    } else {
      // create + 스테이징 파일 업로드
      try {
        const created = await createMut.mutateAsync(form)
        if (pendingFiles.length > 0 && created?.id) {
          for (const f of pendingFiles) {
            try { await uploadFile({ file: f, planId: created.id }) } catch { /* 개별 실패 무시 */ }
          }
        }
        closeDialog()
      } catch { /* createMut onError 처리 */ }
    }
  }
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (editing) {
      uploadFileMut.mutate({ file: f, planId: editing.id })
    } else {
      setPendingFiles(prev => [...prev, f])
    }
    e.target.value = ''
  }
  const removePending = (idx: number) => setPendingFiles(prev => prev.filter((_, i) => i !== idx))

  const totalTargets = items.reduce((s, p) => s + (p.targetCount || 0), 0)

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}><StatCard color="blue"  value={stats?.planTotal ?? 0}        label={t('odPlanTab.label1', '검진 계획 총계')} /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="green" value={stats?.planDoneCount ?? 0}   label={t('odPlanTab.label2', '완료')} /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="yellow" value={stats?.planPlannedCount ?? 0} label={t('odPlanTab.label3', '계획·진행중')} /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="purple" value={totalTargets}                  label={t('odPlanTab.label4', '누적 대상 인원')} sub={`${items.length}개 일정`} /></Grid>
      </Grid>

      <Stack direction="row" sx={{ mb: 2 }} justifyContent="flex-end">
        {canSee(MENU, 'LIST', 'New', myRoles) && (
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreate}
            sx={{ width: { xs: '100%', md: 'auto' } }}>
            New
          </Button>
        )}
      </Stack>

      {isLoading ? <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box> : (
        <>
        {/* PC 테이블 */}
        <Paper variant="outlined" sx={{ display: { xs: 'none', md: 'block' } }}>
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell align="center">구분</TableCell><TableCell>기관명</TableCell><TableCell align="center">검진방법</TableCell>
                <TableCell align="center">검진기간</TableCell><TableCell align="right">대상인원</TableCell>
                <TableCell>유해인자</TableCell><TableCell align="center">담당자</TableCell><TableCell align="center">상태</TableCell>
                <TableCell>비고</TableCell><TableCell align="center" sx={{ width: 80 }}>액션</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {items.map(p => (
                  <TableRow key={p.id} hover>
                    <TableCell align="center"><Chip size="small" label={p.half} color={halfColor(p.half)} /></TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{p.orgName}</TableCell>
                    <TableCell align="center"><Chip size="small" label={p.method} variant="outlined" /></TableCell>
                    <TableCell align="center">{p.startDate} ~ {p.endDate}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'info.main' }}>{p.targetCount}명</TableCell>
                    <TableCell>{p.hazardFactors}</TableCell>
                    <TableCell align="center">{p.mgr}</TableCell>
                    <TableCell align="center"><Chip size="small" label={p.status} color={statusColor(p.status)} /></TableCell>
                    <TableCell sx={{ color: 'text.disabled' }}>{p.note || '-'}</TableCell>
                    <TableCell align="center" sx={{ width: 80, whiteSpace: 'nowrap', px: 0.5 }}>
                      {canSee(MENU, 'DETAIL', '수정', getRoles(selected ?? {})) && (
                        <IconButton size="small" onClick={() => openEdit(p)}><EditIcon fontSize="inherit" /></IconButton>
                      )}
                      {canSee(MENU, 'DETAIL', '삭제', getRoles(selected ?? {})) && (
                        <IconButton size="small" onClick={async () => { if (await showConfirm(t('odPlanTab.msg1', '삭제하시겠습니까?'))) deleteMut.mutate(p.id) }}><DeleteIcon fontSize="inherit" /></IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && <TableRow><TableCell colSpan={10} align="center" sx={{ color: 'text.disabled', py: 6 }}>등록된 일정이 없습니다</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* 모바일 카드 */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1 }}>
          {items.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', color: 'text.disabled' }}>등록된 일정이 없습니다</Paper>
          ) : items.map(p => (
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
                {p.startDate} ~ {p.endDate} · {p.targetCount}명
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                담당: {p.mgr || '-'} · {p.hazardFactors || '-'}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 0.5 }}>
                {canSee(MENU, 'DETAIL', '수정', getRoles(selected ?? {})) && (
                  <IconButton size="small" onClick={() => openEdit(p)}><EditIcon fontSize="small" /></IconButton>
                )}
                {canSee(MENU, 'DETAIL', '삭제', getRoles(selected ?? {})) && (
                  <IconButton size="small" onClick={async () => { if (await showConfirm(t('odPlanTab.msg2', '삭제하시겠습니까?'))) deleteMut.mutate(p.id) }}><DeleteIcon fontSize="small" /></IconButton>
                )}
              </Box>
            </Paper>
          ))}
        </Box>
        </>
      )}

      <Dialog open={open} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? '검진계획 수정' : '검진계획 등록'}</DialogTitle>
        <DialogContent dividers>
          <FormTable>
            <FormRow>
              <FormLabel required>구분</FormLabel>
              <FormCell borderRight>
                <TextField select fullWidth size="small" value={form.half || ''} onChange={e => setForm({ ...form, half: e.target.value })}>
                  <MenuItem value="">선택하세요</MenuItem>
                  {HALVES.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                </TextField>
              </FormCell>
              <FormLabel>검진방법</FormLabel>
              <FormCell>
                <TextField select fullWidth size="small" value={form.method || ''} onChange={e => setForm({ ...form, method: e.target.value })}>
                  <MenuItem value="">선택하세요</MenuItem>
                  {METHODS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </TextField>
              </FormCell>
            </FormRow>
            <FormRow>
              <FormLabel required>기관명</FormLabel>
              <FormCell>
                <TextField fullWidth size="small" value={form.orgName || ''} onChange={e => setForm({ ...form, orgName: e.target.value })} />
              </FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>검진 시작일</FormLabel>
              <FormCell borderRight>
                <DatePickerField value={form.startDate || null} onChange={d => setForm({ ...form, startDate: d })} />
              </FormCell>
              <FormLabel>검진 종료일</FormLabel>
              <FormCell>
                <DatePickerField value={form.endDate || null} onChange={d => setForm({ ...form, endDate: d })} />
              </FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>담당자</FormLabel>
              <FormCell>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField fullWidth size="small" InputProps={{ readOnly: true }}
                    value={form.mgr || ''} placeholder="조직도에서 선택" />
                  <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setPickerOpen(true)}>
                    <PersonSearchIcon fontSize="small" />
                  </Button>
                </Box>
              </FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>유해인자</FormLabel>
              <FormCell>
                <TextField fullWidth size="small" value={form.hazardFactors || ''} onChange={e => setForm({ ...form, hazardFactors: e.target.value })} />
              </FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>상태</FormLabel>
              <FormCell>
                <TextField select fullWidth size="small" value={form.status || '계획'} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <MenuItem value="">선택하세요</MenuItem>
                  {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>비고</FormLabel>
              <FormCell>
                <TextField fullWidth size="small" multiline minRows={2} value={form.note || ''} onChange={e => setForm({ ...form, note: e.target.value })} />
              </FormCell>
            </FormRow>
            <FormRow last>
              <FormLabel>첨부파일</FormLabel>
              <FormCell>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, width: '100%' }}>
                  <Box>
                    <Button variant="outlined" component="label" size="small" startIcon={<CloudUploadIcon />}>
                      업로드
                      <input type="file" hidden onChange={handleFileChange} />
                    </Button>
                  </Box>
                  {!editing && pendingFiles.length > 0 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {pendingFiles.map((f, idx) => (
                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 0.5, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                          <AttachFileIcon fontSize="small" />
                          <Typography variant="body2" sx={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</Typography>
                          <IconButton size="small" color="error" onClick={() => removePending(idx)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  )}
                  {editing && files.length > 0 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {files.map(f => (
                        <Box key={f.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 0.5, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                          <AttachFileIcon fontSize="small" />
                          <Typography variant="body2" sx={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.fileName}</Typography>
                          <IconButton size="small" color="error" onClick={() => deleteFileMut.mutate(f.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              </FormCell>
            </FormRow>
          </FormTable>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={closeDialog}>취소</Button>
          {canSee(MENU, 'DETAIL', '저장', getRoles(selected ?? {})) && (
            <Button variant="contained" onClick={submit} disabled={!form.orgName}>저장</Button>
          )}
        </DialogActions>
      </Dialog>

      <UserSelectModal open={pickerOpen} onClose={() => setPickerOpen(false)} selectedUsers={[]} onConfirm={onPicked} singleSelect useCompanyTree title="담당자 선택 (조직도)" />
    </Box>
  )
}

export default OdPlanTab
