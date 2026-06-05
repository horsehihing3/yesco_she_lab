import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Grid, Paper, Stack, TextField, MenuItem, Button, Chip, Typography,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, CircularProgress, Divider,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import { odOrgApi } from '../../api/occupationalDiseaseApi'
import type { OdOrg } from '../../types/occupationalDisease.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import NumberField from '../common/NumberField'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import { useAlert } from '../../contexts/AlertContext'

const ORG_TYPES = ['특수검진 전문기관', '일반검진기관']

const emptyForm: Partial<OdOrg> = { orgType: '특수검진 전문기관' }

const OdManageTab: React.FC = () => {
  const qc = useQueryClient()
  const { showConfirm } = useAlert()
  const { data: orgs = [], isLoading } = useQuery({ queryKey: ['odOrgs'], queryFn: odOrgApi.list })

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<OdOrg | null>(null)
  const [form, setForm] = useState<Partial<OdOrg>>(emptyForm)

  const createMut = useMutation({ mutationFn: (e: Partial<OdOrg>) => odOrgApi.create(e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['odOrgs'] }); setOpen(false) } })
  const updateMut = useMutation({ mutationFn: ({ id, e }: { id: number; e: Partial<OdOrg> }) => odOrgApi.update(id, e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['odOrgs'] }); setOpen(false) } })
  const deleteMut = useMutation({ mutationFn: (id: number) => odOrgApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['odOrgs'] }) } })

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, contractEnd: todayStr() }); setOpen(true) }
  const openEdit = (o: OdOrg) => { setEditing(o); setForm(o); setOpen(true) }
  const submit = () => { if (editing) updateMut.mutate({ id: editing.id, e: form }); else createMut.mutate(form) }

  const totalTargets = orgs.reduce((s, o) => s + (o.targetCount || 0), 0)
  const totalCost = orgs.reduce((s, o) => s + (o.costPerPerson || 0) * (o.targetCount || 0), 0)

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}><StatCard color="blue"  value={orgs.length}             label="계약 검진기관" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="green" value={totalTargets}              label="대상자 명부" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="yellow" value={`₩${(totalCost/1000000).toFixed(1)}M`} label="연간 검진 예산" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="purple" value={ORG_TYPES.length}          label="기관 유형 수" /></Grid>
      </Grid>

      <Stack direction="row" sx={{ mb: 2 }} justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle1" fontWeight={700}>검진기관 관리</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreate}>New</Button>
      </Stack>

      {isLoading ? <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box> : (
        <Grid container spacing={1.5}>
          {orgs.map(o => (
            <Grid item xs={12} sm={6} md={4} key={o.id}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{ width: 40, height: 40, borderRadius: 1.5, bgcolor: 'primary.light', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}><LocalHospitalIcon color="primary" /></Box>
                    <Box><Typography fontWeight={700}>{o.name}</Typography><Typography variant="caption" color="text.secondary">{o.orgType}</Typography></Box>
                  </Stack>
                  <Chip size="small" label="계약중" color="success" />
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>{o.doctor} · 검진 인자: {o.factors}</Typography>
                <Divider sx={{ my: 1 }} />
                <Grid container spacing={1}>
                  <Grid item xs={6}><Typography variant="caption" color="text.disabled">인당 검진비</Typography><Typography variant="body2" fontWeight={600}>₩{o.costPerPerson?.toLocaleString()}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="caption" color="text.disabled">계약 만료</Typography><Typography variant="body2">{o.contractEnd}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="caption" color="text.disabled">담당 인원</Typography><Typography variant="body2" fontWeight={600}>{o.targetCount}명</Typography></Grid>
                  <Grid item xs={6}><Typography variant="caption" color="text.disabled">연간 예상</Typography><Typography variant="body2">₩{(((o.costPerPerson||0)*(o.targetCount||0))/10000).toFixed(0)}만</Typography></Grid>
                </Grid>
                <Stack direction="row" spacing={0.5} sx={{ mt: 1 }} justifyContent="flex-end">
                  <IconButton size="small" onClick={() => openEdit(o)}><EditIcon fontSize="inherit" /></IconButton>
                  <IconButton size="small" onClick={async () => { if (await showConfirm('삭제하시겠습니까?')) deleteMut.mutate(o.id) }}><DeleteIcon fontSize="inherit" /></IconButton>
                </Stack>
              </Paper>
            </Grid>
          ))}
          {orgs.length === 0 && <Grid item xs={12}><Paper variant="outlined" sx={{ p: 6, textAlign: 'center', color: 'text.disabled' }}>등록된 기관이 없습니다</Paper></Grid>}
        </Grid>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? '검진기관 수정' : '검진기관 등록'}</DialogTitle>
        <DialogContent dividers>
          <FormTable>
            <FormRow>
              <FormLabel required>기관명</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>대표 의사</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.doctor || ''} onChange={e => setForm({ ...form, doctor: e.target.value })} /></FormCell>
              <FormLabel>지정 유형</FormLabel>
              <FormCell><TextField select fullWidth size="small" value={form.orgType || ''} onChange={e => setForm({ ...form, orgType: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{ORG_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>지정 유해인자</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.factors || ''} onChange={e => setForm({ ...form, factors: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>인당 검진비</FormLabel>
              <FormCell borderRight><NumberField fullWidth size="small" value={form.costPerPerson ?? null} onChange={v => setForm({ ...form, costPerPerson: v ?? 0 })} min={0} thousandSeparator /></FormCell>
              <FormLabel>계약 만료일</FormLabel>
              <FormCell><DatePickerField value={form.contractEnd || null} onChange={d => setForm({ ...form, contractEnd: d })} /></FormCell>
            </FormRow>
            <FormRow last>
              <FormLabel>담당 인원</FormLabel>
              <FormCell><NumberField fullWidth size="small" value={form.targetCount ?? null} onChange={v => setForm({ ...form, targetCount: v ?? 0 })} min={0} /></FormCell>
            </FormRow>
          </FormTable>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setOpen(false)}>취소</Button>
          <Button variant="contained" onClick={submit} disabled={!form.name}>저장</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default OdManageTab
