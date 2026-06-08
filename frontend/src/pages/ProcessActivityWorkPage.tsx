import React, { useState, useEffect, useRef } from 'react'
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
import axiosInstance from '../api/axiosInstance'
import { ApiResponse } from '../types/common.types'
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

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const emptyItem = (sort: number): ProcessActivityItem => ({
  itemNo: sort, workContent: '', excludeEval: false, applicableLaw: '', sortOrder: sort,
})
const emptyProcess = (sort: number): ProcessActivityProcess => ({
  majorCategory: '', middleCategory: '', subCategory: '', sortOrder: sort,
  items: [emptyItem(1)],
})
const emptyForm = (): ProcessActivityFormRequest => ({
  title: '', description: '', divisionName: '', departmentName: '',
  evaluator: '', creationDate: '', teamMembers: '',
  processes: [emptyProcess(1)],
})

const labelSx = {
  width: 140, minWidth: 140, fontWeight: 'bold', bgcolor: 'grey.100',
  px: 2, py: 1.5, borderRight: 1, borderColor: 'grey.300',
  display: 'flex', alignItems: 'center', fontSize: '0.875rem',
  justifyContent: 'center', wordBreak: 'keep-all' as const, textAlign: 'center' as const,
}
const valSx = { flex: 1, px: 2, py: 1, bgcolor: 'background.paper', display: 'flex', alignItems: 'center' }
const valBorderSx = { ...valSx, borderRight: 1, borderColor: 'grey.300' }
const hSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const, bgcolor: 'grey.100' }

const ProcessActivityWorkPage: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()

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
        processes: (detailData.processes && detailData.processes.length > 0)
          ? detailData.processes.map(p => ({
              ...p,
              items: (p.items && p.items.length > 0) ? p.items : [emptyItem(1)],
            }))
          : [emptyProcess(1)],
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

  // ===== Handlers =====
  const handleAdd = () => { setForm(emptyForm()); setSelectedId(null); setViewMode('create') }
  const handleRowClick = (id: number) => { setSelectedId(id); setViewMode('detail') }
  const handleEdit = () => setViewMode('edit')
  const handleCancel = () => { setViewMode(selectedId ? 'detail' : 'list') }
  const handleSave = async () => {
    if (!form.title.trim()) { showError(t('common.required', '제목은 필수입니다')); return }
    const confirmed = await showConfirm(t('common.confirmSave', '저장하시겠습니까?'))
    if (!confirmed) return
    if (viewMode === 'create') createMutation.mutate(form)
    else if (selectedId) updateMutation.mutate({ id: selectedId, data: form })
  }
  const handleDelete = async () => {
    if (!selectedId) return
    const confirmed = await showConfirm(t('common.confirmDelete', '삭제하시겠습니까?'))
    if (!confirmed) return
    deleteMutation.mutate(selectedId)
  }

  const addProcess = () => setForm(f => ({
    ...f,
    processes: [...f.processes, {
      ...emptyProcess(f.processes.length + 1),
      majorCategory: f.divisionName || '',
      middleCategory: f.departmentName || '',
    }],
  }))
  const removeProcess = (idx: number) => setForm(f => ({
    ...f, processes: f.processes.filter((_, i) => i !== idx).map((p, i) => ({ ...p, sortOrder: i + 1 })),
  }))
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
            <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300' }}>
              <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'grey.300' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
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
                <Paper key={f.id} sx={{ p: 2, border: 1, borderColor: 'grey.300', cursor: 'pointer' }} onClick={() => handleRowClick(f.id)}>
                  <Typography fontWeight="bold" sx={{ mb: 1 }}>{f.title}</Typography>
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
      <LoadingOverlay open={isProcessing} />
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
        {t('nav.processActivityWork', '공정/활동별 작업내용')}
      </Typography>

      {/* 상단 정보 - PC */}
      <Paper variant="outlined" sx={{ mb: 2, overflow: 'hidden', display: { xs: 'none', md: 'block' } }}>
        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
          <Typography sx={labelSx}>{t('common.title', '제목')}</Typography>
          <Box sx={valSx}>
            {isEditing ? (
              <TextField size="small" fullWidth value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            ) : <Typography variant="body2">{displayData.title || ''}</Typography>}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
          <Typography sx={labelSx}>{t('processActivity.division', '부문명')}</Typography>
          <Box sx={valBorderSx}>
            {isEditing ? (
              <TextField size="small" fullWidth value={form.divisionName || ''} onChange={(e) => setForm(f => ({
                ...f, divisionName: e.target.value,
                processes: f.processes.map(p => ({ ...p, majorCategory: e.target.value })),
              }))} />
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
        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
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
        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
          <Typography sx={labelSx}>{t('common.description', '상세')}</Typography>
          <Box sx={valSx}>
            {isEditing ? (
              <TextField size="small" fullWidth multiline minRows={2} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            ) : <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{displayData.description || ''}</Typography>}
          </Box>
        </Box>
        {/* 작성자 | 작성일자 */}
        <Box sx={{ display: 'flex', borderBottom: ((displayData as ProcessActivityForm).modifiedAt && (displayData as ProcessActivityForm).modifiedAt !== (displayData as ProcessActivityForm).createdAt) ? 1 : 0, borderColor: 'grey.300' }}>
          <Typography sx={labelSx}>{t('common.creator', '작성자')}</Typography>
          <Box sx={valBorderSx}>
            <Typography variant="body2">{(displayData as ProcessActivityForm).createdByName || ''}</Typography>
          </Box>
          <Typography sx={labelSx}>{t('processActivity.creationDate', '작성일자')}</Typography>
          <Box sx={valSx}>
            {isEditing ? (
              <DatePickerField size="small" value={form.creationDate || null} onChange={(v) => setForm({ ...form, creationDate: v || '' })} />
            ) : <Typography variant="body2">{displayData.creationDate || ((displayData as ProcessActivityForm).createdAt?.substring(0, 10) ?? '')}</Typography>}
          </Box>
        </Box>
        {/* 수정자 | 수정일자 — 수정 이력 있을 때만 */}
        {(displayData as ProcessActivityForm).modifiedAt && (displayData as ProcessActivityForm).modifiedAt !== (displayData as ProcessActivityForm).createdAt && (
          <Box sx={{ display: 'flex' }}>
            <Typography sx={labelSx}>{t('common.modifier', '수정자')}</Typography>
            <Box sx={valBorderSx}>
              <Typography variant="body2">{(displayData as ProcessActivityForm).modifiedByName || ''}</Typography>
            </Box>
            <Typography sx={labelSx}>{t('common.modifiedAt', '수정일자')}</Typography>
            <Box sx={valSx}>
              <Typography variant="body2">{(displayData as ProcessActivityForm).modifiedAt?.replace('T', ' ').substring(0, 16) ?? ''}</Typography>
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
          {isEditing ? (
            <DatePickerField size="small" value={form.creationDate || null} onChange={(v) => setForm({ ...form, creationDate: v || '' })} />
          ) : <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{displayData.creationDate || ''}</Typography>}
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('processActivity.division', '부문명')}</Typography>
          {isEditing ? (
            <TextField size="small" fullWidth value={form.divisionName || ''} onChange={(e) => setForm(f => ({
              ...f, divisionName: e.target.value,
              processes: f.processes.map(p => ({ ...p, majorCategory: e.target.value })),
            }))} />
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
          <Table size="small" sx={{ minWidth: 1100, '& td, & th': { borderRight: '1px solid', borderColor: 'grey.300' } }}>
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
                const getMajor = (i: number) => processList[i]?.majorCategory || ''
                const getMiddle = (i: number) => processList[i]?.middleCategory || ''
                // 편집 모드에서는 form 의 부문명/부서(팀)명으로 강제 매칭
                const getMajorEff = (i: number) => isEditing ? (form.divisionName || '') : getMajor(i)
                const getMiddleEff = (i: number) => isEditing ? (form.departmentName || '') : getMiddle(i)
                const sameMajorAsPrevEff = (i: number) => i > 0 && getMajorEff(i) === getMajorEff(i - 1)
                // 대분류 span: 연속 동일값 프로세스들의 items.length 합. 첫 프로세스에서만 렌더
                const computeMajorSpan = (i: number): { render: boolean; span: number } => {
                  if (sameMajorAsPrevEff(i)) return { render: false, span: 0 }
                  let span = processItems(processList[i]).length
                  for (let k = i + 1; k < processList.length; k++) {
                    if (getMajorEff(k) !== getMajorEff(i)) break
                    span += processItems(processList[k]).length
                  }
                  return { render: true, span }
                }
                // 중분류 span: 대분류 그룹 안에서만 연속 동일값 병합
                const computeMiddleSpan = (i: number): { render: boolean; span: number } => {
                  const prevSameMiddle = i > 0 && getMiddleEff(i) === getMiddleEff(i - 1)
                  if (prevSameMiddle && sameMajorAsPrevEff(i)) return { render: false, span: 0 }
                  let span = processItems(processList[i]).length
                  for (let k = i + 1; k < processList.length; k++) {
                    if (getMiddleEff(k) !== getMiddleEff(i)) break
                    if (!sameMajorAsPrevEff(k)) break
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
                      <TableCell rowSpan={majorSpan.span} align="center">
                        {(isEditing ? form.divisionName : p.majorCategory) || ''}
                      </TableCell>
                    )}
                    {iIdx === 0 && middleSpan.render && (
                      <TableCell rowSpan={middleSpan.span} align="center">
                        {(isEditing ? form.departmentName : p.middleCategory) || ''}
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
                                  {t('processActivity.addItem', '추가')}
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
              {t('processActivity.addProcess', '공정/활동 추가')}
            </Button>
          </Box>
        )}
      </Paper>

      {/* 하단 버튼 - PC */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, justifyContent: 'flex-end' }}>
        {isEditing ? (
          <>
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
            const res = await axiosInstance.get<ApiResponse<CompanyTreeNode[]>>('/users/company-tree')
            const tree = res.data?.data || []
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
