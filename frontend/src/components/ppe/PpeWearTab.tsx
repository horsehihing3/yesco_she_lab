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
import LoadingOverlay from '../common/LoadingOverlay'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import { isSystemAdmin } from '../../utils/auth'
import { formatDateTime } from '../../utils/dateDefaults'
import { formatUserName } from '../../utils/userDisplay'
import useCodeMap from '../../hooks/useCodeMap'
import { ppeWearApi } from '../../api/ppeApi'
import { PpeWear, PpeWearRequest } from '../../types/ppe.types'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const STATUS_COLOR: Record<string, 'success' | 'warning' | 'error'> = {
  OK: 'success', IMPROPER: 'warning', VIOLATION: 'error',
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

const todayDate = () => new Date().toISOString().slice(0, 10)

const emptyForm: PpeWearRequest = {
  checkDatetime: todayDate(), workerName: '', department: '',
  workZone: '', requiredPpe: '', wearStatus: 'OK', checker: '', actionTaken: '', note: '',
}

const PpeWearTab: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()
  const { user } = useAuth()
  const isAdmin = isSystemAdmin(user)

  const { codeList: statusCodes, getLabel: getStatusLabel } = useCodeMap('PPE_WEAR_STATUS')

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selected, setSelected] = useState<PpeWear | null>(null)
  const [form, setForm] = useState<PpeWearRequest>({ ...emptyForm })
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [searchText, setSearchText] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showWorkerModal, setShowWorkerModal] = useState(false)
  const [showCheckerModal, setShowCheckerModal] = useState(false)
  const [showDeptModal, setShowDeptModal] = useState(false)
  const pageSize = 10

  const handleWorkerSelect = (users: UserInfo[]) => {
    if (users.length > 0) {
      const u = users[0]
      setForm({ ...form, workerName: u.name, department: u.department || form.department })
    }
    setShowWorkerModal(false)
  }
  const handleCheckerSelect = (users: UserInfo[]) => {
    if (users.length > 0) setForm({ ...form, checker: users[0].name })
    setShowCheckerModal(false)
  }
  const handleDeptSelect = (deptName: string) => {
    setForm({ ...form, department: deptName })
    setShowDeptModal(false)
  }

  const queryKey = ['ppeWears', searchText, deptFilter, statusFilter, page]
  const queryFn = () => {
    if (searchText) return ppeWearApi.search(searchText, page, pageSize)
    if (statusFilter) return ppeWearApi.getByStatus(statusFilter, page, pageSize)
    if (deptFilter) return ppeWearApi.getByDepartment(deptFilter, page, pageSize)
    return ppeWearApi.getAll(page, pageSize)
  }
  const { data, isLoading } = useQuery({ queryKey, queryFn, enabled: viewMode === 'list' })
  const { data: kpi } = useQuery({ queryKey: ['ppeWearKpi'], queryFn: ppeWearApi.getKpi })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['ppeWears'] })
    qc.invalidateQueries({ queryKey: ['ppeWearKpi'] })
  }
  const createMut = useMutation({
    mutationFn: (req: PpeWearRequest) => ppeWearApi.create(req),
    onSuccess: () => { invalidate(); showSuccess(t('common.saved', '저장되었습니다.')); handleBack() },
    onError: () => showError(t('common.error', '오류가 발생했습니다.')),
  })
  const updateMut = useMutation({
    mutationFn: ({ id, req }: { id: number; req: PpeWearRequest }) => ppeWearApi.update(id, req),
    onSuccess: () => { invalidate(); showSuccess(t('common.saved', '저장되었습니다.')); handleBack() },
  })
  const deleteMut = useMutation({
    mutationFn: (id: number) => ppeWearApi.delete(id),
    onSuccess: () => { invalidate(); showSuccess(t('common.deleted', '삭제되었습니다.')); handleBack() },
  })
  const isProcessing = createMut.isPending || updateMut.isPending || deleteMut.isPending

  const handleBack = () => { setViewMode('list'); setSelected(null); setForm({ ...emptyForm }) }
  const handleCancel = () => { if (viewMode === 'edit') { setViewMode('detail'); setForm({ ...emptyForm }) } else handleBack() }
  const handleRowClick = (item: PpeWear) => { setSelected(item); setViewMode('detail') }
  const handleAdd = () => { setSelected(null); setForm({ ...emptyForm, checkDatetime: todayDate() }); setViewMode('create') }
  const handleEdit = () => {
    if (!selected) return
    setForm({
      checkDatetime: selected.checkDatetime, workerName: selected.workerName,
      department: selected.department, workZone: selected.workZone,
      requiredPpe: selected.requiredPpe, wearStatus: selected.wearStatus,
      checker: selected.checker, actionTaken: selected.actionTaken, note: selected.note,
    })
    setViewMode('edit')
  }

  const fillPersonRef = (req: PpeWearRequest, isCreate: boolean): PpeWearRequest => isCreate
    ? { ...req,
        createdByUserId: (user as any)?.id, createdByName: user?.name, createdByTeam: (user as any)?.team, createdByPosition: (user as any)?.position,
        modifiedByUserId: (user as any)?.id, modifiedByName: user?.name, modifiedByTeam: (user as any)?.team, modifiedByPosition: (user as any)?.position }
    : { ...req,
        modifiedByUserId: (user as any)?.id, modifiedByName: user?.name, modifiedByTeam: (user as any)?.team, modifiedByPosition: (user as any)?.position }

  const handleSave = async () => {
    if (!form.workerName?.trim()) { showError(t('ppe.wear.requireWorker', '근로자명을 입력하세요.')); return }
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

  if (viewMode === 'list') {
    const items = data?.content || []
    const totalPages = data?.totalPages || 0

    return (
      <Box sx={{ position: 'relative' }}>
        <LoadingOverlay open={isProcessing || isLoading} />

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6} md={3}><KpiPaper label={t('ppe.wear.kpiRate', '이행율')} value={kpi != null ? `${kpi.complianceRate}%` : '-'} color="#2563eb" /></Grid>
          <Grid item xs={6} md={3}><KpiPaper label={t('ppe.wear.kpiCheck', '확인 건수')} value={kpi?.totalCheck ?? '-'} color="#2563eb" /></Grid>
          <Grid item xs={6} md={3}><KpiPaper label={t('ppe.wear.kpiViolation', '미착용')} value={kpi?.violationCount ?? '-'} color="#2563eb" /></Grid>
          <Grid item xs={6} md={3}><KpiPaper label={t('ppe.wear.kpiEdu', '교육 조치')} value={kpi?.educationNeededCount ?? '-'} color="#2563eb" /></Grid>
        </Grid>

        <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <ListSearchBar placeholder={t('ppe.wear.searchPh', '근로자명·작업구역·확인자')}
              value={searchInput} onChange={setSearchInput} onSearch={applySearch}
              sx={{ minWidth: 240 }} />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select displayEmpty value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}>
                <MenuItem value="">{t('ppe.wear.allStatus', '전체 상태')}</MenuItem>
                {statusCodes.map(c => <MenuItem key={c.code} value={c.code}>{getStatusLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
            <IconButton onClick={handleResetSearch} size="small"><RefreshIcon /></IconButton>
          </Box>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAdd}>New</Button>
        </Box>

        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Box sx={{ flex: 1 }}>
              <ListSearchBar fullWidth placeholder={t('ppe.wear.searchPh', '근로자명·작업구역·확인자')}
                value={searchInput} onChange={setSearchInput} onSearch={applySearch} />
            </Box>
            <IconButton onClick={handleResetSearch} size="small"><RefreshIcon /></IconButton>
          </Box>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAdd} fullWidth>New</Button>
        </Box>

        {items.length === 0 ? (
          <Alert severity="info" sx={{ m: 2 }}>{t('common.noData', '데이터가 없습니다.')}</Alert>
        ) : (
          <>
            <Paper sx={{ display: { xs: 'none', md: 'block' }, overflow: 'hidden', borderRadius: 1 }}>
              <TableContainer>
                <Table size="small" stickyHeader sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
                  <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 'bold', borderRight: '1px solid', borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }, '& th:last-child': { borderRight: 'none' } }}>
                      <TableCell align="center">{t('ppe.wear.datetime', '확인일시')}</TableCell>
                      <TableCell align="center">{t('ppe.wear.worker', '근로자')}</TableCell>
                      <TableCell align="center">{t('ppe.wear.dept', '부서')}</TableCell>
                      <TableCell align="center">{t('ppe.wear.zone', '작업구역')}</TableCell>
                      <TableCell align="center">{t('ppe.wear.requiredPpe', '필수 보호구')}</TableCell>
                      <TableCell align="center">{t('ppe.wear.status', '상태')}</TableCell>
                      <TableCell align="center">{t('ppe.wear.checker', '확인자')}</TableCell>
                      <TableCell align="center">{t('common.createdBy', '작성자')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((it) => (
                      <TableRow key={it.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(it)}>
                        <TableCell align="center">{it.checkDatetime ? it.checkDatetime.replace('T', ' ').slice(0, 16) : '-'}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>{it.workerName || '-'}</TableCell>
                        <TableCell align="center">{it.department || '-'}</TableCell>
                        <TableCell align="center">{it.workZone || '-'}</TableCell>
                        <TableCell>{it.requiredPpe || '-'}</TableCell>
                        <TableCell align="center">
                          {it.wearStatus ? <Chip size="small" label={getStatusLabel(it.wearStatus)} color={STATUS_COLOR[it.wearStatus] || 'default'} /> : '-'}
                        </TableCell>
                        <TableCell align="center">{it.checker || '-'}</TableCell>
                        <TableCell align="center">{formatUserName(it.createdByTeam, it.createdByName, it.createdByPosition) || '-'}</TableCell>
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
                    {it.wearStatus && <Chip size="small" label={getStatusLabel(it.wearStatus)} color={STATUS_COLOR[it.wearStatus] || 'default'} />}
                  </Box>
                  <Typography variant="body2" color="text.secondary">{it.checkDatetime ? it.checkDatetime.replace('T', ' ').slice(0, 16) : '-'} | {it.department || '-'}</Typography>
                  <Typography variant="body2" color="text.secondary">{it.workZone || '-'} | {it.requiredPpe || '-'}</Typography>
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

  const isEdit = viewMode === 'edit' || viewMode === 'create'
  const v: any = isEdit ? form : (selected || {})

  return (
    <Box sx={{ position: 'relative' }}>
      <LoadingOverlay open={isProcessing} />

      <Paper sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
        <Box sx={rowSx}>
          <Typography sx={labelSx}>
            {t('ppe.wear.datetime', '확인 일시')}
            {isEdit && <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>}
          </Typography>
          {isEdit ? (
            <Box sx={valueBorderSx}>
              <DatePickerField value={(form.checkDatetime || '').slice(0, 10)}
                onChange={(d) => setForm({ ...form, checkDatetime: d || undefined })} />
            </Box>
          ) : <Box sx={valueBorderSx}>{v.checkDatetime ? (v.checkDatetime.replace('T', ' ').slice(0, 10)) : '-'}</Box>}
          <Typography sx={labelSx}>{t('ppe.wear.status', '착용 상태')}</Typography>
          {isEdit ? (
            <Box sx={valueSx}>
              <Select fullWidth size="small" value={form.wearStatus || 'OK'} onChange={(e) => setForm({ ...form, wearStatus: e.target.value })}>
                {statusCodes.map(c => <MenuItem key={c.code} value={c.code}>{getStatusLabel(c.code)}</MenuItem>)}
              </Select>
            </Box>
          ) : <Box sx={valueSx}>
            {v.wearStatus ? <Chip size="small" label={getStatusLabel(v.wearStatus)} color={STATUS_COLOR[v.wearStatus] || 'default'} /> : '-'}
          </Box>}
        </Box>

        <Box sx={rowSx}>
          <Typography sx={labelSx}>
            {t('ppe.wear.worker', '근로자명')}
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
          <Typography sx={labelSx}>{t('ppe.wear.dept', '부서')}</Typography>
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

        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('ppe.wear.zone', '작업구역')}</Typography>
          {isEdit ? (
            <Box sx={valueBorderSx}>
              <TextField fullWidth size="small" value={form.workZone || ''} onChange={(e) => setForm({ ...form, workZone: e.target.value })}
                placeholder="예) A동 1층 프레스실" />
            </Box>
          ) : <Box sx={valueBorderSx}>{v.workZone || '-'}</Box>}
          <Typography sx={labelSx}>{t('ppe.wear.checker', '확인자')}</Typography>
          {isEdit ? (
            <Box sx={{ ...valueSx, display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField fullWidth size="small" value={form.checker || ''} InputProps={{ readOnly: true }}
                placeholder={t('common.selectFromOrg', '조직도에서 선택') as string} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setShowCheckerModal(true)}>
                <PersonSearchIcon fontSize="small" />
              </Button>
            </Box>
          ) : <Box sx={valueSx}>{v.checker || '-'}</Box>}
        </Box>

        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('ppe.wear.requiredPpe', '필수 보호구')}</Typography>
          {isEdit ? (
            <Box sx={{ ...valueSx, p: 1 }}>
              <TextField fullWidth size="small" value={form.requiredPpe || ''}
                onChange={(e) => setForm({ ...form, requiredPpe: e.target.value })}
                placeholder="예) 안전모, 안전화, 방진마스크" />
            </Box>
          ) : <Box sx={valueSx}>{v.requiredPpe || '-'}</Box>}
        </Box>

        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('ppe.wear.action', '조치 내용')}</Typography>
          {isEdit ? (
            <Box sx={{ ...valueSx, p: 1 }}>
              <TextField fullWidth size="small" multiline minRows={2} value={form.actionTaken || ''}
                onChange={(e) => setForm({ ...form, actionTaken: e.target.value })}
                placeholder="미착용/부적정 시 조치 내용..." />
            </Box>
          ) : <Box sx={valueSx}>{v.actionTaken || '-'}</Box>}
        </Box>

        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('common.note', '비고')}</Typography>
          {isEdit ? (
            <Box sx={{ ...valueSx, p: 1 }}>
              <TextField fullWidth size="small" multiline minRows={2} value={form.note || ''}
                onChange={(e) => setForm({ ...form, note: e.target.value })} />
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
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.wear.datetime', '확인 일시')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography></Typography>
            <DatePickerField value={(form.checkDatetime || '').slice(0, 10)} onChange={(d) => setForm({ ...form, checkDatetime: d || undefined })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.wear.status', '착용 상태')}</Typography>
            <Select fullWidth size="small" value={form.wearStatus || 'OK'} onChange={(e) => setForm({ ...form, wearStatus: e.target.value })}>
              {statusCodes.map(c => <MenuItem key={c.code} value={c.code}>{getStatusLabel(c.code)}</MenuItem>)}
            </Select>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.wear.worker', '근로자명')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography></Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField fullWidth size="small" value={form.workerName || ''} InputProps={{ readOnly: true }} placeholder={t('common.selectFromOrg', '조직도에서 선택') as string} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setShowWorkerModal(true)}><PersonSearchIcon fontSize="small" /></Button>
            </Box>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.wear.dept', '부서')}</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField fullWidth size="small" value={form.department || ''} InputProps={{ readOnly: true }} placeholder={t('common.selectDept', '부서 선택') as string} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setShowDeptModal(true)}><PersonSearchIcon fontSize="small" /></Button>
            </Box>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.wear.zone', '작업구역')}</Typography>
            <TextField fullWidth size="small" value={form.workZone || ''} onChange={(e) => setForm({ ...form, workZone: e.target.value })} placeholder="예) A동 1층 프레스실" />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.wear.checker', '확인자')}</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField fullWidth size="small" value={form.checker || ''} InputProps={{ readOnly: true }} placeholder={t('common.selectFromOrg', '조직도에서 선택') as string} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setShowCheckerModal(true)}><PersonSearchIcon fontSize="small" /></Button>
            </Box>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.wear.requiredPpe', '필수 보호구')}</Typography>
            <TextField fullWidth size="small" value={form.requiredPpe || ''} onChange={(e) => setForm({ ...form, requiredPpe: e.target.value })} placeholder="예) 안전모, 안전화, 방진마스크" />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.wear.action', '조치 내용')}</Typography>
            <TextField fullWidth size="small" multiline minRows={2} value={form.actionTaken || ''} onChange={(e) => setForm({ ...form, actionTaken: e.target.value })} placeholder="미착용/부적정 시 조치 내용..." />
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
            [t('ppe.wear.datetime', '확인 일시'), v.checkDatetime ? v.checkDatetime.replace('T', ' ').slice(0, 16) : '-'],
            [t('ppe.wear.worker', '근로자'), v.workerName || '-'],
            [t('ppe.wear.dept', '부서'), v.department || '-'],
            [t('ppe.wear.zone', '작업 구역'), v.workZone || '-'],
            [t('ppe.wear.requiredPpe', '필수 보호구'), v.requiredPpe || '-'],
            [t('ppe.wear.status', '착용 상태'), v.wearStatus ? (getStatusLabel(v.wearStatus) || '-') : '-'],
            [t('ppe.wear.checker', '확인자'), v.checker || '-'],
            [t('ppe.wear.action', '조치 사항'), v.actionTaken || '-'],
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

      <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' }, gap: 1, mt: 2, flexWrap: 'wrap', '& > .MuiButton-root': { flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } } }}>
        <Button variant="outlined" onClick={handleCancel}>{viewMode === 'detail' ? t('common.list', '목록') : t('common.cancel', '취소')}</Button>
        {viewMode === 'detail' && isAdmin && (
          <>
            <Button variant="contained" onClick={handleEdit}>{t('common.edit', '수정')}</Button>
            <Button variant="contained" color="error" onClick={handleDelete}>{t('common.delete', '삭제')}</Button>
          </>
        )}
        {isEdit && (
          <Button variant="contained" onClick={handleSave}>{t('common.save', '저장')}</Button>
        )}
      </Box>

      <UserSelectModal
        open={showWorkerModal}
        onClose={() => setShowWorkerModal(false)}
        selectedUsers={[]}
        singleSelect
        useCompanyTree
        onConfirm={handleWorkerSelect}
        title={t('ppe.wear.selectWorker', '근로자 선택') as string}
      />
      <UserSelectModal
        open={showCheckerModal}
        onClose={() => setShowCheckerModal(false)}
        selectedUsers={[]}
        singleSelect
        useCompanyTree
        onConfirm={handleCheckerSelect}
        title={t('ppe.wear.selectChecker', '확인자 선택') as string}
      />
      <DepartmentSelectModal
        open={showDeptModal}
        onClose={() => setShowDeptModal(false)}
        onConfirm={handleDeptSelect}
        initialDepartment={form.department || ''}
        title={t('ppe.wear.selectDept', '부서 선택') as string}
      />
    </Box>
  )
}

export default PpeWearTab
