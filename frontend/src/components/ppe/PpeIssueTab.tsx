import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, TextField, Select, MenuItem,
  FormControl, Chip, Pagination, Alert, IconButton, Grid,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import UserSelectModal, { UserInfo } from '../common/UserSelectModal'
import DepartmentSelectModal from '../common/DepartmentSelectModal'
import ListSearchBar from '../common/ListSearchBar'
import DatePickerField from '../common/DatePickerField'
import NumberField from '../common/NumberField'
import LoadingOverlay from '../common/LoadingOverlay'
import SignaturePad from '../common/SignaturePad'
import SignatureImage from '../common/SignatureImage'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import { isSystemAdmin } from '../../utils/auth'
import { formatDateTime, todayStr } from '../../utils/dateDefaults'
import { formatUserName } from '../../utils/userDisplay'
import useCodeMap from '../../hooks/useCodeMap'
import { ppeIssueApi, ppeItemApi } from '../../api/ppeApi'
import { PpeIssue, PpeIssueRequest } from '../../types/ppe.types'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const STATUS_COLOR: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
  ISSUED: 'success', RETURNED: 'info', REPLACE: 'warning', LOSS: 'error',
}

const labelSx = {
  width: 160, minWidth: 160, fontWeight: 'bold', bgcolor: 'grey.100',
  px: 2, py: 1.5, borderRight: 1,
  borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider',
  display: 'flex', alignItems: 'center', fontSize: '0.875rem',
  justifyContent: 'center', wordBreak: 'keep-all' as const, textAlign: 'center',
}
const valueSx = { flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem' }
const valueBorderSx = {
  ...valueSx, borderRight: 1,
  borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider',
}
const rowSx = {
  display: 'flex', borderBottom: 1,
  borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider',
}

const emptyForm: PpeIssueRequest = {
  issueDate: todayStr(), workerName: '', empId: '', department: '',
  itemId: undefined, itemName: '', quantity: 1, issueReason: 'NEW',
  returnDate: undefined, status: 'ISSUED', signed: false, note: '',
}

const PpeIssueTab: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()
  const { user } = useAuth()
  const isAdmin = isSystemAdmin(user)

  // 코드 시스템에서 조회 (하드코딩 제거)
  const { codeList: reasonCodes, getLabel: getReasonLabel } = useCodeMap('PPE_ISSUE_REASON')
  const { codeList: statusCodes, getLabel: getStatusLabel } = useCodeMap('PPE_ISSUE_STATUS')

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selected, setSelected] = useState<PpeIssue | null>(null)
  const [form, setForm] = useState<PpeIssueRequest>({ ...emptyForm })
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [searchText, setSearchText] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showWorkerModal, setShowWorkerModal] = useState(false)
  const [showDeptModal, setShowDeptModal] = useState(false)
  const pageSize = 10

  const handleWorkerSelect = (users: UserInfo[]) => {
    if (users.length > 0) {
      const u = users[0]
      setForm({ ...form, workerName: u.name, empId: (u as any).empNo || (u as any).empId || '', department: u.department || '' })
    }
    setShowWorkerModal(false)
  }
  const handleDeptSelect = (deptName: string) => {
    setForm({ ...form, department: deptName })
    setShowDeptModal(false)
  }

  const queryKey = ['ppeIssues', searchText, deptFilter, statusFilter, page]
  const queryFn = () => {
    if (searchText) return ppeIssueApi.search(searchText, page, pageSize)
    if (statusFilter) return ppeIssueApi.getByStatus(statusFilter, page, pageSize)
    if (deptFilter) return ppeIssueApi.getByDepartment(deptFilter, page, pageSize)
    return ppeIssueApi.getAll(page, pageSize)
  }
  const { data, isLoading } = useQuery({ queryKey, queryFn, enabled: viewMode === 'list' })
  const { data: kpi } = useQuery({ queryKey: ['ppeIssueKpi'], queryFn: ppeIssueApi.getKpi })
  const { data: itemList } = useQuery({ queryKey: ['ppeItemsForIssue'], queryFn: () => ppeItemApi.getAll(0, 200) })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['ppeIssues'] })
    qc.invalidateQueries({ queryKey: ['ppeIssueKpi'] })
  }
  const createMut = useMutation({
    mutationFn: (req: PpeIssueRequest) => ppeIssueApi.create(req),
    onSuccess: () => { invalidate(); showSuccess(t('common.saved', '저장되었습니다.')); handleBack() },
    onError: () => showError(t('common.error', '오류가 발생했습니다.')),
  })
  const updateMut = useMutation({
    mutationFn: ({ id, req }: { id: number; req: PpeIssueRequest }) => ppeIssueApi.update(id, req),
    onSuccess: () => { invalidate(); showSuccess(t('common.saved', '저장되었습니다.')); handleBack() },
  })
  const deleteMut = useMutation({
    mutationFn: (id: number) => ppeIssueApi.delete(id),
    onSuccess: () => { invalidate(); showSuccess(t('common.deleted', '삭제되었습니다.')); handleBack() },
  })
  const statusActionMut = useMutation({
    mutationFn: async ({ id, action, who }: { id: number; action: 'return' | 'replace' | 'loss'; who: any }) => {
      if (action === 'return') return ppeIssueApi.returnItem(id, who)
      if (action === 'replace') return ppeIssueApi.replaceRequest(id, who)
      return ppeIssueApi.lossReport(id, who)
    },
    onSuccess: (_, vars) => {
      invalidate()
      const msg = vars.action === 'return' ? '반납 처리되었습니다.' : vars.action === 'replace' ? '교체 요청되었습니다.' : '분실 신고되었습니다.'
      showSuccess(msg); handleBack()
    },
  })
  const isProcessing = createMut.isPending || updateMut.isPending || deleteMut.isPending || statusActionMut.isPending

  const handleBack = () => { setViewMode('list'); setSelected(null); setForm({ ...emptyForm }) }
  const handleCancel = () => { if (viewMode === 'edit') { setViewMode('detail'); setForm({ ...emptyForm }) } else handleBack() }
  const handleRowClick = (item: PpeIssue) => { setSelected(item); setViewMode('detail') }
  const handleAdd = () => { setSelected(null); setForm({ ...emptyForm, issueDate: todayStr() }); setViewMode('create') }
  const handleEdit = () => {
    if (!selected) return
    setForm({
      issueDate: selected.issueDate, workerName: selected.workerName, empId: selected.empId,
      department: selected.department, itemId: selected.itemId, itemName: selected.itemName,
      quantity: selected.quantity, issueReason: selected.issueReason,
      returnDate: selected.returnDate, status: selected.status, signed: selected.signed, note: selected.note,
    })
    setViewMode('edit')
  }

  const personRef = () => ({
    modifiedByUserId: (user as any)?.id, modifiedByName: user?.name,
    modifiedByTeam: (user as any)?.team, modifiedByPosition: (user as any)?.position,
  })
  const fillPersonRef = (req: PpeIssueRequest, isCreate: boolean): PpeIssueRequest => isCreate
    ? { ...req, createdByUserId: (user as any)?.id, createdByName: user?.name, createdByTeam: (user as any)?.team, createdByPosition: (user as any)?.position, ...personRef() }
    : { ...req, ...personRef() }

  const handleSave = async () => {
    if (!form.workerName?.trim()) { showError(t('ppe.issue.requireWorker', '근로자명을 입력하세요.')); return }
    if (!form.itemName?.trim()) { showError(t('ppe.issue.requireItem', '품목을 선택하세요.')); return }
    const ok = await showConfirm(t('common.confirmSave', '저장하시겠습니까?'))
    if (!ok) return
    if (viewMode === 'edit' && selected) updateMut.mutate({ id: selected.id, req: fillPersonRef(form, false) })
    else createMut.mutate(fillPersonRef(form, true))
  }
  const handleDelete = async () => {
    if (!selected) return
    const ok = await showConfirm(t('common.confirmDelete', '삭제하시겠습니까?'))
    if (ok) deleteMut.mutate(selected.id)
  }
  const handleStatusAction = async (action: 'return' | 'replace' | 'loss') => {
    if (!selected) return
    const msg = action === 'return' ? '반납 처리하시겠습니까?' : action === 'replace' ? '교체 요청 처리하시겠습니까?' : '분실 신고 처리하시겠습니까?'
    const ok = await showConfirm(msg)
    if (ok) statusActionMut.mutate({ id: selected.id, action, who: personRef() })
  }

  const applySearch = () => { setSearchText(searchInput); setPage(0) }
  const handleResetSearch = () => { setSearchInput(''); setSearchText(''); setDeptFilter(''); setStatusFilter(''); setPage(0) }

  const KpiPaper = ({ label, value, color }: { label: string; value: number | string; color: string }) => (
    <Paper sx={(theme: any) => ({
      p: 2.5, pl: 3, position: 'relative', overflow: 'hidden',
      ...(theme.isYesco && { border: 1, borderColor: '#0F2147' }),
      '&::before': {
        content: '""', position: 'absolute', top: 0, bottom: 0, left: 0,
        width: 4, backgroundColor: theme.isYesco ? '#E60012' : color,
        borderTopLeftRadius: 'inherit', borderBottomLeftRadius: 'inherit',
      },
    })}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="h6" fontWeight="bold" sx={{ mt: 0.5 }}>{value ?? '-'}</Typography>
    </Paper>
  )

  // ── LIST ──
  if (viewMode === 'list') {
    const items = data?.content || []
    const totalPages = data?.totalPages || 0

    return (
      <Box sx={{ position: 'relative' }}>
        <LoadingOverlay open={isProcessing || isLoading} />

        {/* KPI */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6} md={3}><KpiPaper label={t('ppe.issue.kpiTotal', '총 지급')} value={kpi?.totalIssues ?? '-'} color="#2563eb" /></Grid>
          <Grid item xs={6} md={3}><KpiPaper label={t('ppe.issue.kpiReturn', '반납 완료')} value={kpi?.returnedCount ?? '-'} color="#2563eb" /></Grid>
          <Grid item xs={6} md={3}><KpiPaper label={t('ppe.issue.kpiReplace', '교체 요청')} value={kpi?.replaceRequestCount ?? '-'} color="#2563eb" /></Grid>
          <Grid item xs={6} md={3}><KpiPaper label={t('ppe.issue.kpiLoss', '분실 신고')} value={kpi?.lossReportCount ?? '-'} color="#2563eb" /></Grid>
        </Grid>

        {/* PC Toolbar */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <ListSearchBar placeholder={t('ppe.issue.searchPh', '근로자·부서·품목')}
              value={searchInput} onChange={setSearchInput} onSearch={applySearch}
              sx={{ minWidth: 240 }} />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select displayEmpty value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}>
                <MenuItem value="">{t('ppe.issue.allStatus', '전체 상태')}</MenuItem>
                {statusCodes.map(c => <MenuItem key={c.code} value={c.code}>{getStatusLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
            <IconButton onClick={handleResetSearch} size="small"><RefreshIcon /></IconButton>
          </Box>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAdd}>New</Button>
        </Box>

        {/* Mobile Toolbar */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
          <ListSearchBar fullWidth placeholder={t('ppe.issue.searchPh', '근로자·부서·품목')}
            value={searchInput} onChange={setSearchInput} onSearch={applySearch} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl size="small" sx={{ flex: 1 }}>
              <Select displayEmpty value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}>
                <MenuItem value="">{t('ppe.issue.allStatus', '전체 상태')}</MenuItem>
                {statusCodes.map(c => <MenuItem key={c.code} value={c.code}>{getStatusLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
            <IconButton onClick={handleResetSearch} size="small"><RefreshIcon /></IconButton>
          </Box>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAdd} fullWidth>New</Button>
        </Box>

        {/* Table — 로딩은 상단 LoadingOverlay 사용 */}
        {items.length === 0 ? (
          <Alert severity="info" sx={{ m: 2 }}>{t('common.noData', '데이터가 없습니다.')}</Alert>
        ) : (
          <>
            <Paper sx={{ display: { xs: 'none', md: 'block' }, overflow: 'hidden', borderRadius: 1 }}>
              <TableContainer>
                <Table size="small" stickyHeader sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
                  <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 'bold', borderRight: '1px solid', borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }, '& th:last-child': { borderRight: 'none' } }}>
                      <TableCell align="center">{t('ppe.issue.date', '지급일')}</TableCell>
                      <TableCell align="center">{t('ppe.issue.worker', '근로자')}</TableCell>
                      <TableCell align="center">{t('ppe.issue.dept', '부서')}</TableCell>
                      <TableCell align="center">{t('ppe.issue.item', '품목')}</TableCell>
                      <TableCell align="center">{t('ppe.issue.qty', '수량')}</TableCell>
                      <TableCell align="center">{t('ppe.issue.reason', '지급사유')}</TableCell>
                      <TableCell align="center">{t('ppe.issue.returnDate', '반납예정')}</TableCell>
                      <TableCell align="center">{t('ppe.issue.status', '상태')}</TableCell>
                      <TableCell align="center">{t('ppe.issue.signed', '서명')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((it) => (
                      <TableRow key={it.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(it)}>
                        <TableCell align="center">{it.issueDate || '-'}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>{it.workerName || '-'}</TableCell>
                        <TableCell align="center">{it.department || '-'}</TableCell>
                        <TableCell align="center">{it.itemName || '-'}</TableCell>
                        <TableCell align="center">{it.quantity ?? '-'}</TableCell>
                        <TableCell align="center"><Chip size="small" label={getReasonLabel(it.issueReason || '') || '-'} variant="outlined" /></TableCell>
                        <TableCell align="center">{it.returnDate || '-'}</TableCell>
                        <TableCell align="center">
                          {it.status ? <Chip size="small" label={getStatusLabel(it.status)} color={STATUS_COLOR[it.status] || 'default'} /> : '-'}
                        </TableCell>
                        <TableCell align="center">
                          <Chip size="small" label={it.signed ? '완료' : '미서명'} color={it.signed ? 'success' : 'error'} variant="outlined" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
            {/* Mobile card list */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
              {items.map((it) => (
                <Paper key={it.id} sx={{ p: 2, border: 1, borderColor: 'divider', cursor: 'pointer' }} onClick={() => handleRowClick(it)}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography fontWeight="bold">{it.workerName || '-'}</Typography>
                    {it.status && <Chip size="small" label={getStatusLabel(it.status)} color={STATUS_COLOR[it.status] || 'default'} />}
                  </Box>
                  <Typography variant="body2" color="text.secondary">{it.issueDate || '-'} | {it.department || '-'}</Typography>
                  <Typography variant="body2" color="text.secondary">{it.itemName || '-'} | {it.quantity ?? '-'}개</Typography>
                </Paper>
              ))}
            </Box>
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Pagination count={totalPages} page={page + 1} onChange={(_, p) => setPage(p - 1)} />
              </Box>
            )}
          </>
        )}
      </Box>
    )
  }

  // ── DETAIL / CREATE / EDIT ──
  const isEdit = viewMode === 'edit' || viewMode === 'create'
  const v: any = isEdit ? form : (selected || {})
  const items = itemList?.content || []

  return (
    <Box sx={{ position: 'relative' }}>
      <LoadingOverlay open={isProcessing} />

      <Paper sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
        <Box sx={rowSx}>
          <Typography sx={labelSx}>
            {t('ppe.issue.date', '지급일')}
            {isEdit && <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>}
          </Typography>
          {isEdit ? (
            <Box sx={valueBorderSx}>
              <DatePickerField value={form.issueDate || null} onChange={(d) => setForm({ ...form, issueDate: d || undefined })} />
            </Box>
          ) : <Box sx={valueBorderSx}>{v.issueDate || '-'}</Box>}
          <Typography sx={labelSx}>{t('ppe.issue.status', '상태')}</Typography>
          {isEdit ? (
            <Box sx={valueSx}>
              <Select fullWidth size="small" value={form.status || 'ISSUED'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {statusCodes.map(c => <MenuItem key={c.code} value={c.code}>{getStatusLabel(c.code)}</MenuItem>)}
              </Select>
            </Box>
          ) : <Box sx={valueSx}>{v.status ? <Chip size="small" label={getStatusLabel(v.status)} color={STATUS_COLOR[v.status] || 'default'} /> : '-'}</Box>}
        </Box>

        {/* 행: 근로자 / 부서 */}
        <Box sx={rowSx}>
          <Typography sx={labelSx}>
            {t('ppe.issue.worker', '근로자')}
            {isEdit && <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>}
          </Typography>
          {isEdit ? (
            <Box sx={{ ...valueBorderSx, display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField fullWidth size="small" value={form.workerName || ''} InputProps={{ readOnly: true }}
                placeholder={t('common.selectFromOrg', '조직도에서 선택') as string} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setShowWorkerModal(true)}>
                <PersonSearchIcon fontSize="small" />
              </Button>
            </Box>
          ) : <Box sx={valueBorderSx}>{v.workerName || '-'}</Box>}
          <Typography sx={labelSx}>{t('ppe.issue.dept', '부서')}</Typography>
          {isEdit ? (
            <Box sx={{ ...valueSx, display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField fullWidth size="small" value={form.department || ''} InputProps={{ readOnly: true }}
                placeholder={t('common.selectDept', '부서 선택') as string} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setShowDeptModal(true)}>
                <PersonSearchIcon fontSize="small" />
              </Button>
            </Box>
          ) : <Box sx={valueSx}>{v.department || '-'}</Box>}
        </Box>

        {/* 행: 품목 / 수량 */}
        <Box sx={rowSx}>
          <Typography sx={labelSx}>
            {t('ppe.issue.item', '품목')}
            {isEdit && <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>}
          </Typography>
          {isEdit ? (
            <Box sx={valueBorderSx}>
              <Select fullWidth size="small" value={form.itemId ?? ''} displayEmpty
                onChange={(e) => {
                  const id = e.target.value as number
                  const item = items.find(i => i.id === id)
                  setForm({ ...form, itemId: id, itemName: item?.name })
                }}>
                <MenuItem value="" sx={{ fontStyle: 'normal' }}>{t('common.select', '선택하세요')}</MenuItem>
                {items.map(i => <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>)}
              </Select>
            </Box>
          ) : <Box sx={valueBorderSx}>{v.itemName || '-'}</Box>}
          <Typography sx={labelSx}>{t('ppe.issue.qty', '수량')}</Typography>
          <Box sx={valueSx}>
            <NumberField value={isEdit ? form.quantity : v.quantity} readOnly={!isEdit}
              onChange={(n) => setForm({ ...form, quantity: n ?? 1 })} min={1} />
          </Box>
        </Box>

        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('ppe.issue.reason', '지급 사유')}</Typography>
          {isEdit ? (
            <Box sx={valueBorderSx}>
              <Select fullWidth size="small" value={form.issueReason || 'NEW'} onChange={(e) => setForm({ ...form, issueReason: e.target.value })}>
                {reasonCodes.map(c => <MenuItem key={c.code} value={c.code}>{getReasonLabel(c.code)}</MenuItem>)}
              </Select>
            </Box>
          ) : <Box sx={valueBorderSx}>{getReasonLabel(v.issueReason || '') || '-'}</Box>}
          <Typography sx={labelSx}>{t('ppe.issue.returnDate', '반납 예정일')}</Typography>
          {isEdit ? (
            <Box sx={valueSx}>
              <DatePickerField value={form.returnDate || null} onChange={(d) => setForm({ ...form, returnDate: d || undefined })} />
            </Box>
          ) : <Box sx={valueSx}>{v.returnDate || '-'}</Box>}
        </Box>

        {/* 서명 — SignaturePad(입력) / SignatureImage(조회) */}
        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('ppe.issue.signature', '서명')}</Typography>
          {isEdit ? (
            <Box sx={{ ...valueSx, p: 1.5 }}>
              <SignaturePad
                value={form.signatureImage || ''}
                onChange={(dataUrl) => setForm({ ...form, signatureImage: dataUrl, signed: !!dataUrl })}
                height={80}
              />
            </Box>
          ) : (
            <Box sx={{ ...valueSx, py: 1 }}>
              {v.signatureImage ? (
                <SignatureImage src={v.signatureImage} maxHeight={80} />
              ) : (
                <Chip size="small" label={t('ppe.issue.notSigned', '미서명')} color="error" variant="outlined" />
              )}
            </Box>
          )}
        </Box>

        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('common.note', '비고')}</Typography>
          {isEdit ? (
            <Box sx={{ ...valueSx, p: 1 }}>
              <TextField fullWidth size="small" multiline minRows={2} value={form.note || ''} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </Box>
          ) : <Box sx={valueSx}>{v.note || '-'}</Box>}
        </Box>

        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('common.createdBy', '작성자')}</Typography>
          <Box sx={valueBorderSx}>
            {viewMode === 'create'
              ? formatUserName((user as any)?.team, user?.name, (user as any)?.position) || '-'
              : formatUserName(selected?.createdByTeam, selected?.createdByName, selected?.createdByPosition) || '-'}
          </Box>
          <Typography sx={labelSx}>작성일자</Typography>
          <Box sx={valueSx}>
            {viewMode === 'create' ? '' : formatDateTime(selected?.createdAt)}
          </Box>
        </Box>
        {(viewMode === 'edit' || viewMode === 'detail') && (
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('common.modifiedBy', '수정자')}</Typography>
            <Box sx={valueBorderSx}>
              {viewMode === 'edit'
                ? formatUserName((user as any)?.team, user?.name, (user as any)?.position) || '-'
                : formatUserName(selected?.modifiedByTeam, selected?.modifiedByName, selected?.modifiedByPosition) || '-'}
            </Box>
            <Typography sx={labelSx}>수정일자</Typography>
            <Box sx={valueSx}>
              {viewMode === 'edit' ? '' : formatDateTime(selected?.modifiedAt)}
            </Box>
          </Box>
        )}
      </Paper>

      {/* Mobile Create/Edit */}
      {isEdit && (
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.issue.date', '지급일')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography></Typography>
            <DatePickerField value={form.issueDate || null} onChange={(d) => setForm({ ...form, issueDate: d || undefined })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.issue.status', '상태')}</Typography>
            <Select fullWidth size="small" value={form.status || 'ISSUED'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {statusCodes.map(c => <MenuItem key={c.code} value={c.code}>{getStatusLabel(c.code)}</MenuItem>)}
            </Select>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.issue.worker', '근로자')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography></Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField fullWidth size="small" value={form.workerName || ''} InputProps={{ readOnly: true }} placeholder={t('common.selectFromOrg', '조직도에서 선택') as string} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setShowWorkerModal(true)}><PersonSearchIcon fontSize="small" /></Button>
            </Box>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.issue.dept', '부서')}</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField fullWidth size="small" value={form.department || ''} InputProps={{ readOnly: true }} placeholder={t('common.selectDept', '부서 선택') as string} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setShowDeptModal(true)}><PersonSearchIcon fontSize="small" /></Button>
            </Box>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.issue.item', '품목')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography></Typography>
            <Select fullWidth size="small" value={form.itemId ?? ''} displayEmpty
              onChange={(e) => {
                const id = e.target.value as number
                const item = items.find(i => i.id === id)
                setForm({ ...form, itemId: id, itemName: item?.name })
              }}>
              <MenuItem value="" sx={{ fontStyle: 'normal' }}>{t('common.select', '선택하세요')}</MenuItem>
              {items.map(i => <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>)}
            </Select>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.issue.qty', '수량')}</Typography>
            <NumberField value={form.quantity} onChange={(n) => setForm({ ...form, quantity: n ?? 1 })} min={1} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.issue.reason', '지급 사유')}</Typography>
            <Select fullWidth size="small" value={form.issueReason || 'NEW'} onChange={(e) => setForm({ ...form, issueReason: e.target.value })}>
              {reasonCodes.map(c => <MenuItem key={c.code} value={c.code}>{getReasonLabel(c.code)}</MenuItem>)}
            </Select>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.issue.returnDate', '반납 예정일')}</Typography>
            <DatePickerField value={form.returnDate || null} onChange={(d) => setForm({ ...form, returnDate: d || undefined })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.issue.signature', '서명')}</Typography>
            <SignaturePad value={form.signatureImage || ''} onChange={(dataUrl) => setForm({ ...form, signatureImage: dataUrl, signed: !!dataUrl })} height={80} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.note', '비고')}</Typography>
            <TextField fullWidth size="small" multiline minRows={2} value={form.note || ''} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.createdBy', '작성자')}</Typography>
            <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>
              {viewMode === 'create'
                ? formatUserName((user as any)?.team, user?.name, (user as any)?.position) || '-'
                : formatUserName(selected?.createdByTeam, selected?.createdByName, selected?.createdByPosition) || '-'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>작성일자</Typography>
            <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{viewMode === 'create' ? '' : formatDateTime(selected?.createdAt)}</Typography>
          </Box>
          {viewMode === 'edit' && (
            <>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.modifiedBy', '수정자')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{formatUserName((user as any)?.team, user?.name, (user as any)?.position) || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>수정일자</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}></Typography>
              </Box>
            </>
          )}
        </Box>
      )}

      {/* Mobile Detail */}
      {viewMode === 'detail' && (
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5, mb: 2 }}>
          {([
            [t('ppe.issue.date', '지급일'), v.issueDate || '-'],
            [t('ppe.issue.worker', '근로자'), v.workerName || '-'],
            [t('ppe.issue.dept', '부서'), v.department || '-'],
            [t('ppe.issue.item', '품목'), v.itemName || '-'],
            [t('ppe.issue.qty', '수량'), String(v.quantity ?? '-')],
            [t('ppe.issue.reason', '지급사유'), getReasonLabel(v.issueReason || '') || '-'],
            [t('ppe.issue.returnDate', '반납 예정'), v.returnDate || '-'],
            [t('ppe.issue.status', '상태'), v.status ? (getStatusLabel(v.status) || '-') : '-'],
            [t('ppe.issue.signed', '서명'), v.signed ? '완료' : '미서명'],
            [t('common.notes', '비고'), v.note || '-'],
            [t('common.createdBy', '작성자'), formatUserName(v.createdByTeam, v.createdByName, v.createdByPosition) || '-'],
            ['작성일자', v.createdAt ? formatDateTime(v.createdAt) : '-'],
            [t('common.modifier', '수정자'), formatUserName(v.modifiedByTeam, v.modifiedByName, v.modifiedByPosition) || '-'],
            ['수정일자', v.modifiedAt ? formatDateTime(v.modifiedAt) : '-'],
          ] as Array<[string, string]>).map(([label, value], i) => (
            <Box key={i}>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{label}</Typography>
              <Typography variant="body2" sx={{ px: 1.5, py: 0.5, whiteSpace: 'pre-wrap' }}>{value}</Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* 액션 버튼 — 기본 크기 */}
      <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' }, gap: 1, mt: 2, flexWrap: 'wrap', '& > .MuiButton-root': { flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } } }}>
        <Button variant="outlined" onClick={handleCancel}>{viewMode === 'detail' ? t('common.list', '목록') : t('common.cancel', '취소')}</Button>
        {viewMode === 'detail' && (
          <>
            <Button variant="contained" onClick={() => handleStatusAction('return')}>
              {t('ppe.issue.actionReturn', '반납')}
            </Button>
            <Button variant="contained" onClick={() => handleStatusAction('replace')}>
              {t('ppe.issue.actionReplace', '교체 요청')}
            </Button>
            <Button variant="contained" onClick={() => handleStatusAction('loss')}>
              {t('ppe.issue.actionLoss', '분실 신고')}
            </Button>
            {isAdmin && (
              <>
                <Button variant="contained" onClick={handleEdit}>{t('common.edit', '수정')}</Button>
                <Button variant="contained" color="error" onClick={handleDelete}>{t('common.delete', '삭제')}</Button>
              </>
            )}
          </>
        )}
        {isEdit && (
          <Button variant="contained" onClick={handleSave}>{t('common.save', '저장')}</Button>
        )}
      </Box>

      {/* 근로자 선택 모달 */}
      <UserSelectModal
        open={showWorkerModal}
        onClose={() => setShowWorkerModal(false)}
        selectedUsers={[]}
        singleSelect
        useCompanyTree
        onConfirm={handleWorkerSelect}
        title={t('ppe.issue.selectWorker', '근로자 선택') as string}
      />

      {/* 부서 선택 모달 */}
      <DepartmentSelectModal
        open={showDeptModal}
        onClose={() => setShowDeptModal(false)}
        onConfirm={handleDeptSelect}
        initialDepartment={form.department || ''}
        title={t('ppe.issue.selectDept', '부서 선택') as string}
      />
    </Box>
  )
}

export default PpeIssueTab
