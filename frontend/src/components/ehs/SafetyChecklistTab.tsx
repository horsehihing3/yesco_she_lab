import { formatDate } from '../../utils/dateDefaults'
import React, { useState, useEffect, useCallback, useRef, useImperativeHandle, forwardRef } from 'react'
import {
  Box,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  Typography,
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  UploadFile as UploadFileIcon,
} from '@mui/icons-material'
import * as XLSX from 'xlsx'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  fetchSafetyTemplateDetail,
  batchSaveTemplate,
} from '../../api/safetyChecklistApi'
import {
  SafetyChecklistTemplate,
} from '../../types/safetyChecklist.types'
import { useAlert } from '../../contexts/AlertContext'
import DatePickerField from '../common/DatePickerField'
import LoadingOverlay from '../common/LoadingOverlay'
import SignaturePad from '../common/SignaturePad'
import UserSelectModal, { UserInfo } from '../common/UserSelectModal'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import { createSafetyTemplate, deleteSafetyTemplate } from '../../api/safetyChecklistApi'
import ItemAttachmentCell from '../common/ItemAttachmentCell'
import { SAFETY_CHECKLIST_ITEM_ENTITY_TYPE } from '../../api/itemAttachmentApi'
import { useItemAttachments } from '../../hooks/useItemAttachments'

interface SafetyChecklistTabProps {
  templateId: number
  onBack?: () => void
  startEditing?: boolean
  isNew?: boolean
  categoryType?: string
  onCreated?: (id: number) => void
  embedded?: boolean
  showSummary?: boolean
  // 점검자/검토자/승인자 이름·서명·날짜 입력 영역 숨김 (감사 실시 등에서 사용)
  hideSignatures?: boolean
  // 모바일 단순 체크리스트 모드: 지적사항/조치기한/조치완료/첨부파일 셀 숨김
  simpleMode?: boolean
  // 결재 상신 등 상태일 때 모든 입력·저장 컨트롤 비활성화 (읽기 전용 강제)
  locked?: boolean
  // 상단 '체크리스트 정보' 헤더(제목·설명·작성일) 영역 숨김
  hideTemplateInfo?: boolean
  // 항상 빈 상태로 시작 (저장된 checkResult/finding/조치 데이터 무시) — 협력업체 실행 URL 등
  freshFill?: boolean
}

interface LocalItem {
  id?: number
  _tempId: string
  classification: string
  checkItem: string
  legalBasis: string
  checkResult: string
  finding: string
  actionDeadline: string
  actionComplete: boolean
  sortOrder: number
}

interface LocalCategory {
  id?: number
  _tempId: string
  categoryName: string
  sortOrder: number
  items: LocalItem[]
}

export interface SafetyChecklistTabRef {
  save: () => Promise<void>
  isAllChecked: () => boolean
  // 현재 체크리스트 응답을 JSON 문자열로 직렬화 (협력업체 실행 등 실행 단위 스냅샷 저장용)
  getSnapshot: () => string
}

let tempIdCounter = 0
const nextTempId = () => `temp_${++tempIdCounter}`

const SafetyChecklistTab = forwardRef<SafetyChecklistTabRef, SafetyChecklistTabProps>(({ templateId, onBack, startEditing, isNew, categoryType, onCreated, embedded, showSummary, hideSignatures, simpleMode: simpleModeProp, locked, hideTemplateInfo, freshFill }, ref) => {
  const { t } = useTranslation()
  const { showConfirm, showSuccess, showError } = useAlert()
  const queryClient = useQueryClient()

  const [isEditing, setIsEditing] = useState(startEditing || false)
  const [isSaving, setIsSaving] = useState(false)
  const [localCategories, setLocalCategories] = useState<LocalCategory[]>([])
  const [initialized, setInitialized] = useState(false)
  const attachments = useItemAttachments(SAFETY_CHECKLIST_ITEM_ENTITY_TYPE)

  const [templateName, setTemplateName] = useState('')
  const [templateDesc, setTemplateDesc] = useState('')
  const [signData, setSignData] = useState({
    inspectorName: '', inspectorSign: '', inspectorSignDate: '',
    reviewerName: '', reviewerSign: '', reviewerSignDate: '',
    approverName: '', approverSign: '', approverSignDate: '',
  })
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [userModalTarget, setUserModalTarget] = useState<'inspectorName' | 'reviewerName' | 'approverName'>('inspectorName')

  const userModalTitles: Record<string, string> = {
    inspectorName: t('safetyChecklist.selectInspector', '점검자 선택'),
    reviewerName: t('safetyChecklist.selectReviewer', '검토자 선택'),
    approverName: t('safetyChecklist.selectApprover', '승인자 선택'),
  }

  const openUserModal = (target: typeof userModalTarget) => { setUserModalTarget(target); setUserModalOpen(true) }
  const handleUserSelected = (users: UserInfo[]) => {
    if (users.length > 0) setSignData(prev => ({ ...prev, [userModalTarget]: users[0].name }))
    setUserModalOpen(false)
  }

  // Template detail query
  const { data: template } = useQuery<SafetyChecklistTemplate>({
    queryKey: ['safetyTemplate', templateId],
    queryFn: () => fetchSafetyTemplateDetail(templateId),
    enabled: !isNew && !!templateId,
  })

  // simpleMode 자동 활성화 — 템플릿 카테고리가 CONTRACTOR_MOBILE 이면 어디서 임베드되든 협력사 모바일 단순 컬럼 적용
  const simpleMode = simpleModeProp || template?.categoryType === 'CONTRACTOR_MOBILE' || categoryType === 'CONTRACTOR_MOBILE'

  // 임베디드 미리보기 모드 (점검/감사 실행이 아닌 단순 템플릿 표시)
  // 또는 freshFill=true (협력업체 실행 URL 등 매번 빈 상태로 시작)
  // → 템플릿에 베이크된 checkResult/finding/조치 데이터를 표시하지 않음 (빈 상태로 시작)
  const isPreviewOnly = freshFill || (embedded && !showSummary && !startEditing)

  // Sync server data → local state
  const syncFromServer = useCallback((tmpl: SafetyChecklistTemplate) => {
    setLocalCategories(
      (tmpl.categories || []).map(cat => ({
        id: cat.id,
        _tempId: nextTempId(),
        categoryName: cat.categoryName,
        sortOrder: cat.sortOrder,
        items: (cat.items || []).map(item => ({
          id: item.id,
          _tempId: nextTempId(),
          classification: item.classification || '필수',
          checkItem: item.checkItem,
          legalBasis: item.legalBasis,
          checkResult: isPreviewOnly ? '' : (item.checkResult || ''),
          finding: isPreviewOnly ? '' : (item.finding || ''),
          actionDeadline: isPreviewOnly ? '' : (item.actionDeadline || ''),
          actionComplete: isPreviewOnly ? false : (item.actionComplete || false),
          sortOrder: item.sortOrder,
        })),
      }))
    )
  }, [isPreviewOnly])

  // Reset when templateId changes
  useEffect(() => {
    setInitialized(false)
    if (!isNew) setIsEditing(false)
  }, [templateId])

  useEffect(() => {
    if (template && !initialized) {
      syncFromServer(template)
      setTemplateName(template.templateName || '')
      setTemplateDesc(template.description || '')
      setSignData({
        inspectorName: template.inspectorName || '', inspectorSign: template.inspectorSign || '', inspectorSignDate: template.inspectorSignDate || '',
        reviewerName: template.reviewerName || '', reviewerSign: template.reviewerSign || '', reviewerSignDate: template.reviewerSignDate || '',
        approverName: template.approverName || '', approverSign: template.approverSign || '', approverSignDate: template.approverSignDate || '',
      })
      setInitialized(true)
    }
  }, [template, initialized, syncFromServer])

  // --- Local state handlers ---
  // ──── 엑셀 업로드 ────
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer)
      const wb = XLSX.read(data, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

      // 헤더 행 찾기: "No" 또는 "번호"가 포함된 행
      let headerIdx = -1
      for (let i = 0; i < Math.min(rows.length, 20); i++) {
        const rowStr = rows[i].map((c: any) => String(c).trim().toLowerCase()).join(' ')
        if (rowStr.includes('no') && (rowStr.includes('점검') || rowStr.includes('항목') || rowStr.includes('check'))) {
          headerIdx = i
          break
        }
      }
      if (headerIdx === -1) {
        showError(t('safetyChecklist.excelNoHeader', '헤더 행(No, 분류, 점검 항목...)을 찾을 수 없습니다.'))
        return
      }

      // 헤더 컬럼 인덱스 매핑
      const headers = rows[headerIdx].map((c: any) => String(c).trim().toLowerCase())
      const findCol = (keywords: string[]) => headers.findIndex(h => keywords.some(k => h.includes(k)))
      const noCol = findCol(['no', '번호'])
      const classCol = findCol(['분류'])
      const itemCol = findCol(['점검', '항목', 'check'])
      const legalCol = findCol(['근거', '법', 'legal'])

      if (itemCol === -1) {
        showError(t('safetyChecklist.excelNoItemCol', '점검 항목 컬럼을 찾을 수 없습니다.'))
        return
      }

      // 데이터 파싱
      const dataRows = rows.slice(headerIdx + 1)
      const categories: LocalCategory[] = []
      let currentCategory: LocalCategory | null = null
      let itemNo = 0

      for (const row of dataRows) {
        const cells = row.map((c: any) => String(c || '').trim())
        const filledCells = cells.filter((c: string) => c.length > 0)
        const no = noCol >= 0 ? cells[noCol] : ''
        const classification = classCol >= 0 ? cells[classCol] : ''
        const checkItem = itemCol >= 0 ? cells[itemCol] : ''
        const legalBasis = legalCol >= 0 ? cells[legalCol] : ''
        const isNoNumeric = /^\d+$/.test(no)

        // 완전히 빈 행은 무시
        if (filledCells.length === 0) continue

        // 소계/서명 영역 행 무시
        const rowJoined = filledCells.join(' ').toLowerCase()
        const skipKeywords = ['소계', '적합수', '부적합수', '적합률', '점검자', '검토자', '승인자', '성명', '서명', '일자', '판정기준', '총 ', '개 항목']
        if (skipKeywords.some(k => rowJoined.includes(k))) continue

        // 카테고리 행 판별: No가 숫자가 아니고, 채워진 셀이 적음 (1~2개)
        // 또는 ■ 기호로 시작하는 텍스트가 있음
        const firstFilled = filledCells[0] || ''
        const isCategoryRow = !isNoNumeric && (
          filledCells.length <= 2 ||
          firstFilled.startsWith('■') ||
          (filledCells.length <= 3 && !legalBasis)
        ) && !classification.includes('필수') && !classification.includes('선택')

        if (isCategoryRow) {
          const catName = firstFilled.replace(/^[■▪▶●\s]+/, '').trim()
          if (catName) {
            currentCategory = {
              _tempId: nextTempId(),
              categoryName: catName,
              sortOrder: categories.length + 1,
              items: [],
            }
            categories.push(currentCategory)
          }
          continue
        }

        // 카테고리가 없으면 기본 카테고리 생성
        if (!currentCategory) {
          currentCategory = {
            _tempId: nextTempId(),
            categoryName: t('safetyChecklist.defaultCategory', '일반'),
            sortOrder: 1,
            items: [],
          }
          categories.push(currentCategory)
        }

        // 점검 항목이 있는 데이터 행
        const actualCheckItem = checkItem || filledCells.find((c: string) => c.length > 5 && !/^\d+$/.test(c)) || ''
        if (actualCheckItem) {
          itemNo++
          currentCategory.items.push({
            _tempId: nextTempId(),
            classification: classification || '필수',
            checkItem: actualCheckItem,
            legalBasis,
            checkResult: '',
            finding: '',
            actionDeadline: '',
            actionComplete: false,
            sortOrder: currentCategory.items.length + 1,
          })
        }
      }

      if (categories.length === 0) {
        showError(t('safetyChecklist.excelNoData', '데이터를 찾을 수 없습니다.'))
        return
      }

      setLocalCategories(categories)
      showSuccess(t('safetyChecklist.excelImported', '{{count}}개 카테고리, {{items}}개 항목이 로드되었습니다.', {
        count: categories.length,
        items: categories.reduce((sum, c) => sum + c.items.length, 0),
      }))
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  const handleAddCategory = () => {
    setLocalCategories(prev => [
      ...prev,
      {
        _tempId: nextTempId(),
        categoryName: '',
        sortOrder: prev.length + 1,
        items: [],
      },
    ])
  }

  const handleDeleteCategory = (catTempId: string) => {
    setLocalCategories(prev => prev.filter(c => c._tempId !== catTempId))
  }

  const handleCategoryNameChange = (catTempId: string, name: string) => {
    setLocalCategories(prev =>
      prev.map(c => c._tempId === catTempId ? { ...c, categoryName: name } : c)
    )
  }

  const handleAddItem = (catTempId: string) => {
    setLocalCategories(prev =>
      prev.map(c => {
        if (c._tempId !== catTempId) return c
        return {
          ...c,
          items: [
            ...c.items,
            {
              _tempId: nextTempId(),
              classification: '필수',
              checkItem: '',
              legalBasis: '',
              checkResult: '',
              finding: '',
              actionDeadline: '',
              actionComplete: false,
              sortOrder: c.items.length + 1,
            },
          ],
        }
      })
    )
  }

  const handleDeleteItem = (catTempId: string, itemTempId: string) => {
    setLocalCategories(prev =>
      prev.map(c => {
        if (c._tempId !== catTempId) return c
        return {
          ...c,
          items: c.items
            .filter(i => i._tempId !== itemTempId)
            .map((i, idx) => ({ ...i, sortOrder: idx + 1 })),
        }
      })
    )
  }

  const handleItemChange = (catTempId: string, itemTempId: string, field: keyof LocalItem, value: any) => {
    setLocalCategories(prev =>
      prev.map(c => {
        if (c._tempId !== catTempId) return c
        return {
          ...c,
          items: c.items.map(i =>
            i._tempId === itemTempId ? { ...i, [field]: value } : i
          ),
        }
      })
    )
  }

  // --- 내부 저장 로직 ---
  const saveInternal = async (skipConfirm = false) => {
    if (!skipConfirm) {
      const confirmed = await showConfirm(t('common.confirmSave'))
      if (!confirmed) return
    }

    setIsSaving(true)
    try {
      const categories = localCategories.map((cat, ci) => ({
        id: cat.id,
        categoryName: cat.categoryName,
        sortOrder: ci + 1,
        items: cat.items.map((item, ii) => ({
          id: item.id,
          classification: item.classification,
          checkItem: item.checkItem,
          legalBasis: item.legalBasis,
          checkResult: item.checkResult,
          finding: item.finding,
          actionDeadline: item.actionDeadline,
          actionComplete: item.actionComplete,
          sortOrder: ii + 1,
        })),
      }))

      let actualId = templateId
      if (isNew) {
        const created = await createSafetyTemplate({
          templateName: templateName || t('checklist.newTemplate', '새 체크리스트'),
          categoryType,
          description: templateDesc,
        })
        actualId = created.id
      }
      const updated = await batchSaveTemplate(actualId, {
        categories,
        templateName,
        description: templateDesc,
        ...signData,
      })
      // 보류된 첨부파일 처리 (저장 성공 후)
      await attachments.flush()
      if (isNew && onCreated) {
        onCreated(actualId)
        if (!embedded) showSuccess(t('common.saveSuccess', '저장되었습니다.'))
        return
      }
      queryClient.invalidateQueries({ queryKey: ['safetyTemplate', actualId] })
      queryClient.invalidateQueries({ queryKey: ['safetyTemplates'] })
      syncFromServer(updated)
      setIsEditing(false)
      // embedded 부모(EmrDrillTab/AuditExecutionTab/AuditFindingTab)가 자체 success 토스트를 띄우므로 중복 방지
      if (!embedded) showSuccess(t('common.saveSuccess', '저장되었습니다.'))
    } catch {
      showError(t('safetyChecklistTab.msg1', '저장에 실패했습니다.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleSave = () => saveInternal(false)

  // 외부에서 호출 가능한 함수
  useImperativeHandle(ref, () => ({
    save: () => saveInternal(true),
    isAllChecked: () => {
      const allItems = localCategories.flatMap(c => c.items)
      return allItems.length > 0 && allItems.every(i => i.checkResult === 'PASS' || i.checkResult === 'FAIL' || i.checkResult === 'NA')
    },
    getSnapshot: () => {
      const snap = localCategories.flatMap(cat => cat.items.map(item => ({
        categoryName: cat.categoryName,
        checkItem: item.checkItem,
        legalBasis: item.legalBasis,
        checkResult: item.checkResult,
        finding: item.finding || undefined,
        actionDeadline: item.actionDeadline || undefined,
        actionComplete: item.actionComplete || undefined,
      })))
      return JSON.stringify(snap)
    },
  }))

  const handleCancelEdit = () => {
    if (isNew && onBack) {
      attachments.reset()
      onBack()
      return
    }
    if (template) {
      syncFromServer(template)
    }
    attachments.reset()
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (isNew) return
    const confirmed = await showConfirm(t('common.confirmDelete', '삭제하시겠습니까?'))
    if (!confirmed) return
    try {
      await deleteSafetyTemplate(templateId)
      queryClient.invalidateQueries({ queryKey: ['safetyTemplates'] })
      showSuccess(t('common.deleted', '삭제되었습니다.'))
      if (onBack) onBack()
    } catch {
      showError(t('common.error'))
    }
  }

  // Compute item numbers across all categories
  let globalItemNo = 0

  if (!template && !isNew) return null

  return (
    <Box>
      <LoadingOverlay open={isSaving} message="처리 중..." />

      {!hideTemplateInfo && (
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" color="text.primary" sx={{ mb: 2 }}>{t('checklist.checklistInfo', '체크리스트 정보')}</Typography>
        <Paper sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Box sx={{ width: 130, minWidth: 130, fontWeight: 'bold', color: 'text.primary', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center' }}>
              {t('common.title', '제목')}
            </Box>
            <Box sx={{ flex: 1, px: 2, py: 1.5, display: 'flex', alignItems: 'center' }}>
              {isEditing ? (
                <TextField size="small" fullWidth value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder={t('checklist.titlePlaceholder', '체크리스트 제목을 입력하세요')} />
              ) : (
                <Typography variant="body2" color="text.primary">{templateName || ''}</Typography>
              )}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Box sx={{ width: 130, minWidth: 130, fontWeight: 'bold', color: 'text.primary', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center' }}>
              {t('common.description', '설명')}
            </Box>
            <Box sx={{ flex: 1, px: 2, py: 1.5, display: 'flex', alignItems: 'center' }}>
              {isEditing ? (
                <TextField size="small" fullWidth value={templateDesc} onChange={(e) => setTemplateDesc(e.target.value)} placeholder={t('checklist.descPlaceholder', '설명을 입력하세요')} />
              ) : (
                <Typography variant="body2" color="text.primary">{templateDesc || ''}</Typography>
              )}
            </Box>
          </Box>
          <Box sx={{ display: 'flex' }}>
            <Box sx={{ width: 130, minWidth: 130, fontWeight: 'bold', color: 'text.primary', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center' }}>
              {t('common.createdAt', '작성일자')}
            </Box>
            <Box sx={{ flex: 1, px: 2, py: 1.5, display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" color="text.primary" sx={{ fontFamily: 'monospace' }}>
                {formatDate(template?.createdAt) || ''}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
      )}

      {isEditing && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleExcelUpload} />
          <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => fileInputRef.current?.click()} sx={{ flex: { xs: 1, md: 'none' } }}>
            {t('safetyChecklist.excelUpload', '엑셀 업로드')}
          </Button>
          <Button variant="outlined" onClick={handleAddCategory} sx={{ flex: { xs: 1, md: 'none' } }}>
            {t('safetyChecklist.addRow', '행 추가')}
          </Button>
        </Box>
      )}

      <TableContainer component={Paper} sx={{ width: '100%', border: '1px solid', borderColor: 'divider', overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: simpleMode ? 0 : 1800, width: '100%', tableLayout: 'auto', '& td, & th': { borderRight: '1px solid', borderColor: 'divider', px: 1, py: 0.75 } }}>
          <TableHead sx={{ '& .MuiTableCell-root': { color: 'text.primary', fontWeight: 'bold' } }}>
            <TableRow>
              <TableCell sx={{ width: 40, textAlign: 'center' }}>No</TableCell>
              {!simpleMode && <TableCell sx={{ width: 80, textAlign: 'center' }}>{t('safetyChecklist.classification', '분류')}</TableCell>}
              <TableCell sx={{ minWidth: simpleMode ? 'auto' : 420, textAlign: 'center', whiteSpace: 'nowrap' }}>{t('safetyChecklist.checkItem', '점검 항목')}</TableCell>
              {!simpleMode && <TableCell sx={{ width: 130, textAlign: 'center' }}>{t('safetyChecklist.legalBasis', '관련 근거')}</TableCell>}
              <TableCell sx={{ width: 65, textAlign: 'center', whiteSpace: 'nowrap' }}>{t('safetyChecklist.pass', '적합')}</TableCell>
              <TableCell sx={{ width: 65, textAlign: 'center', whiteSpace: 'nowrap' }}>{t('safetyChecklist.fail', '부적합')}</TableCell>
              {!simpleMode && <TableCell sx={{ width: 70, textAlign: 'center', whiteSpace: 'nowrap' }}>{t('safetyChecklist.na', '해당없음')}</TableCell>}
              {!simpleMode && <TableCell sx={{ width: 200, textAlign: 'center' }}>{t('safetyChecklist.finding', '지적사항 / 개선내용')}</TableCell>}
              {!simpleMode && <TableCell sx={{ width: 200, textAlign: 'center' }}>{t('safetyChecklist.actionDeadline', '조치기한')}</TableCell>}
              {!simpleMode && <TableCell sx={{ width: 80, textAlign: 'center', whiteSpace: 'nowrap' }}>{t('safetyChecklist.actionComplete', '조치완료')}</TableCell>}
              {!simpleMode && <TableCell sx={{ width: 200, textAlign: 'center' }}>{t('evalSheet.attachment', '첨부파일')}</TableCell>}
              {isEditing && (
                <TableCell sx={{ width: 50, textAlign: 'center' }}>{t('common.delete')}</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {localCategories.map((category) => {
              const items = category.items

              return (
                <React.Fragment key={category._tempId}>
                  {/* 카테고리 헤더 행 (파란 배경) */}
                  <TableRow>
                    <TableCell
                      colSpan={(simpleMode ? 4 : 11) + (isEditing ? 1 : 0)}
                      sx={{ bgcolor: '#1e293b', color: 'white', fontWeight: 'bold', fontSize: '0.85rem', py: 1.5 }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {isEditing ? (
                          <TextField size="small" value={category.categoryName} onChange={e => handleCategoryNameChange(category._tempId, e.target.value)}
                            sx={{ '& input': { color: 'white', fontWeight: 'bold' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.4)' } }} />
                        ) : category.categoryName}
                        {isEditing && (
                          <>
                            <IconButton size="small" sx={{ color: 'white' }} onClick={() => handleAddItem(category._tempId)}><AddIcon fontSize="small" /></IconButton>
                            <IconButton size="small" sx={{ color: '#ff8a80' }} onClick={() => handleDeleteCategory(category._tempId)}><DeleteIcon fontSize="small" /></IconButton>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                  {/* 항목 행 */}
                  {items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={(simpleMode ? 4 : 11) + (isEditing ? 1 : 0)} sx={{ textAlign: 'center', color: 'text.secondary', fontStyle: 'italic', py: 2 }}>
                        {t('safetyChecklist.noItems', '항목이 없습니다.')} {isEditing ? t('safetyChecklist.addItemHint', '+ 버튼으로 항목을 추가하세요.') : ''}
                      </TableCell>
                    </TableRow>
                  )}
                  {items.map((item) => {
                    globalItemNo++
                    const isPass = item.checkResult === 'PASS'
                    const isFail = item.checkResult === 'FAIL'
                    const isNA = item.checkResult === 'NA'
                    return (
                      <TableRow key={item._tempId} sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                        <TableCell sx={{ textAlign: 'center' }}>{globalItemNo}</TableCell>
                        {!simpleMode && (
                          <TableCell sx={{ textAlign: 'center', fontSize: '0.75rem', color: item.classification === '필수' ? 'error.main' : 'info.main', fontWeight: 'bold' }}>
                            {isEditing ? (
                              <TextField select size="small" value={item.classification} onChange={e => handleItemChange(category._tempId, item._tempId, 'classification', e.target.value)}
                                SelectProps={{ native: true }} sx={{ minWidth: 75 }}>
                                <option value="">선택하세요</option>
                                <option value="필수">필수</option>
                                <option value="선택">선택</option>
                              </TextField>
                            ) : item.classification || ''}
                          </TableCell>
                        )}
                        <TableCell sx={{ minWidth: simpleMode ? 'auto' : 420, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                          {isEditing ? (
                            <TextField size="small" value={item.checkItem} onChange={e => handleItemChange(category._tempId, item._tempId, 'checkItem', e.target.value)} fullWidth sx={{ minWidth: simpleMode ? 240 : 380 }} />
                          ) : item.checkItem || ''}
                        </TableCell>
                        {!simpleMode && (
                          <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary', textAlign: 'center' }}>
                            {isEditing ? (
                              <TextField size="small" value={item.legalBasis} onChange={e => handleItemChange(category._tempId, item._tempId, 'legalBasis', e.target.value)} fullWidth />
                            ) : item.legalBasis || ''}
                          </TableCell>
                        )}
                        {/* 적합 ○ */}
                        <TableCell sx={{ textAlign: 'center', cursor: (showSummary && !locked) ? 'pointer' : 'default' }}
                          onClick={() => (showSummary && !locked) && handleItemChange(category._tempId, item._tempId, 'checkResult', isPass ? '' : 'PASS')}>
                          <Typography sx={{ fontSize: '1.2rem', color: isPass ? 'success.main' : 'grey.300', fontWeight: 'bold', lineHeight: 1 }}>○</Typography>
                        </TableCell>
                        {/* 부적합 × */}
                        <TableCell sx={{ textAlign: 'center', cursor: (showSummary && !locked) ? 'pointer' : 'default' }}
                          onClick={() => (showSummary && !locked) && handleItemChange(category._tempId, item._tempId, 'checkResult', isFail ? '' : 'FAIL')}>
                          <Typography sx={{ fontSize: '1.2rem', color: isFail ? 'error.main' : 'grey.300', fontWeight: 'bold', lineHeight: 1 }}>✕</Typography>
                        </TableCell>
                        {/* 해당없음 — simpleMode 에서는 숨김 */}
                        {!simpleMode && (
                          <TableCell sx={{ textAlign: 'center', cursor: (showSummary && !locked) ? 'pointer' : 'default' }}
                            onClick={() => (showSummary && !locked) && handleItemChange(category._tempId, item._tempId, 'checkResult', isNA ? '' : 'NA')}>
                            <Typography sx={{ fontSize: '1.2rem', color: isNA ? 'text.primary' : 'grey.300', fontWeight: 'bold', lineHeight: 1 }}>-</Typography>
                          </TableCell>
                        )}
                        {/* 지적사항 */}
                        {!simpleMode && (
                          <TableCell>
                            {(showSummary && !locked) ? (
                              <TextField size="small" fullWidth multiline minRows={1} value={item.finding || ''} onChange={e => handleItemChange(category._tempId, item._tempId, 'finding', e.target.value)} />
                            ) : (
                              <Typography variant="body2" sx={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>{item.finding || ''}</Typography>
                            )}
                          </TableCell>
                        )}
                        {/* 조치기한 */}
                        {!simpleMode && (
                          <TableCell sx={{ textAlign: 'center', fontSize: '0.8rem' }}>
                            {(showSummary && !locked) ? (
                              <DatePickerField size="small" value={item.actionDeadline || null} onChange={v => handleItemChange(category._tempId, item._tempId, 'actionDeadline', v || '')} />
                            ) : (
                              item.actionDeadline || ''
                            )}
                          </TableCell>
                        )}
                        {/* 조치완료 */}
                        {!simpleMode && (
                          <TableCell sx={{ textAlign: 'center', cursor: (showSummary && !locked) ? 'pointer' : 'default' }}
                            onClick={() => (showSummary && !locked) && handleItemChange(category._tempId, item._tempId, 'actionComplete', !item.actionComplete)}>
                            <Typography sx={{ fontSize: '1rem', color: item.actionComplete ? 'success.main' : 'grey.300' }}>
                              {item.actionComplete ? '✔' : '—'}
                            </Typography>
                          </TableCell>
                        )}
                        {/* 첨부파일 — 업로드는 체크리스트 관리(isEditing)에서만 가능.
                            평가서 조회/감사·실시 등 showSummary 모드에서는 다운로드만 허용. */}
                        {!simpleMode && (
                          <TableCell sx={{ verticalAlign: 'middle' }}>
                            <ItemAttachmentCell
                              entityType={SAFETY_CHECKLIST_ITEM_ENTITY_TYPE}
                              itemId={item.id}
                              editing={isEditing}
                              pendingUploads={item.id ? attachments.pendingUploads[item.id] : undefined}
                              pendingDeleteIds={item.id ? attachments.pendingDeletes[item.id] : undefined}
                              onAddPending={(files) => item.id && attachments.addPending(item.id, files)}
                              onRemovePending={(idx) => item.id && attachments.removePending(item.id, idx)}
                              onMarkDelete={(fileId) => item.id && attachments.markDelete(item.id, fileId)}
                              onUnmarkDelete={(fileId) => item.id && attachments.unmarkDelete(item.id, fileId)}
                            />
                          </TableCell>
                        )}
                        {isEditing && (
                          <TableCell sx={{ textAlign: 'center' }}>
                            <IconButton size="small" color="error" onClick={() => handleDeleteItem(category._tempId, item._tempId)}><DeleteIcon fontSize="small" /></IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </React.Fragment>
              )
            })}
          {/* 소계 / 적합률 */}
          {showSummary && (() => {
            const allItems = localCategories.flatMap(c => c.items)
            const total = allItems.length
            const passCount = allItems.filter(i => i.checkResult === 'PASS').length
            const failCount = allItems.filter(i => i.checkResult === 'FAIL').length
            const naCount = allItems.filter(i => i.checkResult === 'NA').length
            const rate = total > 0 ? Math.round((passCount / total) * 100) : 0
            // simpleMode: 4~5 col 레이아웃 — [소계 1] [적합수 1] [부적합수 1] [적합률 1] (+ delete 1)
            // non-simple: 11~12 col 레이아웃 — [소계 4] [적합수 1] [부적합수 1] [해당없음 1] [적합률 4~5]
            if (simpleMode) {
              return (
                <>
                  <TableRow sx={{ bgcolor: 'primary.main' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center', whiteSpace: 'nowrap', minWidth: 56, px: 1.5 }}>{t('safetyChecklist.subtotal', '소계')}</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{t('safetyChecklist.passCount', '적합수')}</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{t('safetyChecklist.failCount', '부적합수')}</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{t('safetyChecklist.passRate', '적합률')}</TableCell>
                    {isEditing && <TableCell sx={{ bgcolor: 'primary.main' }} />}
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 'bold' }}>{total}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', color: 'success.main' }}>{passCount}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', color: 'error.main' }}>{failCount}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', color: 'success.main' }}>{rate}%</TableCell>
                    {isEditing && <TableCell />}
                  </TableRow>
                </>
              )
            }
            const colSpanLeft = 4
            const colSpanRight = isEditing ? 5 : 4
            return (
              <>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  <TableCell colSpan={colSpanLeft} sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>{t('safetyChecklist.subtotal', '소계')}</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{t('safetyChecklist.passCount', '적합수')}</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{t('safetyChecklist.failCount', '부적합수')}</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{t('safetyChecklist.na', '해당없음')}</TableCell>
                  <TableCell colSpan={colSpanRight} sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>{t('safetyChecklist.passRate', '적합률 (적합/전체×100)')}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={colSpanLeft} sx={{ textAlign: 'center', fontWeight: 'bold' }}>{t('safetyChecklist.totalItems', '총 {{count}}개 항목', { count: total })}</TableCell>
                  <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', color: 'success.main' }}>{passCount}</TableCell>
                  <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', color: 'error.main' }}>{failCount}</TableCell>
                  <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>{naCount}</TableCell>
                  <TableCell colSpan={colSpanRight} sx={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem', color: 'success.main' }}>{rate}%</TableCell>
                </TableRow>
              </>
            )
          })()}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 점검자 / 검토자 / 승인자 서명 — PC */}
      {showSummary && !hideSignatures && <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, mt: 3, border: '1px solid', borderColor: 'divider', overflowX: 'auto' }}>
        <Table size="small" sx={{ '& td, & th': { borderRight: '1px solid', borderColor: 'divider', px: 2, py: 1 }, '& td:last-child, & th:last-child': { borderRight: 'none' } }}>
          <TableHead sx={{ '& .MuiTableCell-root': { color: 'text.primary', fontWeight: 'bold' } }}>
            <TableRow>
              <TableCell sx={{ textAlign: 'center', width: 80 }}></TableCell>
              <TableCell sx={{ textAlign: 'center' }}>{t('safetyChecklist.inspectorSign', '점검자')}</TableCell>
              <TableCell sx={{ textAlign: 'center' }}>{t('safetyChecklist.reviewerSign', '검토자')}</TableCell>
              <TableCell sx={{ textAlign: 'center' }}>{t('safetyChecklist.approverSign', '승인자')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100', textAlign: 'center' }}>{t('common.name', '성명')}</TableCell>
              <TableCell>{(!locked && (isEditing || showSummary)) ? <Box sx={{ display: 'flex', gap: 0 }}><TextField size="small" fullWidth value={signData.inspectorName} InputProps={{ readOnly: true }} /><Button variant="outlined" size="small" sx={{ ml: 1, minWidth: 40 }} onClick={() => openUserModal('inspectorName')}><PersonSearchIcon fontSize="small" /></Button></Box> : <Typography variant="body2">{signData.inspectorName || ''}</Typography>}</TableCell>
              <TableCell>{(!locked && (isEditing || showSummary)) ? <Box sx={{ display: 'flex', gap: 0 }}><TextField size="small" fullWidth value={signData.reviewerName} InputProps={{ readOnly: true }} /><Button variant="outlined" size="small" sx={{ ml: 1, minWidth: 40 }} onClick={() => openUserModal('reviewerName')}><PersonSearchIcon fontSize="small" /></Button></Box> : <Typography variant="body2">{signData.reviewerName || ''}</Typography>}</TableCell>
              <TableCell>{(!locked && (isEditing || showSummary)) ? <Box sx={{ display: 'flex', gap: 0 }}><TextField size="small" fullWidth value={signData.approverName} InputProps={{ readOnly: true }} /><Button variant="outlined" size="small" sx={{ ml: 1, minWidth: 40 }} onClick={() => openUserModal('approverName')}><PersonSearchIcon fontSize="small" /></Button></Box> : <Typography variant="body2">{signData.approverName || ''}</Typography>}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100', textAlign: 'center' }}>{t('common.signature', '서명')}</TableCell>
              <TableCell>{(!locked && (isEditing || showSummary)) ? <SignaturePad value={signData.inspectorSign} onChange={v => setSignData({ ...signData, inspectorSign: v })} /> : (signData.inspectorSign ? <img src={signData.inspectorSign} alt="" style={{ maxHeight: 60 }} /> : '')}</TableCell>
              <TableCell>{(!locked && (isEditing || showSummary)) ? <SignaturePad value={signData.reviewerSign} onChange={v => setSignData({ ...signData, reviewerSign: v })} /> : (signData.reviewerSign ? <img src={signData.reviewerSign} alt="" style={{ maxHeight: 60 }} /> : '')}</TableCell>
              <TableCell>{(!locked && (isEditing || showSummary)) ? <SignaturePad value={signData.approverSign} onChange={v => setSignData({ ...signData, approverSign: v })} /> : (signData.approverSign ? <img src={signData.approverSign} alt="" style={{ maxHeight: 60 }} /> : '')}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100', textAlign: 'center' }}>{t('common.date', '일자')}</TableCell>
              <TableCell>{(!locked && (isEditing || showSummary)) ? <DatePickerField size="small" value={signData.inspectorSignDate || null} onChange={v => setSignData({ ...signData, inspectorSignDate: v || '' })} /> : <Typography variant="body2">{signData.inspectorSignDate || ''}</Typography>}</TableCell>
              <TableCell>{(!locked && (isEditing || showSummary)) ? <DatePickerField size="small" value={signData.reviewerSignDate || null} onChange={v => setSignData({ ...signData, reviewerSignDate: v || '' })} /> : <Typography variant="body2">{signData.reviewerSignDate || ''}</Typography>}</TableCell>
              <TableCell>{(!locked && (isEditing || showSummary)) ? <DatePickerField size="small" value={signData.approverSignDate || null} onChange={v => setSignData({ ...signData, approverSignDate: v || '' })} /> : <Typography variant="body2">{signData.approverSignDate || ''}</Typography>}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>}
      {/* 점검자 / 검토자 / 승인자 서명 — Mobile */}
      {showSummary && !hideSignatures && (
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mt: 3 }}>
          {([
            [t('safetyChecklist.inspectorSign', '점검자'), 'inspectorName', 'inspectorSign', 'inspectorSignDate'],
            [t('safetyChecklist.reviewerSign', '검토자'), 'reviewerName', 'reviewerSign', 'reviewerSignDate'],
            [t('safetyChecklist.approverSign', '승인자'), 'approverName', 'approverSign', 'approverSignDate'],
          ] as [string, string, string, string][]).map(([title, nameKey, signKey, dateKey]) => (
            <Paper key={nameKey} sx={{ p: 2, border: 1, borderColor: 'divider' }}>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 1.5, bgcolor: 'primary.main', color: 'white', px: 1.5, py: 0.75, borderRadius: 0.5, textAlign: 'center' }}>{title}</Typography>
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="caption" fontWeight="bold" sx={{ mb: 0.5, display: 'block' }}>{t('common.name', '성명')}</Typography>
                {(!locked && (isEditing || showSummary)) ? <Box sx={{ display: 'flex', gap: 1 }}><TextField size="small" fullWidth value={(signData as any)[nameKey]} InputProps={{ readOnly: true }} /><Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => openUserModal(nameKey as any)}><PersonSearchIcon fontSize="small" /></Button></Box> : <Typography variant="body2">{(signData as any)[nameKey] || ''}</Typography>}
              </Box>
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="caption" fontWeight="bold" sx={{ mb: 0.5, display: 'block' }}>{t('common.signature', '서명')}</Typography>
                {(!locked && (isEditing || showSummary)) ? <SignaturePad value={(signData as any)[signKey]} onChange={v => setSignData({ ...signData, [signKey]: v })} /> : ((signData as any)[signKey] ? <img src={(signData as any)[signKey]} alt="" style={{ maxHeight: 60, width: '100%' }} /> : '')}
              </Box>
              <Box>
                <Typography variant="caption" fontWeight="bold" sx={{ mb: 0.5, display: 'block' }}>{t('common.date', '일자')}</Typography>
                {(!locked && (isEditing || showSummary)) ? <DatePickerField size="small" value={(signData as any)[dateKey] || null} onChange={v => setSignData({ ...signData, [dateKey]: v || '' })} /> : <Typography variant="body2">{(signData as any)[dateKey] || ''}</Typography>}
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {!embedded && <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: { xs: 'stretch', md: 'flex-end' }, flexWrap: 'wrap' }}>
        {isEditing ? (
          <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', md: 'auto' } }}>
            <Button variant="outlined" onClick={handleCancelEdit} sx={{ flex: { xs: 1, md: 'none' } }}>{t('common.cancel')}</Button>
            <Button variant="contained" onClick={handleSave} disabled={isSaving} sx={{ flex: { xs: 1, md: 'none' } }}>{t('common.save')}</Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', md: 'auto' } }}>
            {onBack && <Button variant="outlined" onClick={onBack} sx={{ flex: { xs: 1, md: 'none' } }}>{t('common.list')}</Button>}
            <Button variant="contained" color="primary" onClick={() => setIsEditing(true)} sx={{ flex: { xs: 1, md: 'none' } }}>{t('common.edit')}</Button>
            {!isNew && <Button variant="contained" color="error" onClick={handleDelete} sx={{ flex: { xs: 1, md: 'none' } }}>{t('common.delete')}</Button>}
          </Box>
        )}
      </Box>}
      <UserSelectModal open={userModalOpen} onClose={() => setUserModalOpen(false)} selectedUsers={[]} onConfirm={handleUserSelected} singleSelect useCompanyTree title={userModalTitles[userModalTarget]} />
    </Box>
  )
})

export default SafetyChecklistTab
