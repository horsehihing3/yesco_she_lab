import { formatDate } from '../utils/dateDefaults'
import React, { useState, useRef, useTransition } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Paper, Typography, Button, TextField, IconButton, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material'
import ListSearchBar from '../components/common/ListSearchBar'
import { formatUserName } from '../utils/userDisplay'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import RefreshIcon from '@mui/icons-material/Refresh'
import * as XLSX from 'xlsx'
import { safetyAccidentApi } from '../api/safetyAccidentApi'
import { SafetyAccidentForm, SafetyAccidentItem, SafetyAccidentFormRequest } from '../types/safetyAccident.types'
import DatePickerField from '../components/common/DatePickerField'
import LoadingOverlay from '../components/common/LoadingOverlay'
import DepartmentSelectModal from '../components/common/DepartmentSelectModal'
import DeptUserMultiSelectModal from '../components/common/DeptUserMultiSelectModal'
import type { UserInfo } from '../components/common/UserSelectModal'
import { useAlert } from '../contexts/AlertContext'
import { useAuth } from '../context/AuthContext'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

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

const emptyItem = (sort: number): SafetyAccidentItem => ({
  itemNo: sort, accidentCase: '', accidentType: '',
  frequency: '', processActivity: '', sortOrder: sort,
})
const todayStr = () => new Date().toISOString().slice(0, 10)
const emptyForm = (): SafetyAccidentFormRequest => ({
  title: '', description: '', divisionName: '', departmentName: '',
  evaluator: '', surveyDate: todayStr(),
  items: [emptyItem(1)],
})

const SafetyAccidentInfoPage: React.FC = () => {
  const qc = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()
  const { user } = useAuth()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [page] = useState(0)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [form, setForm] = useState<SafetyAccidentFormRequest>(emptyForm())
  const [isUploading, setIsUploading] = useState(false)

  const [deptModalOpen, setDeptModalOpen] = useState(false)
  const [evaluatorModalOpen, setEvaluatorModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const applySearch = () => setKeyword(keywordInput)

  const { data: listData, isFetching: listFetching } = useQuery({
    queryKey: ['safetyAccidentForms', page],
    queryFn: () => safetyAccidentApi.list(page, 50),
    enabled: viewMode === 'list',
  })

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['safetyAccidentForm', selectedId],
    queryFn: () => safetyAccidentApi.getById(selectedId!),
    enabled: !!selectedId && (viewMode === 'detail' || viewMode === 'edit'),
  })

  const createMut = useMutation({
    mutationFn: (req: SafetyAccidentFormRequest) => safetyAccidentApi.create(req),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['safetyAccidentForms'] })
      showSuccess('저장되었습니다')
      setSelectedId(created.id!)
      setViewMode('detail')
    },
    onError: () => showError('저장 실패'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, req }: { id: number; req: SafetyAccidentFormRequest }) => safetyAccidentApi.update(id, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['safetyAccidentForms'] })
      qc.invalidateQueries({ queryKey: ['safetyAccidentForm', selectedId] })
      showSuccess('수정되었습니다')
      setViewMode('detail')
    },
    onError: () => showError('수정 실패'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => safetyAccidentApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['safetyAccidentForms'] })
      showSuccess('삭제되었습니다')
      setSelectedId(null)
      setViewMode('list')
    },
    onError: () => showError('삭제 실패'),
  })

  const isEditing = viewMode === 'create' || viewMode === 'edit'
  const isProcessing = createMut.isPending || updateMut.isPending || deleteMut.isPending
  const [isEditPending, startEditTransition] = useTransition()
  const displayData = isEditing ? form : (detailData || form)

  const handleAdd = () => { setForm(emptyForm()); setSelectedId(null); setViewMode('create') }
  const handleRowClick = (id: number) => { setSelectedId(id); setViewMode('detail') }
  const handleEdit = () => {
    if (!detailData) return
    startEditTransition(() => {
      setForm({
        title: detailData.title, description: detailData.description,
        divisionName: detailData.divisionName, departmentName: detailData.departmentName,
        evaluator: detailData.evaluator, surveyDate: detailData.surveyDate,
        items: detailData.items || [emptyItem(1)],
      })
      setViewMode('edit')
    })
  }
  const handleCancel = () => {
    if (viewMode === 'edit') setViewMode('detail')
    else { setSelectedId(null); setViewMode('list') }
  }
  const handleSave = () => {
    if (!form.title.trim()) { showError('제목은 필수입니다'); return }
    if (viewMode === 'edit' && selectedId) updateMut.mutate({ id: selectedId, req: form })
    else createMut.mutate(form)
  }
  const handleDelete = async () => {
    if (!selectedId) return
    if (await showConfirm('삭제하시겠습니까?')) deleteMut.mutate(selectedId)
  }

  const updateItem = (idx: number, patch: Partial<SafetyAccidentItem>) => {
    setForm(f => ({ ...f, items: (f.items || []).map((it, i) => i === idx ? { ...it, ...patch } : it) }))
  }
  const addItem = () => setForm(f => ({ ...f, items: [...(f.items || []), emptyItem((f.items?.length || 0) + 1)] }))
  const removeItem = (idx: number) => setForm(f => ({ ...f, items: (f.items || []).filter((_, i) => i !== idx) }))

  // 엑셀 업로드 → 즉시 저장
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (fileInputRef.current) fileInputRef.current.value = ''
    setIsUploading(true)
    try {
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })
      // 엑셀 셀 값을 숫자로 변환 (빈 값 = undefined, 숫자가 아닌 마커성 텍스트("O"/"1" 등) = 1)
      const N = (v: any): number | undefined => {
        if (v === null || v === undefined) return undefined
        const s = v.toString().trim()
        if (s === '') return undefined
        const n = Number(s)
        return Number.isFinite(n) ? n : 1
      }
      const newItems: SafetyAccidentItem[] = []
      let order = 1
      for (let r = 5; r < rows.length; r++) {
        const row = rows[r]
        if (!row || row.every((c: any) => c === null || c === '')) continue
        const accidentCase = (row[1] ?? '')?.toString().trim()
        if (!accidentCase) continue
        newItems.push({
          itemNo: typeof row[0] === 'number' ? row[0] : Number(row[0]) || order,
          accidentCase,
          accidentType: (row[9] ?? '')?.toString() || undefined,
          nearMiss: N(row[11]),
          fatalAccident: N(row[13]),
          leaveOver1month: N(row[15]),
          leaveUnder1month: N(row[17]),
          noLeave: N(row[19]),
          frequency: (row[21] ?? '')?.toString() || undefined,
          processActivity: (row[23] ?? '')?.toString() || undefined,
          sortOrder: order++,
        })
      }
      if (newItems.length === 0) { showError('파싱된 행이 없습니다'); return }
      const r2 = rows[1] || []
      const r3 = rows[2] || []
      const division = (r2[3] ?? '')?.toString().trim()
      const dept = (r3[3] ?? '')?.toString().trim()
      const evaluator = (r2[22] ?? '')?.toString().trim()
      const surveyDateRaw = (r3[22] ?? '')?.toString().trim()
      const payload: SafetyAccidentFormRequest = {
        title: '보건안전재해발생정보조사서',
        divisionName: division, departmentName: dept,
        evaluator,
        surveyDate: surveyDateRaw ? surveyDateRaw.replace(/[.\s]+/g, '-').replace(/-$/, '') : todayStr(),
        items: newItems,
      }
      await safetyAccidentApi.create(payload)
      qc.invalidateQueries({ queryKey: ['safetyAccidentForms'] })
      showSuccess(`${newItems.length}개 행이 등록되었습니다.`)
    } catch (err) {
      console.error(err); showError('엑셀 파일 처리에 실패했습니다')
    } finally {
      setIsUploading(false)
    }
  }

  if (viewMode === 'list') {
    const raw = listData?.content || []
    const items = keyword.trim()
      ? raw.filter(f => (f.title || '').toLowerCase().includes(keyword.toLowerCase()))
      : raw
    return (
      <Box>
        <LoadingOverlay open={listFetching || isUploading} message={isUploading ? '엑셀 업로드 중...' : '로딩 중...'} />
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleExcelUpload} />
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>보건안전 재해발생 정보</Typography>
        <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <ListSearchBar placeholder="제목으로 검색" value={keywordInput} onChange={setKeywordInput} onSearch={applySearch} />
            <IconButton onClick={() => setKeyword('')} size="small"><RefreshIcon /></IconButton>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" size="small" onClick={() => fileInputRef.current?.click()}>엑셀 업로드</Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd} size="small">New</Button>
          </Box>
        </Box>
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
          <ListSearchBar fullWidth placeholder="제목으로 검색" value={keywordInput} onChange={setKeywordInput} onSearch={applySearch} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={() => setKeyword('')} sx={{ flex: 1 }}>초기화</Button>
            <Button variant="contained" size="small" onClick={() => fileInputRef.current?.click()} sx={{ flex: 1 }}>엑셀 업로드</Button>
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAdd} sx={{ flex: 1 }}>New</Button>
          </Box>
        </Box>
        <Paper variant="outlined" sx={{ display: { xs: 'none', md: 'block' } }}>
          <TableContainer>
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
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell sx={hSx}>제목</TableCell>
                  <TableCell sx={hSx} align="center" width={140}>부문명</TableCell>
                  <TableCell sx={hSx} align="center" width={150}>부서(팀)명</TableCell>
                  <TableCell sx={hSx} align="center" width={110}>평가자</TableCell>
                  <TableCell sx={hSx} align="center" width={110}>조사일자</TableCell>
                  <TableCell sx={hSx} align="center" width={110}>작성자</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.disabled' }}>등록된 내역이 없습니다</TableCell></TableRow>
                ) : items.map(f => (
                  <TableRow key={f.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(f.id!)}>
                    <TableCell>{f.title}</TableCell>
                    <TableCell align="center">{f.divisionName || '-'}</TableCell>
                    <TableCell align="center">{f.departmentName || '-'}</TableCell>
                    <TableCell align="center">{f.evaluator || '-'}</TableCell>
                    <TableCell align="center">{f.surveyDate || '-'}</TableCell>
                    <TableCell align="center">{f.createdByName || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          {items.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', color: 'text.disabled' }}>등록된 내역이 없습니다</Paper>
          ) : items.map(f => (
            <Paper key={f.id} variant="outlined" sx={{ p: 1.5, mb: 1, cursor: 'pointer' }} onClick={() => handleRowClick(f.id!)}>
              <Typography variant="body2" fontWeight="bold">{f.title}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                부문명: {f.divisionName || ''} / 부서(팀)명: {f.departmentName || ''}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                평가자: {f.evaluator || ''} · {f.surveyDate || ''}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Box>
    )
  }

  if ((viewMode === 'detail' || viewMode === 'edit') && detailLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
  }

  return (
    <Box>
      <LoadingOverlay open={isProcessing || isEditPending} message={isEditPending ? '로딩 중...' : undefined} />
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>보건안전 재해발생 정보</Typography>

      <Paper variant="outlined" sx={{ mb: 2, overflow: 'hidden', display: { xs: 'none', md: 'block' } }}>
        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: dividerColor }}>
          <Typography sx={labelSx}>제목</Typography>
          <Box sx={valSx}>
            {isEditing ? (
              <TextField size="small" fullWidth value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            ) : <Typography variant="body2">{displayData.title || ''}</Typography>}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: dividerColor }}>
          <Typography sx={labelSx}>부문명</Typography>
          <Box sx={valBorderSx}>
            {isEditing ? (
              <TextField size="small" fullWidth value={form.divisionName || ''} onChange={(e) => setForm(f => ({ ...f, divisionName: e.target.value }))} />
            ) : <Typography variant="body2">{displayData.divisionName || ''}</Typography>}
          </Box>
          <Typography sx={labelSx}>부서(팀)명</Typography>
          <Box sx={valSx}>
            {isEditing ? (
              <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                <TextField size="small" fullWidth value={form.departmentName || ''} InputProps={{ readOnly: true }} placeholder="조직도에서 선택" />
                <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setDeptModalOpen(true)}>
                  <PersonSearchIcon fontSize="small" />
                </Button>
              </Box>
            ) : <Typography variant="body2">{displayData.departmentName || ''}</Typography>}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: dividerColor }}>
          <Typography sx={labelSx}>평가자</Typography>
          <Box sx={valBorderSx}>
            {isEditing ? (
              <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                <TextField size="small" fullWidth value={form.evaluator || ''} InputProps={{ readOnly: true }} placeholder="조직도에서 선택" />
                <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setEvaluatorModalOpen(true)}>
                  <PersonSearchIcon fontSize="small" />
                </Button>
              </Box>
            ) : <Typography variant="body2">{displayData.evaluator || ''}</Typography>}
          </Box>
          <Typography sx={labelSx}>조사일자</Typography>
          <Box sx={valSx}>
            {isEditing ? (
              <DatePickerField size="small" value={form.surveyDate || null} onChange={(v) => setForm({ ...form, surveyDate: v || '' })} />
            ) : <Typography variant="body2">{displayData.surveyDate || ''}</Typography>}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: dividerColor }}>
          <Typography sx={labelSx}>설명</Typography>
          <Box sx={valSx}>
            {isEditing ? (
              <TextField size="small" fullWidth multiline minRows={2} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            ) : <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{displayData.description || ''}</Typography>}
          </Box>
        </Box>
        <Box sx={{ display: 'flex' }}>
          <Typography sx={labelSx}>작성자</Typography>
          <Box sx={valBorderSx}>
            <Typography variant="body2">{viewMode === 'create' ? (formatUserName(user?.department, user?.name, user?.position) || user?.name || user?.username || '') : (formatUserName(detailData?.createdByTeam, detailData?.createdByName, detailData?.createdByPosition) || '')}</Typography>
          </Box>
          <Typography sx={labelSx}>작성일자</Typography>
          <Box sx={valSx}>
            <Typography variant="body2">{viewMode === 'create' ? todayStr() : (formatDate(detailData?.createdAt) || '')}</Typography>
          </Box>
        </Box>
      </Paper>

      {/* 모바일 상단 폼 */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 2 }}>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>제목</Typography>
          {isEditing ? (
            <TextField size="small" fullWidth value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          ) : <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{displayData.title || ''}</Typography>}
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>부문명</Typography>
          {isEditing ? (
            <TextField size="small" fullWidth value={form.divisionName || ''} onChange={(e) => setForm(f => ({ ...f, divisionName: e.target.value }))} />
          ) : <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{displayData.divisionName || ''}</Typography>}
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>부서(팀)명</Typography>
          {isEditing ? (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField size="small" fullWidth value={form.departmentName || ''} InputProps={{ readOnly: true }} placeholder="조직도에서 선택" />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setDeptModalOpen(true)}>
                <PersonSearchIcon fontSize="small" />
              </Button>
            </Box>
          ) : <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{displayData.departmentName || ''}</Typography>}
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>평가자</Typography>
          {isEditing ? (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField size="small" fullWidth value={form.evaluator || ''} InputProps={{ readOnly: true }} placeholder="조직도에서 선택" />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setEvaluatorModalOpen(true)}>
                <PersonSearchIcon fontSize="small" />
              </Button>
            </Box>
          ) : <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{displayData.evaluator || ''}</Typography>}
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>조사일자</Typography>
          {isEditing ? (
            <DatePickerField size="small" value={form.surveyDate || null} onChange={(v) => setForm({ ...form, surveyDate: v || '' })} />
          ) : <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{displayData.surveyDate || ''}</Typography>}
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>설명</Typography>
          {isEditing ? (
            <TextField size="small" fullWidth multiline minRows={2} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          ) : <Typography variant="body2" sx={{ px: 1.5, py: 0.5, whiteSpace: 'pre-wrap' }}>{displayData.description || ''}</Typography>}
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>작성자</Typography>
          <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{viewMode === 'create' ? (formatUserName(user?.department, user?.name, user?.position) || user?.name || user?.username || '') : (formatUserName(detailData?.createdByTeam, detailData?.createdByName, detailData?.createdByPosition) || '')}</Typography>
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>작성일자</Typography>
          <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{viewMode === 'create' ? todayStr() : (formatDate(detailData?.createdAt) || '')}</Typography>
        </Box>
      </Box>

      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 1400 }}>
            <TableHead sx={(theme: any) => {
              const c = theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)'
                : theme.isYesco ? 'rgba(255,255,255,0.35)'
                : theme.palette.divider
              return {
                '& .MuiTableCell-root': {
                  borderRight: `1px solid ${c} !important`,
                  borderBottom: `1px solid ${c} !important`,
                },
                '& tr:first-of-type > .MuiTableCell-root:last-child': { borderRight: 'none !important' },
                '& tr:last-child > .MuiTableCell-root:last-child': { borderRight: `1px solid ${c} !important` },
              }
            }}>
              <TableRow>
                <TableCell sx={hSx} align="center" width={50} rowSpan={2}>No</TableCell>
                <TableCell sx={{ ...hSx, minWidth: 220 }} rowSpan={2}>발생사례</TableCell>
                <TableCell sx={hSx} align="center" colSpan={2}>재해형태/사고형태</TableCell>
                <TableCell sx={hSx} align="center" width={80} rowSpan={2}>사망 재해</TableCell>
                <TableCell sx={hSx} align="center" colSpan={3}>휴업재해</TableCell>
                <TableCell sx={{ ...hSx, minWidth: 100 }} align="center">발생빈도</TableCell>
                <TableCell sx={{ ...hSx, minWidth: 180 }} rowSpan={2}>해당 공정/활동</TableCell>
                {isEditing && <TableCell sx={{ ...hSx, width: 64, px: 0.5 }} align="center" rowSpan={2}>관리</TableCell>}
              </TableRow>
              <TableRow>
                <TableCell sx={hSx} align="center" width={100}>재해형태</TableCell>
                <TableCell sx={hSx} align="center" width={60}>아차사고</TableCell>
                <TableCell sx={hSx} align="center" width={70}>1개월 이상</TableCell>
                <TableCell sx={hSx} align="center" width={70}>1개월 미만</TableCell>
                <TableCell sx={hSx} align="center" width={60}>없음</TableCell>
                <TableCell sx={hSx} align="center" width={100}>발생주기</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(displayData.items || []).map((it, i) => (
                <TableRow key={i}>
                  <TableCell align="center">{it.itemNo ?? i + 1}</TableCell>
                  <TableCell>{isEditing ? <TextField size="small" fullWidth value={it.accidentCase || ''} onChange={e => updateItem(i, { accidentCase: e.target.value })} /> : it.accidentCase}</TableCell>
                  <TableCell align="center">{isEditing ? <TextField size="small" value={it.accidentType || ''} onChange={e => updateItem(i, { accidentType: e.target.value })} sx={{ width: 100 }} /> : it.accidentType}</TableCell>
                  <TableCell align="center" sx={{ p: 0.5 }}>{isEditing ? <TextField size="small" type="number" value={it.nearMiss ?? ''} onChange={e => updateItem(i, { nearMiss: e.target.value === '' ? undefined : Number(e.target.value) })} sx={{ width: 60 }} inputProps={{ min: 0, style: { textAlign: 'center' } }} /> : (it.nearMiss ?? '')}</TableCell>
                  <TableCell align="center" sx={{ p: 0.5 }}>{isEditing ? <TextField size="small" type="number" value={it.fatalAccident ?? ''} onChange={e => updateItem(i, { fatalAccident: e.target.value === '' ? undefined : Number(e.target.value) })} sx={{ width: 60 }} inputProps={{ min: 0, style: { textAlign: 'center' } }} /> : (it.fatalAccident ?? '')}</TableCell>
                  <TableCell align="center" sx={{ p: 0.5 }}>{isEditing ? <TextField size="small" type="number" value={it.leaveOver1month ?? ''} onChange={e => updateItem(i, { leaveOver1month: e.target.value === '' ? undefined : Number(e.target.value) })} sx={{ width: 60 }} inputProps={{ min: 0, style: { textAlign: 'center' } }} /> : (it.leaveOver1month ?? '')}</TableCell>
                  <TableCell align="center" sx={{ p: 0.5 }}>{isEditing ? <TextField size="small" type="number" value={it.leaveUnder1month ?? ''} onChange={e => updateItem(i, { leaveUnder1month: e.target.value === '' ? undefined : Number(e.target.value) })} sx={{ width: 60 }} inputProps={{ min: 0, style: { textAlign: 'center' } }} /> : (it.leaveUnder1month ?? '')}</TableCell>
                  <TableCell align="center" sx={{ p: 0.5 }}>{isEditing ? <TextField size="small" type="number" value={it.noLeave ?? ''} onChange={e => updateItem(i, { noLeave: e.target.value === '' ? undefined : Number(e.target.value) })} sx={{ width: 60 }} inputProps={{ min: 0, style: { textAlign: 'center' } }} /> : (it.noLeave ?? '')}</TableCell>
                  <TableCell align="center">{isEditing ? <TextField size="small" value={it.frequency || ''} onChange={e => updateItem(i, { frequency: e.target.value })} sx={{ width: 100 }} /> : it.frequency}</TableCell>
                  <TableCell>{isEditing ? <TextField size="small" fullWidth value={it.processActivity || ''} onChange={e => updateItem(i, { processActivity: e.target.value })} /> : it.processActivity}</TableCell>
                  {isEditing && <TableCell align="center" sx={{ width: 64, px: 0.5 }}><IconButton size="small" color="error" onClick={() => removeItem(i)}><DeleteIcon fontSize="small" /></IconButton></TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {isEditing && (
          <Box sx={{ p: 1.5 }}>
            <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={addItem}>행 추가</Button>
          </Box>
        )}
      </Paper>

      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'flex-end', gap: 1, mt: 2 }}>
        {isEditing ? (
          <>
            <Button variant="outlined" onClick={handleCancel}>취소</Button>
            <Button variant="contained" onClick={handleSave} disabled={isProcessing}>저장</Button>
          </>
        ) : (
          <>
            <Button variant="outlined" onClick={() => { setSelectedId(null); setViewMode('list') }}>목록</Button>
            <Button variant="contained" onClick={handleEdit}>수정</Button>
            <Button variant="contained" color="error" onClick={handleDelete}>삭제</Button>
          </>
        )}
      </Box>
      <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 1, mt: 2 }}>
        {isEditing ? (
          <>
            <Button variant="outlined" onClick={handleCancel} sx={{ flex: 1 }}>취소</Button>
            <Button variant="contained" onClick={handleSave} disabled={isProcessing} sx={{ flex: 1 }}>저장</Button>
          </>
        ) : (
          <>
            <Button variant="outlined" onClick={() => { setSelectedId(null); setViewMode('list') }} sx={{ flex: 1 }}>목록</Button>
            <Button variant="contained" onClick={handleEdit} sx={{ flex: 1 }}>수정</Button>
            <Button variant="contained" color="error" onClick={handleDelete} sx={{ flex: 1 }}>삭제</Button>
          </>
        )}
      </Box>

      <DeptUserMultiSelectModal
        open={evaluatorModalOpen}
        onClose={() => setEvaluatorModalOpen(false)}
        title="평가자 선택"
        initialSelected={(form.evaluator || '').split(',').map(s => s.trim()).filter(Boolean).map((name, idx) => ({
          id: -(idx + 1), username: '', email: '', name,
          department: form.departmentName || '', company: '', role: '',
        }))}
        onConfirm={(users: UserInfo[]) => {
          setForm({ ...form, evaluator: users.map(u => u.name).join(', ') })
          setEvaluatorModalOpen(false)
        }}
      />
      <DepartmentSelectModal
        open={deptModalOpen}
        onClose={() => setDeptModalOpen(false)}
        initialDepartment={form.departmentName || ''}
        onConfirm={(dept: string) => {
          setDeptModalOpen(false)
          setForm(f => ({ ...f, departmentName: dept }))
        }}
      />
    </Box>
  )
}

export default SafetyAccidentInfoPage
