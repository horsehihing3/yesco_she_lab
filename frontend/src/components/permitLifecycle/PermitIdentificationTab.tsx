import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Grid, Paper, Stack, TextField, MenuItem, Button, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, CircularProgress,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { permitIdentApi, permitLifecycleStatsApi } from '../../api/permitLifecycleApi'
import type { PermitIdentification } from '../../types/permitLifecycle.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import { useAlert } from '../../contexts/AlertContext'

const STATUSES = ['식별완료', '검토중', '미식별', '미대상']
const CATEGORIES = ['환경', '안전', '보건', '소방', '화학', '건축']

const statusColor = (s?: string): 'success' | 'warning' | 'error' | 'default' =>
  s === '식별완료' ? 'success' : s === '검토중' ? 'warning' : s === '미식별' ? 'error' : 'default'

const emptyForm: Partial<PermitIdentification> = { status: '검토중' }

const PermitIdentificationTab: React.FC = () => {
  const qc = useQueryClient()
  const { showConfirm, showSuccess, showError } = useAlert()

  const { data: list = [], isLoading } = useQuery({ queryKey: ['permitIdent'], queryFn: permitIdentApi.list })
  const { data: stats } = useQuery({ queryKey: ['permitLifecycleStats'], queryFn: permitLifecycleStatsApi.get })

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<PermitIdentification | null>(null)
  const [form, setForm] = useState<Partial<PermitIdentification>>(emptyForm)

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['permitIdent'] })
    qc.invalidateQueries({ queryKey: ['permitLifecycleStats'] })
  }

  const createM = useMutation({
    mutationFn: permitIdentApi.create,
    onSuccess: () => { invalidate(); setOpen(false); showSuccess('등록되었습니다') },
    onError: () => showError('등록에 실패했습니다'),
  })
  const updateM = useMutation({
    mutationFn: ({ id, e }: { id: number; e: Partial<PermitIdentification> }) => permitIdentApi.update(id, e),
    onSuccess: () => { invalidate(); setOpen(false); showSuccess('수정되었습니다') },
    onError: () => showError('수정에 실패했습니다'),
  })
  const deleteM = useMutation({
    mutationFn: permitIdentApi.remove,
    onSuccess: () => { invalidate(); showSuccess('삭제되었습니다') },
  })

  const filtered = useMemo(() => list.filter((x) => {
    if (filterStatus !== 'all' && x.status !== filterStatus) return false
    if (search) {
      const q = search.toLowerCase()
      const hay = `${x.equipmentName} ${x.equipmentType || ''} ${x.location || ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  }), [list, filterStatus, search])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true) }
  const openEdit = (item: PermitIdentification) => { setEditing(item); setForm({ ...item }); setOpen(true) }
  const handleSave = () => {
    if (!form.equipmentName) { showError('설비명을 입력해주세요'); return }
    if (editing) updateM.mutate({ id: editing.id, e: form })
    else createM.mutate(form)
  }

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}><StatCard color="blue"   value={stats?.identTotal ?? 0}  label="전체 식별" sub="건" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="green"  value={stats?.identDone ?? 0}   label="식별완료" sub="인허가 매핑 완료" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="yellow" value={stats?.identReview ?? 0} label="검토 중" sub="대상 여부 판정 중" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="red"    value={stats?.identMiss ?? 0}   label="미식별" sub="조치 필요" /></Grid>
      </Grid>

      <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <TextField size="small" placeholder="설비명·위치 검색" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ flex: 1, minWidth: 180 }} />
          <TextField select size="small" label="식별 상태" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} sx={{ minWidth: 130 }}>
            <MenuItem value="all">전체</MenuItem>
            {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ mb: 2 }}>
        {isLoading ? <Box sx={{ p: 6, textAlign: 'center' }}><CircularProgress /></Box> : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>설비·시설명</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>시설 종류</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>위치</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 110 }}>설치일</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 90 }}>상태</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 120 }}>평가자</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 90 }}>작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.disabled' }}>식별 항목이 없습니다</TableCell></TableRow>
                ) : filtered.map((x) => (
                  <TableRow key={x.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{x.equipmentName}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{x.equipmentType || '-'}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{x.location || '-'}</TableCell>
                    <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{x.installDate || '-'}</TableCell>
                    <TableCell align="center"><Chip size="small" label={x.status} color={statusColor(x.status)} /></TableCell>
                    <TableCell align="center" sx={{ fontSize: '0.85rem' }}>{x.assessor || '-'}</TableCell>
                    <TableCell align="center" sx={{ whiteSpace: 'nowrap', px: 0.5 }}>
                      <IconButton size="small" onClick={() => openEdit(x)}><EditIcon fontSize="inherit" /></IconButton>
                      <IconButton size="small" onClick={async () => {
                        if (await showConfirm('이 식별 항목을 삭제하시겠습니까?')) deleteM.mutate(x.id)
                      }}><DeleteIcon fontSize="inherit" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Stack direction="row" justifyContent="flex-end">
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>신규 등록</Button>
      </Stack>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? '식별 항목 수정' : '식별 항목 등록'}</DialogTitle>
        <DialogContent dividers>
          <FormTable>
            <FormRow>
              <FormLabel required>설비·시설명</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.equipmentName || ''} onChange={(e) => setForm({ ...form, equipmentName: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>시설 종류</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.equipmentType || ''} onChange={(e) => setForm({ ...form, equipmentType: e.target.value })} /></FormCell>
              <FormLabel>식별 상태</FormLabel>
              <FormCell>
                <TextField select fullWidth size="small" value={form.status || ''} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <MenuItem value="">선택</MenuItem>
                  {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>위치</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} /></FormCell>
              <FormLabel>설치일</FormLabel>
              <FormCell><DatePickerField value={form.installDate || null} onChange={(d) => setForm({ ...form, installDate: d || undefined })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>해당 분야</FormLabel>
              <FormCell><TextField fullWidth size="small" placeholder="예: 환경,화학,소방 (쉼표 구분)" value={form.applicableCategories || ''} onChange={(e) => setForm({ ...form, applicableCategories: e.target.value })} helperText={`선택지: ${CATEGORIES.join(' / ')}`} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>예상 인허가</FormLabel>
              <FormCell><TextField fullWidth size="small" placeholder="예: 대기배출시설,안전검사 (쉼표 구분)" value={form.applicablePermits || ''} onChange={(e) => setForm({ ...form, applicablePermits: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>연결된 인허가</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.linkedPermits || ''} onChange={(e) => setForm({ ...form, linkedPermits: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>평가자</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.assessor || ''} onChange={(e) => setForm({ ...form, assessor: e.target.value })} /></FormCell>
              <FormLabel>평가일</FormLabel>
              <FormCell><DatePickerField value={form.assessmentDate || null} onChange={(d) => setForm({ ...form, assessmentDate: d || undefined })} /></FormCell>
            </FormRow>
            <FormRow last>
              <FormLabel>비고</FormLabel>
              <FormCell><TextField fullWidth size="small" multiline minRows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></FormCell>
            </FormRow>
          </FormTable>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>취소</Button>
          <Button variant="contained" onClick={handleSave} disabled={createM.isPending || updateM.isPending}>저장</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PermitIdentificationTab
