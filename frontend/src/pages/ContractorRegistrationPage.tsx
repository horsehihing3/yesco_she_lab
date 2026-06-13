import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { fmtPhone } from '../utils/phoneFormat'
import ReadTextField from '../components/common/ReadTextField'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fileApi } from '../api/fileApi'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, TextField, MenuItem, Chip, Stack, IconButton,
  Pagination, CircularProgress, Step, Stepper, StepLabel, StepButton,
  Checkbox, FormControlLabel, Divider, Alert,
} from '@mui/material'
import ListSearchBar from '../components/common/ListSearchBar'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import DescriptionIcon from '@mui/icons-material/Description'
import CloseIcon from '@mui/icons-material/Close'

import DatePickerField from '../components/common/DatePickerField'
import { todayStr } from '../utils/dateDefaults'
import NumberField from '../components/common/NumberField'
import { FormTable, FormRow, FormLabel, FormCell } from '../components/common/FormTable'
import { useAlert } from '../contexts/AlertContext'
import { useAuth } from '../context/AuthContext'
import { useButtonRules } from '../hooks/useButtonRules'

import { contractorRegistrationApi } from '../api/contractorRegistrationApi'
import type {
  ContractorRegistration, ContractorRegistrationRequest, RegStatus,
} from '../types/contractorRegistration.types'

type ViewMode = 'list' | 'create' | 'edit' | 'detail'

const STATUS_LABEL: Record<RegStatus, string> = { APPROVED: '승인', REVIEW: '검토중', HOLD: '보류' }
const STATUS_COLOR: Record<RegStatus, 'success' | 'warning' | 'error'> = {
  APPROVED: 'success', REVIEW: 'warning', HOLD: 'error',
}

const BIZ_TYPES = ['건설업', '제조업', '서비스업', '운반·물류', '청소·위생', '전기·통신', '기계·설비', '화학·환경', '기타']
const EMP_SIZES = ['5인 미만', '5~49인', '50~299인', '300인 이상']
const OSH_APPLY_OPTS = ['해당', '비해당']
const MGR_STATUS_OPTS = ['선임', '미선임', '위탁']
const RISK_EVAL_OPTS = ['실시', '미실시']
const CERT_OPTS = ['ISO45001', 'KOSHA-MS', 'ISO14001', 'ISO9001', '녹색기업', '기타']
const HAZARD_OPTS = ['화학물질', '고소작업', '중량물 취급', '밀폐공간', '전기', '폭발·화재', '소음·진동', '분진']
const CONTRACT_TYPES = ['도급', '용역', '구매', '파견', '기타']
const INTERNAL_DEPTS = ['안전보건팀', '환경팀', '구매팀', '생산팀']

const STEPS = ['기본정보', '안전보건', '담당자', '서류·계약', '확인·등록']

// ─────────────────────────────────────────────
// 유틸: 콤마분리 문자열 ↔ 배열
// ─────────────────────────────────────────────
const csvToArr = (s?: string | null): string[] =>
  !s ? [] : s.split(',').map(x => x.trim()).filter(Boolean)
const arrToCsv = (arr: string[]): string => arr.join(',')

// 사업자번호 / 법인번호 포맷터
const fmtBiz = (raw: string): string => {
  const v = raw.replace(/\D/g, '').slice(0, 10)
  if (v.length > 5) return `${v.slice(0, 3)}-${v.slice(3, 5)}-${v.slice(5)}`
  if (v.length > 3) return `${v.slice(0, 3)}-${v.slice(3)}`
  return v
}
const fmtCorp = (raw: string): string => {
  const v = raw.replace(/\D/g, '').slice(0, 13)
  if (v.length > 6) return `${v.slice(0, 6)}-${v.slice(6)}`
  return v
}

const emptyForm = (): ContractorRegistrationRequest => ({
  bizNum: '', companyName: '', ceoName: '',
  regStatus: 'REVIEW',
  safetyRating: 0, envRating: 0,
})

// ─────────────────────────────────────────────
// 별점 컴포넌트 (공통 스타일과 매칭, 노란색)
// ─────────────────────────────────────────────
const StarRating: React.FC<{ value: number; onChange?: (v: number) => void; readOnly?: boolean }> = ({ value, onChange, readOnly }) => (
  <Box sx={{ display: 'flex', gap: 0.5 }}>
    {[1, 2, 3, 4, 5].map(i => (
      <IconButton key={i} size="small" disabled={readOnly}
        onClick={() => onChange?.(i === value ? 0 : i)}
        sx={{ p: 0.25, color: i <= value ? '#f5a623' : 'grey.400' }}>
        {i <= value ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
      </IconButton>
    ))}
  </Box>
)

// ─────────────────────────────────────────────
// 메인 페이지
// ─────────────────────────────────────────────
const ContractorRegistrationPage: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()
  const { user } = useAuth()
  const { canSee } = useButtonRules()
  const MENU = '협력 업체 관리 › 협력 업체 등록'
  const myRoles: string[] = ['guest', ...(user?.role === 'SYSTEM_ADMIN' ? ['superAdmin'] : [user?.role ?? ''].filter(Boolean))]
  const getRoles = (item: { createdByUserId?: number | null }): string[] => {
    const roles = [...myRoles]
    if (item.createdByUserId != null && user?.id != null && item.createdByUserId === user.id) roles.push('writer')
    return roles
  }

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selected, setSelected] = useState<ContractorRegistration | null>(null)

  const canNew  = canSee(MENU, 'LIST',   'New (신규 등록)', myRoles)
  const canEdit = canSee(MENU, 'DETAIL', '수정', getRoles(selected ?? {}))
  const canDel  = canSee(MENU, 'DETAIL', '삭제', getRoles(selected ?? {}))
  const canSave = canSee(MENU, 'FORM',   '등록 완료 / 저장', getRoles(selected ?? {}))
  const [page, setPage] = useState(0)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const applySearch = () => setKeyword(keywordInput)
  const [statusFilter, setStatusFilter] = useState('')

  // wizard state
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<ContractorRegistrationRequest>(emptyForm())
  const [submittedResult, setSubmittedResult] = useState<ContractorRegistration | null>(null)
  // 제출 서류 — 4개 명명 슬롯 + 기타 다중 업로드
  type DocSlot = 'bizLicense' | 'safetyMgrAssign' | 'riskEval' | 'insurance'
  const [namedFiles, setNamedFiles] = useState<Record<DocSlot, File | null>>({
    bizLicense: null, safetyMgrAssign: null, riskEval: null, insurance: null,
  })
  const [extraFiles, setExtraFiles] = useState<File[]>([])
  const namedFilesRef = useRef(namedFiles)
  const extraFilesRef = useRef(extraFiles)
  useEffect(() => { namedFilesRef.current = namedFiles }, [namedFiles])
  useEffect(() => { extraFilesRef.current = extraFiles }, [extraFiles])
  // 동의 확인
  const [agree1, setAgree1] = useState(false)
  const [agree2, setAgree2] = useState(false)
  const [agree3, setAgree3] = useState(false)

  // ─── Data fetch ───────────────────────────
  const queryKey = ['contractorRegistrations', keyword, statusFilter, page]
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => contractorRegistrationApi.search({ keyword, regStatus: statusFilter, page, size: 10 }),
    enabled: viewMode === 'list',
  })

  // ─── Mutations ────────────────────────────
  const uploadPendingFiles = async (regId: number) => {
    const slots = namedFilesRef.current
    const extras = extraFilesRef.current
    const docTypeLabel: Record<DocSlot, string> = {
      bizLicense: '사업자등록증', safetyMgrAssign: '안전관리자 선임 서류',
      riskEval: '위험성평가 확인서', insurance: '보험가입증명서',
    }
    const namedEntries = (Object.keys(slots) as DocSlot[])
      .filter(k => slots[k] != null)
      .map(k => ({ file: slots[k]!, docType: docTypeLabel[k] }))
    for (const { file, docType } of namedEntries) {
      await fileApi.upload('CONTRACTOR_REGISTRATION', String(regId), file, { docType })
    }
    for (const file of extras) {
      await fileApi.upload('CONTRACTOR_REGISTRATION', String(regId), file)
    }
  }

  const createMut = useMutation({
    mutationFn: (req: ContractorRegistrationRequest) => contractorRegistrationApi.create(req),
    onSuccess: async (created) => {
      try { await uploadPendingFiles(created.id) } catch { /* 파일 업로드 실패는 별도 안내 — 등록 자체는 유지 */ }
      qc.invalidateQueries({ queryKey: ['contractorRegistrations'] })
      setSubmittedResult(created)
      showSuccess(t('contractorRegistrationPage.msg1', '등록되었습니다.'))
    },
    onError: () => showError(t('contractorRegistrationPage.msg2', '등록에 실패했습니다.')),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, req }: { id: number; req: ContractorRegistrationRequest }) =>
      contractorRegistrationApi.update(id, req),
    onSuccess: async (updated) => {
      try { await uploadPendingFiles(updated.id) } catch { /* ignore upload error */ }
      qc.invalidateQueries({ queryKey: ['contractorRegistrations'] })
      showSuccess(t('contractorRegistrationPage.msg3', '저장되었습니다.'))
      backToList()
    },
    onError: () => showError(t('contractorRegistrationPage.msg4', '저장에 실패했습니다.')),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => contractorRegistrationApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contractorRegistrations'] })
      showSuccess(t('contractorRegistrationPage.msg5', '삭제되었습니다.'))
      backToList()
    },
    onError: () => showError(t('contractorRegistrationPage.msg6', '삭제에 실패했습니다.')),
  })

  // ─── Handlers ─────────────────────────────
  const resetUploadsAndAgree = () => {
    setNamedFiles({ bizLicense: null, safetyMgrAssign: null, riskEval: null, insurance: null })
    setExtraFiles([])
    setAgree1(false); setAgree2(false); setAgree3(false)
  }

  const backToList = () => {
    setViewMode('list')
    setSelected(null)
    setForm(emptyForm())
    setStep(0)
    setSubmittedResult(null)
    resetUploadsAndAgree()
  }

  const openCreate = () => {
    setSelected(null)
    setForm({ ...emptyForm(), modifiedBy: user?.name || user?.username || '', riskEvalDate: todayStr() })
    setStep(0)
    setSubmittedResult(null)
    resetUploadsAndAgree()
    setViewMode('create')
  }

  const openEdit = (item: ContractorRegistration) => {
    setSelected(item)
    setForm({ ...item, modifiedBy: user?.name || user?.username || '' })
    setStep(0)
    setSubmittedResult(null)
    // 수정 모드: 동의는 이미 받았다고 가정, 신규 파일 첨부만 추가 업로드
    setNamedFiles({ bizLicense: null, safetyMgrAssign: null, riskEval: null, insurance: null })
    setExtraFiles([])
    setAgree1(true); setAgree2(true); setAgree3(true)
    setViewMode('edit')
  }

  const openDetail = (item: ContractorRegistration) => {
    setSelected(item)
    setForm({ ...item })
    setStep(0)
    setViewMode('detail')
  }

  const handleDelete = async (item: ContractorRegistration) => {
    if (await showConfirm(t('contractorRegistrationPage.msg7', '정말로 삭제하시겠습니까?'))) {
      deleteMut.mutate(item.id)
    }
  }

  // wizard step 검증
  const validateStep = (s: number): boolean => {
    if (s === 0) {
      if (!form.bizNum || !form.companyName || !form.ceoName) {
        showError(t('contractorRegistrationPage.msg8', '사업자등록번호 / 업체명 / 대표자명 은 필수입니다.'))
        return false
      }
    }
    if (s === 2) {
      if (!form.safetyMgrName || !form.safetyMgrTel) {
        showError(t('contractorRegistrationPage.msg9', '안전보건 담당자 성명·휴대전화 는 필수입니다.'))
        return false
      }
    }
    if (s === 3) {
      // 신규 등록 시에만 사업자등록증·동의 필수 체크
      if (viewMode === 'create') {
        if (!namedFiles.bizLicense) {
          showError(t('contractorRegistrationPage.msg10', '사업자등록증을 첨부해주세요.'))
          return false
        }
        if (!agree1 || !agree2 || !agree3) {
          showError(t('contractorRegistrationPage.msg11', '동의 항목을 모두 확인해주세요.'))
          return false
        }
      }
    }
    return true
  }

  const goNext = () => { if (validateStep(step)) setStep(s => Math.min(STEPS.length - 1, s + 1)) }
  const goPrev = () => setStep(s => Math.max(0, s - 1))
  const jumpTo = (s: number) => { if (s <= step) setStep(s) }

  const handleSubmit = () => {
    if (viewMode === 'edit' && selected) {
      updateMut.mutate({ id: selected.id, req: form })
    } else {
      createMut.mutate(form)
    }
  }

  // ─── LIST VIEW ────────────────────────────
  if (viewMode === 'list') {
    const items = data?.content || []
    return (
      <Box>
        {/* ─── 데스크탑(md+) : 한 줄 ─── */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1.5, mb: 2, alignItems: 'center' }}>
          <ListSearchBar sx={{ width: 380 }} placeholder="업체명 / 사업자번호 / 등록번호 / 대표자 검색" value={keywordInput} onChange={setKeywordInput} onSearch={applySearch} />
          <TextField select size="small" sx={{ width: 140 }} label={t('contractorRegistrationPage.label1', '상태')}
            value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0) }}>
            <MenuItem value="">전체</MenuItem>
            <MenuItem value="APPROVED">승인</MenuItem>
            <MenuItem value="REVIEW">검토중</MenuItem>
            <MenuItem value="HOLD">보류</MenuItem>
          </TextField>
          <IconButton size="small" onClick={() => qc.invalidateQueries({ queryKey: ['contractorRegistrations'] })}><RefreshIcon /></IconButton>
          <Box sx={{ flex: 1 }} />
          {canNew && (
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreate}
              sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>New</Button>
          )}
        </Box>

        {/* ─── 모바일(xs/sm) : 세로 스택 ─── */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField size="small" fullWidth placeholder="검색"
              value={keyword} onChange={e => setKeyword(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') setPage(0) }} />
            <IconButton size="small" onClick={() => qc.invalidateQueries({ queryKey: ['contractorRegistrations'] })}
              sx={{ border: 1, borderColor: 'divider', borderRadius: 1, flexShrink: 0 }}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Box>
          <TextField select size="small" fullWidth label={t('contractorRegistrationPage.label2', '상태')}
            value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0) }}>
            <MenuItem value="">전체</MenuItem>
            <MenuItem value="APPROVED">승인</MenuItem>
            <MenuItem value="REVIEW">검토중</MenuItem>
            <MenuItem value="HOLD">보류</MenuItem>
          </TextField>
          {canNew && (
            <Button variant="contained" fullWidth startIcon={<AddIcon />} onClick={openCreate}>
              New
            </Button>
          )}
        </Box>

        {isLoading ? (
          <Paper variant="outlined" sx={{ p: 6, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Paper>
        ) : (
          <>
            {/* ─── 데스크탑(md+) : 테이블 ─── */}
            <Paper variant="outlined" sx={{ display: { xs: 'none', md: 'block' } }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell align="center" sx={{ width: 160, whiteSpace: 'nowrap' }}>등록번호</TableCell>
                      <TableCell>업체명</TableCell>
                      <TableCell>사업자번호</TableCell>
                      <TableCell align="center">업종</TableCell>
                      <TableCell align="center">대표자</TableCell>
                      <TableCell align="center">종업원</TableCell>
                      <TableCell align="center">계약기간</TableCell>
                      <TableCell align="center">상태</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map(item => (
                      <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => openDetail(item)}>
                        <TableCell align="center" sx={{ fontWeight: 700, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{item.regNo}</TableCell>
                        <TableCell>{item.companyName}</TableCell>
                        <TableCell>{item.bizNum}</TableCell>
                        <TableCell align="center">{item.bizType || '-'}</TableCell>
                        <TableCell align="center">{item.ceoName}</TableCell>
                        <TableCell align="center">{item.empSize || '-'}</TableCell>
                        <TableCell align="center">
                          {item.contractStart && item.contractEnd ? `${item.contractStart} ~ ${item.contractEnd}` : '-'}
                        </TableCell>
                        <TableCell align="center">
                          <Chip size="small" label={STATUS_LABEL[item.regStatus]} color={STATUS_COLOR[item.regStatus]} />
                        </TableCell>
                      </TableRow>
                    ))}
                    {items.length === 0 && (
                      <TableRow><TableCell colSpan={8} align="center" sx={{ color: 'text.disabled', py: 6 }}>등록된 협력 업체가 없습니다.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {/* ─── 모바일(xs/sm) : 카드 ─── */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1 }}>
              {items.length === 0 && (
                <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', color: 'text.disabled', fontSize: '0.875rem' }}>
                  등록된 협력 업체가 없습니다.
                </Paper>
              )}
              {items.map(item => (
                <Paper key={item.id} variant="outlined"
                  onClick={() => openDetail(item)}
                  sx={{ p: 1.5, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                  {/* 1행: 업체명 + 상태칩 */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 0.75 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.companyName}
                    </Typography>
                    <Chip size="small" label={STATUS_LABEL[item.regStatus]} color={STATUS_COLOR[item.regStatus]} />
                  </Box>
                  {/* 2행: 등록번호 (monospace) */}
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'primary.main', fontWeight: 700, mb: 0.5 }}>
                    {item.regNo}
                  </Typography>
                  {/* 3행: 라벨 두 줄 */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: '70px 1fr', rowGap: 0.25, columnGap: 1, fontSize: '0.75rem' }}>
                    <Typography sx={{ color: 'text.secondary', fontSize: 'inherit' }}>사업자</Typography>
                    <Typography sx={{ fontSize: 'inherit' }}>{item.bizNum}</Typography>

                    <Typography sx={{ color: 'text.secondary', fontSize: 'inherit' }}>대표자</Typography>
                    <Typography sx={{ fontSize: 'inherit' }}>
                      {item.ceoName}
                      {item.bizType && <Typography component="span" sx={{ color: 'text.secondary', ml: 0.5, fontSize: 'inherit' }}>· {item.bizType}</Typography>}
                    </Typography>

                    {(item.contractStart || item.contractEnd) && (
                      <>
                        <Typography sx={{ color: 'text.secondary', fontSize: 'inherit' }}>계약기간</Typography>
                        <Typography sx={{ fontSize: 'inherit' }}>
                          {item.contractStart && item.contractEnd
                            ? `${item.contractStart} ~ ${item.contractEnd}`
                            : (item.contractStart || item.contractEnd)}
                        </Typography>
                      </>
                    )}
                  </Box>
                </Paper>
              ))}
            </Box>
          </>
        )}

        {data && data.totalPages > 1 && (
          <Stack direction="row" justifyContent="center" sx={{ mt: 2 }}>
            <Pagination count={data.totalPages} page={page + 1} onChange={(_, v) => setPage(v - 1)} size="small" />
          </Stack>
        )}
      </Box>
    )
  }

  // ─── CREATE / EDIT / DETAIL VIEW ──────────
  const isReadonly = viewMode === 'detail'
  const isEditing = viewMode === 'edit'

  return (
    <Box sx={{ pb: { xs: 4, md: 0 } }}>
      {isReadonly && selected && (
        <Stack direction="row" alignItems="center" justifyContent="flex-end" sx={{ mb: 1 }}>
          <Chip size="small" label={STATUS_LABEL[selected.regStatus]} color={STATUS_COLOR[selected.regStatus]} />
        </Stack>
      )}

      {/* ───── 데스크탑(md+) : 풀 Stepper ───── */}
      <Paper variant="outlined" sx={{ mb: 2, p: 1.5, display: { xs: 'none', md: 'block' } }}>
        <Stepper activeStep={step} alternativeLabel nonLinear>
          {STEPS.map((label, idx) => (
            <Step key={label} completed={idx < step}>
              <StepButton color="inherit" onClick={() => jumpTo(idx)}>
                <StepLabel>{label}</StepLabel>
              </StepButton>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* ───── 모바일(xs/sm) : 컴팩트 진행 헤더 ───── */}
      <Paper variant="outlined" sx={{ mb: 2, p: 1.5, display: { xs: 'block', md: 'none' } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Box sx={{
            width: 32, height: 32, borderRadius: '50%',
            bgcolor: 'primary.main', color: 'primary.contrastText',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.95rem', flexShrink: 0,
          }}>
            {step + 1}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', lineHeight: 1.2 }}>
              {step + 1} / {STEPS.length} 단계
            </Typography>
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.3 }}>
              {STEPS[step]}
            </Typography>
          </Box>
        </Box>
        {/* 진행 점 — 클릭으로 이전 단계 이동 */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {STEPS.map((_, idx) => (
            <Box key={idx}
              onClick={() => jumpTo(idx)}
              sx={{
                flex: 1, height: 4, borderRadius: 2, cursor: idx <= step ? 'pointer' : 'default',
                bgcolor: idx < step ? 'success.main'
                       : idx === step ? 'primary.main'
                       : 'action.disabledBackground',
                transition: 'background-color .2s',
              }} />
          ))}
        </Box>
      </Paper>

      {/* ───── Step 0 — 기본정보 ───── */}
      {step === 0 && (
        <Step0Panel form={form} setForm={setForm} isReadonly={isReadonly} />
      )}

      {/* ───── Step 1 — 안전보건 ───── */}
      {step === 1 && (
        <Step1Panel form={form} setForm={setForm} isReadonly={isReadonly} />
      )}

      {/* ───── Step 2 — 담당자 ───── */}
      {step === 2 && (
        <Step2Panel form={form} setForm={setForm} isReadonly={isReadonly} />
      )}

      {/* ───── Step 3 — 서류·계약 ───── */}
      {step === 3 && (
        <Step3Panel form={form} setForm={setForm} isReadonly={isReadonly}
          namedFiles={namedFiles} setNamedFiles={setNamedFiles}
          extraFiles={extraFiles} setExtraFiles={setExtraFiles}
          agree1={agree1} setAgree1={setAgree1}
          agree2={agree2} setAgree2={setAgree2}
          agree3={agree3} setAgree3={setAgree3} />
      )}

      {/* ───── Step 4 — 확인·등록 ───── */}
      {step === 4 && (
        <Step4Panel form={form} submittedResult={submittedResult} onReset={backToList} />
      )}

      {/* ───── 하단 액션 버튼 ───── */}
      {!submittedResult && (
        <Box sx={{ display: 'flex', gap: 1, mt: 3, mb: 4, justifyContent: { xs: 'stretch', sm: 'flex-end' }, flexWrap: 'wrap' }}>
          {viewMode === 'edit' ? (
            <Button variant="outlined" onClick={() => setViewMode('detail')} sx={{ flex: { xs: '1 1 calc(50% - 4px)', sm: 'none' } }}>취소</Button>
          ) : (
            <Button variant="outlined" onClick={backToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', sm: 'none' } }}>목록</Button>
          )}
          {/* 위저드 이전/다음 — 상세에서도 단계 이동 가능 */}
          {step > 0 && (
            <Button variant="outlined" onClick={goPrev} sx={{ flex: { xs: '1 1 calc(50% - 4px)', sm: 'none' } }}>이전</Button>
          )}
          {step < STEPS.length - 1 && (
            <Button variant="contained" onClick={goNext} sx={{ flex: { xs: '1 1 calc(50% - 4px)', sm: 'none' } }}>
              {!isReadonly && step === 3 ? '검토하기' : '다음'}
            </Button>
          )}
          {!isReadonly && canSave && step === STEPS.length - 1 && (
            <Button variant="contained" color="success" onClick={handleSubmit}
              disabled={createMut.isPending || updateMut.isPending}
              sx={{ flex: { xs: '1 1 calc(50% - 4px)', sm: 'none' } }}>
              {isEditing ? '저장' : '등록 완료'}
            </Button>
          )}
          {/* 상세 모드: 수정·삭제 */}
          {isReadonly && selected && (
            <>
              {canEdit && <Button variant="contained" onClick={() => openEdit(selected)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', sm: 'none' } }}>수정</Button>}
              {canDel  && <Button variant="contained" color="error" onClick={() => handleDelete(selected)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', sm: 'none' } }}>삭제</Button>}
            </>
          )}
        </Box>
      )}
    </Box>
  )
}

// ═════════════════════════════════════════════
// Step 0 — 기본정보
// ═════════════════════════════════════════════
const Step0Panel: React.FC<{ form: ContractorRegistrationRequest; setForm: React.Dispatch<React.SetStateAction<ContractorRegistrationRequest>>; isReadonly: boolean }> = ({ form, setForm, isReadonly }) => {
  const { t } = useTranslation()
  return (
  <Box>
    <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 1, mb: 1 }}>{t('contractorRegistrationPage.section1', '사업자 기본정보')}</Typography>
    <FormTable>
      <FormRow>
        <FormLabel required>사업자등록번호</FormLabel>
        <FormCell borderRight>
          <ReadTextField fullWidth size="small" readOnly={isReadonly} placeholder="000-00-00000"
            value={form.bizNum || ''} onChange={e => setForm(f => ({ ...f, bizNum: fmtBiz(e.target.value) }))} />
        </FormCell>
        <FormLabel>법인등록번호</FormLabel>
        <FormCell>
          <ReadTextField fullWidth size="small" readOnly={isReadonly} placeholder="000000-0000000"
            value={form.corpNum || ''} onChange={e => setForm(f => ({ ...f, corpNum: fmtCorp(e.target.value) }))} />
        </FormCell>
      </FormRow>
      <FormRow>
        <FormLabel required>업체명 (상호)</FormLabel>
        <FormCell borderRight>
          <ReadTextField fullWidth size="small" readOnly={isReadonly} placeholder="㈜ 예시안전"
            value={form.companyName || ''} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} />
        </FormCell>
        <FormLabel required>대표자명</FormLabel>
        <FormCell>
          <ReadTextField fullWidth size="small" readOnly={isReadonly} placeholder="홍길동"
            value={form.ceoName || ''} onChange={e => setForm(f => ({ ...f, ceoName: e.target.value }))} />
        </FormCell>
      </FormRow>
      <FormRow last>
        <FormLabel>업종</FormLabel>
        <FormCell borderRight>
          <ReadTextField select fullWidth size="small" readOnly={isReadonly}
            value={form.bizType || ''} onChange={e => setForm(f => ({ ...f, bizType: e.target.value }))}>
            <MenuItem value="">선택하세요</MenuItem>
            {BIZ_TYPES.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
          </ReadTextField>
        </FormCell>
        <FormLabel>업태</FormLabel>
        <FormCell>
          <ReadTextField fullWidth size="small" readOnly={isReadonly} placeholder="도급, 용역, 제조 등"
            value={form.bizCategory || ''} onChange={e => setForm(f => ({ ...f, bizCategory: e.target.value }))} />
        </FormCell>
      </FormRow>
    </FormTable>

    <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 3, mb: 1 }}>{t('contractorRegistrationPage.section2', '사업장 소재지')}</Typography>
    <FormTable>
      <FormRow>
        <FormLabel>우편번호</FormLabel>
        <FormCell borderRight>
          <ReadTextField fullWidth size="small" readOnly={isReadonly} placeholder="00000"
            value={form.zipCode || ''} onChange={e => setForm(f => ({ ...f, zipCode: e.target.value.replace(/\D/g, '').slice(0, 5) }))} />
        </FormCell>
        <FormLabel>주소</FormLabel>
        <FormCell>
          <ReadTextField fullWidth size="small" readOnly={isReadonly} placeholder="도로명 주소"
            value={form.addr1 || ''} onChange={e => setForm(f => ({ ...f, addr1: e.target.value }))} />
        </FormCell>
      </FormRow>
      <FormRow last>
        <FormLabel>상세주소</FormLabel>
        <FormCell>
          <ReadTextField fullWidth size="small" readOnly={isReadonly} placeholder="동·호수, 층 등"
            value={form.addr2 || ''} onChange={e => setForm(f => ({ ...f, addr2: e.target.value }))} />
        </FormCell>
      </FormRow>
    </FormTable>

    <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 3, mb: 1 }}>{t('contractorRegistrationPage.section3', '연락처')}</Typography>
    <FormTable>
      <FormRow>
        <FormLabel>대표 전화번호</FormLabel>
        <FormCell borderRight>
          <ReadTextField fullWidth size="small" readOnly={isReadonly} placeholder="02-0000-0000"
            value={form.tel || ''} onChange={e => setForm(f => ({ ...f, tel: fmtPhone(e.target.value) }))} />
        </FormCell>
        <FormLabel>팩스번호</FormLabel>
        <FormCell>
          <ReadTextField fullWidth size="small" readOnly={isReadonly} placeholder="02-0000-0000"
            value={form.fax || ''} onChange={e => setForm(f => ({ ...f, fax: fmtPhone(e.target.value) }))} />
        </FormCell>
      </FormRow>
      <FormRow>
        <FormLabel>대표 이메일</FormLabel>
        <FormCell borderRight>
          <ReadTextField fullWidth size="small" readOnly={isReadonly} type="email" placeholder="info@company.com"
            value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        </FormCell>
        <FormLabel>홈페이지</FormLabel>
        <FormCell>
          <ReadTextField fullWidth size="small" readOnly={isReadonly} placeholder="https://www.company.com"
            value={form.homepage || ''} onChange={e => setForm(f => ({ ...f, homepage: e.target.value }))} />
        </FormCell>
      </FormRow>
      <FormRow last>
        <FormLabel>종업원 수</FormLabel>
        <FormCell>
          <ReadTextField select fullWidth size="small" readOnly={isReadonly}
            value={form.empSize || ''} onChange={e => setForm(f => ({ ...f, empSize: e.target.value }))}>
            <MenuItem value="">선택하세요</MenuItem>
            {EMP_SIZES.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
          </ReadTextField>
        </FormCell>
      </FormRow>
    </FormTable>
  </Box>
  )
}

// ═════════════════════════════════════════════
// Step 1 — 안전보건
// ═════════════════════════════════════════════
const Step1Panel: React.FC<{ form: ContractorRegistrationRequest; setForm: React.Dispatch<React.SetStateAction<ContractorRegistrationRequest>>; isReadonly: boolean }> = ({ form, setForm, isReadonly }) => {
  const { t } = useTranslation()
  const certs = csvToArr(form.certifications)
  const hazards = csvToArr(form.hazardFactors)
  const toggleCsv = (key: 'certifications' | 'hazardFactors', value: string) => {
    const cur = csvToArr(form[key])
    const next = cur.includes(value) ? cur.filter(x => x !== value) : [...cur, value]
    setForm(f => ({ ...f, [key]: arrToCsv(next) }))
  }
  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 1, mb: 1 }}>{t('contractorRegistrationPage.section4', '안전보건 자격·인증')}</Typography>
      <FormTable>
        <FormRow>
          <FormLabel>산업안전보건법 적용</FormLabel>
          <FormCell borderRight>
            <ReadTextField select fullWidth size="small" readOnly={isReadonly}
              value={form.oshApply || ''} onChange={e => setForm(f => ({ ...f, oshApply: e.target.value }))}>
              <MenuItem value="">선택하세요</MenuItem>
              {OSH_APPLY_OPTS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
            </ReadTextField>
          </FormCell>
          <FormLabel>산업재해율 (전년도 %)</FormLabel>
          <FormCell>
            <NumberField value={form.accRate ?? null} onChange={v => setForm(f => ({ ...f, accRate: v }))}
              step={0.01} min={0} readOnly={isReadonly} thousandSeparator={false} placeholder="0.00" />
          </FormCell>
        </FormRow>
        <FormRow last>
          <FormLabel>안전관리자 선임</FormLabel>
          <FormCell borderRight>
            <ReadTextField select fullWidth size="small" readOnly={isReadonly}
              value={form.safetyMgrStatus || ''} onChange={e => setForm(f => ({ ...f, safetyMgrStatus: e.target.value }))}>
              <MenuItem value="">선택하세요</MenuItem>
              {MGR_STATUS_OPTS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
            </ReadTextField>
          </FormCell>
          <FormLabel>보건관리자 선임</FormLabel>
          <FormCell>
            <ReadTextField select fullWidth size="small" readOnly={isReadonly}
              value={form.healthMgrStatus || ''} onChange={e => setForm(f => ({ ...f, healthMgrStatus: e.target.value }))}>
              <MenuItem value="">선택하세요</MenuItem>
              {MGR_STATUS_OPTS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
            </ReadTextField>
          </FormCell>
        </FormRow>
      </FormTable>

      <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 2, mb: 1, color: 'text.secondary' }}>{t('contractorRegistrationPage.section5', '보유 인증 (다중선택)')}</Typography>
      <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {CERT_OPTS.map(o => (
          <Chip key={o} label={o} size="small"
            color={certs.includes(o) ? 'primary' : 'default'}
            variant={certs.includes(o) ? 'filled' : 'outlined'}
            onClick={isReadonly ? undefined : () => toggleCsv('certifications', o)}
            sx={{ cursor: isReadonly ? 'default' : 'pointer' }} />
        ))}
      </Paper>

      <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 3, mb: 1 }}>{t('contractorRegistrationPage.section6', '위험성 평가')}</Typography>
      <FormTable>
        <FormRow last>
          <FormLabel>위험성평가 실시</FormLabel>
          <FormCell borderRight>
            <ReadTextField select fullWidth size="small" readOnly={isReadonly}
              value={form.riskEval || ''} onChange={e => setForm(f => ({ ...f, riskEval: e.target.value }))}>
              <MenuItem value="">선택하세요</MenuItem>
              {RISK_EVAL_OPTS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
            </ReadTextField>
          </FormCell>
          <FormLabel>최근 실시일</FormLabel>
          <FormCell>
            <DatePickerField value={form.riskEvalDate || null} onChange={d => setForm(f => ({ ...f, riskEvalDate: d || undefined }))} readOnly={isReadonly} />
          </FormCell>
        </FormRow>
      </FormTable>

      <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 2, mb: 1, color: 'text.secondary' }}>{t('contractorRegistrationPage.section7', '주요 취급 유해·위험요인 (다중선택)')}</Typography>
      <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {HAZARD_OPTS.map(o => (
          <Chip key={o} label={o} size="small"
            color={hazards.includes(o) ? 'warning' : 'default'}
            variant={hazards.includes(o) ? 'filled' : 'outlined'}
            onClick={isReadonly ? undefined : () => toggleCsv('hazardFactors', o)}
            sx={{ cursor: isReadonly ? 'default' : 'pointer' }} />
        ))}
      </Paper>

      <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 3, mb: 1 }}>{t('contractorRegistrationPage.section8', '협력업체 등급 설정')}</Typography>
      <FormTable>
        <FormRow>
          <FormLabel>안전관리 수준</FormLabel>
          <FormCell borderRight>
            <StarRating value={form.safetyRating ?? 0} onChange={v => setForm(f => ({ ...f, safetyRating: v }))} readOnly={isReadonly} />
          </FormCell>
          <FormLabel>환경관리 수준</FormLabel>
          <FormCell>
            <StarRating value={form.envRating ?? 0} onChange={v => setForm(f => ({ ...f, envRating: v }))} readOnly={isReadonly} />
          </FormCell>
        </FormRow>
        <FormRow last>
          <FormLabel>등록 상태</FormLabel>
          <FormCell>
            <Stack direction="row" spacing={1}>
              {(['APPROVED', 'REVIEW', 'HOLD'] as RegStatus[]).map(s => (
                <Chip key={s} label={STATUS_LABEL[s]} size="small"
                  color={form.regStatus === s ? STATUS_COLOR[s] : 'default'}
                  variant={form.regStatus === s ? 'filled' : 'outlined'}
                  onClick={isReadonly ? undefined : () => setForm(f => ({ ...f, regStatus: s }))}
                  sx={{ cursor: isReadonly ? 'default' : 'pointer', minWidth: 60 }} />
              ))}
            </Stack>
          </FormCell>
        </FormRow>
      </FormTable>
    </Box>
  )
}

// ═════════════════════════════════════════════
// Step 2 — 담당자
// ═════════════════════════════════════════════
const Step2Panel: React.FC<{ form: ContractorRegistrationRequest; setForm: React.Dispatch<React.SetStateAction<ContractorRegistrationRequest>>; isReadonly: boolean }> = ({ form, setForm, isReadonly }) => {
  const { t } = useTranslation()
  return (
  <Box>
    <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 1, mb: 1 }}>{t('contractorRegistrationPage.section9', '안전보건 담당자 (협력업체측)')}</Typography>
    <FormTable>
      <FormRow>
        <FormLabel required>성명</FormLabel>
        <FormCell borderRight>
          <ReadTextField fullWidth size="small" readOnly={isReadonly} placeholder="홍길동"
            value={form.safetyMgrName || ''} onChange={e => setForm(f => ({ ...f, safetyMgrName: e.target.value }))} />
        </FormCell>
        <FormLabel>직책</FormLabel>
        <FormCell>
          <ReadTextField fullWidth size="small" readOnly={isReadonly} placeholder="안전관리자"
            value={form.safetyMgrPosition || ''} onChange={e => setForm(f => ({ ...f, safetyMgrPosition: e.target.value }))} />
        </FormCell>
      </FormRow>
      <FormRow>
        <FormLabel>부서</FormLabel>
        <FormCell borderRight>
          <ReadTextField fullWidth size="small" readOnly={isReadonly} placeholder="안전팀"
            value={form.safetyMgrDept || ''} onChange={e => setForm(f => ({ ...f, safetyMgrDept: e.target.value }))} />
        </FormCell>
        <FormLabel required>휴대전화</FormLabel>
        <FormCell>
          <ReadTextField fullWidth size="small" readOnly={isReadonly} placeholder="010-0000-0000"
            value={form.safetyMgrTel || ''} onChange={e => setForm(f => ({ ...f, safetyMgrTel: fmtPhone(e.target.value) }))} />
        </FormCell>
      </FormRow>
      <FormRow last>
        <FormLabel>직통전화</FormLabel>
        <FormCell borderRight>
          <ReadTextField fullWidth size="small" readOnly={isReadonly} placeholder="02-0000-0000"
            value={form.safetyMgrOfficeTel || ''} onChange={e => setForm(f => ({ ...f, safetyMgrOfficeTel: fmtPhone(e.target.value) }))} />
        </FormCell>
        <FormLabel>이메일</FormLabel>
        <FormCell>
          <ReadTextField fullWidth size="small" readOnly={isReadonly} type="email" placeholder="safety@company.com"
            value={form.safetyMgrEmail || ''} onChange={e => setForm(f => ({ ...f, safetyMgrEmail: e.target.value }))} />
        </FormCell>
      </FormRow>
    </FormTable>

    <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 3, mb: 1 }}>{t('contractorRegistrationPage.section10', '보건담당자')}</Typography>
    <FormTable>
      <FormRow>
        <FormLabel>성명</FormLabel>
        <FormCell borderRight>
          <ReadTextField fullWidth size="small" readOnly={isReadonly} placeholder="김보건"
            value={form.healthMgrName || ''} onChange={e => setForm(f => ({ ...f, healthMgrName: e.target.value }))} />
        </FormCell>
        <FormLabel>직책</FormLabel>
        <FormCell>
          <ReadTextField fullWidth size="small" readOnly={isReadonly} placeholder="보건관리자"
            value={form.healthMgrPosition || ''} onChange={e => setForm(f => ({ ...f, healthMgrPosition: e.target.value }))} />
        </FormCell>
      </FormRow>
      <FormRow>
        <FormLabel>자격증</FormLabel>
        <FormCell>
          <ReadTextField fullWidth size="small" readOnly={isReadonly} placeholder="간호사, 산업위생관리사 등"
            value={form.healthMgrCert || ''} onChange={e => setForm(f => ({ ...f, healthMgrCert: e.target.value }))} />
        </FormCell>
      </FormRow>
      <FormRow last>
        <FormLabel>휴대전화</FormLabel>
        <FormCell borderRight>
          <ReadTextField fullWidth size="small" readOnly={isReadonly} placeholder="010-0000-0000"
            value={form.healthMgrTel || ''} onChange={e => setForm(f => ({ ...f, healthMgrTel: fmtPhone(e.target.value) }))} />
        </FormCell>
        <FormLabel>이메일</FormLabel>
        <FormCell>
          <ReadTextField fullWidth size="small" readOnly={isReadonly} type="email" placeholder="health@company.com"
            value={form.healthMgrEmail || ''} onChange={e => setForm(f => ({ ...f, healthMgrEmail: e.target.value }))} />
        </FormCell>
      </FormRow>
    </FormTable>

    <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 3, mb: 1 }}>{t('contractorRegistrationPage.section11', '당사 내부 담당자')}</Typography>
    <FormTable>
      <FormRow>
        <FormLabel>담당팀</FormLabel>
        <FormCell borderRight>
          <ReadTextField select fullWidth size="small" readOnly={isReadonly}
            value={form.internalDept || ''} onChange={e => setForm(f => ({ ...f, internalDept: e.target.value }))}>
            <MenuItem value="">선택하세요</MenuItem>
            {INTERNAL_DEPTS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
          </ReadTextField>
        </FormCell>
        <FormLabel>담당자명</FormLabel>
        <FormCell>
          <ReadTextField fullWidth size="small" readOnly={isReadonly} placeholder="이담당"
            value={form.internalName || ''} onChange={e => setForm(f => ({ ...f, internalName: e.target.value }))} />
        </FormCell>
      </FormRow>
      <FormRow>
        <FormLabel>연락처</FormLabel>
        <FormCell>
          <ReadTextField fullWidth size="small" readOnly={isReadonly} placeholder="010-0000-0000"
            value={form.internalTel || ''} onChange={e => setForm(f => ({ ...f, internalTel: fmtPhone(e.target.value) }))} />
        </FormCell>
      </FormRow>
      <FormRow last>
        <FormLabel>특이사항·메모</FormLabel>
        <FormCell>
          <ReadTextField fullWidth size="small" multiline minRows={3} readOnly={isReadonly}
            placeholder="협력업체 관련 특이사항, 주의사항, 협력 이력 등을 입력하세요."
            value={form.memo || ''} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))} />
        </FormCell>
      </FormRow>
    </FormTable>
  </Box>
  )
}

// ═════════════════════════════════════════════
// Step 3 — 서류·계약
// ═════════════════════════════════════════════
type DocSlotKey = 'bizLicense' | 'safetyMgrAssign' | 'riskEval' | 'insurance'

const UploadBox: React.FC<{
  label: string
  required?: boolean
  hint?: string
  file: File | null
  onSelect: (f: File | null) => void
  isReadonly: boolean
}> = ({ label, required, hint, file, onSelect, isReadonly }) => {
  const ref = React.useRef<HTMLInputElement>(null)
  return (
    <Box sx={{ flex: 1 }}>
      <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
        {label}{required && <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>}
      </Typography>
      <Box
        onClick={() => !isReadonly && ref.current?.click()}
        sx={{
          border: '1px dashed', borderColor: 'divider', borderRadius: 1, p: 2,
          minHeight: 96, display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', cursor: isReadonly ? 'default' : 'pointer',
          bgcolor: file ? 'action.hover' : 'transparent',
          '&:hover': { borderColor: isReadonly ? 'grey.400' : 'primary.main' },
        }}>
        {file ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', justifyContent: 'center' }}>
            <DescriptionIcon fontSize="small" color="primary" />
            <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{file.name}</Typography>
            {!isReadonly && (
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); onSelect(null) }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        ) : (
          <>
            <CloudUploadIcon sx={{ color: 'text.disabled', mb: 0.5 }} />
            <Typography variant="body2" color="text.secondary">클릭하여 파일 업로드</Typography>
            {hint && <Typography variant="caption" color="text.disabled" sx={{ mt: 0.25 }}>{hint}</Typography>}
          </>
        )}
      </Box>
      <input ref={ref} type="file" hidden onChange={(e) => { const f = e.target.files?.[0] || null; onSelect(f); if (ref.current) ref.current.value = '' }} />
    </Box>
  )
}

const Step3Panel: React.FC<{
  form: ContractorRegistrationRequest
  setForm: React.Dispatch<React.SetStateAction<ContractorRegistrationRequest>>
  isReadonly: boolean
  namedFiles: Record<DocSlotKey, File | null>
  setNamedFiles: React.Dispatch<React.SetStateAction<Record<DocSlotKey, File | null>>>
  extraFiles: File[]
  setExtraFiles: React.Dispatch<React.SetStateAction<File[]>>
  agree1: boolean; setAgree1: (v: boolean) => void
  agree2: boolean; setAgree2: (v: boolean) => void
  agree3: boolean; setAgree3: (v: boolean) => void
}> = ({ form, setForm, isReadonly, namedFiles, setNamedFiles, extraFiles, setExtraFiles,
       agree1, setAgree1, agree2, setAgree2, agree3, setAgree3 }) => {
  const { t } = useTranslation()
  const extraInputRef = React.useRef<HTMLInputElement>(null)
  return (
  <Box>
    <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 1, mb: 1 }}>{t('contractorRegistrationPage.section12', '계약 정보')}</Typography>
    <FormTable>
      <FormRow>
        <FormLabel>계약 시작일</FormLabel>
        <FormCell borderRight>
          <DatePickerField value={form.contractStart || null} onChange={d => setForm(f => ({ ...f, contractStart: d || undefined }))} readOnly={isReadonly} />
        </FormCell>
        <FormLabel>계약 종료일</FormLabel>
        <FormCell>
          <DatePickerField value={form.contractEnd || null} onChange={d => setForm(f => ({ ...f, contractEnd: d || undefined }))} readOnly={isReadonly} />
        </FormCell>
      </FormRow>
      <FormRow>
        <FormLabel>계약 유형</FormLabel>
        <FormCell borderRight>
          <ReadTextField select fullWidth size="small" readOnly={isReadonly}
            value={form.contractType || ''} onChange={e => setForm(f => ({ ...f, contractType: e.target.value }))}>
            <MenuItem value="">선택하세요</MenuItem>
            {CONTRACT_TYPES.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
          </ReadTextField>
        </FormCell>
        <FormLabel>계약금액 (원)</FormLabel>
        <FormCell>
          <NumberField value={form.contractAmount ?? null} onChange={v => setForm(f => ({ ...f, contractAmount: v }))}
            min={0} readOnly={isReadonly} placeholder="0" />
        </FormCell>
      </FormRow>
      <FormRow last>
        <FormLabel>작업 구역</FormLabel>
        <FormCell>
          <ReadTextField fullWidth size="small" readOnly={isReadonly} placeholder="제1공장, 외부 현장 등"
            value={form.workZone || ''} onChange={e => setForm(f => ({ ...f, workZone: e.target.value }))} />
        </FormCell>
      </FormRow>
    </FormTable>

    <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 3, mb: 1 }}>{t('contractorRegistrationPage.section13', '제출 서류')}</Typography>
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <UploadBox label={t('contractorRegistrationPage.label3', '사업자등록증')} required hint="PDF, JPG, PNG (최대 10MB)"
          file={namedFiles.bizLicense} isReadonly={isReadonly}
          onSelect={(f) => setNamedFiles(prev => ({ ...prev, bizLicense: f }))} />
        <UploadBox label={t('contractorRegistrationPage.label4', '안전관리자 선임 서류')}
          file={namedFiles.safetyMgrAssign} isReadonly={isReadonly}
          onSelect={(f) => setNamedFiles(prev => ({ ...prev, safetyMgrAssign: f }))} />
        <UploadBox label={t('contractorRegistrationPage.label5', '위험성평가 확인서')}
          file={namedFiles.riskEval} isReadonly={isReadonly}
          onSelect={(f) => setNamedFiles(prev => ({ ...prev, riskEval: f }))} />
        <UploadBox label={t('contractorRegistrationPage.label6', '보험가입증명서')}
          file={namedFiles.insurance} isReadonly={isReadonly}
          onSelect={(f) => setNamedFiles(prev => ({ ...prev, insurance: f }))} />
      </Box>
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>추가 서류 업로드</Typography>
        <Box
          onClick={() => !isReadonly && extraInputRef.current?.click()}
          sx={{
            border: '1px dashed', borderColor: 'divider', borderRadius: 1, p: 2,
            minHeight: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: isReadonly ? 'default' : 'pointer',
            '&:hover': { borderColor: isReadonly ? 'grey.400' : 'primary.main' },
          }}>
          <DescriptionIcon sx={{ color: 'text.disabled', mb: 0.5 }} />
          <Typography variant="body2" color="text.secondary">기타 서류 (KOSHA 인증서, 환경인증, ISO 등)</Typography>
        </Box>
        <input ref={extraInputRef} type="file" hidden multiple
          onChange={(e) => {
            const fs = Array.from(e.target.files || [])
            if (fs.length) setExtraFiles(prev => [...prev, ...fs])
            if (extraInputRef.current) extraInputRef.current.value = ''
          }} />
        {extraFiles.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            {extraFiles.map((f, idx) => (
              <Chip key={idx} label={f.name} size="small"
                onDelete={isReadonly ? undefined : () => setExtraFiles(prev => prev.filter((_, i) => i !== idx))} />
            ))}
          </Box>
        )}
      </Box>
    </Paper>

    {!isReadonly && (
      <>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 3, mb: 1 }}>{t('contractorRegistrationPage.section14', '동의 확인')}</Typography>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={1}>
            <FormControlLabel control={<Checkbox size="small" checked={agree1} onChange={e => setAgree1(e.target.checked)} />}
              label={t('contractorRegistrationPage.label7', '안전보건 관리규정 및 협력업체 준수사항을 확인하였습니다.')} />
            <FormControlLabel control={<Checkbox size="small" checked={agree2} onChange={e => setAgree2(e.target.checked)} />}
              label={t('contractorRegistrationPage.label8', '개인정보 수집·이용에 동의합니다.')} />
            <FormControlLabel control={<Checkbox size="small" checked={agree3} onChange={e => setAgree3(e.target.checked)} />}
              label={t('contractorRegistrationPage.label9', '입력한 정보가 사실임을 확인합니다.')} />
          </Stack>
        </Paper>
      </>
    )}
  </Box>
  )
}

// ═════════════════════════════════════════════
// Step 4 — 확인·등록
// ═════════════════════════════════════════════
const Step4Panel: React.FC<{
  form: ContractorRegistrationRequest
  submittedResult: ContractorRegistration | null
  onReset: () => void
}> = ({ form, submittedResult, onReset }) => {
  const { t } = useTranslation()
  const rows = useMemo(() => {
    const r: Array<[string, string | number | null | undefined]> = [
      ['업체명', form.companyName],
      ['사업자등록번호', form.bizNum],
      ['법인등록번호', form.corpNum],
      ['대표자명', form.ceoName],
      ['업종', form.bizType],
      ['업태', form.bizCategory],
      ['주소', [form.zipCode ? `(${form.zipCode})` : '', form.addr1, form.addr2].filter(Boolean).join(' ')],
      ['대표전화', form.tel],
      ['이메일', form.email],
      ['홈페이지', form.homepage],
      ['종업원 수', form.empSize],
      ['산업안전보건법 적용', form.oshApply],
      ['안전관리자', form.safetyMgrStatus],
      ['보건관리자', form.healthMgrStatus],
      ['산업재해율', form.accRate != null ? `${form.accRate}%` : ''],
      ['보유 인증', form.certifications],
      ['위험성평가', form.riskEval],
      ['위험성평가일', form.riskEvalDate],
      ['유해·위험요인', form.hazardFactors],
      ['안전관리 수준', '★'.repeat(form.safetyRating ?? 0) + '☆'.repeat(5 - (form.safetyRating ?? 0))],
      ['환경관리 수준', '★'.repeat(form.envRating ?? 0) + '☆'.repeat(5 - (form.envRating ?? 0))],
      ['등록 상태', form.regStatus ? STATUS_LABEL[form.regStatus as RegStatus] : ''],
      ['안전담당자', [form.safetyMgrName, form.safetyMgrPosition].filter(Boolean).join(' / ')],
      ['안전담당자 연락처', form.safetyMgrTel],
      ['보건담당자', [form.healthMgrName, form.healthMgrPosition].filter(Boolean).join(' / ')],
      ['당사 담당자', [form.internalName, form.internalDept].filter(Boolean).join(' / ')],
      ['계약기간', form.contractStart && form.contractEnd ? `${form.contractStart} ~ ${form.contractEnd}` : ''],
      ['계약유형', form.contractType],
      ['계약금액', form.contractAmount != null ? `${Number(form.contractAmount).toLocaleString('ko-KR')}원` : ''],
      ['작업구역', form.workZone],
      ['특이사항', form.memo],
    ]
    return r.filter(([, v]) => v != null && String(v).trim() !== '')
  }, [form])

  if (submittedResult) {
    return (
      <Paper variant="outlined" sx={{ p: 5, textAlign: 'center' }}>
        <CheckCircleOutlineIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
        <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>{t('contractorReg.complete', '등록 완료!')}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('contractorReg.completeDesc1', '협력 업체 정보가 성공적으로 등록되었습니다.')}<br />{t('contractorReg.completeDesc2', '승인 검토 후 담당자가 안내드리겠습니다.')}
        </Typography>
        <Chip label={`등록번호: ${submittedResult.regNo}`} color="primary" variant="outlined"
          sx={{ fontSize: 14, fontWeight: 700, py: 2.5, px: 1 }} />
        <Box sx={{ mt: 3 }}>
          <Button variant="contained" onClick={onReset}>등록 목록으로</Button>
        </Box>
      </Paper>
    )
  }

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 1, mb: 1 }}>{t('contractorRegistrationPage.section15', '등록 정보 최종 확인')}</Typography>
      {rows.length === 0 ? (
        <Paper variant="outlined">
          <Typography variant="body2" color="text.disabled" sx={{ p: 4, textAlign: 'center' }}>
            확인할 내용이 없습니다.
          </Typography>
        </Paper>
      ) : (
        <FormTable>
          {Array.from({ length: Math.ceil(rows.length / 2) }).map((_, rowIdx) => {
            const left = rows[rowIdx * 2]
            const right = rows[rowIdx * 2 + 1]
            const isLast = rowIdx === Math.ceil(rows.length / 2) - 1
            return (
              <FormRow key={rowIdx} last={isLast}>
                <FormLabel>{left[0]}</FormLabel>
                <FormCell borderRight={!!right}>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{String(left[1])}</Typography>
                </FormCell>
                {right ? (
                  <>
                    <FormLabel>{right[0]}</FormLabel>
                    <FormCell>
                      <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{String(right[1])}</Typography>
                    </FormCell>
                  </>
                ) : (
                  <>
                    <FormLabel> </FormLabel>
                    <FormCell><Typography variant="body2">&nbsp;</Typography></FormCell>
                  </>
                )}
              </FormRow>
            )
          })}
        </FormTable>
      )}
    </Box>
  )
}

export default ContractorRegistrationPage
