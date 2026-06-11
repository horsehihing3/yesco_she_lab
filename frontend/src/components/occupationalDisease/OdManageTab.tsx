import { useState } from 'react'
import { isSystemAdmin } from '../../utils/auth'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Grid, Paper, Stack, TextField, MenuItem, Button, Chip, Typography,
  CircularProgress, Divider,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import { odOrgApi } from '../../api/occupationalDiseaseApi'
import type { OdOrg } from '../../types/occupationalDisease.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import NumberField from '../common/NumberField'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import { useButtonRules } from '../../hooks/useButtonRules'

const ORG_TYPES = ['특수검진 전문기관', '일반검진기관']

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const emptyForm: Partial<OdOrg> = { orgType: '특수검진 전문기관' }

const MENU = '보건 관리 › 직업병 관리 › 검진관리'

const OdManageTab: React.FC = () => {
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
  const { data: orgs = [], isLoading } = useQuery({ queryKey: ['odOrgs'], queryFn: odOrgApi.list })

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selected, setSelected] = useState<OdOrg | null>(null)
  const [form, setForm] = useState<Partial<OdOrg>>(emptyForm)

  const handleBackToList = () => { setViewMode('list'); setSelected(null); setForm(emptyForm) }

  const createMut = useMutation({ mutationFn: (e: Partial<OdOrg>) => odOrgApi.create(e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['odOrgs'] }); handleBackToList() } })
  const updateMut = useMutation({ mutationFn: ({ id, e }: { id: number; e: Partial<OdOrg> }) => odOrgApi.update(id, e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['odOrgs'] }); handleBackToList() } })
  const deleteMut = useMutation({ mutationFn: (id: number) => odOrgApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['odOrgs'] }); handleBackToList() } })

  const handleCardClick = (o: OdOrg) => { setSelected(o); setViewMode('detail') }
  const handleAddClick = () => { setSelected(null); setForm({ ...emptyForm, contractEnd: todayStr() }); setViewMode('create') }
  const handleEditClick = () => { if (selected) { setForm({ ...selected }); setViewMode('edit') } }
  const handleDeleteClick = async () => {
    if (!selected) return
    if (await showConfirm(t('odManageTab.msg1', '삭제하시겠습니까?'))) deleteMut.mutate(selected.id)
  }
  const handleSave = () => {
    if (!form.name) return
    if (viewMode === 'edit' && selected) updateMut.mutate({ id: selected.id, e: form })
    else createMut.mutate(form)
  }

  const totalTargets = orgs.reduce((s, o) => s + (o.targetCount || 0), 0)
  const totalCost = orgs.reduce((s, o) => s + (o.costPerPerson || 0) * (o.targetCount || 0), 0)

  // ─── DETAIL ───
  if (viewMode === 'detail' && selected) {
    return (
      <Box>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>{t('odManageTab.section1', '검진기관 상세')}</Typography>
        <FormTable>
          <FormRow><FormLabel>기관명</FormLabel><FormCell><Typography variant="body2" fontWeight={600}>{selected.name}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>대표 의사</FormLabel><FormCell borderRight><Typography variant="body2">{selected.doctor || ''}</Typography></FormCell><FormLabel>지정 유형</FormLabel><FormCell><Typography variant="body2">{selected.orgType || ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>지정 유해인자</FormLabel><FormCell><Typography variant="body2">{selected.factors || ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>인당 검진비</FormLabel><FormCell borderRight><Typography variant="body2" fontFamily="monospace">₩{selected.costPerPerson?.toLocaleString()}</Typography></FormCell><FormLabel>계약 만료일</FormLabel><FormCell><Typography variant="body2" fontFamily="monospace">{selected.contractEnd || ''}</Typography></FormCell></FormRow>
          <FormRow last><FormLabel>담당 인원</FormLabel><FormCell><Typography variant="body2" fontFamily="monospace">{selected.targetCount ?? 0}명</Typography></FormCell></FormRow>
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
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>{viewMode === 'edit' ? '검진기관 수정' : '검진기관 등록'}</Typography>
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
        <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' }, gap: 1, mt: 2 }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>취소</Button>
          {canSee(MENU, 'DETAIL', '저장', getRoles(selected ?? {})) && (
            <Button variant="contained" onClick={handleSave} disabled={!form.name} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>저장</Button>
          )}
        </Box>
      </Box>
    )
  }

  // ─── LIST ───
  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}><StatCard color="blue"  value={orgs.length}             label={t('odManageTab.label1', '계약 검진기관')} /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="green" value={totalTargets}              label={t('odManageTab.label2', '대상자 명부')} /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="yellow" value={`₩${(totalCost/1000000).toFixed(1)}M`} label={t('odManageTab.label3', '연간 검진 예산')} /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="purple" value={ORG_TYPES.length}          label={t('odManageTab.label4', '기관 유형 수')} /></Grid>
      </Grid>

      <Stack direction="row" sx={{ mb: 2 }} justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle1" fontWeight={700}>{t('odManageTab.section2', '검진기관 관리')}</Typography>
        {canSee(MENU, 'LIST', 'New', myRoles) && (
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddClick}>New</Button>
        )}
      </Stack>

      {isLoading ? <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box> : (
        <Grid container spacing={1.5}>
          {orgs.map(o => (
            <Grid item xs={12} sm={6} md={4} key={o.id}>
              <Paper variant="outlined" sx={{ p: 2, cursor: 'pointer', '&:hover': { borderColor: 'primary.main' } }} onClick={() => handleCardClick(o)}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{ width: 40, height: 40, borderRadius: 1.5, bgcolor: 'primary.light', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}><LocalHospitalIcon color="primary" /></Box>
                    <Box><Typography fontWeight={700}>{o.name}</Typography><Typography variant="caption" color="text.secondary">{o.orgType}</Typography></Box>
                  </Stack>
                  <Chip size="small" label={t('odManageTab.label5', '계약중')} color="success" />
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>{o.doctor} · 검진 인자: {o.factors}</Typography>
                <Divider sx={{ my: 1 }} />
                <Grid container spacing={1}>
                  <Grid item xs={6}><Typography variant="caption" color="text.disabled">인당 검진비</Typography><Typography variant="body2" fontWeight={600}>₩{o.costPerPerson?.toLocaleString()}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="caption" color="text.disabled">계약 만료</Typography><Typography variant="body2">{o.contractEnd}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="caption" color="text.disabled">담당 인원</Typography><Typography variant="body2" fontWeight={600}>{o.targetCount}명</Typography></Grid>
                  <Grid item xs={6}><Typography variant="caption" color="text.disabled">연간 예상</Typography><Typography variant="body2">₩{(((o.costPerPerson||0)*(o.targetCount||0))/10000).toFixed(0)}만</Typography></Grid>
                </Grid>
              </Paper>
            </Grid>
          ))}
          {orgs.length === 0 && <Grid item xs={12}><Paper variant="outlined" sx={{ p: 6, textAlign: 'center', color: 'text.disabled' }}>등록된 기관이 없습니다</Paper></Grid>}
        </Grid>
      )}
    </Box>
  )
}

export default OdManageTab
