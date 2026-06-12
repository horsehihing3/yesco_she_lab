import React, { useState, useRef, useEffect, useTransition } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Paper, Typography, Button, TextField, IconButton, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Checkbox,
} from '@mui/material'
import ListSearchBar from '../components/common/ListSearchBar'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import RefreshIcon from '@mui/icons-material/Refresh'
import * as XLSX from 'xlsx'
import { safetyHazardApi } from '../api/safetyHazardApi'
import { SafetyHazardForm, SafetyHazardItem, SafetyHazardFormRequest } from '../types/safetyHazard.types'
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

const emptyItem = (sort: number): SafetyHazardItem => ({
  processActivity: '', machineName: '', machineQty: undefined,
  chemicalName: '', chemicalQty: '', exposureTime: '',
  workerComp1: false, workerComp2: false, workerComp3: false,
  workerComp4: false, workerComp5: false, workerComp6: false,
  shiftWork1: false, shiftWork2: false, shiftWork3: false,
  heavyLoad1: false, heavyLoad2: false, heavyLoad3: false,
  permitWork: '', specialTraining: '', sortOrder: sort,
})
const todayStr = () => new Date().toISOString().slice(0, 10)
const emptyForm = (): SafetyHazardFormRequest => ({
  title: '', description: '', divisionName: '', departmentName: '',
  evaluator: '', surveyDate: todayStr(), teamMembers: '',
  items: [emptyItem(1)],
})

const SafetyHazardInfoPage: React.FC = () => {
  const qc = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()
  const { user } = useAuth()

  // 공정/활동 그룹 식별 키
  const keyCounter = useRef(0)
  const nk = () => 'k' + (++keyCounter.current)
  const assignKeys = (items: SafetyHazardItem[]): SafetyHazardItem[] => {
    let pk = nk()
    return items.map((it, i) => {
      if (i > 0) {
        const prev = items[i - 1]
        const same = (it.processActivity || '') !== '' && (it.processActivity || '') === (prev.processActivity || '')
        if (!same) pk = nk()
      }
      return { ...it, _pk: pk } as any
    })
  }
  const stripKeys = (items: SafetyHazardItem[]): SafetyHazardItem[] =>
    items.map(it => { const { _pk, ...rest } = it as any; return rest })

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [page] = useState(0)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [form, setForm] = useState<SafetyHazardFormRequest>(emptyForm())
  const [isUploading, setIsUploading] = useState(false)

  const [deptModalOpen, setDeptModalOpen] = useState(false)
  const [evaluatorModalOpen, setEvaluatorModalOpen] = useState(false)
  const [memberModalOpen, setMemberModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const applySearch = () => setKeyword(keywordInput)

  const { data: listData, isFetching: listFetching } = useQuery({
    queryKey: ['safetyHazardForms', page],
    queryFn: () => safetyHazardApi.list(page, 50),
    enabled: viewMode === 'list',
  })

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['safetyHazardForm', selectedId],
    queryFn: () => safetyHazardApi.getById(selectedId!),
    enabled: !!selectedId && (viewMode === 'detail' || viewMode === 'edit'),
  })

  const createMut = useMutation({
    mutationFn: (req: SafetyHazardFormRequest) => safetyHazardApi.create(req),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['safetyHazardForms'] })
      showSuccess('저장되었습니다')
      setSelectedId(created.id!)
      setViewMode('detail')
    },
    onError: () => showError('저장 실패'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, req }: { id: number; req: SafetyHazardFormRequest }) => safetyHazardApi.update(id, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['safetyHazardForms'] })
      qc.invalidateQueries({ queryKey: ['safetyHazardForm', selectedId] })
      showSuccess('수정되었습니다')
      setViewMode('detail')
    },
    onError: () => showError('수정 실패'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => safetyHazardApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['safetyHazardForms'] })
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

  const handleAdd = () => {
    const f = emptyForm()
    setForm({ ...f, items: assignKeys(f.items || []) })
    setSelectedId(null)
    setViewMode('create')
  }
  const handleRowClick = (id: number) => { setSelectedId(id); setViewMode('detail') }
  const handleEdit = () => {
    if (!detailData) return
    startEditTransition(() => {
      setForm({
        title: detailData.title, description: detailData.description,
        divisionName: detailData.divisionName, departmentName: detailData.departmentName,
        evaluator: detailData.evaluator, surveyDate: detailData.surveyDate, teamMembers: detailData.teamMembers,
        items: assignKeys(detailData.items || [emptyItem(1)]),
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
    const req = { ...form, items: stripKeys(form.items || []) }
    if (viewMode === 'edit' && selectedId) updateMut.mutate({ id: selectedId, req })
    else createMut.mutate(req)
  }
  const handleDelete = async () => {
    if (!selectedId) return
    if (await showConfirm('삭제하시겠습니까?')) deleteMut.mutate(selectedId)
  }

  const updateItem = (idx: number, patch: Partial<SafetyHazardItem>) => {
    setForm(f => ({ ...f, items: (f.items || []).map((it, i) => i === idx ? { ...it, ...patch } : it) }))
  }
  // 신규 공정/활동 그룹으로 행 추가 (새 _pk)
  const addItem = () => setForm(f => ({
    ...f,
    items: [...(f.items || []), { ...emptyItem((f.items?.length || 0) + 1), _pk: nk() } as any],
  }))
  const removeItem = (idx: number) => setForm(f => ({ ...f, items: (f.items || []).filter((_, i) => i !== idx) }))
  // 동일 공정/활동 그룹 안에 행 추가 (기존 _pk 공유)
  const addItemInGroup = (idx: number) => setForm(f => {
    const arr = [...(f.items || [])] as any[]
    const pk = arr[idx]._pk || nk()
    const proc = arr[idx].processActivity || ''
    let lastIdx = idx
    for (let i = idx + 1; i < arr.length; i++) {
      if (arr[i]._pk === pk) lastIdx = i
      else break
    }
    arr.splice(lastIdx + 1, 0, { ...emptyItem(0), processActivity: proc, _pk: pk } as any)
    return { ...f, items: arr.map((it, i) => ({ ...it, sortOrder: i + 1 })) }
  })

  // 마운트 시 초기 form items에 키 부여
  useEffect(() => {
    setForm(f => ({ ...f, items: assignKeys(f.items || []) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      const O = (v: any) => v !== null && v !== undefined && v.toString().trim() !== ''
      const newItems: SafetyHazardItem[] = []
      let curProcess = ''
      let order = 1
      for (let r = 6; r < rows.length; r++) {
        const row = rows[r]
        if (!row || row.every((c: any) => c === null || c === '')) continue
        const proc = row[0]
        if (proc && typeof proc === 'string' && proc.trim()) curProcess = proc.trim()
        const machineName = (row[2] ?? '')?.toString().trim()
        if (!machineName && !curProcess) continue
        newItems.push({
          processActivity: curProcess,
          machineName,
          machineQty: typeof row[4] === 'number' ? row[4] : Number(row[4]) || undefined,
          chemicalName: (row[5] ?? '')?.toString() || undefined,
          chemicalQty: (row[6] ?? '')?.toString() || undefined,
          exposureTime: (row[7] ?? '')?.toString() || undefined,
          workerComp1: O(row[8]), workerComp2: O(row[9]), workerComp3: O(row[10]),
          workerComp4: O(row[11]), workerComp5: O(row[12]), workerComp6: O(row[13]),
          shiftWork1: O(row[14]), shiftWork2: O(row[15]), shiftWork3: O(row[16]),
          heavyLoad1: O(row[17]), heavyLoad2: O(row[18]), heavyLoad3: O(row[19]),
          permitWork: (row[20] ?? '')?.toString() || undefined,
          specialTraining: (row[21] ?? '')?.toString() || undefined,
          sortOrder: order++,
        })
      }
      if (newItems.length === 0) { showError('파싱된 행이 없습니다'); return }
      const r2 = rows[1] || []
      const r3 = rows[2] || []
      const division = (r2[1] ?? '')?.toString().trim()
      const dept = (r3[1] ?? '')?.toString().trim()
      const evaluator = (r2[16] ?? '')?.toString().trim()
      const surveyDateRaw = (r3[16] ?? '')?.toString().trim()
      const payload: SafetyHazardFormRequest = {
        title: '안전보건상 위험정보조사서',
        divisionName: division, departmentName: dept,
        evaluator, teamMembers: '',
        surveyDate: surveyDateRaw ? surveyDateRaw.replace(/[.\s]+/g, '-').replace(/-$/, '') : todayStr(),
        items: newItems,
      }
      await safetyHazardApi.create(payload)
      qc.invalidateQueries({ queryKey: ['safetyHazardForms'] })
      showSuccess(`${newItems.length}개 행이 등록되었습니다.`)
    } catch (err) {
      console.error(err); showError('엑셀 파일 처리에 실패했습니다')
    } finally {
      setIsUploading(false)
    }
  }

  // ===== LIST =====
  if (viewMode === 'list') {
    const raw = listData?.content || []
    const items = keyword.trim()
      ? raw.filter(f => (f.title || '').toLowerCase().includes(keyword.toLowerCase()))
      : raw
    return (
      <Box>
        <LoadingOverlay open={listFetching || isUploading} message={isUploading ? '엑셀 업로드 중...' : '로딩 중...'} />
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleExcelUpload} />
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>안전보건상 위험정보</Typography>
        {/* PC */}
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
        {/* Mobile */}
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
        {/* Mobile list */}
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

  // ===== DETAIL / EDIT / CREATE =====
  if ((viewMode === 'detail' || viewMode === 'edit') && detailLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
  }

  return (
    <Box>
      <LoadingOverlay open={isProcessing || isEditPending} message={isEditPending ? '로딩 중...' : undefined} />
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>안전보건상 위험정보</Typography>

      {/* 상단 정보 - PC */}
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
          <Typography sx={labelSx}>팀 참여자</Typography>
          <Box sx={valSx}>
            {isEditing ? (
              <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                <TextField size="small" fullWidth multiline value={form.teamMembers || ''} InputProps={{ readOnly: true }} placeholder="조직도에서 선택" />
                <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setMemberModalOpen(true)}>
                  <PersonSearchIcon fontSize="small" />
                </Button>
              </Box>
            ) : <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{displayData.teamMembers || ''}</Typography>}
          </Box>
        </Box>
        {/* 조사일자 */}
        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: dividerColor }}>
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
        {/* 작성자 | 작성일자 */}
        <Box sx={{ display: 'flex' }}>
          <Typography sx={labelSx}>작성자</Typography>
          <Box sx={valBorderSx}>
            <Typography variant="body2">{viewMode === 'create' ? (user?.name || user?.username || '') : (detailData?.createdByName || '')}</Typography>
          </Box>
          <Typography sx={labelSx}>작성일자</Typography>
          <Box sx={valSx}>
            <Typography variant="body2">{viewMode === 'create' ? todayStr() : (detailData?.createdAt?.substring(0, 10) || '')}</Typography>
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
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>팀 참여자</Typography>
          {isEditing ? (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField size="small" fullWidth multiline value={form.teamMembers || ''} InputProps={{ readOnly: true }} placeholder="조직도에서 선택" />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setMemberModalOpen(true)}>
                <PersonSearchIcon fontSize="small" />
              </Button>
            </Box>
          ) : <Typography variant="body2" sx={{ px: 1.5, py: 0.5, whiteSpace: 'pre-wrap' }}>{displayData.teamMembers || ''}</Typography>}
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
          <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{viewMode === 'create' ? (user?.name || user?.username || '') : (detailData?.createdByName || '')}</Typography>
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>작성일자</Typography>
          <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{viewMode === 'create' ? todayStr() : (detailData?.createdAt?.substring(0, 10) || '')}</Typography>
        </Box>
      </Box>

      {/* 항목 테이블 */}
      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 1600 }}>
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
                <TableCell sx={{ ...hSx, minWidth: 140 }} rowSpan={2}>공정/활동</TableCell>
                <TableCell sx={hSx} align="center" colSpan={2}>기계·기구·설비</TableCell>
                <TableCell sx={hSx} align="center" colSpan={3}>유해화학물질</TableCell>
                <TableCell sx={hSx} align="center" colSpan={6}>근로자 구성 및 경력특성</TableCell>
                <TableCell sx={hSx} align="center" colSpan={3}>교대작업 유무 및 형태</TableCell>
                <TableCell sx={hSx} align="center" colSpan={3}>중량물 취급</TableCell>
                <TableCell sx={hSx} align="center" rowSpan={2}>허가작업</TableCell>
                <TableCell sx={hSx} align="center" rowSpan={2}>특별교육</TableCell>
                {isEditing && <TableCell sx={{ ...hSx, width: 64, px: 0.5 }} align="center" rowSpan={2}>관리</TableCell>}
              </TableRow>
              <TableRow>
                <TableCell sx={{ ...hSx, minWidth: 130 }}>명칭</TableCell>
                <TableCell sx={hSx} align="center" width={60}>수량</TableCell>
                <TableCell sx={{ ...hSx, minWidth: 120 }}>화학물질명</TableCell>
                <TableCell sx={hSx} align="center" width={80}>취급량/일</TableCell>
                <TableCell sx={hSx} align="center" width={80}>노출시간</TableCell>
                {[1, 2, 3, 4, 5, 6].map(n => <TableCell key={`wc${n}`} sx={hSx} align="center" width={36}>{n}</TableCell>)}
                {[1, 2, 3].map(n => <TableCell key={`sw${n}`} sx={hSx} align="center" width={36}>{n}</TableCell>)}
                {[1, 2, 3].map(n => <TableCell key={`hl${n}`} sx={hSx} align="center" width={36}>{n}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {(() => {
                const items = displayData.items || []
                const getPk = (i: number) => (items[i] as any)?._pk
                // 키 기반 그룹 머지 (값이 비어도 같은 키면 머지)
                const procSpan = (i: number): { render: boolean; span: number } => {
                  if (i > 0 && getPk(i) && getPk(i) === getPk(i - 1)) return { render: false, span: 0 }
                  // 키 없을 시(상세 모드) 값 기반 폴백
                  if (i > 0 && !getPk(i) && (items[i].processActivity || '') !== '' && (items[i].processActivity || '') === (items[i - 1].processActivity || '')) return { render: false, span: 0 }
                  const pk = getPk(i)
                  const val = items[i].processActivity || ''
                  let span = 1
                  for (let k = i + 1; k < items.length; k++) {
                    if (pk ? getPk(k) === pk : (val !== '' && (items[k].processActivity || '') === val)) span++
                    else break
                  }
                  return { render: true, span }
                }
                return items.map((it, i) => {
                  const ps = procSpan(i)
                  return (
                <TableRow key={i}>
                  {ps.render && (
                    <TableCell rowSpan={ps.span} sx={{ verticalAlign: 'top' }}>
                      {isEditing ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <TextField size="small" fullWidth value={it.processActivity || ''} onChange={e => updateItem(i, { processActivity: e.target.value })} />
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addItemInGroup(i)} sx={{ fontSize: '0.7rem', minWidth: 'auto', px: 1, whiteSpace: 'nowrap' }}>행 추가</Button>
                          </Box>
                        </Box>
                      ) : it.processActivity}
                    </TableCell>
                  )}
                  <TableCell>{isEditing ? <TextField size="small" fullWidth value={it.machineName || ''} onChange={e => updateItem(i, { machineName: e.target.value })} /> : it.machineName}</TableCell>
                  <TableCell align="center">{isEditing ? <TextField size="small" type="number" value={it.machineQty ?? ''} onChange={e => updateItem(i, { machineQty: e.target.value ? Number(e.target.value) : undefined })} sx={{ width: 60 }} /> : it.machineQty}</TableCell>
                  <TableCell>{isEditing ? <TextField size="small" fullWidth value={it.chemicalName || ''} onChange={e => updateItem(i, { chemicalName: e.target.value })} /> : it.chemicalName}</TableCell>
                  <TableCell align="center">{isEditing ? <TextField size="small" value={it.chemicalQty || ''} onChange={e => updateItem(i, { chemicalQty: e.target.value })} sx={{ width: 80 }} /> : it.chemicalQty}</TableCell>
                  <TableCell align="center">{isEditing ? <TextField size="small" value={it.exposureTime || ''} onChange={e => updateItem(i, { exposureTime: e.target.value })} sx={{ width: 80 }} /> : it.exposureTime}</TableCell>
                  {([1, 2, 3, 4, 5, 6] as const).map(n => {
                    const key = `workerComp${n}` as keyof SafetyHazardItem
                    return <TableCell key={`wc${n}`} align="center" sx={{ p: 0.5 }}><Checkbox size="small" disabled={!isEditing} checked={!!it[key]} onChange={e => updateItem(i, { [key]: e.target.checked } as any)} /></TableCell>
                  })}
                  {([1, 2, 3] as const).map(n => {
                    const key = `shiftWork${n}` as keyof SafetyHazardItem
                    return <TableCell key={`sw${n}`} align="center" sx={{ p: 0.5 }}><Checkbox size="small" disabled={!isEditing} checked={!!it[key]} onChange={e => updateItem(i, { [key]: e.target.checked } as any)} /></TableCell>
                  })}
                  {([1, 2, 3] as const).map(n => {
                    const key = `heavyLoad${n}` as keyof SafetyHazardItem
                    return <TableCell key={`hl${n}`} align="center" sx={{ p: 0.5 }}><Checkbox size="small" disabled={!isEditing} checked={!!it[key]} onChange={e => updateItem(i, { [key]: e.target.checked } as any)} /></TableCell>
                  })}
                  <TableCell align="center">{isEditing ? <TextField size="small" value={it.permitWork || ''} onChange={e => updateItem(i, { permitWork: e.target.value })} sx={{ width: 60 }} /> : it.permitWork}</TableCell>
                  <TableCell align="center">{isEditing ? <TextField size="small" value={it.specialTraining || ''} onChange={e => updateItem(i, { specialTraining: e.target.value })} sx={{ width: 60 }} /> : it.specialTraining}</TableCell>
                  {isEditing && <TableCell align="center" sx={{ width: 64, px: 0.5 }}><IconButton size="small" color="error" onClick={() => removeItem(i)}><DeleteIcon fontSize="small" /></IconButton></TableCell>}
                </TableRow>
                  )
                })
              })()}
            </TableBody>
          </Table>
        </TableContainer>
        {isEditing && (
          <Box sx={{ p: 1.5 }}>
            <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={addItem}>행 추가</Button>
          </Box>
        )}
      </Paper>

      {/* 하단 버튼 - PC */}
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
      {/* 하단 버튼 - Mobile */}
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

      {/* 모달 */}
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
      <DeptUserMultiSelectModal
        open={memberModalOpen}
        onClose={() => setMemberModalOpen(false)}
        title="팀 참여자 선택"
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
        onConfirm={(dept: string) => {
          setDeptModalOpen(false)
          setForm(f => ({ ...f, departmentName: dept }))
        }}
      />
    </Box>
  )
}

export default SafetyHazardInfoPage
