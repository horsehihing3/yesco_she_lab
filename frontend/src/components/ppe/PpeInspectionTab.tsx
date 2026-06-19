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
import ListSearchBar from '../common/ListSearchBar'
import DatePickerField from '../common/DatePickerField'
import LoadingOverlay from '../common/LoadingOverlay'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import { isSystemAdmin } from '../../utils/auth'
import { formatDateTime, todayStr } from '../../utils/dateDefaults'
import { formatUserName } from '../../utils/userDisplay'
import useCodeMap from '../../hooks/useCodeMap'
import { ppeInspectionApi, ppeItemApi } from '../../api/ppeApi'
import { PpeInspection, PpeInspectionRequest } from '../../types/ppe.types'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const RESULT_COLOR: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  PASS: 'success', CONDITIONAL: 'warning', FAIL: 'error', DISPOSE: 'error',
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

const emptyForm: PpeInspectionRequest = {
  inspectionDate: todayStr(), itemId: undefined, itemName: '', itemCode: '',
  inspectionType: 'REGULAR', inspector: '', result: 'PASS',
  nextDate: undefined, note: '',
}

const PpeInspectionTab: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()
  const { user } = useAuth()
  const isAdmin = isSystemAdmin(user)

  const { codeList: typeCodes, getLabel: getTypeLabel } = useCodeMap('PPE_INSPECTION_TYPE')
  const { codeList: resultCodes, getLabel: getResultLabel } = useCodeMap('PPE_INSPECTION_RESULT')

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selected, setSelected] = useState<PpeInspection | null>(null)
  const [form, setForm] = useState<PpeInspectionRequest>({ ...emptyForm })
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [searchText, setSearchText] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [resultFilter, setResultFilter] = useState('')
  const [showInspectorModal, setShowInspectorModal] = useState(false)
  const pageSize = 10

  const handleInspectorSelect = (users: UserInfo[]) => {
    if (users.length > 0) setForm({ ...form, inspector: users[0].name })
    setShowInspectorModal(false)
  }

  const queryKey = ['ppeInspections', searchText, typeFilter, resultFilter, page]
  const queryFn = () => {
    if (searchText) return ppeInspectionApi.search(searchText, page, pageSize)
    if (resultFilter) return ppeInspectionApi.getByResult(resultFilter, page, pageSize)
    if (typeFilter) return ppeInspectionApi.getByType(typeFilter, page, pageSize)
    return ppeInspectionApi.getAll(page, pageSize)
  }
  const { data, isLoading } = useQuery({ queryKey, queryFn, enabled: viewMode === 'list' })
  const { data: kpi } = useQuery({ queryKey: ['ppeInspectionKpi'], queryFn: ppeInspectionApi.getKpi })
  const { data: upcoming } = useQuery({ queryKey: ['ppeInspectionUpcoming'], queryFn: () => ppeInspectionApi.getUpcoming(30) })
  const { data: fails } = useQuery({ queryKey: ['ppeInspectionFails'], queryFn: ppeInspectionApi.getFails })
  const { data: itemList } = useQuery({ queryKey: ['ppeItemsForInspection'], queryFn: () => ppeItemApi.getAll(0, 200) })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['ppeInspections'] })
    qc.invalidateQueries({ queryKey: ['ppeInspectionKpi'] })
    qc.invalidateQueries({ queryKey: ['ppeInspectionUpcoming'] })
    qc.invalidateQueries({ queryKey: ['ppeInspectionFails'] })
  }
  const createMut = useMutation({
    mutationFn: (req: PpeInspectionRequest) => ppeInspectionApi.create(req),
    onSuccess: () => { invalidate(); showSuccess(t('common.saved', '저장되었습니다.')); handleBack() },
    onError: () => showError(t('common.error', '오류가 발생했습니다.')),
  })
  const updateMut = useMutation({
    mutationFn: ({ id, req }: { id: number; req: PpeInspectionRequest }) => ppeInspectionApi.update(id, req),
    onSuccess: () => { invalidate(); showSuccess(t('common.saved', '저장되었습니다.')); handleBack() },
  })
  const deleteMut = useMutation({
    mutationFn: (id: number) => ppeInspectionApi.delete(id),
    onSuccess: () => { invalidate(); showSuccess(t('common.deleted', '삭제되었습니다.')); handleBack() },
  })
  const isProcessing = createMut.isPending || updateMut.isPending || deleteMut.isPending

  const handleBack = () => { setViewMode('list'); setSelected(null); setForm({ ...emptyForm }) }
  const handleRowClick = (item: PpeInspection) => { setSelected(item); setViewMode('detail') }
  const handleAdd = () => { setSelected(null); setForm({ ...emptyForm, inspectionDate: todayStr() }); setViewMode('create') }
  const handleEdit = () => {
    if (!selected) return
    setForm({
      inspectionDate: selected.inspectionDate, itemId: selected.itemId,
      itemName: selected.itemName, itemCode: selected.itemCode,
      inspectionType: selected.inspectionType, inspector: selected.inspector,
      result: selected.result, nextDate: selected.nextDate, note: selected.note,
    })
    setViewMode('edit')
  }

  const fillPersonRef = (req: PpeInspectionRequest, isCreate: boolean): PpeInspectionRequest => isCreate
    ? { ...req,
        createdByUserId: (user as any)?.id, createdByName: user?.name, createdByTeam: (user as any)?.team, createdByPosition: (user as any)?.position,
        modifiedByUserId: (user as any)?.id, modifiedByName: user?.name, modifiedByTeam: (user as any)?.team, modifiedByPosition: (user as any)?.position }
    : { ...req,
        modifiedByUserId: (user as any)?.id, modifiedByName: user?.name, modifiedByTeam: (user as any)?.team, modifiedByPosition: (user as any)?.position }

  const handleSave = async () => {
    if (!form.itemName?.trim()) { showError(t('ppe.inspection.requireItem', '품목을 선택하세요.')); return }
    if (!form.inspector?.trim()) { showError(t('ppe.inspection.requireInspector', '점검자를 입력하세요.')); return }
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
  const handleResetSearch = () => { setSearchInput(''); setSearchText(''); setTypeFilter(''); setResultFilter(''); setPage(0) }

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

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6} md={3}><KpiPaper label={t('ppe.inspection.kpiTotal', '전체 점검')} value={kpi?.totalCount ?? '-'} color="#2563eb" /></Grid>
          <Grid item xs={6} md={3}><KpiPaper label={t('ppe.inspection.kpiPass', '합격')} value={kpi?.passCount ?? '-'} color="#2563eb" /></Grid>
          <Grid item xs={6} md={3}><KpiPaper label={t('ppe.inspection.kpiFail', '불합격·폐기')} value={kpi?.failOrDisposeCount ?? '-'} color="#2563eb" /></Grid>
          <Grid item xs={6} md={3}><KpiPaper label={t('ppe.inspection.kpiUpcoming', '예정(30일)')} value={kpi?.upcomingCount ?? '-'} color="#2563eb" /></Grid>
        </Grid>

        {fails && fails.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <strong>{t('ppe.inspection.failAlert', '불합격·폐기 품목')}</strong> — {fails.slice(0, 3).map(f => f.itemName).join(', ')}
            {fails.length > 3 && ` 외 ${fails.length - 3}건`}
          </Alert>
        )}
        {upcoming && upcoming.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <strong>{t('ppe.inspection.upcomingAlert', '30일 내 점검 예정')}</strong> — {upcoming.slice(0, 3).map(u => `${u.itemName}(${u.nextDate})`).join(', ')}
            {upcoming.length > 3 && ` 외 ${upcoming.length - 3}건`}
          </Alert>
        )}

        {/* PC Toolbar */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <ListSearchBar placeholder={t('ppe.inspection.searchPh', '품목명·점검자·코드')}
              value={searchInput} onChange={setSearchInput} onSearch={applySearch}
              sx={{ minWidth: 240 }} />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select displayEmpty value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0) }}>
                <MenuItem value="">{t('ppe.inspection.allType', '전체 유형')}</MenuItem>
                {typeCodes.map(c => <MenuItem key={c.code} value={c.code}>{getTypeLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select displayEmpty value={resultFilter} onChange={(e) => { setResultFilter(e.target.value); setPage(0) }}>
                <MenuItem value="">{t('ppe.inspection.allResult', '전체 결과')}</MenuItem>
                {resultCodes.map(c => <MenuItem key={c.code} value={c.code}>{getResultLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
            <IconButton onClick={handleResetSearch} size="small"><RefreshIcon /></IconButton>
          </Box>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAdd}>New</Button>
        </Box>

        {/* Mobile Toolbar */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
          <ListSearchBar fullWidth placeholder={t('ppe.inspection.searchPh', '품목명·점검자·코드')}
            value={searchInput} onChange={setSearchInput} onSearch={applySearch} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl size="small" sx={{ flex: 1 }}>
              <Select displayEmpty value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0) }}>
                <MenuItem value="">{t('ppe.inspection.allType', '전체 유형')}</MenuItem>
                {typeCodes.map(c => <MenuItem key={c.code} value={c.code}>{getTypeLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ flex: 1 }}>
              <Select displayEmpty value={resultFilter} onChange={(e) => { setResultFilter(e.target.value); setPage(0) }}>
                <MenuItem value="">{t('ppe.inspection.allResult', '전체 결과')}</MenuItem>
                {resultCodes.map(c => <MenuItem key={c.code} value={c.code}>{getResultLabel(c.code)}</MenuItem>)}
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
                      <TableCell align="center">{t('ppe.inspection.date', '점검일')}</TableCell>
                      <TableCell align="center">{t('ppe.inspection.item', '품목명')}</TableCell>
                      <TableCell align="center">{t('ppe.inspection.code', '품목코드')}</TableCell>
                      <TableCell align="center">{t('ppe.inspection.type', '유형')}</TableCell>
                      <TableCell align="center">{t('ppe.inspection.inspector', '점검자')}</TableCell>
                      <TableCell align="center">{t('ppe.inspection.result', '결과')}</TableCell>
                      <TableCell align="center">{t('ppe.inspection.nextDate', '다음 점검')}</TableCell>
                      <TableCell align="center">{t('common.createdBy', '작성자')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((it) => (
                      <TableRow key={it.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(it)}>
                        <TableCell align="center">{it.inspectionDate || '-'}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{it.itemName || '-'}</TableCell>
                        <TableCell align="center">{it.itemCode || '-'}</TableCell>
                        <TableCell align="center"><Chip size="small" label={getTypeLabel(it.inspectionType || '') || '-'} variant="outlined" /></TableCell>
                        <TableCell align="center">{it.inspector || '-'}</TableCell>
                        <TableCell align="center">
                          {it.result ? <Chip size="small" label={getResultLabel(it.result)} color={RESULT_COLOR[it.result] || 'default'} /> : '-'}
                        </TableCell>
                        <TableCell align="center">{it.nextDate || '-'}</TableCell>
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
                    <Typography fontWeight="bold">{it.itemName || '-'}</Typography>
                    {it.result && <Chip size="small" label={getResultLabel(it.result)} color={RESULT_COLOR[it.result] || 'default'} />}
                  </Box>
                  <Typography variant="body2" color="text.secondary">{it.inspectionDate || '-'} | {getTypeLabel(it.inspectionType || '') || '-'}</Typography>
                  <Typography variant="body2" color="text.secondary">{it.inspector || '-'} | 다음 점검: {it.nextDate || '-'}</Typography>
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
            {t('ppe.inspection.date', '점검일')}
            {isEdit && <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>}
          </Typography>
          {isEdit ? (
            <Box sx={valueBorderSx}>
              <DatePickerField value={form.inspectionDate || null} onChange={(d) => setForm({ ...form, inspectionDate: d || undefined })} />
            </Box>
          ) : <Box sx={valueBorderSx}>{v.inspectionDate || '-'}</Box>}
          <Typography sx={labelSx}>{t('ppe.inspection.type', '점검 유형')}</Typography>
          {isEdit ? (
            <Box sx={valueSx}>
              <Select fullWidth size="small" value={form.inspectionType || 'REGULAR'} onChange={(e) => setForm({ ...form, inspectionType: e.target.value })}>
                {typeCodes.map(c => <MenuItem key={c.code} value={c.code}>{getTypeLabel(c.code)}</MenuItem>)}
              </Select>
            </Box>
          ) : <Box sx={valueSx}>{getTypeLabel(v.inspectionType || '') || '-'}</Box>}
        </Box>

        <Box sx={rowSx}>
          <Typography sx={labelSx}>
            {t('ppe.inspection.item', '품목')}
            {isEdit && <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>}
          </Typography>
          {isEdit ? (
            <Box sx={valueBorderSx}>
              <Select fullWidth size="small" value={form.itemId ?? ''} displayEmpty
                onChange={(e) => {
                  const id = e.target.value as number
                  const item = items.find(i => i.id === id)
                  setForm({ ...form, itemId: id, itemName: item?.name, itemCode: item?.itemCode })
                }}>
                <MenuItem value="" sx={{ fontStyle: 'normal' }}>{t('common.select', '선택하세요')}</MenuItem>
                {items.map(i => <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>)}
              </Select>
            </Box>
          ) : <Box sx={valueBorderSx}>{v.itemName || '-'}</Box>}
          <Typography sx={labelSx}>{t('ppe.inspection.code', '품목코드')}</Typography>
          {isEdit ? (
            <Box sx={valueSx}>
              <TextField fullWidth size="small" value={form.itemCode || ''} InputProps={{ readOnly: true }}
                placeholder={t('ppe.inspection.codeAuto', '품목 선택 시 자동 채워짐') as string} />
            </Box>
          ) : <Box sx={valueSx}>{v.itemCode || '-'}</Box>}
        </Box>

        <Box sx={rowSx}>
          <Typography sx={labelSx}>
            {t('ppe.inspection.inspector', '점검자')}
            {isEdit && <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>}
          </Typography>
          {isEdit ? (
            <Box sx={{ ...valueBorderSx, display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField fullWidth size="small" value={form.inspector || ''} InputProps={{ readOnly: true }}
                placeholder={t('common.selectFromOrg', '조직도에서 선택') as string} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setShowInspectorModal(true)}>
                <PersonSearchIcon fontSize="small" />
              </Button>
            </Box>
          ) : <Box sx={valueBorderSx}>{v.inspector || '-'}</Box>}
          <Typography sx={labelSx}>{t('ppe.inspection.result', '결과')}</Typography>
          {isEdit ? (
            <Box sx={valueSx}>
              <Select fullWidth size="small" value={form.result || 'PASS'} onChange={(e) => setForm({ ...form, result: e.target.value })}>
                {resultCodes.map(c => <MenuItem key={c.code} value={c.code}>{getResultLabel(c.code)}</MenuItem>)}
              </Select>
            </Box>
          ) : <Box sx={valueSx}>
            {v.result ? <Chip size="small" label={getResultLabel(v.result)} color={RESULT_COLOR[v.result] || 'default'} /> : '-'}
          </Box>}
        </Box>

        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('ppe.inspection.nextDate', '다음 점검 예정일')}</Typography>
          {isEdit ? (
            <Box sx={{ ...valueSx, p: 1 }}>
              <DatePickerField value={form.nextDate || null} onChange={(d) => setForm({ ...form, nextDate: d || undefined })} />
            </Box>
          ) : <Box sx={valueSx}>{v.nextDate || '-'}</Box>}
        </Box>

        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('ppe.inspection.note', '점검 내용')}</Typography>
          {isEdit ? (
            <Box sx={{ ...valueSx, p: 1 }}>
              <TextField fullWidth size="small" multiline minRows={3} value={form.note || ''}
                placeholder={t('ppe.inspection.notePh', '점검 세부 내용 입력...') as string}
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
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.inspection.date', '점검일')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography></Typography>
            <DatePickerField value={form.inspectionDate || null} onChange={(d) => setForm({ ...form, inspectionDate: d || undefined })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.inspection.type', '점검 유형')}</Typography>
            <Select fullWidth size="small" value={form.inspectionType || 'REGULAR'} onChange={(e) => setForm({ ...form, inspectionType: e.target.value })}>
              {typeCodes.map(c => <MenuItem key={c.code} value={c.code}>{getTypeLabel(c.code)}</MenuItem>)}
            </Select>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.inspection.item', '품목')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography></Typography>
            <Select fullWidth size="small" value={form.itemId ?? ''} displayEmpty
              onChange={(e) => {
                const id = e.target.value as number
                const item = items.find(i => i.id === id)
                setForm({ ...form, itemId: id, itemName: item?.name, itemCode: item?.itemCode })
              }}>
              <MenuItem value="" sx={{ fontStyle: 'normal' }}>{t('common.select', '선택하세요')}</MenuItem>
              {items.map(i => <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>)}
            </Select>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.inspection.code', '품목코드')}</Typography>
            <TextField fullWidth size="small" value={form.itemCode || ''} InputProps={{ readOnly: true }} placeholder={t('ppe.inspection.codeAuto', '품목 선택 시 자동 채워짐') as string} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.inspection.inspector', '점검자')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography></Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField fullWidth size="small" value={form.inspector || ''} InputProps={{ readOnly: true }} placeholder={t('common.selectFromOrg', '조직도에서 선택') as string} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setShowInspectorModal(true)}><PersonSearchIcon fontSize="small" /></Button>
            </Box>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.inspection.result', '결과')}</Typography>
            <Select fullWidth size="small" value={form.result || 'PASS'} onChange={(e) => setForm({ ...form, result: e.target.value })}>
              {resultCodes.map(c => <MenuItem key={c.code} value={c.code}>{getResultLabel(c.code)}</MenuItem>)}
            </Select>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.inspection.nextDate', '다음 점검 예정일')}</Typography>
            <DatePickerField value={form.nextDate || null} onChange={(d) => setForm({ ...form, nextDate: d || undefined })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.inspection.note', '점검 내용')}</Typography>
            <TextField fullWidth size="small" multiline minRows={3} value={form.note || ''} placeholder={t('ppe.inspection.notePh', '점검 세부 내용 입력...') as string} onChange={(e) => setForm({ ...form, note: e.target.value })} />
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
            [t('ppe.inspection.date', '점검일'), v.inspectionDate || '-'],
            [t('ppe.inspection.item', '품목명'), v.itemName || '-'],
            [t('ppe.inspection.code', '품목코드'), v.itemCode || '-'],
            [t('ppe.inspection.type', '유형'), getTypeLabel(v.inspectionType || '') || '-'],
            [t('ppe.inspection.inspector', '점검자'), v.inspector || '-'],
            [t('ppe.inspection.result', '결과'), v.result ? (getResultLabel(v.result) || '-') : '-'],
            [t('ppe.inspection.nextDate', '다음 점검'), v.nextDate || '-'],
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
        <Button variant="outlined" onClick={handleBack}>{t('common.cancel', '취소')}</Button>
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
        open={showInspectorModal}
        onClose={() => setShowInspectorModal(false)}
        selectedUsers={[]}
        singleSelect
        useCompanyTree
        onConfirm={handleInspectorSelect}
        title={t('ppe.inspection.selectInspector', '점검자 선택') as string}
      />
    </Box>
  )
}

export default PpeInspectionTab
