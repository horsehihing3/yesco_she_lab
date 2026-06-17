import { formatDateTime } from '../../utils/dateDefaults'
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Button, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Chip, CircularProgress, Alert, TextField, MenuItem, Select, FormControl, IconButton,
  Checkbox,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import LoadingOverlay from '../common/LoadingOverlay'
import { psmApi } from '../../api/psmApi'
import DevTestFillButton from '../common/DevTestFillButton'
import type { PsmPtw, PsmPtwCheck, PermitType, PtwStatus } from '../../types/psm.types'
import { useAlert } from '../../contexts/AlertContext'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const PERMIT_TYPES: { v: PermitType; l: string; defaults: { key: string; label: string }[] }[] = [
  { v: 'HOT_WORK',       l: '화기작업',     defaults: [
    { key: 'gas',   label: '가스 농도 측정 완료' },
    { key: 'loto',  label: '에너지 격리(LOTO) 완료' },
    { key: 'fire',  label: '소화기 배치 확인' },
    { key: 'ppe',   label: '개인보호구 착용 확인' },
    { key: 'watch', label: '감시인 배치 완료' },
    { key: 'emerg', label: '비상연락 체계 확인' },
  ]},
  { v: 'CONFINED_SPACE', l: '밀폐공간 작업', defaults: [
    { key: 'gas',    label: '산소·가스 농도 측정 (LEL 5% 이하)' },
    { key: 'vent',   label: '강제 환기 가동' },
    { key: 'loto',   label: '입출구 격리(LOTO)' },
    { key: 'watch',  label: '감시인 외부 배치' },
    { key: 'escape', label: '비상 탈출 장비 준비' },
  ]},
  { v: 'HEIGHT',         l: '고소작업',     defaults: [
    { key: 'belt',    label: '안전대 착용' },
    { key: 'ladder',  label: '사다리/플랫폼 점검' },
    { key: 'barrier', label: '하부 통제 라인 설치' },
  ]},
  { v: 'ELECTRICAL',     l: '전기작업',     defaults: [
    { key: 'loto',    label: '전원 차단 및 LOTO' },
    { key: 'volt',    label: '검전기 측정 (무전압 확인)' },
    { key: 'ground',  label: '접지 설치' },
    { key: 'ppe',     label: '절연 보호구 착용' },
  ]},
  { v: 'GENERAL',        l: '일반작업',     defaults: [
    { key: 'ppe',     label: '개인보호구 착용 확인' },
    { key: 'tools',   label: '공구 점검' },
  ]},
]

const PTW_STATUS: Record<PtwStatus, { l: string; c: 'default' | 'info' | 'warning' | 'success' | 'error' }> = {
  DRAFT:     { l: '작성중',   c: 'default' },
  SUBMITTED: { l: '승인 대기', c: 'warning' },
  APPROVED:  { l: '승인 완료', c: 'success' },
  COMPLETED: { l: '작업 완료', c: 'info' },
  REJECTED:  { l: '반려',     c: 'error' },
  EXPIRED:   { l: '만료',     c: 'error' },
}

const parseChecks = (json?: string | null): PsmPtwCheck[] => {
  try { return json ? JSON.parse(json) : [] } catch { return [] }
}
const emptyPtw = (): Partial<PsmPtw> => ({
  permitType: 'HOT_WORK', status: 'DRAFT', workName: '',
  safetyChecksJson: JSON.stringify(PERMIT_TYPES[0].defaults.map(d => ({ ...d, checked: false, owner: '' }))),
})

const PsmPtwTab: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [form, setForm] = useState<Partial<PsmPtw>>(emptyPtw())

  const { data, isLoading } = useQuery({
    queryKey: ['psm-ptw'],
    queryFn: () => psmApi.listPtw(0, 50),
    enabled: viewMode === 'list',
  })
  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['psm-ptw-detail', selectedId],
    queryFn: () => psmApi.getPtw(selectedId!),
    enabled: !!selectedId && (viewMode === 'detail' || viewMode === 'edit'),
  })

  const createMut = useMutation({
    mutationFn: (p: Partial<PsmPtw>) => psmApi.createPtw(p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['psm-ptw'] }); qc.invalidateQueries({ queryKey: ['psm-dashboard'] }); showSuccess(t('common.saved')); handleBackToList() },
    onError: () => showError(t('common.error')),
  })
  const updateMut = useMutation({
    mutationFn: ({ id, p }: { id: number; p: Partial<PsmPtw> }) => psmApi.updatePtw(id, p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['psm-ptw'] }); qc.invalidateQueries({ queryKey: ['psm-ptw-detail'] }); showSuccess(t('common.saved')); handleBackToList() },
  })
  const deleteMut = useMutation({
    mutationFn: (id: number) => psmApi.deletePtw(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['psm-ptw'] }); qc.invalidateQueries({ queryKey: ['psm-dashboard'] }); showSuccess(t('common.deleted')); handleBackToList() },
  })
  const isProcessing = createMut.isPending || updateMut.isPending || deleteMut.isPending

  const handleBackToList = () => { setViewMode('list'); setSelectedId(null); setForm(emptyPtw()) }
  const handleRowClick = (p: PsmPtw) => { setSelectedId(p.id); setViewMode('detail') }
  const handleAddClick = () => { setSelectedId(null); setForm(emptyPtw()); setViewMode('create') }
  const handleEditClick = () => { if (detail) { setForm({ ...detail }); setViewMode('edit') } }

  const handleSave = async () => {
    if (!form.workName?.trim()) { showError(t('psmPtwTab.msg1', '작업명을 입력해 주세요.')); return }
    if (!form.permitType) { showError(t('psmPtwTab.msg2', '허가 유형을 선택해 주세요.')); return }
    if (!form.startAt || !form.endAt) { showError(t('psmPtwTab.msg3', '시작/종료 일시를 입력해 주세요.')); return }
    const ok = await showConfirm(t('common.confirmSave', '저장하시겠습니까?'))
    if (!ok) return
    if (selectedId) updateMut.mutate({ id: selectedId, p: form })
    else createMut.mutate(form)
  }
  const handleDelete = async () => {
    if (!selectedId) return
    const ok = await showConfirm(t('common.confirmDelete', '삭제하시겠습니까?'))
    if (ok) deleteMut.mutate(selectedId)
  }

  const setV = (patch: Partial<PsmPtw>) => setForm(f => ({ ...f, ...patch }))
  const fillTestData = () => setForm(prev => ({
    ...prev,
    workName: prev.workName || '반응기 R-101 내부 점검',
    workLocation: prev.workLocation || '제1공장 반응공정동 2층',
    startAt: prev.startAt || '2026-06-13T09:00',
    endAt: prev.endAt || '2026-06-13T17:00',
    supervisorName: prev.supervisorName || '김작업',
    supervisorDept: prev.supervisorDept || '생산1팀',
    workDescription: prev.workDescription || '반응기 R-101 맨홀 개방 후 내부 부식 상태 점검 및 촉매 교체 작업',
  }))
  const isEdit = viewMode === 'edit' || viewMode === 'create'
  const v = (isEdit ? form : detail || {}) as Partial<PsmPtw>
  const checks = useMemo<PsmPtwCheck[]>(() => parseChecks(v.safetyChecksJson), [v.safetyChecksJson])

  // 허가 유형 변경 시 체크 항목 자동 교체 (등록/수정 모드, 빈 상태일 때만)
  const handlePermitTypeChange = (pt: PermitType) => {
    const def = PERMIT_TYPES.find(p => p.v === pt)
    const fresh = def ? def.defaults.map(d => ({ ...d, checked: false, owner: '' })) : []
    setV({ permitType: pt, safetyChecksJson: JSON.stringify(fresh) })
  }
  const updateChecks = (next: PsmPtwCheck[]) => setV({ safetyChecksJson: JSON.stringify(next) })
  const toggleCheck = (idx: number) => { const n = [...checks]; n[idx] = { ...n[idx], checked: !n[idx].checked }; updateChecks(n) }
  const updateCheckLabel = (idx: number, label: string) => { const n = [...checks]; n[idx] = { ...n[idx], label }; updateChecks(n) }
  const updateCheckOwner = (idx: number, owner: string) => { const n = [...checks]; n[idx] = { ...n[idx], owner }; updateChecks(n) }
  const removeCheck = (idx: number) => updateChecks(checks.filter((_, i) => i !== idx))
  const addCheck = () => updateChecks([...checks, { key: `c${checks.length + 1}`, label: '', checked: false, owner: '' }])

  // 진행률 계산
  const progress = checks.length > 0 ? Math.round(checks.filter(c => c.checked).length / checks.length * 100) : 0

  // ─── LIST ───
  if (viewMode === 'list') {
    const items = data?.content || []
    return (
      <Box>
        {/* PC toolbar */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, mb: 2, alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" fontWeight="bold">{t('psm.tabs.ptw', 'PTW 작업허가')}</Typography>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddClick}>{t('common.new', '신규 등록')}</Button>
        </Box>
        {/* Mobile toolbar */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">{t('psm.tabs.ptw', 'PTW 작업허가')}</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddClick} sx={{ flex: 1 }}>{t('common.new', '신규 등록')}</Button>
          </Box>
        </Box>
        {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
          : items.length === 0 ? <Alert severity="info">{t('common.noData')}</Alert>
          : (
            <>
              {/* PC Table */}
              <Paper variant="outlined" sx={{ display: { xs: 'none', md: 'block' } }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.100' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>허가 번호</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }} align="center">허가 유형</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>작업명</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>작업 장소</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }} align="center">시작</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }} align="center">종료</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }} align="center">책임자</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }} align="center">상태</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map(p => (
                        <TableRow key={p.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(p)}>
                          <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{p.ptwNo}</TableCell>
                          <TableCell align="center">{PERMIT_TYPES.find(t => t.v === p.permitType)?.l || p.permitType}</TableCell>
                          <TableCell>{p.workName}</TableCell>
                          <TableCell sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.workLocation || '-'}</TableCell>
                          <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{formatDateTime(p.startAt) || '-'}</TableCell>
                          <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{formatDateTime(p.endAt) || '-'}</TableCell>
                          <TableCell align="center">{p.supervisorName || '-'}</TableCell>
                          <TableCell align="center"><Chip size="small" label={PTW_STATUS[p.status]?.l} color={PTW_STATUS[p.status]?.c} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
              {/* Mobile Card List */}
              <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                {items.map(p => (
                  <Paper key={p.id} variant="outlined" sx={{ p: 1.5, mb: 1, cursor: 'pointer' }} onClick={() => handleRowClick(p)}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="body2" fontWeight="bold" sx={{ wordBreak: 'break-all' }}>
                          <span style={{ fontFamily: 'monospace' }}>{p.ptwNo}</span> · {p.workName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {PERMIT_TYPES.find(t => t.v === p.permitType)?.l || p.permitType} · {p.workLocation || '-'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {formatDateTime(p.startAt) || '-'} ~ {formatDateTime(p.endAt) || '-'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          책임자: {p.supervisorName || '-'}
                        </Typography>
                      </Box>
                      <Box sx={{ flexShrink: 0 }}>
                        <Chip size="small" label={PTW_STATUS[p.status]?.l} color={PTW_STATUS[p.status]?.c} />
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Box>
            </>
          )}
      </Box>
    )
  }

  // ─── DETAIL / EDIT / CREATE ───
  if (viewMode === 'detail' && (detailLoading || !detail)) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
  }

  return (
    <Box>
      <LoadingOverlay open={isProcessing} />

      <Box sx={{ mb: 2, p: 1.5, borderRadius: 1, bgcolor: '#FEE2E2', border: 1, borderColor: 'error.light' }}>
        <Typography variant="subtitle1" fontWeight="bold" color="error.main" sx={{ mb: 0.5 }}>
          ⚠ 안전작업허가서 (Permit to Work)
        </Typography>
        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
          {v.ptwNo || (viewMode === 'create' ? '자동 생성' : '')} · PSM 12대 요소 ⑤ · 상태: <Chip size="small" sx={{ ml: 0.5 }} label={PTW_STATUS[v.status as PtwStatus]?.l || v.status} color={PTW_STATUS[v.status as PtwStatus]?.c || 'default'} />
        </Typography>
      </Box>

      {/* 작업 기본 정보 */}
      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>{t('psmPtwTab.section2', '작업 기본 정보')}</Typography>
      <FormTable>
        <FormRow>
          <FormLabel required>허가 유형</FormLabel>
          <FormCell borderRight>
            {isEdit ? (
              <FormControl fullWidth size="small">
                <Select displayEmpty value={v.permitType || ''} onChange={e => handlePermitTypeChange(e.target.value as PermitType)}>
                  <MenuItem value="" disabled>선택하세요</MenuItem>
                  {PERMIT_TYPES.map(p => <MenuItem key={p.v} value={p.v}>{p.l}</MenuItem>)}
                </Select>
              </FormControl>
            ) : <Typography variant="body2">{PERMIT_TYPES.find(p => p.v === v.permitType)?.l || ''}</Typography>}
          </FormCell>
          <FormLabel>상태</FormLabel>
          <FormCell>
            {isEdit ? (
              <FormControl fullWidth size="small">
                <Select displayEmpty value={v.status || 'DRAFT'} onChange={e => setV({ status: e.target.value as PtwStatus })}>
                  {(Object.keys(PTW_STATUS) as PtwStatus[]).map(k => <MenuItem key={k} value={k}>{PTW_STATUS[k].l}</MenuItem>)}
                </Select>
              </FormControl>
            ) : <Chip size="small" label={PTW_STATUS[v.status as PtwStatus]?.l} color={PTW_STATUS[v.status as PtwStatus]?.c} />}
          </FormCell>
        </FormRow>
        <FormRow>
          <FormLabel required>작업명</FormLabel>
          <FormCell>
            {isEdit ? <TextField fullWidth size="small" value={v.workName || ''} onChange={e => setV({ workName: e.target.value })} />
              : <Typography variant="body2" fontWeight={600}>{v.workName || ''}</Typography>}
          </FormCell>
        </FormRow>
        <FormRow>
          <FormLabel>작업 장소</FormLabel>
          <FormCell>
            {isEdit ? <TextField fullWidth size="small" value={v.workLocation || ''} onChange={e => setV({ workLocation: e.target.value })} />
              : <Typography variant="body2">{v.workLocation || ''}</Typography>}
          </FormCell>
        </FormRow>
        <FormRow>
          <FormLabel required>시작 일시</FormLabel>
          <FormCell borderRight>
            {isEdit ? <TextField fullWidth size="small" type="datetime-local" value={v.startAt?.substring(0, 16) || ''} onChange={e => setV({ startAt: e.target.value })} />
              : <Typography variant="body2" fontFamily="monospace">{formatDateTime(v.startAt) || ''}</Typography>}
          </FormCell>
          <FormLabel required>종료 일시</FormLabel>
          <FormCell>
            {isEdit ? <TextField fullWidth size="small" type="datetime-local" value={v.endAt?.substring(0, 16) || ''} onChange={e => setV({ endAt: e.target.value })} />
              : <Typography variant="body2" fontFamily="monospace">{formatDateTime(v.endAt) || ''}</Typography>}
          </FormCell>
        </FormRow>
        <FormRow>
          <FormLabel>작업 책임자</FormLabel>
          <FormCell borderRight>
            {isEdit ? <TextField fullWidth size="small" value={v.supervisorName || ''} onChange={e => setV({ supervisorName: e.target.value })} />
              : <Typography variant="body2">{v.supervisorName || ''}</Typography>}
          </FormCell>
          <FormLabel>책임자 부서</FormLabel>
          <FormCell>
            {isEdit ? <TextField fullWidth size="small" value={v.supervisorDept || ''} onChange={e => setV({ supervisorDept: e.target.value })} />
              : <Typography variant="body2">{v.supervisorDept || ''}</Typography>}
          </FormCell>
        </FormRow>
        <FormRow>
          <FormLabel>연계 MOC</FormLabel>
          <FormCell borderRight>
            {isEdit ? <TextField fullWidth size="small" value={v.relatedMocNo || ''} onChange={e => setV({ relatedMocNo: e.target.value })} placeholder="예: MOC-2026-041" />
              : <Typography variant="body2" fontFamily="monospace">{v.relatedMocNo || ''}</Typography>}
          </FormCell>
          <FormLabel>연계 WO</FormLabel>
          <FormCell>
            {isEdit ? <TextField fullWidth size="small" value={v.relatedWoNo || ''} onChange={e => setV({ relatedWoNo: e.target.value })} placeholder="예: WO-2026-001" />
              : <Typography variant="body2" fontFamily="monospace">{v.relatedWoNo || ''}</Typography>}
          </FormCell>
        </FormRow>
        <FormRow last>
          <FormLabel>작업 내용</FormLabel>
          <FormCell>
            {isEdit ? <TextField fullWidth size="small" multiline minRows={3} value={v.workDescription || ''} onChange={e => setV({ workDescription: e.target.value })} />
              : <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{v.workDescription || ''}</Typography>}
          </FormCell>
        </FormRow>
      </FormTable>

      {/* 작업 전 안전 점검 */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 3, mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle2" fontWeight="bold">{t('psmPtwTab.section3', '작업 전 안전 점검')}</Typography>
          <Chip size="small" label={`${checks.filter(c => c.checked).length} / ${checks.length} (${progress}%)`}
            color={progress === 100 ? 'success' : progress >= 50 ? 'warning' : 'default'} />
        </Box>
        {isEdit && <Button size="small" startIcon={<AddIcon />} onClick={addCheck}>점검 항목 추가</Button>}
      </Box>
      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 'bold', width: 60 }} align="center">확인</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>점검 항목</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 160 }} align="center">담당자</TableCell>
                {isEdit && <TableCell sx={{ width: 40 }}></TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {checks.length === 0 && (
                <TableRow><TableCell colSpan={isEdit ? 4 : 3} align="center" sx={{ py: 3, color: 'text.disabled' }}>점검 항목이 없습니다</TableCell></TableRow>
              )}
              {checks.map((c, idx) => (
                <TableRow key={idx}>
                  <TableCell align="center">
                    <Checkbox size="small" checked={c.checked} disabled={!isEdit && v.status !== 'DRAFT' && v.status !== 'SUBMITTED'} onChange={() => isEdit && toggleCheck(idx)} />
                  </TableCell>
                  <TableCell>
                    {isEdit ? <TextField size="small" fullWidth value={c.label} onChange={e => updateCheckLabel(idx, e.target.value)} />
                      : <Typography variant="body2" sx={{ textDecoration: c.checked ? 'line-through' : 'none', color: c.checked ? 'text.disabled' : 'text.primary' }}>{c.label}</Typography>}
                  </TableCell>
                  <TableCell>
                    {isEdit ? <TextField size="small" fullWidth value={c.owner || ''} onChange={e => updateCheckOwner(idx, e.target.value)} />
                      : <Typography variant="body2">{c.owner || '-'}</Typography>}
                  </TableCell>
                  {isEdit && <TableCell><IconButton size="small" color="error" onClick={() => removeCheck(idx)}><DeleteIcon fontSize="inherit" /></IconButton></TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 서명 / 승인 */}
      <Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 3, mb: 1 }}>{t('psmPtwTab.section4', '서명 / 승인')}</Typography>
      <FormTable>
        <FormRow>
          <FormLabel>작업 책임자<br/>서명</FormLabel>
          <FormCell borderRight>
            {isEdit ? <TextField fullWidth size="small" value={v.supervisorSign || ''} onChange={e => setV({ supervisorSign: e.target.value })} placeholder="서명자 이름" />
              : <Typography variant="body2">{v.supervisorSign || '-'}</Typography>}
          </FormCell>
          <FormLabel>서명 일시</FormLabel>
          <FormCell>
            {isEdit ? <TextField fullWidth size="small" type="datetime-local" value={v.supervisorSignedAt?.substring(0, 16) || ''} onChange={e => setV({ supervisorSignedAt: e.target.value })} />
              : <Typography variant="body2" fontFamily="monospace">{formatDateTime(v.supervisorSignedAt) || ''}</Typography>}
          </FormCell>
        </FormRow>
        <FormRow>
          <FormLabel>SHE 담당자<br/>승인</FormLabel>
          <FormCell borderRight>
            {isEdit ? <TextField fullWidth size="small" value={v.ehsApproverName || ''} onChange={e => setV({ ehsApproverName: e.target.value })} placeholder="SHE 담당자 이름" />
              : <Typography variant="body2">{v.ehsApproverName || '-'}</Typography>}
          </FormCell>
          <FormLabel>승인 일시</FormLabel>
          <FormCell>
            {isEdit ? <TextField fullWidth size="small" type="datetime-local" value={v.ehsApprovedAt?.substring(0, 16) || ''} onChange={e => setV({ ehsApprovedAt: e.target.value })} />
              : <Typography variant="body2" fontFamily="monospace">{formatDateTime(v.ehsApprovedAt) || ''}</Typography>}
          </FormCell>
        </FormRow>
        <FormRow>
          <FormLabel>운영부서<br/>관리자 승인</FormLabel>
          <FormCell borderRight>
            {isEdit ? <TextField fullWidth size="small" value={v.opsApproverName || ''} onChange={e => setV({ opsApproverName: e.target.value })} placeholder="운영부서 관리자 이름" />
              : <Typography variant="body2">{v.opsApproverName || '-'}</Typography>}
          </FormCell>
          <FormLabel>승인 일시</FormLabel>
          <FormCell>
            {isEdit ? <TextField fullWidth size="small" type="datetime-local" value={v.opsApprovedAt?.substring(0, 16) || ''} onChange={e => setV({ opsApprovedAt: e.target.value })} />
              : <Typography variant="body2" fontFamily="monospace">{formatDateTime(v.opsApprovedAt) || ''}</Typography>}
          </FormCell>
        </FormRow>
        <FormRow last>
          <FormLabel>반려 사유</FormLabel>
          <FormCell>
            {isEdit ? <TextField fullWidth size="small" multiline minRows={2} value={v.rejectReason || ''} onChange={e => setV({ rejectReason: e.target.value })} placeholder="반려 시 사유 입력" />
              : <Typography variant="body2" color="error" sx={{ whiteSpace: 'pre-wrap' }}>{v.rejectReason || '-'}</Typography>}
          </FormCell>
        </FormRow>
      </FormTable>

      {/* 하단 버튼 */}
      <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' }, gap: 1, mt: 2 }}>
        <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
          {isEdit ? t('common.cancel', '취소') : t('common.list', '목록')}
        </Button>
        {viewMode === 'create' && <DevTestFillButton onFill={fillTestData} />}
        {isEdit ? (
          <Button variant="contained" onClick={handleSave} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.save', '저장')}</Button>
        ) : (
          <>
            <Button variant="contained" onClick={handleEditClick} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.edit', '수정')}</Button>
            <Button variant="contained" color="error" onClick={handleDelete} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.delete', '삭제')}</Button>
          </>
        )}
      </Box>
    </Box>
  )
}

export default PsmPtwTab
