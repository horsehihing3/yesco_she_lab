import { formatDateTime } from '../../utils/dateDefaults'
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Button, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Chip, CircularProgress, Alert, TextField, MenuItem, Select, FormControl, IconButton,
  Stepper, Step, StepLabel, Checkbox, FormControlLabel,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import DatePickerField from '../common/DatePickerField'
import NumberField from '../common/NumberField'
import LoadingOverlay from '../common/LoadingOverlay'
import { psmApi } from '../../api/psmApi'
import DevTestFillButton from '../common/DevTestFillButton'
import type { PsmIncident, PsmIncidentAction, IncidentSeverity, IncidentType, IncidentStatus } from '../../types/psm.types'
import { useAlert } from '../../contexts/AlertContext'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const STEPS = ['기본 정보', '원인 분석', '피해 현황', '재발방지 대책']
const INCIDENT_TYPES: { v: IncidentType; l: string }[] = [
  { v: 'LEAK', l: '누출' }, { v: 'FIRE', l: '화재' }, { v: 'EXPLOSION', l: '폭발' },
  { v: 'NEAR_MISS', l: '아차사고' }, { v: 'INJURY', l: '부상' },
]
const SEVERITY: { v: IncidentSeverity; l: string; c: 'error' | 'warning' | 'info' | 'success' }[] = [
  { v: 'CRITICAL', l: '1등급 — 중대사고', c: 'error' },
  { v: 'MAJOR',    l: '2등급 — 중요사고', c: 'warning' },
  { v: 'MINOR',    l: '3등급 — 경미사고', c: 'info' },
  { v: 'NEAR',     l: '4등급 — 아차사고', c: 'success' },
]
const STATUS_COLOR: Record<IncidentStatus, 'default' | 'warning' | 'success'> = { DRAFT: 'default', SUBMITTED: 'warning', CLOSED: 'success' }
const STATUS_LABEL: Record<IncidentStatus, string> = { DRAFT: '작성중', SUBMITTED: '제출됨', CLOSED: '종결' }

const HUMAN_FACTORS = ['안전수칙 미준수', '부적절한 작업 방법', '보호구 미착용', '교육 훈련 미이수']
const TECH_FACTORS = ['설비 결함/노후화', '방호장치 미설치', '작업환경 불량', '유지보수 불량']
const INJURY_TYPES = ['화상', '골절', '질식', '찰과상', '베임', '기타']
const ENV_IMPACTS = ['없음', '토양 오염', '수질 오염', '대기 오염']

const parseJson = <T,>(s?: string | null): T => { try { return s ? JSON.parse(s) : ([] as unknown as T) } catch { return ([] as unknown as T) } }
const emptyIncident = (): Partial<PsmIncident> => ({ status: 'DRAFT', incidentType: 'LEAK', severity: 'MINOR' })

const PsmIncidentTab: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<Partial<PsmIncident>>(emptyIncident())

  const { data, isLoading } = useQuery({
    queryKey: ['psm-incident'],
    queryFn: () => psmApi.listIncident(0, 50),
    enabled: viewMode === 'list',
  })
  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['psm-incident-detail', selectedId],
    queryFn: () => psmApi.getIncident(selectedId!),
    enabled: !!selectedId && (viewMode === 'detail' || viewMode === 'edit'),
  })

  const createMut = useMutation({
    mutationFn: (i: Partial<PsmIncident>) => psmApi.createIncident(i),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['psm-incident'] }); qc.invalidateQueries({ queryKey: ['psm-dashboard'] }); showSuccess(t('common.saved')); handleBackToList() },
    onError: () => showError(t('common.error')),
  })
  const updateMut = useMutation({
    mutationFn: ({ id, i }: { id: number; i: Partial<PsmIncident> }) => psmApi.updateIncident(id, i),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['psm-incident'] }); qc.invalidateQueries({ queryKey: ['psm-incident-detail'] }); showSuccess(t('common.saved')); handleBackToList() },
  })
  const deleteMut = useMutation({
    mutationFn: (id: number) => psmApi.deleteIncident(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['psm-incident'] }); qc.invalidateQueries({ queryKey: ['psm-dashboard'] }); showSuccess(t('common.deleted')); handleBackToList() },
  })
  const isProcessing = createMut.isPending || updateMut.isPending || deleteMut.isPending

  const handleBackToList = () => { setViewMode('list'); setSelectedId(null); setForm(emptyIncident()); setStep(0) }
  const handleRowClick = (i: PsmIncident) => { setSelectedId(i.id); setViewMode('detail'); setStep(0) }
  const handleAddClick = () => { setSelectedId(null); setForm(emptyIncident()); setViewMode('create'); setStep(0) }
  const handleEditClick = () => { if (detail) { setForm({ ...detail }); setViewMode('edit'); setStep(0) } }
  const handleSave = async () => {
    if (!form.location?.trim()) { showError(t('psmIncidentTab.msg1', '발생 장소를 입력해 주세요.')); return }
    const ok = await showConfirm(t('common.confirmSave', '저장하시겠습니까?'))
    if (!ok) return
    if (selectedId) updateMut.mutate({ id: selectedId, i: form })
    else createMut.mutate(form)
  }
  const handleDelete = async () => {
    if (!selectedId) return
    const ok = await showConfirm(t('common.confirmDelete', '삭제하시겠습니까?'))
    if (ok) deleteMut.mutate(selectedId)
  }

  const setV = (patch: Partial<PsmIncident>) => setForm(f => ({ ...f, ...patch }))
  const fillTestData = () => setForm(prev => ({
    ...prev,
    occurAt: prev.occurAt || '2026-06-12T14:30',
    location: prev.location || '제2공장 정제공정동 1층',
    relatedEquipment: prev.relatedEquipment || '열교환기 E-204',
    relatedMaterial: prev.relatedMaterial || '톨루엔',
    firstFinder: prev.firstFinder || '이순찰',
    reporter: prev.reporter || '박보고',
    investigator: prev.investigator || '최조사',
    reportedAt: prev.reportedAt || '2026-06-12T15:00',
    narrative: prev.narrative || '정기 순찰 중 열교환기 E-204 플랜지 연결부에서 톨루엔이 미량 누출되는 것을 발견하여 즉시 밸브를 차단함',
    why1: prev.why1 || '플랜지 가스켓 노후화로 인한 밀봉 불량',
    why5: prev.why5 || '가스켓 교체 주기 관리 절차 미흡',
    managementCause: prev.managementCause || '예방정비 점검 주기 미준수',
    deaths: prev.deaths ?? 0,
    seriousInjuries: prev.seriousInjuries ?? 0,
    minorInjuries: prev.minorInjuries ?? 1,
    injuryType: prev.injuryType || '기타',
    damagedEquipment: prev.damagedEquipment || '열교환기 E-204 플랜지 가스켓',
    propertyLoss: prev.propertyLoss ?? 500,
    productionLoss: prev.productionLoss ?? 1200,
    downtimeHours: prev.downtimeHours ?? 4,
    envImpact: prev.envImpact || '없음',
    technicalAction: prev.technicalAction || '플랜지 가스켓을 내화학성 재질로 교체하고 토크 관리 시행',
    managerialAction: prev.managerialAction || '동종 가스켓 교체 주기를 예방정비 절차서에 반영',
    similarCheckPlan: prev.similarCheckPlan || '정제공정동 내 동일 사양 열교환기 전수 점검',
    psmImprovement: prev.psmImprovement || '공정안전자료 내 가스켓 사양 정보 갱신',
  }))
  const isEdit = viewMode === 'edit' || viewMode === 'create'
  const v = (isEdit ? form : detail || {}) as Partial<PsmIncident>

  const humanFactors = useMemo<string[]>(() => parseJson<string[]>(v.humanFactorsJson) || [], [v.humanFactorsJson])
  const techFactors  = useMemo<string[]>(() => parseJson<string[]>(v.technicalFactorsJson) || [], [v.technicalFactorsJson])
  const actions      = useMemo<PsmIncidentAction[]>(() => parseJson<PsmIncidentAction[]>(v.actionsJson) || [], [v.actionsJson])

  const toggleHF = (x: string) => setV({ humanFactorsJson: JSON.stringify(humanFactors.includes(x) ? humanFactors.filter(h => h !== x) : [...humanFactors, x]) })
  const toggleTF = (x: string) => setV({ technicalFactorsJson: JSON.stringify(techFactors.includes(x) ? techFactors.filter(h => h !== x) : [...techFactors, x]) })
  const updateActions = (next: PsmIncidentAction[]) => setV({ actionsJson: JSON.stringify(next) })

  // ─── LIST ───
  if (viewMode === 'list') {
    const items = data?.content || []
    return (
      <Box>
        <Box sx={{ display: 'flex', mb: 2, alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" fontWeight="bold">{t('psmIncidentTab.section1', '사고보고')}</Typography>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddClick}>{t('common.new', '신규 등록')}</Button>
        </Box>
        {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
          : items.length === 0 ? <Alert severity="info">{t('common.noData')}</Alert>
          : (
            <Paper variant="outlined">
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>사고 번호</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="center">유형</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="center">발생 일시</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>장소</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>관련 설비</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="center">중대성</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="center">상태</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map(i => (
                      <TableRow key={i.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(i)}>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{i.incidentNo}</TableCell>
                        <TableCell align="center">{INCIDENT_TYPES.find(t => t.v === i.incidentType)?.l || '-'}</TableCell>
                        <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{formatDateTime(i.occurAt) || '-'}</TableCell>
                        <TableCell>{i.location || '-'}</TableCell>
                        <TableCell sx={{ fontSize: '0.85rem' }}>{i.relatedEquipment || '-'}</TableCell>
                        <TableCell align="center">
                          {i.severity && <Chip size="small" label={SEVERITY.find(s => s.v === i.severity)?.l || i.severity} color={SEVERITY.find(s => s.v === i.severity)?.c} />}
                        </TableCell>
                        <TableCell align="center"><Chip size="small" label={STATUS_LABEL[i.status]} color={STATUS_COLOR[i.status]} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
      </Box>
    )
  }

  if (viewMode === 'detail' && (detailLoading || !detail)) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
  }

  // ─── DETAIL / EDIT / CREATE — Stepper로 4단계 ───
  return (
    <Box>
      <LoadingOverlay open={isProcessing} />
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
        사고보고 {viewMode === 'create' ? '신규 등록' : viewMode === 'edit' ? '수정' : '상세'}
      </Typography>

      <Stepper activeStep={step} alternativeLabel sx={{ mb: 3 }}>
        {STEPS.map((s, i) => (
          <Step key={s} onClick={() => setStep(i)} sx={{ cursor: 'pointer' }}>
            <StepLabel>{s}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Step 1: 기본 정보 */}
      {step === 0 && (
        <FormTable>
          <FormRow>
            <FormLabel>사고 번호</FormLabel>
            <FormCell borderRight><Typography variant="body2" fontFamily="monospace">{v.incidentNo || (viewMode === 'create' ? '자동 생성' : '')}</Typography></FormCell>
            <FormLabel required>중대성 등급</FormLabel>
            <FormCell>
              {isEdit ? (
                <FormControl fullWidth size="small">
                  <Select displayEmpty value={v.severity || ''} onChange={e => setV({ severity: (e.target.value || null) as IncidentSeverity })}>
                    <MenuItem value="" disabled>선택하세요</MenuItem>
                    {SEVERITY.map(s => <MenuItem key={s.v} value={s.v}>{s.l}</MenuItem>)}
                  </Select>
                </FormControl>
              ) : v.severity && <Chip size="small" label={SEVERITY.find(s => s.v === v.severity)?.l} color={SEVERITY.find(s => s.v === v.severity)?.c} />}
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel required>사고 유형</FormLabel>
            <FormCell borderRight>
              {isEdit ? (
                <FormControl fullWidth size="small">
                  <Select displayEmpty value={v.incidentType || ''} onChange={e => setV({ incidentType: (e.target.value || null) as IncidentType })}>
                    <MenuItem value="" disabled>선택하세요</MenuItem>
                    {INCIDENT_TYPES.map(o => <MenuItem key={o.v} value={o.v}>{o.l}</MenuItem>)}
                  </Select>
                </FormControl>
              ) : <Typography variant="body2">{INCIDENT_TYPES.find(o => o.v === v.incidentType)?.l || ''}</Typography>}
            </FormCell>
            <FormLabel>발생 일시</FormLabel>
            <FormCell>
              {isEdit ? <TextField fullWidth size="small" type="datetime-local" value={v.occurAt?.substring(0, 16) || ''} onChange={e => setV({ occurAt: e.target.value })} />
                : <Typography variant="body2" fontFamily="monospace">{formatDateTime(v.occurAt) || ''}</Typography>}
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel required>발생 장소</FormLabel>
            <FormCell>
              {isEdit ? <TextField fullWidth size="small" value={v.location || ''} onChange={e => setV({ location: e.target.value })} />
                : <Typography variant="body2">{v.location || ''}</Typography>}
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>관련 설비</FormLabel>
            <FormCell borderRight>
              {isEdit ? <TextField fullWidth size="small" value={v.relatedEquipment || ''} onChange={e => setV({ relatedEquipment: e.target.value })} />
                : <Typography variant="body2">{v.relatedEquipment || ''}</Typography>}
            </FormCell>
            <FormLabel>관련 물질</FormLabel>
            <FormCell>
              {isEdit ? <TextField fullWidth size="small" value={v.relatedMaterial || ''} onChange={e => setV({ relatedMaterial: e.target.value })} />
                : <Typography variant="body2">{v.relatedMaterial || ''}</Typography>}
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>최초 발견자</FormLabel>
            <FormCell borderRight>
              {isEdit ? <TextField fullWidth size="small" value={v.firstFinder || ''} onChange={e => setV({ firstFinder: e.target.value })} />
                : <Typography variant="body2">{v.firstFinder || ''}</Typography>}
            </FormCell>
            <FormLabel>보고자</FormLabel>
            <FormCell>
              {isEdit ? <TextField fullWidth size="small" value={v.reporter || ''} onChange={e => setV({ reporter: e.target.value })} />
                : <Typography variant="body2">{v.reporter || ''}</Typography>}
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>조사 책임자</FormLabel>
            <FormCell borderRight>
              {isEdit ? <TextField fullWidth size="small" value={v.investigator || ''} onChange={e => setV({ investigator: e.target.value })} />
                : <Typography variant="body2">{v.investigator || ''}</Typography>}
            </FormCell>
            <FormLabel>보고 일시</FormLabel>
            <FormCell>
              {isEdit ? <TextField fullWidth size="small" type="datetime-local" value={v.reportedAt?.substring(0, 16) || ''} onChange={e => setV({ reportedAt: e.target.value })} />
                : <Typography variant="body2" fontFamily="monospace">{formatDateTime(v.reportedAt) || ''}</Typography>}
            </FormCell>
          </FormRow>
          <FormRow last>
            <FormLabel>사고 경위 (5W1H)</FormLabel>
            <FormCell>
              {isEdit ? <TextField fullWidth size="small" multiline minRows={3} value={v.narrative || ''} onChange={e => setV({ narrative: e.target.value })} placeholder="언제, 어디서, 누가, 무엇을, 어떻게, 왜" />
                : <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{v.narrative || ''}</Typography>}
            </FormCell>
          </FormRow>
        </FormTable>
      )}

      {/* Step 2: 원인 분석 */}
      {step === 1 && (
        <>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>{t('psmIncidentTab.section2', '직접 원인 분석')}</Typography>
          <FormTable>
            <FormRow>
              <FormLabel>불안전한 행동<br/>(Human Factor)</FormLabel>
              <FormCell borderRight>
                {isEdit ? HUMAN_FACTORS.map(f => (
                  <FormControlLabel key={f} control={<Checkbox size="small" checked={humanFactors.includes(f)} onChange={() => toggleHF(f)} />} label={f} />
                )) : <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{humanFactors.map(f => <Chip key={f} size="small" label={f} variant="outlined" />)}</Box>}
              </FormCell>
              <FormLabel>불안전한 상태<br/>(Technical)</FormLabel>
              <FormCell>
                {isEdit ? TECH_FACTORS.map(f => (
                  <FormControlLabel key={f} control={<Checkbox size="small" checked={techFactors.includes(f)} onChange={() => toggleTF(f)} />} label={f} />
                )) : <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{techFactors.map(f => <Chip key={f} size="small" label={f} variant="outlined" />)}</Box>}
              </FormCell>
            </FormRow>
          </FormTable>

          <Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 3, mb: 1.5 }}>5-Why 근본 원인 분석</Typography>
          <FormTable>
            {([1, 2, 3, 4, 5] as const).map(n => {
              const key = `why${n}` as 'why1' | 'why2' | 'why3' | 'why4' | 'why5'
              const label = n === 1 ? 'Why 1 — 직접 원인' : n === 5 ? 'Why 5 — 근본 원인' : `Why ${n}`
              return (
                <FormRow key={n}>
                  <FormLabel>{label}</FormLabel>
                  <FormCell>
                    {isEdit ? <TextField fullWidth size="small" value={(v as any)[key] || ''} onChange={e => setV({ [key]: e.target.value } as Partial<PsmIncident>)} />
                      : <Typography variant="body2">{(v as any)[key] || ''}</Typography>}
                  </FormCell>
                </FormRow>
              )
            })}
            <FormRow last>
              <FormLabel>관리적 원인</FormLabel>
              <FormCell>
                {isEdit ? <TextField fullWidth size="small" value={v.managementCause || ''} onChange={e => setV({ managementCause: e.target.value })} placeholder="예: MOC 미적용, 절차서 미비" />
                  : <Typography variant="body2">{v.managementCause || ''}</Typography>}
              </FormCell>
            </FormRow>
          </FormTable>
        </>
      )}

      {/* Step 3: 피해 현황 */}
      {step === 2 && (
        <>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>{t('psmIncidentTab.section3', '인명 피해')}</Typography>
          <FormTable>
            <FormRow>
              <FormLabel>사망자</FormLabel>
              <FormCell borderRight>{isEdit ? <NumberField fullWidth value={v.deaths ?? null} onChange={n => setV({ deaths: n ?? 0 })} thousandSeparator={false} /> : <Typography variant="body2">{v.deaths ?? 0} 명</Typography>}</FormCell>
              <FormLabel>중상자</FormLabel>
              <FormCell>{isEdit ? <NumberField fullWidth value={v.seriousInjuries ?? null} onChange={n => setV({ seriousInjuries: n ?? 0 })} thousandSeparator={false} /> : <Typography variant="body2">{v.seriousInjuries ?? 0} 명</Typography>}</FormCell>
            </FormRow>
            <FormRow last>
              <FormLabel>경상자</FormLabel>
              <FormCell borderRight>{isEdit ? <NumberField fullWidth value={v.minorInjuries ?? null} onChange={n => setV({ minorInjuries: n ?? 0 })} thousandSeparator={false} /> : <Typography variant="body2">{v.minorInjuries ?? 0} 명</Typography>}</FormCell>
              <FormLabel>부상 유형</FormLabel>
              <FormCell>
                {isEdit ? (
                  <FormControl fullWidth size="small">
                    <Select displayEmpty value={v.injuryType || ''} onChange={e => setV({ injuryType: e.target.value })}>
                      <MenuItem value="" disabled>선택하세요</MenuItem>
                      {INJURY_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </Select>
                  </FormControl>
                ) : <Typography variant="body2">{v.injuryType || ''}</Typography>}
              </FormCell>
            </FormRow>
          </FormTable>

          <Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 3, mb: 1.5 }}>{t('psmIncidentTab.section4', '설비·재산·환경 피해')}</Typography>
          <FormTable>
            <FormRow>
              <FormLabel>피해 설비</FormLabel>
              <FormCell>
                {isEdit ? <TextField fullWidth size="small" value={v.damagedEquipment || ''} onChange={e => setV({ damagedEquipment: e.target.value })} />
                  : <Typography variant="body2">{v.damagedEquipment || ''}</Typography>}
              </FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>재산 피해(천원)</FormLabel>
              <FormCell borderRight>{isEdit ? <NumberField fullWidth value={v.propertyLoss ?? null} onChange={n => setV({ propertyLoss: n ?? undefined })} /> : <Typography variant="body2">{(v.propertyLoss || 0).toLocaleString()}</Typography>}</FormCell>
              <FormLabel>생산 손실(천원)</FormLabel>
              <FormCell>{isEdit ? <NumberField fullWidth value={v.productionLoss ?? null} onChange={n => setV({ productionLoss: n ?? undefined })} /> : <Typography variant="body2">{(v.productionLoss || 0).toLocaleString()}</Typography>}</FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>가동 중단(h)</FormLabel>
              <FormCell borderRight>{isEdit ? <NumberField fullWidth value={v.downtimeHours ?? null} onChange={n => setV({ downtimeHours: n ?? undefined })} /> : <Typography variant="body2">{v.downtimeHours ?? 0}</Typography>}</FormCell>
              <FormLabel>환경 영향</FormLabel>
              <FormCell>
                {isEdit ? (
                  <FormControl fullWidth size="small">
                    <Select displayEmpty value={v.envImpact || ''} onChange={e => setV({ envImpact: e.target.value })}>
                      <MenuItem value="" disabled>선택하세요</MenuItem>
                      {ENV_IMPACTS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </Select>
                  </FormControl>
                ) : <Typography variant="body2">{v.envImpact || ''}</Typography>}
              </FormCell>
            </FormRow>
            <FormRow last>
              <FormLabel>복구 완료 예정일</FormLabel>
              <FormCell>
                {isEdit ? <DatePickerField value={v.recoveryDate || null} onChange={d => setV({ recoveryDate: d || undefined })} />
                  : <Typography variant="body2" fontFamily="monospace">{v.recoveryDate || ''}</Typography>}
              </FormCell>
            </FormRow>
          </FormTable>
        </>
      )}

      {/* Step 4: 재발방지 */}
      {step === 3 && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="subtitle2" fontWeight="bold">{t('psmIncidentTab.section5', '즉시 조치')}</Typography>
            {isEdit && <Button size="small" startIcon={<AddIcon />} onClick={() => updateActions([...actions, { no: actions.length + 1, desc: '' }])}>행 추가</Button>}
          </Box>
          <Paper variant="outlined">
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell sx={{ fontWeight: 'bold', width: 50 }} align="center">#</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>조치 내용</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: 130 }}>담당자</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: 150 }}>완료일</TableCell>
                    {isEdit && <TableCell sx={{ width: 40 }}></TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {actions.length === 0 && (
                    <TableRow><TableCell colSpan={isEdit ? 5 : 4} align="center" sx={{ py: 3, color: 'text.disabled' }}>등록된 조치가 없습니다</TableCell></TableRow>
                  )}
                  {actions.map((a, idx) => (
                    <TableRow key={idx}>
                      <TableCell align="center">{a.no}</TableCell>
                      <TableCell>{isEdit ? <TextField size="small" fullWidth value={a.desc} onChange={e => { const n = [...actions]; n[idx] = { ...a, desc: e.target.value }; updateActions(n) }} /> : a.desc}</TableCell>
                      <TableCell>{isEdit ? <TextField size="small" fullWidth value={a.owner || ''} onChange={e => { const n = [...actions]; n[idx] = { ...a, owner: e.target.value }; updateActions(n) }} /> : a.owner}</TableCell>
                      <TableCell>{isEdit ? <DatePickerField value={a.due || null} onChange={d => { const n = [...actions]; n[idx] = { ...a, due: d || undefined }; updateActions(n) }} /> : a.due}</TableCell>
                      {isEdit && <TableCell><IconButton size="small" color="error" onClick={() => updateActions(actions.filter((_, i) => i !== idx))}><DeleteIcon fontSize="inherit" /></IconButton></TableCell>}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 3, mb: 1.5 }}>{t('psmIncidentTab.section6', '재발방지 대책')}</Typography>
          <FormTable>
            <FormRow>
              <FormLabel>기술적 대책</FormLabel>
              <FormCell>{isEdit ? <TextField fullWidth size="small" multiline minRows={2} value={v.technicalAction || ''} onChange={e => setV({ technicalAction: e.target.value })} placeholder="설비 개선, 방호장치 추가 등" /> : <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{v.technicalAction || ''}</Typography>}</FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>관리적 대책</FormLabel>
              <FormCell>{isEdit ? <TextField fullWidth size="small" multiline minRows={2} value={v.managerialAction || ''} onChange={e => setV({ managerialAction: e.target.value })} placeholder="절차서 개정, MOC 적용 등" /> : <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{v.managerialAction || ''}</Typography>}</FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>유사 설비 점검 계획</FormLabel>
              <FormCell>{isEdit ? <TextField fullWidth size="small" multiline minRows={2} value={v.similarCheckPlan || ''} onChange={e => setV({ similarCheckPlan: e.target.value })} /> : <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{v.similarCheckPlan || ''}</Typography>}</FormCell>
            </FormRow>
            <FormRow last>
              <FormLabel>PSM 요소 개선 사항</FormLabel>
              <FormCell>{isEdit ? <TextField fullWidth size="small" multiline minRows={2} value={v.psmImprovement || ''} onChange={e => setV({ psmImprovement: e.target.value })} placeholder="공정안전자료 갱신 등" /> : <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{v.psmImprovement || ''}</Typography>}</FormCell>
            </FormRow>
          </FormTable>

          <Box sx={{ mt: 2 }}>
            {isEdit && (
              <FormTable>
                <FormRow last>
                  <FormLabel>상태</FormLabel>
                  <FormCell>
                    <FormControl size="small" sx={{ width: 200 }}>
                      <Select value={v.status || 'DRAFT'} onChange={e => setV({ status: e.target.value as IncidentStatus })}>
                        <MenuItem value="DRAFT">작성중</MenuItem>
                        <MenuItem value="SUBMITTED">제출됨</MenuItem>
                        <MenuItem value="CLOSED">종결</MenuItem>
                      </Select>
                    </FormControl>
                  </FormCell>
                </FormRow>
              </FormTable>
            )}
          </Box>
        </>
      )}

      {/* 하단 버튼 영역 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mt: 3 }}>
        <Box>
          {step > 0 && <Button variant="outlined" onClick={() => setStep(s => s - 1)}>← 이전</Button>}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={handleBackToList}>{t('common.list', '목록')}</Button>
          {viewMode === 'create' && <DevTestFillButton onFill={fillTestData} />}
          {step < 3 && <Button variant="contained" onClick={() => setStep(s => s + 1)}>다음 →</Button>}
          {step === 3 && (
            isEdit ? (
              <Button variant="contained" onClick={handleSave}>{t('common.save', '저장')}</Button>
            ) : (
              <>
                <Button variant="contained" onClick={handleEditClick}>{t('common.edit', '수정')}</Button>
                <Button variant="contained" color="error" onClick={handleDelete}>{t('common.delete', '삭제')}</Button>
              </>
            )
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default PsmIncidentTab
