import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Typography, Button, Alert,
  TextField, IconButton, Radio,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import * as XLSX from 'xlsx'
import { riskAssessmentApi } from '../../api/riskAssessmentApi'
import { RiskAssessmentFormMaster, RiskAssessmentFormItemRequest } from '../../types/riskAssessment.types'
import RiskAssessmentFormTab from '../ehs/RiskAssessmentFormTab'
import { useAlert } from '../../contexts/AlertContext'
import LoadingOverlay from '../common/LoadingOverlay'

const headerCellSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }

type ParsedForm = { title: string; items: RiskAssessmentFormItemRequest[] }

// 공정/활동 제목 정리: 개행 제거, 공백 1개로, 괄호 안 불필요한 공백 제거
//   예: "공사 계약 및\n업체 관리(G)" → "공사 계약 및 업체 관리(G)"
//   예: "자재관련 업무( E)" → "자재관련 업무(E)"
const cleanTitle = (raw: string): string =>
  String(raw || '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\(\s*([A-Za-z0-9])\s*\)/g, '($1)')
    .trim()

// 샘플/예시 시트 제외 키워드
const SAMPLE_SHEET_KEYWORDS = ['사례', '작성 예', '작성예', '예시', '작성방법', '샘플']

// 평가구분(4M) 기호/공백 제거 후 코드 매핑
const mapRisk4M = (raw: string): string => {
  const s = String(raw || '').replace(/[.,/·]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!s) return ''
  if (/(기계)/.test(s)) return 'MECHANICAL'
  if (/(물질.*환경|환경.*물질)/.test(s)) return 'MATERIAL_ENV'
  if (/(환경|작업)/.test(s)) return 'ENVIRONMENT'
  if (/(인적)/.test(s)) return 'HUMAN'
  if (/(관리)/.test(s)) return 'MANAGEMENT'
  if (s === '요인') return 'HUMAN'
  return s  // 미확정이면 원본 유지
}

// 재해형태 기호 제거 후 코드 매핑
const mapDisaster = (raw: string): string => {
  const s = String(raw || '').replace(/[,./·]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!s) return ''
  const table: Array<[RegExp, string]> = [
    [/^추락$/, 'FALL'],
    [/(낙하|비래)/, 'DROP'],
    [/^전도$/, 'SLIP'],
    [/^충돌$/, 'COLLISION'],
    [/^붕괴$/, 'COLLAPSE'],
    [/^끼임$/, 'CAUGHT'],
    [/^협착$/, 'PINCH'],
    [/^절단$/, 'CUT'],
    [/^감전$/, 'ELECTRIC'],
    [/화재/, 'FIRE'],
    [/(화상|고온접촉)/, 'BURN'],
    [/^질식$/, 'SUFFOCATION'],
    [/유해물질/, 'CHEMICAL'],
    [/무리.*동작/, 'OVERWORK'],
    [/^타박상$/, 'BRUISE'],
    [/(배임|베임|찰과상)/, 'SCRATCH'],
    [/청력/, 'HEARING'],
    [/시력/, 'VISION'],
    [/호흡기/, 'RESPIRATORY'],
    [/^골절$/, 'FRACTURE'],
    [/^중독$/, 'POISONING'],
    [/^비래$/, 'FLYING'],
  ]
  for (const [re, code] of table) if (re.test(s)) return code
  if (/(기타|질환|삐임|상해|찔림)/.test(s)) return 'OTHER'
  return s
}

// 플레이스홀더 제목 판정 — 예: "①", "②", "A", 원형숫자만 포함 등
const isPlaceholderTitle = (title: string): boolean => {
  if (!title) return true
  if (title.length <= 2) return true
  // 원형숫자/원형문자/해시/로마숫자 등 기호가 대부분인 경우 제외
  const symbolOnly = /^[①-⑳⓪⒜-⒵㉠-㉿\u2460-\u24FF\u25A0-\u25FF\s]+$/
  if (symbolOnly.test(title)) return true
  return false
}

// 양식5.위험성평가표 시트에서 공정/활동 단위로 form 데이터를 추출
const parseRiskAssessmentSheet = (rows: string[][]): ParsedForm[] => {
  const forms: ParsedForm[] = []
  const norm = (v: unknown) => String(v ?? '').replace(/\s+/g, '').trim()

  let i = 0
  while (i < rows.length) {
    const row = rows[i] || []
    // "공정/활동" 행 찾기 (col 0 에 위치, col 1 에 제목)
    if (norm(row[0]) === '공정/활동' && norm(row[1])) {
      const title = cleanTitle(String(row[1]))

      // 데이터 시작행 = "작업내용" 헤더 이후 2줄 (두번째 헤더 행에 재해형태/빈도/강도...)
      let dataStart = -1
      let headerTopRow = -1
      for (let j = i + 1; j < Math.min(rows.length, i + 12); j++) {
        if (norm(rows[j]?.[0]) === '작업내용') {
          dataStart = j + 2
          headerTopRow = j
          break
        }
      }
      if (dataStart < 0) { i++; continue }

      // 헤더 두 행을 훑어 '현재 안전조치' / '안전조치' 컬럼 인덱스 탐지
      // (KOSHA 양식별로 열 위치가 달라질 수 있어 헤더 텍스트로 동적 탐지)
      let safetyCol = -1
      const headerRows = [rows[headerTopRow] || [], rows[headerTopRow + 1] || []]
      for (const hr of headerRows) {
        for (let c = 0; c < hr.length; c++) {
          const v = norm(hr[c])
          if (!v) continue
          if (v.includes('현재안전조치') || v === '안전조치' || (v.includes('현재') && v.includes('안전'))) {
            safetyCol = c
            break
          }
        }
        if (safetyCol >= 0) break
      }

      const items: RiskAssessmentFormItemRequest[] = []
      let lastDetailAction = ''
      let lastRisk4M = ''

      for (let j = dataStart; j < rows.length; j++) {
        const r = rows[j] || []
        // 다음 양식 시작 / 빈행에서 종료
        if (norm(r[0]) === '양식5.위험성평가표' || norm(r[0]).startsWith('양식5')) break
        if (norm(r[0]) === '공정/활동') break

        const detailAction = String(r[0] || '').trim() || lastDetailAction
        const risk4M = String(r[1] || '').trim() || lastRisk4M
        const danger = String(r[2] || '').trim()
        const expectedDisaster = String(r[4] || '').trim()
        const currentSafetyMeasures = safetyCol >= 0
          ? String(r[safetyCol] || '').replace(/\r\n/g, '\n').trim()
          : ''

        // 완전히 비어 있으면 종료
        if (!detailAction && !risk4M && !danger && !expectedDisaster) break

        // 위험요인이 비어있는 행은 스킵 (헤더 연결 등)
        if (!danger) continue

        if (detailAction) lastDetailAction = detailAction
        if (risk4M) lastRisk4M = risk4M

        items.push({
          riskIdx: items.length + 1,
          detailAction,
          risk4M: mapRisk4M(risk4M),
          danger,
          expectedDisaster: mapDisaster(expectedDisaster),
          target: '',
          currentSafetyMeasures,
          possibilityGrade: 0,
          resultGrade: 0,
          reductionMeasures: '',
          improvementManager: '',
          improvementDeadline: '',
          improvedPossibilityGrade: 0,
          improvedResultGrade: 0,
          relatedLaw: '',
          remark: '',
          reviewer: '',
          approverName: '',
        })
      }

      if (items.length > 0 && !isPlaceholderTitle(title)) {
        forms.push({ title, items })
      }
      i = dataStart + items.length
      continue
    }
    i++
  }
  return forms
}

const RiskAssessmentFormWrapper: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccess, showError, showWarning } = useAlert()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [copyTargetId, setCopyTargetId] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 복사 — 선택된 양식의 상세를 가져와 동일 항목으로 새 양식 생성 (제목 앞에 'copy_ ' 접두어)
  const copyMutation = useMutation({
    mutationFn: async (sourceId: number) => {
      const detail = await riskAssessmentApi.getFormById(sourceId)
      const items: RiskAssessmentFormItemRequest[] = (detail.items || []).map((it: any, idx: number) => ({
        riskIdx: idx + 1,
        detailAction: it.detailAction || '',
        risk4M: it.risk4M || '',
        danger: it.danger || '',
        expectedDisaster: it.expectedDisaster || '',
        target: it.target || '',
        currentSafetyMeasures: it.currentSafetyMeasures || '',
        possibilityGrade: it.possibilityGrade ?? 0,
        resultGrade: it.resultGrade ?? 0,
        reductionMeasures: it.reductionMeasures || '',
        improvementManager: it.improvementManager || '',
        improvementDeadline: it.improvementDeadline || '',
        improvedPossibilityGrade: it.improvedPossibilityGrade ?? 0,
        improvedResultGrade: it.improvedResultGrade ?? 0,
        relatedLaw: it.relatedLaw || '',
        remark: it.remark || '',
        reviewer: it.reviewer || '',
        approverName: it.approverName || '',
      }))
      return riskAssessmentApi.createForm({ title: `copy_ ${detail.title || ''}`.trim(), items })
    },
    onSuccess: () => {
      showSuccess(t('checklist.copySuccess', '복사되었습니다.'))
      queryClient.invalidateQueries({ queryKey: ['riskAssessmentForms'] })
      setCopyTargetId(null)
    },
    onError: () => showError(t('common.failed', '실패했습니다.')),
  })
  const handleCopy = () => {
    if (copyTargetId == null) return
    copyMutation.mutate(copyTargetId)
  }

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setIsUploading(true)
    try {
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' })
      // 시트명에 '위험성평가표' 포함 + 샘플/예시 시트는 제외
      const sheetNames = wb.SheetNames.filter(n => {
        if (!n.includes('위험성평가표')) return false
        return !SAMPLE_SHEET_KEYWORDS.some(kw => n.includes(kw))
      })

      const parsed: ParsedForm[] = []
      for (const name of sheetNames) {
        const ws = wb.Sheets[name]
        const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
        parsed.push(...parseRiskAssessmentSheet(rows))
      }

      if (parsed.length === 0) {
        showWarning(t('riskAssessment.excelNoForms', '업로드할 위험성평가 양식을 찾지 못했습니다.'))
        return
      }

      // 동일 제목이라도 기존 항목 유지 + 새 항목으로 추가 등록 (중복 허용)
      let created = 0
      for (const form of parsed) {
        try {
          await riskAssessmentApi.createForm({ title: form.title, items: form.items })
          created++
        } catch (err) {
          console.error('Failed to create form:', form.title, err)
        }
      }

      // 캐시 무효화 후 즉시 재조회를 await 해서 목록이 새 데이터로 갱신된 뒤 토스트가 뜨도록 함
      // (invalidateQueries 만으로는 비동기 refetch 완료 전에 success 메시지가 떠 사용자가 "변화 없음"으로 오인할 수 있음)
      await queryClient.refetchQueries({ queryKey: ['riskAssessmentForms'], type: 'active' })
      if (keyword.trim()) setKeyword('') // 검색어 걸려있어 새 항목이 안보이는 경우 대비
      if (created === 0) {
        showWarning(t('riskAssessmentFormWrapper.msg1', '등록된 양식이 없습니다. (모두 실패하거나 동일 제목이 이미 존재할 수 있음)'))
      } else {
        showSuccess(`${created}개 양식, 총 ${parsed.reduce((s, f) => s + f.items.length, 0)}개 항목이 등록되었습니다.`)
      }
    } catch (err) {
      console.error('Excel parse failed:', err)
      showError(t('common.error', '엑셀 파일 처리에 실패했습니다.'))
    } finally {
      setIsUploading(false)
    }
  }

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['riskAssessmentForms'],
    queryFn: () => riskAssessmentApi.getForms({ page: 0, size: 100 }),
    enabled: selectedId === null && !isCreating,
  })

  const items = data?.content || []
  const filtered = keyword.trim()
    ? items.filter(i => i.title?.toLowerCase().includes(keyword.toLowerCase()))
    : items

  if (isCreating) {
    return <RiskAssessmentFormTab isNew onBack={() => setIsCreating(false)} />
  }

  if (selectedId !== null) {
    return (
      <RiskAssessmentFormTab formId={selectedId} onBack={() => setSelectedId(null)} />
    )
  }

  return (
    <Box>
      <LoadingOverlay open={isUploading || isFetching} message={isUploading ? t('riskAssessment.uploading', '엑셀 업로드 중...') : t('common.loading', '목록을 불러오는 중...')} />
      <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleExcelUpload} />
      {/* PC Search */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField size="small" placeholder={t('riskAssessment.searchPlaceholder', '제목으로 검색')} value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            sx={{ minWidth: 250 }} />
          <IconButton onClick={() => setKeyword('')} size="small"><RefreshIcon /></IconButton>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" size="small" onClick={() => fileInputRef.current?.click()}>{t('riskAssessment.excelUpload', '엑셀 업로드')}</Button>
          <Button variant="contained" size="small" startIcon={<ContentCopyIcon />}
            disabled={copyTargetId == null || copyMutation.isPending} onClick={handleCopy}>
            {t('common.copy', '복사')}
          </Button>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setIsCreating(true)}>{t('common.new')}</Button>
        </Box>
      </Box>
      {/* Mobile Search */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
        <TextField size="small" fullWidth placeholder={t('riskAssessment.searchPlaceholder', '제목으로 검색')} value={keyword}
          onChange={(e) => setKeyword(e.target.value)} />
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={() => setKeyword('')} sx={{ flex: '1 1 calc(50% - 4px)' }}>{t('common.reset', '초기화')}</Button>
          <Button variant="contained" size="small" startIcon={<ContentCopyIcon />}
            disabled={copyTargetId == null || copyMutation.isPending} onClick={handleCopy}
            sx={{ flex: '1 1 calc(50% - 4px)' }}>
            {t('common.copy', '복사')}
          </Button>
          <Button variant="contained" size="small" onClick={() => fileInputRef.current?.click()} sx={{ flex: '1 1 calc(50% - 4px)' }}>{t('riskAssessment.excelUpload', '엑셀 업로드')}</Button>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setIsCreating(true)} sx={{ flex: '1 1 calc(50% - 4px)' }}>{t('common.new')}</Button>
        </Box>
      </Box>

      {isLoading ? (
        <Box sx={{ minHeight: 200 }} />
      ) : filtered.length === 0 ? (
        <Alert severity="info">{t('common.noData')}</Alert>
      ) : (
        <>
          {/* PC Table */}
          <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', overflowX: 'auto' }}>
            <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ ...headerCellSx, width: 48, p: 0 }} align="center"></TableCell>
                  <TableCell sx={{ ...headerCellSx, width: 40 }} align="center">{t('common.no')}</TableCell>
                  <TableCell sx={headerCellSx}>{t('common.title', '제목')}</TableCell>
                  <TableCell sx={{ ...headerCellSx, width: 40 }} align="center">{t('riskAssessment.itemCount', '항목 수')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((item: RiskAssessmentFormMaster, idx: number) => (
                  <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => setSelectedId(item.id)}>
                    <TableCell align="center" sx={{ width: 48, p: 0 }} onClick={(e) => e.stopPropagation()}>
                      <Radio size="small" checked={copyTargetId === item.id}
                        onChange={() => setCopyTargetId(item.id)} value={item.id} name="risk-copy-radio" />
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', width: 40 }}>{idx + 1}</TableCell>
                    <TableCell><Typography variant="body2" fontWeight={600} color="primary">{item.title}</Typography></TableCell>
                    <TableCell align="center">{item.itemCount ?? 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {/* Mobile Cards */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
            {filtered.map((item: RiskAssessmentFormMaster) => (
              <Paper key={item.id} sx={{ p: 2, cursor: 'pointer', border: 1, borderColor: 'divider' }} onClick={() => setSelectedId(item.id)}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Box onClick={(e) => e.stopPropagation()}>
                    <Radio size="small" checked={copyTargetId === item.id}
                      onChange={() => setCopyTargetId(item.id)} value={item.id} name="risk-copy-radio-mobile" />
                  </Box>
                  <Typography fontWeight="bold" color="primary" sx={{ flex: 1 }}>{item.title}</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">{t('riskAssessment.itemCount', '항목 수')}: {item.itemCount ?? 0}</Typography>
              </Paper>
            ))}
          </Box>
        </>
      )}
    </Box>
  )
}

export default RiskAssessmentFormWrapper
