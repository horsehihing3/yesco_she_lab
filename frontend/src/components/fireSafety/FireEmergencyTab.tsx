import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Grid, Paper, Stack, TextField, MenuItem, Button, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, CircularProgress,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { fireContactApi, fireDrillApi, fireStatsApi } from '../../api/fireSafetyApi'
import type { FireContact, FireDrill } from '../../types/fireSafety.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import NumberField from '../common/NumberField'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import { useAlert } from '../../contexts/AlertContext'

const ORG_TYPES = ['소방서', '경찰서', '구급대', '화학방재', '전기·가스 긴급', '수리업체', '내부담당']
const DRILL_TYPES = ['소방훈련 (전체 대피)', '소방훈련 (초기진압)', '화학물질 누출 방제훈련', '종합 비상훈련']
const FIRE_OBS = ['있음 (소방서 요청)', '있음 (자체 요청)', '없음']
const RESULTS = ['우수', '양호', '미흡']

const resultColor = (r?: string): 'success' | 'warning' | 'error' | 'default' =>
  r === '우수' ? 'success' : r === '양호' ? 'warning' : r === '미흡' ? 'error' : 'default'

const emptyContact: Partial<FireContact> = { orgType: '내부담당' }
const emptyDrill: Partial<FireDrill> = { drillType: '소방훈련 (전체 대피)', fireDeptObs: '없음', result: '양호', drillDate: new Date().toISOString().slice(0, 10) }

const FireEmergencyTab: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showConfirm } = useAlert()
  const { data: contacts = [], isLoading: l1 } = useQuery({ queryKey: ['fireContacts'], queryFn: fireContactApi.list })
  const { data: drills = [], isLoading: l2 } = useQuery({ queryKey: ['fireDrills'], queryFn: fireDrillApi.list })
  const { data: stats } = useQuery({ queryKey: ['fireStats'], queryFn: fireStatsApi.get })

  // Contact dialog
  const [cOpen, setCOpen] = useState(false)
  const [cEditing, setCEditing] = useState<FireContact | null>(null)
  const [cForm, setCForm] = useState<Partial<FireContact>>(emptyContact)
  const cCreate = useMutation({
    mutationFn: fireContactApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fireContacts'] }); qc.invalidateQueries({ queryKey: ['fireStats'] }); setCOpen(false) },
  })
  const cUpdate = useMutation({
    mutationFn: ({ id, e }: { id: number; e: Partial<FireContact> }) => fireContactApi.update(id, e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fireContacts'] }); setCOpen(false) },
  })
  const cDelete = useMutation({
    mutationFn: fireContactApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fireContacts'] }),
  })

  // Drill dialog
  const [dOpen, setDOpen] = useState(false)
  const [dEditing, setDEditing] = useState<FireDrill | null>(null)
  const [dForm, setDForm] = useState<Partial<FireDrill>>(emptyDrill)
  const dCreate = useMutation({
    mutationFn: fireDrillApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fireDrills'] }); qc.invalidateQueries({ queryKey: ['fireStats'] }); setDOpen(false) },
  })
  const dUpdate = useMutation({
    mutationFn: ({ id, e }: { id: number; e: Partial<FireDrill> }) => fireDrillApi.update(id, e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fireDrills'] }); setDOpen(false) },
  })
  const dDelete = useMutation({
    mutationFn: fireDrillApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fireDrills'] }),
  })

  const drillsYear = useMemo(() => drills.filter(d => d.drillDate?.startsWith(String(new Date().getFullYear()))), [drills])

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={2}><StatCard color="red"    value={stats?.drillTotal ?? 0}   label={t('fireEmergencyTab.label1', '총 훈련 이력')} /></Grid>
        <Grid item xs={6} sm={2}><StatCard color="green"  value={stats?.drillYear ?? 0}    label={t('fireEmergencyTab.label2', '올해 훈련 실시')} sub={`${new Date().getFullYear()}년`} /></Grid>
        <Grid item xs={6} sm={2}><StatCard color="blue"   value={stats?.contactTotal ?? 0} label={t('fireEmergencyTab.label3', '비상 연락처')} /></Grid>
        <Grid item xs={6} sm={2}><StatCard color="purple" value={drillsYear.filter(d => d.result === '우수').length} label={t('fireEmergencyTab.label4', '우수 평가')} sub="올해" /></Grid>
        <Grid item xs={6} sm={2}><StatCard color="yellow" value={drillsYear.filter(d => d.fireDeptObs?.startsWith('있음')).length} label={t('fireEmergencyTab.label5', '소방서 참관')} sub="올해" /></Grid>
        <Grid item xs={6} sm={2}><StatCard color="red"    value={drills.length === 0 ? 0 : '0건'} label={t('fireEmergencyTab.label6', '올해 화재')} sub="무사고 운영" /></Grid>
      </Grid>

      {/* ===== Contacts ===== */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={700}>{t('fireEmergencyTab.section1', '비상 연락망')}</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => { setCEditing(null); setCForm(emptyContact); setCOpen(true) }} sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>New</Button>
      </Stack>
      <Paper variant="outlined" sx={{ mb: 3 }}>
        {l1 ? <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box> : (
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell align="center">기관 유형</TableCell>
                <TableCell>기관·업체명</TableCell>
                <TableCell align="center">대표 전화</TableCell>
                <TableCell align="center">24시간 긴급</TableCell>
                <TableCell align="center">담당자</TableCell>
                <TableCell align="center">담당자 휴대폰</TableCell>
                <TableCell align="center">계약 기간</TableCell>
                <TableCell>대응 범위</TableCell>
                <TableCell align="center" sx={{ width: 80 }}>액션</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {contacts.map(v => (
                  <TableRow key={v.id} hover>
                    <TableCell align="center"><Chip size="small" label={v.orgType || '-'} variant="outlined" /></TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{v.orgName}</TableCell>
                    <TableCell align="center" sx={{ fontFamily: 'monospace' }}>{v.mainTel || '-'}</TableCell>
                    <TableCell align="center" sx={{ fontFamily: 'monospace', color: 'error.main', fontWeight: 700 }}>{v.emergencyTel || '-'}</TableCell>
                    <TableCell align="center">{v.mgrName || '-'}</TableCell>
                    <TableCell align="center" sx={{ fontFamily: 'monospace' }}>{v.mgrMobile || '-'}</TableCell>
                    <TableCell align="center">{v.contractPeriod || '-'}</TableCell>
                    <TableCell>{v.coverage || '-'}</TableCell>
                    <TableCell align="center" sx={{ width: 80, whiteSpace: 'nowrap', px: 0.5 }}>
                      <IconButton size="small" onClick={() => { setCEditing(v); setCForm({ ...v }); setCOpen(true) }}><EditIcon fontSize="inherit" /></IconButton>
                      <IconButton size="small" onClick={async () => { if (await showConfirm(t('fireEmergencyTab.msg1', '삭제하시겠습니까?'))) cDelete.mutate(v.id) }}><DeleteIcon fontSize="inherit" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {contacts.length === 0 && <TableRow><TableCell colSpan={9} align="center" sx={{ color: 'text.disabled', py: 6 }}>등록된 연락처가 없습니다</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* ===== Drills ===== */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={700}>{t('fireEmergencyTab.section2', '소방·방제 훈련 이력')}</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => { setDEditing(null); setDForm(emptyDrill); setDOpen(true) }} sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>New</Button>
      </Stack>
      <Paper variant="outlined">
        {l2 ? <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box> : (
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell align="center">훈련일</TableCell>
                <TableCell align="center">종류</TableCell>
                <TableCell>시나리오</TableCell>
                <TableCell align="center">참가 인원</TableCell>
                <TableCell align="center">대피 시간</TableCell>
                <TableCell align="center">담당자</TableCell>
                <TableCell align="center">소방서 참관</TableCell>
                <TableCell align="center">결과</TableCell>
                <TableCell>개선 사항</TableCell>
                <TableCell align="center" sx={{ width: 80 }}>액션</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {drills.map(v => (
                  <TableRow key={v.id} hover>
                    <TableCell align="center">{v.drillDate}</TableCell>
                    <TableCell align="center"><Chip size="small" label={v.drillType || '-'} variant="outlined" /></TableCell>
                    <TableCell sx={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.scenario || '-'}</TableCell>
                    <TableCell align="center">{v.participants != null ? `${v.participants}명` : '-'}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>{v.evacTime || '-'}</TableCell>
                    <TableCell align="center">{v.mgrName || '-'}</TableCell>
                    <TableCell align="center">{v.fireDeptObs || '-'}</TableCell>
                    <TableCell align="center"><Chip size="small" label={v.result || '-'} color={resultColor(v.result)} /></TableCell>
                    <TableCell sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.improvement || '-'}</TableCell>
                    <TableCell align="center" sx={{ width: 80, whiteSpace: 'nowrap', px: 0.5 }}>
                      <IconButton size="small" onClick={() => { setDEditing(v); setDForm({ ...v }); setDOpen(true) }}><EditIcon fontSize="inherit" /></IconButton>
                      <IconButton size="small" onClick={async () => { if (await showConfirm(t('fireEmergencyTab.msg2', '삭제하시겠습니까?'))) dDelete.mutate(v.id) }}><DeleteIcon fontSize="inherit" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {drills.length === 0 && <TableRow><TableCell colSpan={10} align="center" sx={{ color: 'text.disabled', py: 6 }}>훈련 기록이 없습니다</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* ===== Contact dialog ===== */}
      <Dialog open={cOpen} onClose={() => setCOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{cEditing ? '연락처 수정' : '연락처 등록'}</DialogTitle>
        <DialogContent dividers>
          <FormTable>
            <FormRow>
              <FormLabel>기관 유형</FormLabel>
              <FormCell borderRight><TextField select fullWidth size="small" value={cForm.orgType || ''} onChange={e => setCForm({ ...cForm, orgType: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{ORG_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField></FormCell>
              <FormLabel required>기관·업체명</FormLabel>
              <FormCell><TextField fullWidth size="small" value={cForm.orgName || ''} onChange={e => setCForm({ ...cForm, orgName: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>대표 전화</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={cForm.mainTel || ''} onChange={e => setCForm({ ...cForm, mainTel: e.target.value })} /></FormCell>
              <FormLabel>24시간 긴급</FormLabel>
              <FormCell><TextField fullWidth size="small" value={cForm.emergencyTel || ''} onChange={e => setCForm({ ...cForm, emergencyTel: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>담당자 성명</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={cForm.mgrName || ''} onChange={e => setCForm({ ...cForm, mgrName: e.target.value })} /></FormCell>
              <FormLabel>담당자 휴대폰</FormLabel>
              <FormCell><TextField fullWidth size="small" value={cForm.mgrMobile || ''} onChange={e => setCForm({ ...cForm, mgrMobile: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>계약 기간</FormLabel>
              <FormCell><TextField fullWidth size="small" placeholder="예) 2026-01-01 ~ 2026-12-31" value={cForm.contractPeriod || ''} onChange={e => setCForm({ ...cForm, contractPeriod: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>대응 범위</FormLabel>
              <FormCell><TextField fullWidth size="small" value={cForm.coverage || ''} onChange={e => setCForm({ ...cForm, coverage: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow last>
              <FormLabel>비고</FormLabel>
              <FormCell><TextField fullWidth size="small" multiline minRows={2} value={cForm.note || ''} onChange={e => setCForm({ ...cForm, note: e.target.value })} /></FormCell>
            </FormRow>
          </FormTable>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setCOpen(false)}>취소</Button>
          <Button variant="contained" onClick={() => cEditing ? cUpdate.mutate({ id: cEditing.id, e: cForm }) : cCreate.mutate(cForm)} disabled={!cForm.orgName}>저장</Button>
        </DialogActions>
      </Dialog>

      {/* ===== Drill dialog ===== */}
      <Dialog open={dOpen} onClose={() => setDOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{dEditing ? '훈련 기록 수정' : '훈련 기록 등록'}</DialogTitle>
        <DialogContent dividers>
          <FormTable>
            <FormRow>
              <FormLabel required>훈련일</FormLabel>
              <FormCell borderRight><DatePickerField value={dForm.drillDate || null} onChange={d => setDForm({ ...dForm, drillDate: d || '' })} /></FormCell>
              <FormLabel>훈련 종류</FormLabel>
              <FormCell><TextField select fullWidth size="small" value={dForm.drillType || ''} onChange={e => setDForm({ ...dForm, drillType: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{DRILL_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>시나리오</FormLabel>
              <FormCell><TextField fullWidth size="small" multiline minRows={2} value={dForm.scenario || ''} onChange={e => setDForm({ ...dForm, scenario: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>참가 인원</FormLabel>
              <FormCell borderRight><NumberField fullWidth value={dForm.participants ?? null} onChange={v => setDForm({ ...dForm, participants: v ?? undefined })} thousandSeparator={false} /></FormCell>
              <FormLabel>대피 시간</FormLabel>
              <FormCell><TextField fullWidth size="small" placeholder="예) 2분 50초" value={dForm.evacTime || ''} onChange={e => setDForm({ ...dForm, evacTime: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>훈련 주관자</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={dForm.mgrName || ''} onChange={e => setDForm({ ...dForm, mgrName: e.target.value })} /></FormCell>
              <FormLabel>소방서 참관</FormLabel>
              <FormCell><TextField select fullWidth size="small" value={dForm.fireDeptObs || ''} onChange={e => setDForm({ ...dForm, fireDeptObs: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{FIRE_OBS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>훈련 결과</FormLabel>
              <FormCell><TextField select fullWidth size="small" value={dForm.result || ''} onChange={e => setDForm({ ...dForm, result: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{RESULTS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}</TextField></FormCell>
            </FormRow>
            <FormRow last>
              <FormLabel>개선 사항</FormLabel>
              <FormCell><TextField fullWidth size="small" multiline minRows={2} value={dForm.improvement || ''} onChange={e => setDForm({ ...dForm, improvement: e.target.value })} /></FormCell>
            </FormRow>
          </FormTable>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setDOpen(false)}>취소</Button>
          <Button variant="contained" onClick={() => dEditing ? dUpdate.mutate({ id: dEditing.id, e: dForm }) : dCreate.mutate(dForm)} disabled={!dForm.drillDate}>저장</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default FireEmergencyTab
