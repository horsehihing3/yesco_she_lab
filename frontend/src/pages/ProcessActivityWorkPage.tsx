import { formatDate, formatDateTime } from '../utils/dateDefaults'
import React, { useState, useEffect, useRef, useTransition } from 'react'
import { formatUserName } from '../utils/userDisplay'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Paper, Typography, Button, TextField, IconButton, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material'
import ListSearchBar from '../components/common/ListSearchBar'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import RefreshIcon from '@mui/icons-material/Refresh'
import { processActivityApi } from '../api/processActivityApi'
import { userApi } from '../api/userApi'
import * as XLSX from 'xlsx'
import {
  ProcessActivityForm, ProcessActivityProcess, ProcessActivityItem, ProcessActivityFormRequest,
} from '../types/processActivity.types'
import DatePickerField from '../components/common/DatePickerField'
import LoadingOverlay from '../components/common/LoadingOverlay'
import DepartmentSelectModal from '../components/common/DepartmentSelectModal'
import DeptUserMultiSelectModal from '../components/common/DeptUserMultiSelectModal'
import type { UserInfo, CompanyTreeNode } from '../components/common/UserSelectModal'
import { useAlert } from '../contexts/AlertContext'
import { useAuth } from '../context/AuthContext'
import DevTestFillButton from '../components/common/DevTestFillButton'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const emptyItem = (sort: number): ProcessActivityItem => ({
  itemNo: sort, workContent: '', excludeEval: false, applicableLaw: '', sortOrder: sort,
})
const emptyProcess = (sort: number): ProcessActivityProcess => ({
  majorCategory: '', middleCategory: '', subCategory: '', sortOrder: sort,
  items: [emptyItem(1)],
})
const todayStr = () => new Date().toISOString().slice(0, 10)
const emptyForm = (): ProcessActivityFormRequest => ({
  title: '', description: '', divisionName: '', departmentName: '',
  evaluator: '', creationDate: todayStr(), teamMembers: '',
  processes: [emptyProcess(1)],
})

const dividerColor = (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.35)' : theme.palette.divider
const labelSx = {
  width: 140, minWidth: 140, fontWeight: 'bold', bgcolor: 'grey.100',
  px: 2, py: 1.5, borderRight: 1, borderColor: dividerColor,
  display: 'flex', alignItems: 'center', fontSize: '0.875rem',
  justifyContent: 'center', wordBreak: 'keep-all' as const, textAlign: 'center' as const,
}
const valSx = { flex: 1, px: 2, py: 1, bgcolor: 'background.paper', display: 'flex', alignItems: 'center' }
const valBorderSx = { ...valSx, borderRight: 1, borderColor: dividerColor }
const hSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }

const ProcessActivityWorkPage: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()

  // 대분류/중분류 그룹 식별 키 (값이 비어 있어도 명시적 그룹 구분 가능)
  const keyCounter = useRef(0)
  const nk = () => 'k' + (++keyCounter.current)
  const assignKeys = (procs: ProcessActivityProcess[]): ProcessActivityProcess[] => {
    let mk = nk(), dk = nk()
    return procs.map((p, i) => {
      if (i > 0) {
        const prev = procs[i - 1]
        const sameMajor = (p.majorCategory || '') !== '' && (p.majorCategory || '') === (prev.majorCategory || '')
        const sameMiddle = (p.middleCategory || '') !== '' && (p.middleCategory || '') === (prev.middleCategory || '')
        if (!sameMajor) { mk = nk(); dk = nk() }
        else if (!sameMiddle) { dk = nk() }
      }
      return { ...p, _mk: mk, _dk: dk } as any
    })
  }
  const stripKeys = (procs: ProcessActivityProcess[]): ProcessActivityProcess[] =>
    procs.map(p => { const { _mk, _dk, ...rest } = p as any; return rest })

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [form, setForm] = useState<ProcessActivityFormRequest>(emptyForm())
  const [evaluatorModalOpen, setEvaluatorModalOpen] = useState(false)
  const [memberModalOpen, setMemberModalOpen] = useState(false)
  const [deptModalOpen, setDeptModalOpen] = useState(false)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const applySearch = () => setKeyword(keywordInput)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: listData, isLoading: listLoading, isFetching: listFetching } = useQuery({
    queryKey: ['processActivityForms'],
    queryFn: () => processActivityApi.list(0, 100),
    enabled: viewMode === 'list',
  })

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['processActivityForm', selectedId],
    queryFn: () => processActivityApi.getById(selectedId!),
    enabled: !!selectedId && (viewMode === 'detail' || viewMode === 'edit'),
  })

  useEffect(() => {
    if (viewMode === 'edit' && detailData) {
      setForm({
        title: detailData.title,
        description: detailData.description || '',
        divisionName: detailData.divisionName || '',
        departmentName: detailData.departmentName || '',
        evaluator: detailData.evaluator || '',
        creationDate: detailData.creationDate || '',
        teamMembers: detailData.teamMembers || '',
        processes: assignKeys((detailData.processes && detailData.processes.length > 0)
          ? detailData.processes.map(p => ({
              ...p,
              items: (p.items && p.items.length > 0) ? p.items : [emptyItem(1)],
            }))
          : [emptyProcess(1)]),
      })
    }
  }, [viewMode, detailData])

  const createMutation = useMutation({
    mutationFn: processActivityApi.create,
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['processActivityForms'] })
      showSuccess(t('common.saved', '저장되었습니다'))
      setSelectedId(created.id)
      setViewMode('detail')
    },
    onError: () => showError(t('common.error', '오류가 발생했습니다')),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProcessActivityFormRequest }) =>
      processActivityApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processActivityForms'] })
      queryClient.invalidateQueries({ queryKey: ['processActivityForm', selectedId] })
      showSuccess(t('common.saved', '저장되었습니다'))
      setViewMode('detail')
    },
    onError: () => showError(t('common.error', '오류가 발생했습니다')),
  })
  const deleteMutation = useMutation({
    mutationFn: processActivityApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processActivityForms'] })
      showSuccess(t('common.deleted', '삭제되었습니다'))
      setSelectedId(null)
      setViewMode('list')
    },
    onError: () => showError(t('common.error', '오류가 발생했습니다')),
  })
  const isProcessing = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending
  const [isEditPending, startEditTransition] = useTransition()

  // ===== Handlers =====
  const handleAdd = () => {
    const f = emptyForm()
    setForm({ ...f, processes: assignKeys(f.processes) })
    setSelectedId(null)
    setViewMode('create')
  }
  // 마운트 시 초기 form processes에 키 부여
  useEffect(() => {
    setForm(f => ({ ...f, processes: assignKeys(f.processes) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const handleRowClick = (id: number) => { setSelectedId(id); setViewMode('detail') }
  const handleEdit = () => startEditTransition(() => setViewMode('edit'))
  const handleCancel = () => { setViewMode(selectedId ? 'detail' : 'list') }
  const handleSave = async () => {
    if (!form.title.trim()) { showError(t('common.required', '제목은 필수입니다')); return }
    const confirmed = await showConfirm(t('common.confirmSave', '저장하시겠습니까?'))
    if (!confirmed) return
    const payload = { ...form, processes: stripKeys(form.processes) }
    if (viewMode === 'create') createMutation.mutate(payload)
    else if (selectedId) updateMutation.mutate({ id: selectedId, data: payload })
  }
  const handleDelete = async () => {
    if (!selectedId) return
    const confirmed = await showConfirm(t('common.confirmDelete', '삭제하시겠습니까?'))
    if (!confirmed) return
    deleteMutation.mutate(selectedId)
  }

  // DEV ONLY — 비어있는 항목을 공정/활동 더미데이터로 채움 (입력값·그룹키 보존)
  const fillTestData = () => setForm(f => ({
    ...f,
    title: f.title || '제조1팀 공정/활동별 작업내용',
    divisionName: f.divisionName || '생산본부',
    description: f.description || '공정별 작업내용 및 적용법규 조사 (테스트 데이터)',
    creationDate: f.creationDate || todayStr(),
    processes: f.processes.map((p, pi) => pi === 0 ? {
      ...p,
      majorCategory: p.majorCategory || '제조 공정',
      middleCategory: p.middleCategory || '조립 라인',
      subCategory: p.subCategory || '부품 조립 작업',
      items: (p.items && p.items.length > 0 ? p.items : [emptyItem(1)]).map((it, ii) => ii === 0 ? {
        ...it,
        workContent: it.workContent || '전동 공구를 이용한 부품 체결',
        applicableLaw: it.applicableLaw || '산업안전보건기준에 관한 규칙 제32조',
      } : it),
    } : p),
  }))

  const addProcess = () => setForm(f => ({
    ...f,
    processes: [...f.processes, {
      ...emptyProcess(f.processes.length + 1),
      majorCategory: '', middleCategory: '',
      _mk: nk(), _dk: nk(),
    } as any],
  }))
  const removeProcess = (idx: number) => setForm(f => ({
    ...f, processes: f.processes.filter((_, i) => i !== idx).map((p, i) => ({ ...p, sortOrder: i + 1 })),
  }))
  // 대분류 그룹 끝 다음에 동일 대분류 키 공유 + 새 중분류 키로 process 삽입
  const addMiddle = (pIdx: number) => setForm(f => {
    const arr = [...f.processes] as any[]
    const mk = arr[pIdx]._mk || nk()
    const major = arr[pIdx].majorCategory || ''
    let lastIdx = pIdx
    for (let i = pIdx + 1; i < arr.length; i++) {
      if (arr[i]._mk === mk) lastIdx = i
      else break
    }
    arr.splice(lastIdx + 1, 0, { ...emptyProcess(0), majorCategory: major, middleCategory: '', _mk: mk, _dk: nk() } as any)
    return { ...f, processes: arr.map((p, i) => ({ ...p, sortOrder: i + 1 })) }
  })
  // 동일 대분류 키를 가진 모든 process 제거
  const removeMajor = (pIdx: number) => setForm(f => {
    const mk = (f.processes[pIdx] as any)._mk
    return { ...f, processes: f.processes.filter(p => (p as any)._mk !== mk).map((p, i) => ({ ...p, sortOrder: i + 1 })) }
  })
  // 중분류 그룹 끝 다음에 동일 대분류/중분류 키 공유 + 새 소분류로 process 삽입
  const addSub = (pIdx: number) => setForm(f => {
    const arr = [...f.processes] as any[]
    const mk = arr[pIdx]._mk || nk()
    const dk = arr[pIdx]._dk || nk()
    const major = arr[pIdx].majorCategory || ''
    const middle = arr[pIdx].middleCategory || ''
    let lastIdx = pIdx
    for (let i = pIdx + 1; i < arr.length; i++) {
      if (arr[i]._mk === mk && arr[i]._dk === dk) lastIdx = i
      else break
    }
    arr.splice(lastIdx + 1, 0, { ...emptyProcess(0), majorCategory: major, middleCategory: middle, subCategory: '', _mk: mk, _dk: dk } as any)
    return { ...f, processes: arr.map((p, i) => ({ ...p, sortOrder: i + 1 })) }
  })
  // 동일 대분류+중분류 키를 가진 모든 process 제거
  const removeMiddle = (pIdx: number) => setForm(f => {
    const mk = (f.processes[pIdx] as any)._mk
    const dk = (f.processes[pIdx] as any)._dk
    return { ...f, processes: f.processes.filter(p => !((p as any)._mk === mk && (p as any)._dk === dk)).map((p, i) => ({ ...p, sortOrder: i + 1 })) }
  })
  const updateProcess = (idx: number, field: keyof ProcessActivityProcess, value: string | number) => setForm(f => {
    const arr = [...f.processes]
    arr[idx] = { ...arr[idx], [field]: value }
    return { ...f, processes: arr }
  })
  const addItem = (pIdx: number) => setForm(f => {
    const arr = [...f.processes]
    const items = arr[pIdx].items || []
    arr[pIdx] = { ...arr[pIdx], items: [...items, emptyItem(items.length + 1)] }
    return { ...f, processes: arr }
  })
  const removeItem = (pIdx: number, iIdx: number) => setForm(f => {
    const arr = [...f.processes]
    const items = (arr[pIdx].items || []).filter((_, i) => i !== iIdx).map((it, i) => ({ ...it, itemNo: i + 1, sortOrder: i + 1 }))
    arr[pIdx] = { ...arr[pIdx], items }
    return { ...f, processes: arr }
  })
  const updateItem = (pIdx: number, iIdx: number, field: keyof ProcessActivityItem, value: string | number | boolean) => setForm(f => {
    const arr = [...f.processes]
    const items = [...(arr[pIdx].items || [])]
    items[iIdx] = { ...items[iIdx], [field]: value }
    arr[pIdx] = { ...arr[pIdx], items }
    return { ...f, processes: arr }
  })

  // ===== Excel Upload =====
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setIsUploading(true)
    try {
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' })
      const sheetName = wb.SheetNames.find(n => n.includes('양식4'))
      if (!sheetName) { showError(t('processActivity.excelNoSheet', '양식4 시트를 찾지 못했습니다')); return }
      const rows: string[][] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: '' })

      const norm = (v: unknown) => String(v ?? '').replace(/\s+/g, '').trim()
      const getVal = (row: string[], startCol: number) => {
        for (let c = startCol; c < row.length; c++) {
          const v = String(row[c] || '').trim()
          if (v) return v
        }
        return ''
      }

      let divisionName = '', departmentName = '', teamMembers = ''
      let dataStart = -1
      for (let i = 0; i < Math.min(rows.length, 20); i++) {
        const r = rows[i] || []
        const label = norm(r[0])
        if (label === '부문명') divisionName = getVal(r, 1)
        else if (label === '부서(팀)명') departmentName = getVal(r, 1)
        else if (label === '팀참여자') teamMembers = getVal(r, 1)
        else if (label === '대분류') { dataStart = i + 1; break }
      }
      if (dataStart < 0) { showError(t('processActivity.excelNoHeader', '대분류 헤더 행을 찾지 못했습니다')); return }

      // 컬럼 매핑: col 0 = 대분류, col 3 = 중분류, col 6 = 소분류
      //            col 13 = No, col 14 = 작업내용, col 15 = 평가제외(O/빈), col 16 = 적용법규
      const processes: ProcessActivityProcess[] = []
      let currentProcess: ProcessActivityProcess | null = null
      let lastMajor = '', lastMiddle = ''
      for (let i = dataStart; i < rows.length; i++) {
        const r = rows[i] || []
        const major = String(r[0] || '').trim() || lastMajor
        const middle = String(r[3] || '').trim() || lastMiddle
        const sub = String(r[6] || '').trim()
        if (major) lastMajor = major
        if (middle) lastMiddle = middle

        // 새로운 소분류가 나오면 process 시작
        if (sub) {
          currentProcess = {
            majorCategory: lastMajor || divisionName,
            middleCategory: lastMiddle || departmentName,
            subCategory: sub,
            sortOrder: processes.length + 1,
            items: [],
          }
          processes.push(currentProcess)
        }

        // 작업내용 항목 추출
        const itemNoRaw = r[13]
        const workContent = String(r[14] || '').trim()
        const excludeMark = String(r[15] || '').trim()
        const lawRaw = String(r[16] || '').trim()
        const applicableLaw = lawRaw === '-' ? '' : lawRaw
        const hasNumber = itemNoRaw !== '' && itemNoRaw !== null && itemNoRaw !== undefined
        if (currentProcess && (hasNumber || workContent)) {
          const seq = (currentProcess.items?.length || 0) + 1
          const itemNo = typeof itemNoRaw === 'number' ? itemNoRaw : (parseInt(String(itemNoRaw), 10) || seq)
          currentProcess.items = [
            ...(currentProcess.items || []),
            {
              itemNo,
              workContent,
              excludeEval: excludeMark === 'O' || excludeMark === '○',
              applicableLaw,
              sortOrder: seq,
            },
          ]
        }
      }

      if (processes.length === 0) {
        showError(t('processActivity.excelNoData', '공정/활동 데이터를 찾지 못했습니다'))
        return
      }

      const payload: ProcessActivityFormRequest = {
        title: `${divisionName || ''} ${t('nav.processActivityWork', '공정/활동별 작업내용')}`.trim(),
        description: '',
        divisionName,
        departmentName,
        evaluator: '',
        creationDate: new Date().toISOString().substring(0, 10),
        teamMembers,
        processes,
      }
      await processActivityApi.create(payload)
      queryClient.invalidateQueries({ queryKey: ['processActivityForms'] })
      const totalItems = processes.reduce((s, p) => s + (p.items?.length || 0), 0)
      showSuccess(`${processes.length}개 공정/활동, ${totalItems}개 작업내용이 등록되었습니다.`)
      // 업로드 후 목록에 머무름
    } catch (err) {
      console.error('Excel upload failed:', err)
      showError(t('common.error', '엑셀 파일 처리에 실패했습니다'))
    } finally {
      setIsUploading(false)
    }
  }

  // ===== Render =====
  if (viewMode === 'list') {
    const raw = listData?.content || []
    const items = keyword.trim()
      ? raw.filter(f => (f.title || '').toLowerCase().includes(keyword.toLowerCase()))
      : raw
    return (
      <Box>
        <LoadingOverlay open={listFetching || isUploading} message={isUploading ? t('riskAssessment.uploading', '엑셀 업로드 중...') : t('common.loading', '목록을 불러오는 중...')} />
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleExcelUpload} />
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          {t('nav.processActivityWork', '공정/활동별 작업내용')}
        </Typography>
        {/* Search / Action bar - PC */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <ListSearchBar placeholder={t('common.searchByTitle', '제목으로 검색')} value={keywordInput} onChange={setKeywordInput} onSearch={applySearch} />
            <IconButton onClick={() => setKeyword('')} size="small"><RefreshIcon /></IconButton>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" size="small" onClick={() => fileInputRef.current?.click()}>
              {t('processActivity.excelUpload', '엑셀 업로드')}
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd} size="small">
              {t('common.new', '신규')}
            </Button>
          </Box>
        </Box>
        {/* Search / Action bar - Mobile */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
          <ListSearchBar fullWidth placeholder={t('common.searchByTitle', '제목으로 검색')} value={keywordInput} onChange={setKeywordInput} onSearch={applySearch} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={() => setKeyword('')} sx={{ flex: 1 }}>
              {t('common.reset', '초기화')}
            </Button>
            <Button variant="contained" size="small" onClick={() => fileInputRef.current?.click()} sx={{ flex: 1 }}>
              {t('processActivity.excelUpload', '엑셀 업로드')}
            </Button>
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAdd} sx={{ flex: 1 }}>
              {t('common.new', '신규')}
            </Button>
          </Box>
        </Box>
        {listLoading ? (
          <Box sx={{ minHeight: 200 }} />
        ) : items.length === 0 ? (
          <Alert severity="info">{t('common.noData', '데이터가 없습니다')}</Alert>
        ) : (
          <>
            {/* PC Table */}
            <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider' }}>
              <Table size="small" sx={(theme: any) => {
                const isDark = theme.palette.mode === 'dark'
                const headColor = isDark ? 'rgba(255,255,255,0.25)' : theme.isYesco ? 'rgba(255,255,255,0.35)' : theme.palette.divider
                const bodyColor = isDark ? 'rgba(255,255,255,0.25)' : theme.palette.divider
                return {
                  '& .MuiTableHead-root .MuiTableCell-root': { borderRight: `1px solid ${headColor} !important` },
                  '& .MuiTableBody-root .MuiTableCell-root': { borderRight: `1px solid ${bodyColor} !important` },
                  '& .MuiTableCell-root:last-child': { borderRight: 'none !important' },
                }
              }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={hSx} align="center" width={60}>{t('common.no', 'No')}</TableCell>
                    <TableCell sx={hSx}>{t('common.title', '제목')}</TableCell>
                    <TableCell sx={hSx} align="center" width={140}>{t('processActivity.division', '부문명')}</TableCell>
                    <TableCell sx={hSx} align="center" width={150}>{t('processActivity.department', '부서(팀)명')}</TableCell>
                    <TableCell sx={hSx} align="center" width={110}>{t('processActivity.evaluator', '평가자')}</TableCell>
                    <TableCell sx={hSx} align="center" width={110}>{t('processActivity.creationDate', '작성일자')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((f, idx) => (
                    <TableRow key={f.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(f.id)}>
                      <TableCell align="center">{idx + 1}</TableCell>
                      <TableCell><Typography variant="body2" fontWeight={600}>{f.title}</Typography></TableCell>
                      <TableCell align="center">{f.divisionName || ''}</TableCell>
                      <TableCell align="center">{f.departmentName || ''}</TableCell>
                      <TableCell align="center">{f.evaluator || ''}</TableCell>
                      <TableCell align="center">{f.creationDate || ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {/* Mobile Card List */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
              {items.map((f) => (
                <Paper key={f.id} sx={{ p: 2, border: 1, borderColor: 'divider', cursor: 'pointer' }} onClick={() => handleRowClick(f.id)}>
                  <Typography fontWeight="bold" color="primary" sx={{ mb: 1 }}>{f.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('processActivity.division', '부문명')}: {f.divisionName || ''} / {t('processActivity.department', '부서(팀)명')}: {f.departmentName || ''}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('processActivity.evaluator', '평가자')}: {f.evaluator || ''} · {f.creationDate || ''}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </>
        )}
      </Box>
    )
  }

  // detail / create / edit
  const isEditing = viewMode === 'create' || viewMode === 'edit'
  const displayData: ProcessActivityForm | ProcessActivityFormRequest = isEditing ? form : (detailData || emptyForm()) as any
  const processList: ProcessActivityProcess[] = isEditing ? form.processes : (detailData?.processes || [])

  if (viewMode !== 'create' && detailLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
  }

  return (
    <Box>
      <LoadingOverlay open={isProcessing || isEditPending} message={isEditPending ? '로딩 중...' : undefined} />
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
        {t('nav.processActivityWork', '공정/활동별 작업내용')}
      </Typography>

      {/* 상단 정보 - PC */}
      <Paper variant="outlined" sx={{ mb: 2, overflow: 'hidden', display: { xs: 'none', md: 'block' } }}>
        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: dividerColor }}>
          <Typography sx={labelSx}>{t('common.title', '제목')}</Typography>
          <Box sx={valSx}>
            {isEditing ? (
              <TextField size="small" fullWidth value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            ) : <Typography variant="body2">{displayData.title || ''}</Typography>}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: dividerColor }}>
          <Typography sx={labelSx}>{t('processActivity.division', '부문명')}</Typography>
          <Box sx={valBorderSx}>
            {isEditing ? (
              <TextField size="small" fullWidth value={form.divisionName || ''} onChange={(e) => setForm(f => ({ ...f, divisionName: e.target.value }))} />
            ) : <Typography variant="body2">{displayData.divisionName || ''}</Typography>}
          </Box>
          <Typography sx={labelSx}>{t('processActivity.department', '부서(팀)명')}</Typography>
          <Box sx={valSx}>
            {isEditing ? (
              <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                <TextField size="small" fullWidth value={form.departmentName || ''} InputProps={{ readOnly: true }} placeholder={t('common.selectFromOrg', '조직도에서 선택')} />
                <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setDeptModalOpen(true)}>
                  <PersonSearchIcon fontSize="small" />
                </Button>
              </Box>
            ) : <Typography variant="body2">{displayData.departmentName || ''}</Typography>}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: dividerColor }}>
          <Typography sx={labelSx}>{t('processActivity.evaluator', '평가자')}</Typography>
          <Box sx={valBorderSx}>
            {isEditing ? (
              <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                <TextField size="small" fullWidth value={form.evaluator || ''} InputProps={{ readOnly: true }} placeholder={t('common.selectFromOrg', '조직도에서 선택')} />
                <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setEvaluatorModalOpen(true)}>
                  <PersonSearchIcon fontSize="small" />
                </Button>
              </Box>
            ) : <Typography variant="body2">{displayData.evaluator || ''}</Typography>}
          </Box>
          <Typography sx={labelSx}>{t('processActivity.teamMembers', '팀 참여자')}</Typography>
          <Box sx={valSx}>
            {isEditing ? (
              <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                <TextField size="small" fullWidth multiline value={form.teamMembers || ''} InputProps={{ readOnly: true }} placeholder={t('common.selectFromOrg', '조직도에서 선택')} />
                <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setMemberModalOpen(true)}>
                  <PersonSearchIcon fontSize="small" />
                </Button>
              </Box>
            ) : <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{displayData.teamMembers || ''}</Typography>}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: dividerColor }}>
          <Typography sx={labelSx}>{t('common.description', '상세')}</Typography>
          <Box sx={valSx}>
            {isEditing ? (
              <TextField size="small" fullWidth multiline minRows={2} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            ) : <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{displayData.description || ''}</Typography>}
          </Box>
        </Box>
        {/* 작성자 | 작성일자 */}
        <Box sx={{ display: 'flex', borderBottom: (viewMode === 'edit' || ((displayData as ProcessActivityForm).modifiedAt && (displayData as ProcessActivityForm).modifiedAt !== (displayData as ProcessActivityForm).createdAt)) ? 1 : 0, borderColor: 'divider' }}>
          <Typography sx={labelSx}>{t('common.creator', '작성자')}</Typography>
          <Box sx={valBorderSx}>
            <Typography variant="body2">{formatUserName(
              (displayData as ProcessActivityForm).createdByTeam || user?.department,
              (displayData as ProcessActivityForm).createdByName || user?.name,
              (displayData as ProcessActivityForm).createdByPosition || user?.position,
            )}</Typography>
          </Box>
          <Typography sx={labelSx}>{t('processActivity.creationDate', '작성일자')}</Typography>
          <Box sx={valSx}>
            <Typography variant="body2">{viewMode === 'create' ? todayStr() : (displayData.creationDate || formatDate((displayData as ProcessActivityForm).createdAt))}</Typography>
          </Box>
        </Box>
        {/* 수정자 | 수정일자 — edit 모드 또는 수정 이력 있을 때 */}
        {(viewMode === 'edit' || ((displayData as ProcessActivityForm).modifiedAt && (displayData as ProcessActivityForm).modifiedAt !== (displayData as ProcessActivityForm).createdAt)) && (
          <Box sx={{ display: 'flex' }}>
            <Typography sx={labelSx}>{t('common.modifier', '수정자')}</Typography>
            <Box sx={valBorderSx}>
              <Typography variant="body2">{viewMode === 'edit'
                ? formatUserName(user?.department, user?.name, user?.position)
                : formatUserName((displayData as ProcessActivityForm).modifiedByTeam, (displayData as ProcessActivityForm).modifiedByName, (displayData as ProcessActivityForm).modifiedByPosition)
              }</Typography>
            </Box>
            <Typography sx={labelSx}>{t('common.modifiedAt', '수정일자')}</Typography>
            <Box sx={valSx}>
              <Typography variant="body2">{formatDateTime((displayData as ProcessActivityForm).modifiedAt)}</Typography>
            </Box>
          </Box>
        )}
      </Paper>

      {/* 상단 정보 - Mobile */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 2 }}>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.title', '제목')}</Typography>
          {isEditing ? (
            <TextField size="small" fullWidth value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          ) : <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{displayData.title || ''}</Typography>}
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('processActivity.creationDate', '작성일자')}</Typography>
          <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{viewMode === 'create' ? todayStr() : (displayData.creationDate || formatDate((displayData as ProcessActivityForm).createdAt))}</Typography>
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('processActivity.division', '부문명')}</Typography>
          {isEditing ? (
            <TextField size="small" fullWidth value={form.divisionName || ''} onChange={(e) => setForm(f => ({ ...f, divisionName: e.target.value }))} />
          ) : <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{displayData.divisionName || ''}</Typography>}
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('processActivity.department', '부서(팀)명')}</Typography>
          {isEditing ? (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField size="small" fullWidth value={form.departmentName || ''} InputProps={{ readOnly: true }} placeholder={t('common.selectFromOrg', '조직도에서 선택')} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setDeptModalOpen(true)}>
                <PersonSearchIcon fontSize="small" />
              </Button>
            </Box>
          ) : <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{displayData.departmentName || ''}</Typography>}
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('processActivity.evaluator', '평가자')}</Typography>
          {isEditing ? (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField size="small" fullWidth value={form.evaluator || ''} InputProps={{ readOnly: true }} placeholder={t('common.selectFromOrg', '조직도에서 선택')} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setEvaluatorModalOpen(true)}>
                <PersonSearchIcon fontSize="small" />
              </Button>
            </Box>
          ) : <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{displayData.evaluator || ''}</Typography>}
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('processActivity.teamMembers', '팀 참여자')}</Typography>
          {isEditing ? (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField size="small" fullWidth multiline value={form.teamMembers || ''} InputProps={{ readOnly: true }} placeholder={t('common.selectFromOrg', '조직도에서 선택')} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setMemberModalOpen(true)}>
                <PersonSearchIcon fontSize="small" />
              </Button>
            </Box>
          ) : <Typography variant="body2" sx={{ px: 1.5, py: 0.5, whiteSpace: 'pre-wrap' }}>{displayData.teamMembers || ''}</Typography>}
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.description', '상세')}</Typography>
          {isEditing ? (
            <TextField size="small" fullWidth multiline minRows={2} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          ) : <Typography variant="body2" sx={{ px: 1.5, py: 0.5, whiteSpace: 'pre-wrap' }}>{displayData.description || ''}</Typography>}
        </Box>
      </Box>

      {/* 공정/활동 + 작업내용 테이블 */}
      <Paper variant="outlined" sx={{ mb: 2 }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 1100, '& td, & th': { borderRight: '1px solid', borderColor: 'divider' } }}>
            <TableHead sx={{ bgcolor: 'grey.100' }}>
              <TableRow>
                <TableCell sx={hSx} align="center" width={160}>{t('processActivity.majorCategory', '대분류')}</TableCell>
                <TableCell sx={hSx} align="center" width={160}>{t('processActivity.middleCategory', '중분류')}</TableCell>
                <TableCell sx={hSx} align="center" width={220}>{t('processActivity.subCategory', '소분류 (공정/활동)')}</TableCell>
                <TableCell sx={{ ...hSx, width: 28, px: 0.25 }} align="center">{t('common.no', 'No')}</TableCell>
                <TableCell sx={{ ...hSx, width: 220 }}>{t('processActivity.workContent', '작업내용')}</TableCell>
                <TableCell sx={{ ...hSx, width: 60, minWidth: 60, px: 0.5, whiteSpace: 'nowrap' }} align="center">{t('processActivity.excludeEval', '평가제외')}</TableCell>
                <TableCell sx={{ ...hSx, width: 220 }}>{t('processActivity.applicableLaw', '적용되는 법규 및 법 조항 내용')}</TableCell>
                {isEditing && <TableCell sx={{ ...hSx, width: 32, px: 0.25 }} align="center">{t('common.action', '관리')}</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {processList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isEditing ? 8 : 7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    {t('common.noData', '데이터가 없습니다')}
                  </TableCell>
                </TableRow>
              ) : (() => {
                const processItems = (p: ProcessActivityProcess) => (p.items && p.items.length > 0 ? p.items : [emptyItem(1)])
                const getMk = (i: number) => (processList[i] as any)?._mk
                const getDk = (i: number) => (processList[i] as any)?._dk
                const getMajor = (i: number) => processList[i]?.majorCategory || ''
                const getMiddle = (i: number) => processList[i]?.middleCategory || ''
                // 키가 있으면 키 기반, 없으면 값 기반(비어있지 않은 동일 값) 폴백
                const sameMajor = (a: number, b: number): boolean => {
                  const ka = getMk(a), kb = getMk(b)
                  if (ka && kb) return ka === kb
                  const va = getMajor(a), vb = getMajor(b)
                  return va !== '' && va === vb
                }
                const sameMiddle = (a: number, b: number): boolean => {
                  const ka = getDk(a), kb = getDk(b)
                  if (ka && kb) return ka === kb
                  const va = getMiddle(a), vb = getMiddle(b)
                  return va !== '' && va === vb
                }
                const sameMajorAsPrevEff = (i: number) => i > 0 && sameMajor(i, i - 1)
                // 대분류 span
                const computeMajorSpan = (i: number): { render: boolean; span: number } => {
                  if (sameMajorAsPrevEff(i)) return { render: false, span: 0 }
                  let span = processItems(processList[i]).length
                  for (let k = i + 1; k < processList.length; k++) {
                    if (!sameMajor(k, i)) break
                    span += processItems(processList[k]).length
                  }
                  return { render: true, span }
                }
                // 중분류 span: 대분류 동일 + 중분류 동일
                const computeMiddleSpan = (i: number): { render: boolean; span: number } => {
                  if (i > 0 && sameMajor(i, i - 1) && sameMiddle(i, i - 1)) return { render: false, span: 0 }
                  let span = processItems(processList[i]).length
                  for (let k = i + 1; k < processList.length; k++) {
                    if (!sameMajor(k, i) || !sameMiddle(k, i)) break
                    span += processItems(processList[k]).length
                  }
                  return { render: true, span }
                }
                return processList.flatMap((p, pIdx) => {
                  const items = processItems(p)
                  const majorSpan = computeMajorSpan(pIdx)
                  const middleSpan = computeMiddleSpan(pIdx)
                  return items.map((item, iIdx) => (
                  <TableRow key={`${pIdx}-${iIdx}`}>
                    {iIdx === 0 && majorSpan.render && (
                      <TableCell rowSpan={majorSpan.span} align="center" sx={{ verticalAlign: 'top' }}>
                        {isEditing ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <TextField size="small" fullWidth value={p.majorCategory || ''} onChange={(e) => updateProcess(pIdx, 'majorCategory', e.target.value)} />
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                              <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addMiddle(pIdx)} sx={{ fontSize: '0.7rem', minWidth: 'auto', px: 1, whiteSpace: 'nowrap' }}>중분류</Button>
                              <IconButton size="small" color="error" onClick={() => removeMajor(pIdx)}><DeleteIcon fontSize="small" /></IconButton>
                            </Box>
                          </Box>
                        ) : (p.majorCategory || '')}
                      </TableCell>
                    )}
                    {iIdx === 0 && middleSpan.render && (
                      <TableCell rowSpan={middleSpan.span} align="center" sx={{ verticalAlign: 'top' }}>
                        {isEditing ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <TextField size="small" fullWidth value={p.middleCategory || ''} onChange={(e) => updateProcess(pIdx, 'middleCategory', e.target.value)} />
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                              <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addSub(pIdx)} sx={{ fontSize: '0.7rem', minWidth: 'auto', px: 1, whiteSpace: 'nowrap' }}>소분류</Button>
                              <IconButton size="small" color="error" onClick={() => removeMiddle(pIdx)}><DeleteIcon fontSize="small" /></IconButton>
                            </Box>
                          </Box>
                        ) : (p.middleCategory || '')}
                      </TableCell>
                    )}
                    {iIdx === 0 && (
                      <>
                        <TableCell rowSpan={items.length}>
                          {isEditing ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <TextField size="small" fullWidth value={p.subCategory || ''} onChange={(e) => updateProcess(pIdx, 'subCategory', e.target.value)} />
                              <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                                <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addItem(pIdx)} sx={{ fontSize: '0.7rem', minWidth: 'auto', px: 1, whiteSpace: 'nowrap' }}>
                                  {t('processActivity.addItem', '작업내용')}
                                </Button>
                                <IconButton size="small" color="error" onClick={() => removeProcess(pIdx)}><DeleteIcon fontSize="small" /></IconButton>
                              </Box>
                            </Box>
                          ) : (p.subCategory || '')}
                        </TableCell>
                      </>
                    )}
                    <TableCell align="center">{item.itemNo || iIdx + 1}</TableCell>
                    <TableCell>
                      {isEditing ? (
                        <TextField size="small" fullWidth value={item.workContent || ''} onChange={(e) => updateItem(pIdx, iIdx, 'workContent', e.target.value)} />
                      ) : (item.workContent || '')}
                    </TableCell>
                    <TableCell align="center" sx={{ width: 60, minWidth: 60, px: 0.5, cursor: isEditing ? 'pointer' : 'default' }}
                      onClick={() => isEditing && updateItem(pIdx, iIdx, 'excludeEval', !item.excludeEval)}>
                      <Typography sx={{ fontSize: '1.2rem', color: item.excludeEval ? 'success.main' : 'grey.300', fontWeight: 'bold', lineHeight: 1 }}>○</Typography>
                    </TableCell>
                    <TableCell align={!isEditing && !item.applicableLaw ? 'center' : 'left'}>
                      {isEditing ? (
                        <TextField size="small" fullWidth value={item.applicableLaw || ''} onChange={(e) => updateItem(pIdx, iIdx, 'applicableLaw', e.target.value)} />
                      ) : (item.applicableLaw || '')}
                    </TableCell>
                    {isEditing && (
                      <TableCell align="center" sx={{ px: 0.5 }}>
                        <IconButton size="small" color="error" onClick={() => removeItem(pIdx, iIdx)} disabled={items.length <= 1}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                  ))
                })
              })()}
            </TableBody>
          </Table>
        </TableContainer>
        {isEditing && (
          <Box sx={{ p: 1.5 }}>
            <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={addProcess}>
              {t('processActivity.addRow', '행 추가')}
            </Button>
          </Box>
        )}
      </Paper>

      {/* 하단 버튼 - PC */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, justifyContent: 'flex-end' }}>
        {isEditing ? (
          <>
            {viewMode === 'create' && <DevTestFillButton onFill={fillTestData} />}
            <Button variant="outlined" onClick={handleCancel}>{t('common.cancel', '취소')}</Button>
            <Button variant="contained" onClick={handleSave} disabled={isProcessing}>
              {t('common.save', '저장')}
            </Button>
          </>
        ) : (
          <>
            <Button variant="outlined" onClick={() => { setSelectedId(null); setViewMode('list') }}>{t('common.list', '목록')}</Button>
            <Button variant="contained" onClick={handleEdit}>{t('common.edit', '수정')}</Button>
            <Button variant="contained" color="error" onClick={handleDelete}>{t('common.delete', '삭제')}</Button>
          </>
        )}
      </Box>
      {/* 하단 버튼 - Mobile */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 1, mt: 2 }}>
        {isEditing ? (
          <>
            {viewMode === 'create' && <DevTestFillButton onFill={fillTestData} />}
            <Button variant="outlined" onClick={handleCancel} sx={{ flex: 1 }}>{t('common.cancel', '취소')}</Button>
            <Button variant="contained" onClick={handleSave} disabled={isProcessing} sx={{ flex: 1 }}>
              {t('common.save', '저장')}
            </Button>
          </>
        ) : (
          <>
            <Button variant="outlined" onClick={() => { setSelectedId(null); setViewMode('list') }} sx={{ flex: 1 }}>{t('common.list', '목록')}</Button>
            <Button variant="contained" onClick={handleEdit} sx={{ flex: 1 }}>{t('common.edit', '수정')}</Button>
            <Button variant="contained" color="error" onClick={handleDelete} sx={{ flex: 1 }}>{t('common.delete', '삭제')}</Button>
          </>
        )}
      </Box>

      {/* 평가자 선택 모달 */}
      <DeptUserMultiSelectModal
        open={evaluatorModalOpen}
        onClose={() => setEvaluatorModalOpen(false)}
        title={t('processActivity.selectEvaluator', '평가자 선택')}
        initialSelected={(form.evaluator || '').split(',').map(s => s.trim()).filter(Boolean).map((name, idx) => ({
          id: -(idx + 1), username: '', email: '', name,
          department: form.departmentName || '', company: '', role: '',
        }))}
        onConfirm={(users: UserInfo[]) => {
          setForm({ ...form, evaluator: users.map(u => u.name).join(', ') })
          setEvaluatorModalOpen(false)
        }}
      />
      <DeptUserMultiSelectModal
        open={memberModalOpen}
        onClose={() => setMemberModalOpen(false)}
        title={t('processActivity.selectTeamMembers', '팀 참여자 선택')}
        initialSelected={(form.teamMembers || '').split(',').map(s => s.trim()).filter(Boolean).map((name, idx) => ({
          id: -(idx + 1), username: '', email: '', name,
          department: form.departmentName || '', company: '', role: '',
        }))}
        onConfirm={(users: UserInfo[]) => {
          setForm({ ...form, teamMembers: users.map(u => u.name).join(', ') })
          setMemberModalOpen(false)
        }}
      />
      <DepartmentSelectModal
        open={deptModalOpen}
        onClose={() => setDeptModalOpen(false)}
        initialDepartment={form.departmentName || ''}
        onConfirm={async (dept: string) => {
          setDeptModalOpen(false)
          // 1) 부서명 + 중분류 세팅
          setForm(f => ({
            ...f, departmentName: dept,
            processes: f.processes.map(p => ({ ...p, middleCategory: dept })),
          }))
          // 2) 동일 트리(/users/company-tree) 에서 선택 부서명과 일치하는 GROUP 노드 하위 USER 를 수집
          try {
            const tree = await userApi.getCompanyTree()
            const names: string[] = []
            const walk = (node: CompanyTreeNode, underMatchedGroup: boolean) => {
              const match = underMatchedGroup || (node.type === 'GROUP' && node.label === dept)
              if (match && node.type === 'USER' && node.name) names.push(node.name)
              node.children?.forEach(c => walk(c, match))
            }
            tree.forEach(n => walk(n, false))
            setForm(f => ({ ...f, teamMembers: Array.from(new Set(names)).join(', ') }))
          } catch {
            // 무시 — 팀원 조회 실패해도 부서명은 반영됨
          }
        }}
      />
    </Box>
  )
}

export default ProcessActivityWorkPage
