import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Grid, Paper, Stack, TextField, MenuItem, Button, Chip, Alert,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, CircularProgress,
  Typography, LinearProgress,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { fireInspectionApi, fireIssueApi, firePlanApi, fireStatsApi } from '../../api/fireSafetyApi'
import type { FireInspection, FireIssue, FirePlan } from '../../types/fireSafety.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import NumberField from '../common/NumberField'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import DevTestFillButton from '../common/DevTestFillButton'
import { todayStr } from '../../utils/dateDefaults'
import { useAlert } from '../../contexts/AlertContext'

const INSP_TYPES = ['작동기능점검', '종합정밀점검', '자체점검', '화재안전조사']
const RESULTS = ['합격', '조건부합격', '불합격']
const SUBMIT_STATUSES = ['제출 완료', '제출 예정', '제출 불요']
const ISSUE_TYPES = ['불합격', '조건부합격']
const ISSUE_STATUSES = ['진행중', '완료', '지연']
const PLAN_STATUSES = ['계획', '예정', '완료']

const resultColor = (r?: string): 'success' | 'warning' | 'error' | 'default' =>
  r === '합격' ? 'success' : r === '조건부합격' ? 'warning' : r === '불합격' ? 'error' : 'default'
const issueStatusColor = (s?: string): 'warning' | 'success' | 'error' | 'default' =>
  s === '진행중' ? 'warning' : s === '완료' ? 'success' : s === '지연' ? 'error' : 'default'
const planStatusColor = (s?: string): 'info' | 'warning' | 'success' | 'default' =>
  s === '계획' ? 'info' : s === '예정' ? 'warning' : s === '완료' ? 'success' : 'default'

const emptyInsp: Partial<FireInspection> = { inspType: '자체점검', result: '합격', submitStatus: '제출 예정' }
const emptyIssue: Partial<FireIssue> = { issueType: '조건부합격', status: '진행중', progressPct: 0 }
const emptyPlan: Partial<FirePlan> = { status: '계획' }

const FireInspectionTab: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showConfirm } = useAlert()
  const { data: insps = [], isLoading: l1 } = useQuery({ queryKey: ['fireInspections'], queryFn: fireInspectionApi.list })
  const { data: issues = [], isLoading: l2 } = useQuery({ queryKey: ['fireIssues'], queryFn: fireIssueApi.list })
  const { data: plans = [], isLoading: l3 } = useQuery({ queryKey: ['firePlans'], queryFn: firePlanApi.list })
  const { data: stats } = useQuery({ queryKey: ['fireStats'], queryFn: fireStatsApi.get })

  // ===== Inspection dialog =====
  const [iOpen, setIOpen] = useState(false)
  const [iEditing, setIEditing] = useState<FireInspection | null>(null)
  const [iForm, setIForm] = useState<Partial<FireInspection>>(emptyInsp)
  const iCreate = useMutation({
    mutationFn: fireInspectionApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fireInspections'] }); qc.invalidateQueries({ queryKey: ['fireStats'] }); setIOpen(false) },
  })
  const iUpdate = useMutation({
    mutationFn: ({ id, e }: { id: number; e: Partial<FireInspection> }) => fireInspectionApi.update(id, e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fireInspections'] }); setIOpen(false) },
  })
  const iDelete = useMutation({
    mutationFn: fireInspectionApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fireInspections'] }),
  })

  // ===== Issue dialog =====
  const [sOpen, setSOpen] = useState(false)
  const [sEditing, setSEditing] = useState<FireIssue | null>(null)
  const [sForm, setSForm] = useState<Partial<FireIssue>>(emptyIssue)
  const sCreate = useMutation({
    mutationFn: fireIssueApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fireIssues'] }); qc.invalidateQueries({ queryKey: ['fireStats'] }); setSOpen(false) },
  })
  const sUpdate = useMutation({
    mutationFn: ({ id, e }: { id: number; e: Partial<FireIssue> }) => fireIssueApi.update(id, e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fireIssues'] }); qc.invalidateQueries({ queryKey: ['fireStats'] }); setSOpen(false) },
  })
  const sDelete = useMutation({
    mutationFn: fireIssueApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fireIssues'] }),
  })

  // ===== Plan dialog =====
  const [pOpen, setPOpen] = useState(false)
  const [pEditing, setPEditing] = useState<FirePlan | null>(null)
  const [pForm, setPForm] = useState<Partial<FirePlan>>(emptyPlan)
  const pCreate = useMutation({
    mutationFn: firePlanApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['firePlans'] }); setPOpen(false) },
  })
  const pUpdate = useMutation({
    mutationFn: ({ id, e }: { id: number; e: Partial<FirePlan> }) => firePlanApi.update(id, e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['firePlans'] }); setPOpen(false) },
  })
  const pDelete = useMutation({
    mutationFn: firePlanApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['firePlans'] }),
  })

  // DEV ONLY — 비어있는 항목을 소방 점검 도메인 더미데이터로 채움 (입력값은 보존)
  const fillIssue = () => setSForm(prev => ({
    ...prev,
    issueNo: prev.issueNo || 'F-2026-014',
    facility: prev.facility || '옥내소화전 (지하 1층)',
    issueType: prev.issueType || '조건부합격',
    foundDate: prev.foundDate || todayStr(),
    dueDate: prev.dueDate || todayStr(),
    issueContent: prev.issueContent || '옥내소화전 방수압력 기준치 미달 (0.13MPa)',
    actionContent: prev.actionContent || '가압송수장치 점검 및 압력 조정 후 재측정 예정',
    progressPct: prev.progressPct ?? 30,
    status: prev.status || '진행중',
    ownerName: prev.ownerName || '김소방',
  }))
  const fillInsp = () => setIForm(prev => ({
    ...prev,
    inspNo: prev.inspNo || 'INSP-2026-007',
    inspType: prev.inspType || '종합정밀점검',
    inspName: prev.inspName || '2026년 상반기 종합정밀점검',
    org: prev.org || '한국소방안전원',
    inspector: prev.inspector || '이점검',
    applyDate: prev.applyDate || todayStr(),
    inspDate: prev.inspDate || todayStr(),
    result: prev.result || '합격',
    cost: prev.cost ?? 2200000,
    submitStatus: prev.submitStatus || '제출 완료',
    submitDate: prev.submitDate || todayStr(),
    summary: prev.summary || '소화설비·경보설비·피난설비 전반 정상 작동 확인',
    issue: prev.issue || '일부 유도등 점등 불량 (3개소)',
    plan: prev.plan || '불량 유도등 교체 후 재점검 실시',
  }))
  const fillPlan = () => setPForm(prev => ({
    ...prev,
    planType: prev.planType || '작동기능점검',
    lawBasis: prev.lawBasis || '화재예방법 §22',
    cycle: prev.cycle || '연1회',
    planDate: prev.planDate || todayStr(),
    org: prev.org || '자체 점검 (소방안전관리자)',
    target: prev.target || '본관 전 층 소화설비·경보설비·피난설비',
    cost: prev.cost || '₩1,500,000',
    status: prev.status || '계획',
  }))

  const issuesOpen = useMemo(() => issues.filter(i => i.status === '진행중'), [issues])

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={2}><StatCard color="red"    value={stats?.issueOpen ?? 0}    label={t('fireInspectionTab.label1', '불량·지적 미결')} sub="즉시 개선" /></Grid>
        <Grid item xs={6} sm={2}><StatCard color="yellow" value={plans.filter(p => p.status === '예정').length} label={t('fireInspectionTab.label2', '점검 예정')} sub="일정 확정" /></Grid>
        <Grid item xs={6} sm={2}><StatCard color="green"  value={stats?.inspPassed ?? 0}   label={t('fireInspectionTab.label3', '합격')} sub="점검 결과" /></Grid>
        <Grid item xs={6} sm={2}><StatCard color="blue"   value={stats?.inspTotal ?? 0}    label={t('fireInspectionTab.label4', '총 점검 이력')} /></Grid>
        <Grid item xs={6} sm={2}><StatCard color="purple" value={stats?.issueDone ?? 0}    label={t('fireInspectionTab.label5', '지적 완료')} sub="개선 이행" /></Grid>
        <Grid item xs={6} sm={2}><StatCard color="red"    value={stats?.inspFailed ?? 0}   label={t('fireInspectionTab.label6', '불합격')} /></Grid>
      </Grid>

      {issuesOpen.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <strong>미결 지적사항 {issuesOpen.length}건 — 다음 점검 전 완료 필요</strong>
          {' · '}{issuesOpen.slice(0, 3).map(i => i.facility).join(' · ')}
        </Alert>
      )}

      {/* ===== Issues ===== */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={700}>{t('fireInspectionTab.section1', '미결 지적사항 추적')}</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => { setSEditing(null); setSForm(emptyIssue); setSOpen(true) }} sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>New</Button>
      </Stack>
      <Paper variant="outlined" sx={{ mb: 3 }}>
        {l2 ? <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box> : (
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell align="center">번호</TableCell>
                <TableCell>시설</TableCell>
                <TableCell align="center">유형</TableCell>
                <TableCell align="center">발견일</TableCell>
                <TableCell>지적 내용</TableCell>
                <TableCell>조치 계획</TableCell>
                <TableCell align="center">목표일</TableCell>
                <TableCell align="center" sx={{ minWidth: 120 }}>진행률</TableCell>
                <TableCell align="center">상태</TableCell>
                <TableCell align="center">담당자</TableCell>
                <TableCell align="center" sx={{ width: 80 }}>액션</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {issues.map(v => (
                  <TableRow key={v.id} hover>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>{v.issueNo}</TableCell>
                    <TableCell>{v.facility || '-'}</TableCell>
                    <TableCell align="center"><Chip size="small" label={v.issueType || '-'} color={v.issueType === '불합격' ? 'error' : 'warning'} /></TableCell>
                    <TableCell align="center">{v.foundDate || '-'}</TableCell>
                    <TableCell sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.issueContent || '-'}</TableCell>
                    <TableCell sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.actionContent || '-'}</TableCell>
                    <TableCell align="center">{v.dueDate || '-'}</TableCell>
                    <TableCell align="center">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <LinearProgress variant="determinate" value={v.progressPct ?? 0} sx={{ flex: 1, minWidth: 60, height: 6, borderRadius: 1 }} />
                        <Typography variant="caption" sx={{ minWidth: 30, fontWeight: 700 }}>{v.progressPct ?? 0}%</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="center"><Chip size="small" label={v.status} color={issueStatusColor(v.status)} /></TableCell>
                    <TableCell align="center">{v.ownerName || '-'}</TableCell>
                    <TableCell align="center" sx={{ width: 80, whiteSpace: 'nowrap', px: 0.5 }}>
                      <IconButton size="small" onClick={() => { setSEditing(v); setSForm({ ...v }); setSOpen(true) }}><EditIcon fontSize="inherit" /></IconButton>
                      <IconButton size="small" onClick={async () => { if (await showConfirm(t('fireInspectionTab.msg1', '삭제하시겠습니까?'))) sDelete.mutate(v.id) }}><DeleteIcon fontSize="inherit" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {issues.length === 0 && <TableRow><TableCell colSpan={11} align="center" sx={{ color: 'text.disabled', py: 6 }}>지적사항이 없습니다</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* ===== Inspections ===== */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={700}>{t('fireInspectionTab.section2', '점검 이력')}</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => { setIEditing(null); setIForm(emptyInsp); setIOpen(true) }} sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>New</Button>
      </Stack>
      <Paper variant="outlined" sx={{ mb: 3 }}>
        {l1 ? <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box> : (
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell align="center">점검번호</TableCell>
                <TableCell>점검명</TableCell>
                <TableCell align="center">종류</TableCell>
                <TableCell>점검 기관</TableCell>
                <TableCell align="center">점검일</TableCell>
                <TableCell align="center">결과</TableCell>
                <TableCell align="right">비용(원)</TableCell>
                <TableCell align="center">소방서 제출</TableCell>
                <TableCell align="center">제출일</TableCell>
                <TableCell align="center" sx={{ width: 80 }}>액션</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {insps.map(v => (
                  <TableRow key={v.id} hover>
                    <TableCell align="center">{v.inspNo || '-'}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{v.inspName || '-'}</TableCell>
                    <TableCell align="center"><Chip size="small" label={v.inspType || '-'} variant="outlined" /></TableCell>
                    <TableCell>{v.org || '-'}</TableCell>
                    <TableCell align="center">{v.inspDate || '-'}</TableCell>
                    <TableCell align="center"><Chip size="small" label={v.result || '-'} color={resultColor(v.result)} /></TableCell>
                    <TableCell align="right">{v.cost?.toLocaleString() || '-'}</TableCell>
                    <TableCell align="center">{v.submitStatus || '-'}</TableCell>
                    <TableCell align="center">{v.submitDate || '-'}</TableCell>
                    <TableCell align="center" sx={{ width: 80, whiteSpace: 'nowrap', px: 0.5 }}>
                      <IconButton size="small" onClick={() => { setIEditing(v); setIForm({ ...v }); setIOpen(true) }}><EditIcon fontSize="inherit" /></IconButton>
                      <IconButton size="small" onClick={async () => { if (await showConfirm(t('fireInspectionTab.msg2', '삭제하시겠습니까?'))) iDelete.mutate(v.id) }}><DeleteIcon fontSize="inherit" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {insps.length === 0 && <TableRow><TableCell colSpan={10} align="center" sx={{ color: 'text.disabled', py: 6 }}>점검 이력이 없습니다</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* ===== Plans ===== */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={700}>{t('fireInspectionTab.section3', '연간 법정 점검 계획')}</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => { setPEditing(null); setPForm(emptyPlan); setPOpen(true) }} sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>New</Button>
      </Stack>
      <Paper variant="outlined">
        {l3 ? <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box> : (
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>점검 종류</TableCell>
                <TableCell align="center">법령 근거</TableCell>
                <TableCell align="center">주기</TableCell>
                <TableCell align="center">계획일</TableCell>
                <TableCell>점검기관</TableCell>
                <TableCell>대상 시설</TableCell>
                <TableCell align="right">예상 비용</TableCell>
                <TableCell align="center">상태</TableCell>
                <TableCell align="center" sx={{ width: 80 }}>액션</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {plans.map(v => (
                  <TableRow key={v.id} hover>
                    <TableCell sx={{ fontWeight: 700 }}>{v.planType || '-'}</TableCell>
                    <TableCell align="center">{v.lawBasis || '-'}</TableCell>
                    <TableCell align="center">{v.cycle || '-'}</TableCell>
                    <TableCell align="center">{v.planDate || '-'}</TableCell>
                    <TableCell>{v.org || '-'}</TableCell>
                    <TableCell>{v.target || '-'}</TableCell>
                    <TableCell align="right">{v.cost || '-'}</TableCell>
                    <TableCell align="center"><Chip size="small" label={v.status} color={planStatusColor(v.status)} /></TableCell>
                    <TableCell align="center" sx={{ width: 80, whiteSpace: 'nowrap', px: 0.5 }}>
                      <IconButton size="small" onClick={() => { setPEditing(v); setPForm({ ...v }); setPOpen(true) }}><EditIcon fontSize="inherit" /></IconButton>
                      <IconButton size="small" onClick={async () => { if (await showConfirm(t('fireInspectionTab.msg3', '삭제하시겠습니까?'))) pDelete.mutate(v.id) }}><DeleteIcon fontSize="inherit" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {plans.length === 0 && <TableRow><TableCell colSpan={9} align="center" sx={{ color: 'text.disabled', py: 6 }}>점검 계획이 없습니다</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* ===== Issue dialog ===== */}
      <Dialog open={sOpen} onClose={() => setSOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{sEditing ? '지적사항 수정' : '지적사항 등록'}</DialogTitle>
        <DialogContent dividers>
          <FormTable>
            <FormRow>
              <FormLabel>번호</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={sForm.issueNo || ''} onChange={e => setSForm({ ...sForm, issueNo: e.target.value })} /></FormCell>
              <FormLabel>유형</FormLabel>
              <FormCell><TextField select fullWidth size="small" value={sForm.issueType || ''} onChange={e => setSForm({ ...sForm, issueType: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{ISSUE_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>시설</FormLabel>
              <FormCell><TextField fullWidth size="small" value={sForm.facility || ''} onChange={e => setSForm({ ...sForm, facility: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>발견일</FormLabel>
              <FormCell borderRight><DatePickerField value={sForm.foundDate || null} onChange={d => setSForm({ ...sForm, foundDate: d || undefined })} /></FormCell>
              <FormLabel>목표 완료일</FormLabel>
              <FormCell><DatePickerField value={sForm.dueDate || null} onChange={d => setSForm({ ...sForm, dueDate: d || undefined })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>지적 내용</FormLabel>
              <FormCell><TextField fullWidth size="small" multiline minRows={2} value={sForm.issueContent || ''} onChange={e => setSForm({ ...sForm, issueContent: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>조치 계획</FormLabel>
              <FormCell><TextField fullWidth size="small" multiline minRows={2} value={sForm.actionContent || ''} onChange={e => setSForm({ ...sForm, actionContent: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>진행률 (%)</FormLabel>
              <FormCell borderRight><NumberField fullWidth value={sForm.progressPct ?? null} onChange={v => setSForm({ ...sForm, progressPct: v ?? 0 })} min={0} max={100} thousandSeparator={false} /></FormCell>
              <FormLabel>상태</FormLabel>
              <FormCell><TextField select fullWidth size="small" value={sForm.status || ''} onChange={e => setSForm({ ...sForm, status: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{ISSUE_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></FormCell>
            </FormRow>
            <FormRow last>
              <FormLabel>담당자</FormLabel>
              <FormCell><TextField fullWidth size="small" value={sForm.ownerName || ''} onChange={e => setSForm({ ...sForm, ownerName: e.target.value })} /></FormCell>
            </FormRow>
          </FormTable>
        </DialogContent>
        <DialogActions>
          {!sEditing && <DevTestFillButton onFill={fillIssue} />}
          <Button variant="outlined" onClick={() => setSOpen(false)}>취소</Button>
          <Button variant="contained" onClick={() => sEditing ? sUpdate.mutate({ id: sEditing.id, e: sForm }) : sCreate.mutate(sForm)}>저장</Button>
        </DialogActions>
      </Dialog>

      {/* ===== Inspection dialog ===== */}
      <Dialog open={iOpen} onClose={() => setIOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{iEditing ? '점검 이력 수정' : '점검 이력 등록'}</DialogTitle>
        <DialogContent dividers>
          <FormTable>
            <FormRow>
              <FormLabel>점검번호</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={iForm.inspNo || ''} onChange={e => setIForm({ ...iForm, inspNo: e.target.value })} /></FormCell>
              <FormLabel>종류</FormLabel>
              <FormCell><TextField select fullWidth size="small" value={iForm.inspType || ''} onChange={e => setIForm({ ...iForm, inspType: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{INSP_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>점검명</FormLabel>
              <FormCell><TextField fullWidth size="small" value={iForm.inspName || ''} onChange={e => setIForm({ ...iForm, inspName: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>점검 기관</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={iForm.org || ''} onChange={e => setIForm({ ...iForm, org: e.target.value })} /></FormCell>
              <FormLabel>점검자</FormLabel>
              <FormCell><TextField fullWidth size="small" value={iForm.inspector || ''} onChange={e => setIForm({ ...iForm, inspector: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>계약·신청일</FormLabel>
              <FormCell borderRight><DatePickerField value={iForm.applyDate || null} onChange={d => setIForm({ ...iForm, applyDate: d || undefined })} /></FormCell>
              <FormLabel>점검 실시일</FormLabel>
              <FormCell><DatePickerField value={iForm.inspDate || null} onChange={d => setIForm({ ...iForm, inspDate: d || undefined })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>결과</FormLabel>
              <FormCell borderRight><TextField select fullWidth size="small" value={iForm.result || ''} onChange={e => setIForm({ ...iForm, result: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{RESULTS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}</TextField></FormCell>
              <FormLabel>점검 비용 (원)</FormLabel>
              <FormCell><NumberField fullWidth value={iForm.cost ?? null} onChange={v => setIForm({ ...iForm, cost: v ?? undefined })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>제출 여부</FormLabel>
              <FormCell borderRight><TextField select fullWidth size="small" value={iForm.submitStatus || ''} onChange={e => setIForm({ ...iForm, submitStatus: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{SUBMIT_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></FormCell>
              <FormLabel>제출일</FormLabel>
              <FormCell><DatePickerField value={iForm.submitDate || null} onChange={d => setIForm({ ...iForm, submitDate: d || undefined })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>점검 요약</FormLabel>
              <FormCell><TextField fullWidth size="small" multiline minRows={2} value={iForm.summary || ''} onChange={e => setIForm({ ...iForm, summary: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>지적·불량 사항</FormLabel>
              <FormCell><TextField fullWidth size="small" multiline minRows={2} value={iForm.issue || ''} onChange={e => setIForm({ ...iForm, issue: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow last>
              <FormLabel>개선 조치 계획</FormLabel>
              <FormCell><TextField fullWidth size="small" multiline minRows={2} value={iForm.plan || ''} onChange={e => setIForm({ ...iForm, plan: e.target.value })} /></FormCell>
            </FormRow>
          </FormTable>
        </DialogContent>
        <DialogActions>
          {!iEditing && <DevTestFillButton onFill={fillInsp} />}
          <Button variant="outlined" onClick={() => setIOpen(false)}>취소</Button>
          <Button variant="contained" onClick={() => iEditing ? iUpdate.mutate({ id: iEditing.id, e: iForm }) : iCreate.mutate(iForm)}>저장</Button>
        </DialogActions>
      </Dialog>

      {/* ===== Plan dialog ===== */}
      <Dialog open={pOpen} onClose={() => setPOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{pEditing ? '점검 계획 수정' : '점검 계획 등록'}</DialogTitle>
        <DialogContent dividers>
          <FormTable>
            <FormRow>
              <FormLabel required>점검 종류</FormLabel>
              <FormCell><TextField fullWidth size="small" value={pForm.planType || ''} onChange={e => setPForm({ ...pForm, planType: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>법령 근거</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={pForm.lawBasis || ''} onChange={e => setPForm({ ...pForm, lawBasis: e.target.value })} /></FormCell>
              <FormLabel>주기</FormLabel>
              <FormCell><TextField fullWidth size="small" value={pForm.cycle || ''} onChange={e => setPForm({ ...pForm, cycle: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>계획일</FormLabel>
              <FormCell borderRight><DatePickerField value={pForm.planDate || null} onChange={d => setPForm({ ...pForm, planDate: d || undefined })} /></FormCell>
              <FormLabel>상태</FormLabel>
              <FormCell><TextField select fullWidth size="small" value={pForm.status || ''} onChange={e => setPForm({ ...pForm, status: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{PLAN_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>점검기관</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={pForm.org || ''} onChange={e => setPForm({ ...pForm, org: e.target.value })} /></FormCell>
              <FormLabel>예상 비용</FormLabel>
              <FormCell><TextField fullWidth size="small" placeholder="예) ₩2,200,000" value={pForm.cost || ''} onChange={e => setPForm({ ...pForm, cost: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow last>
              <FormLabel>대상 시설</FormLabel>
              <FormCell><TextField fullWidth size="small" multiline minRows={2} value={pForm.target || ''} onChange={e => setPForm({ ...pForm, target: e.target.value })} /></FormCell>
            </FormRow>
          </FormTable>
        </DialogContent>
        <DialogActions>
          {!pEditing && <DevTestFillButton onFill={fillPlan} />}
          <Button variant="outlined" onClick={() => setPOpen(false)}>취소</Button>
          <Button variant="contained" onClick={() => pEditing ? pUpdate.mutate({ id: pEditing.id, e: pForm }) : pCreate.mutate(pForm)} disabled={!pForm.planType}>저장</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default FireInspectionTab
