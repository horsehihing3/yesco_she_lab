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
import { ppePerformanceApi, ppeItemApi } from '../../api/ppeApi'
import { PpePerformance, PpePerformanceRequest } from '../../types/ppe.types'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const RESULT_COLOR: Record<string, 'success' | 'error' | 'warning'> = {
  MEET: 'success', BELOW: 'error', PENDING: 'warning',
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

const emptyForm: PpePerformanceRequest = {
  evaluationDate: todayStr(), itemId: undefined, itemName: '',
  performanceStandard: '', standardValue: '', measuredValue: '',
  result: 'MEET', evaluator: '', note: '',
}

const PpePerformanceTab: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()
  const { user } = useAuth()
  const isAdmin = isSystemAdmin(user)

  const { codeList: resultCodes, getLabel: getResultLabel } = useCodeMap('PPE_PERFORMANCE_RESULT')

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selected, setSelected] = useState<PpePerformance | null>(null)
  const [form, setForm] = useState<PpePerformanceRequest>({ ...emptyForm })
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [searchText, setSearchText] = useState('')
  const [resultFilter, setResultFilter] = useState('')
  const [showEvaluatorModal, setShowEvaluatorModal] = useState(false)
  const pageSize = 10

  const handleEvaluatorSelect = (users: UserInfo[]) => {
    if (users.length > 0) setForm({ ...form, evaluator: users[0].name })
    setShowEvaluatorModal(false)
  }

  const queryKey = ['ppePerformances', searchText, resultFilter, page]
  const queryFn = () => {
    if (searchText) return ppePerformanceApi.search(searchText, page, pageSize)
    if (resultFilter) return ppePerformanceApi.getByResult(resultFilter, page, pageSize)
    return ppePerformanceApi.getAll(page, pageSize)
  }
  const { data, isLoading } = useQuery({ queryKey, queryFn, enabled: viewMode === 'list' })
  const { data: kpi } = useQuery({ queryKey: ['ppePerformanceKpi'], queryFn: ppePerformanceApi.getKpi })
  const { data: itemList } = useQuery({ queryKey: ['ppeItemsForPerf'], queryFn: () => ppeItemApi.getAll(0, 200) })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['ppePerformances'] })
    qc.invalidateQueries({ queryKey: ['ppePerformanceKpi'] })
  }
  const createMut = useMutation({
    mutationFn: (req: PpePerformanceRequest) => ppePerformanceApi.create(req),
    onSuccess: () => { invalidate(); showSuccess(t('common.saved', '저장되었습니다.')); handleBack() },
    onError: () => showError(t('common.error', '오류가 발생했습니다.')),
  })
  const updateMut = useMutation({
    mutationFn: ({ id, req }: { id: number; req: PpePerformanceRequest }) => ppePerformanceApi.update(id, req),
    onSuccess: () => { invalidate(); showSuccess(t('common.saved', '저장되었습니다.')); handleBack() },
  })
  const deleteMut = useMutation({
    mutationFn: (id: number) => ppePerformanceApi.delete(id),
    onSuccess: () => { invalidate(); showSuccess(t('common.deleted', '삭제되었습니다.')); handleBack() },
  })
  const isProcessing = createMut.isPending || updateMut.isPending || deleteMut.isPending

  const handleBack = () => { setViewMode('list'); setSelected(null); setForm({ ...emptyForm }) }
  const handleCancel = () => { if (viewMode === 'edit') { setViewMode('detail'); setForm({ ...emptyForm }) } else handleBack() }
  const handleRowClick = (item: PpePerformance) => { setSelected(item); setViewMode('detail') }
  const handleAdd = () => { setSelected(null); setForm({ ...emptyForm, evaluationDate: todayStr() }); setViewMode('create') }
  const handleEdit = () => {
    if (!selected) return
    setForm({
      evaluationDate: selected.evaluationDate, itemId: selected.itemId, itemName: selected.itemName,
      performanceStandard: selected.performanceStandard, standardValue: selected.standardValue,
      measuredValue: selected.measuredValue, result: selected.result, evaluator: selected.evaluator,
      note: selected.note,
    })
    setViewMode('edit')
  }

  const fillPersonRef = (req: PpePerformanceRequest, isCreate: boolean): PpePerformanceRequest => isCreate
    ? { ...req,
        createdByUserId: (user as any)?.id, createdByName: user?.name, createdByTeam: (user as any)?.team, createdByPosition: (user as any)?.position,
        modifiedByUserId: (user as any)?.id, modifiedByName: user?.name, modifiedByTeam: (user as any)?.team, modifiedByPosition: (user as any)?.position }
    : { ...req,
        modifiedByUserId: (user as any)?.id, modifiedByName: user?.name, modifiedByTeam: (user as any)?.team, modifiedByPosition: (user as any)?.position }

  const handleSave = async () => {
    if (!form.itemName?.trim()) { showError(t('ppe.perf.requireItem', '품목을 선택하세요.')); return }
    if (!form.performanceStandard?.trim()) { showError(t('ppe.perf.requireStd', '성능 기준을 입력하세요.')); return }
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
  const handleResetSearch = () => { setSearchInput(''); setSearchText(''); setResultFilter(''); setPage(0) }

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
          <Grid item xs={6} md={3}><KpiPaper label={t('ppe.perf.kpiTotal', '전체 평가')} value={kpi?.totalCount ?? '-'} color="#2563eb" /></Grid>
          <Grid item xs={6} md={3}><KpiPaper label={t('ppe.perf.kpiOk', '기준 충족')} value={kpi?.okCount ?? '-'} color="#2563eb" /></Grid>
          <Grid item xs={6} md={3}><KpiPaper label={t('ppe.perf.kpiFail', '성능 미달')} value={kpi?.failCount ?? '-'} color="#2563eb" /></Grid>
          <Grid item xs={6} md={3}><KpiPaper label={t('ppe.perf.kpiPending', '평가 대기')} value={kpi?.pendingCount ?? '-'} color="#2563eb" /></Grid>
        </Grid>

        <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <ListSearchBar placeholder={t('ppe.perf.searchPh', '품목명·성능기준·평가자')}
              value={searchInput} onChange={setSearchInput} onSearch={applySearch}
              sx={{ minWidth: 240 }} />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select displayEmpty value={resultFilter} onChange={(e) => { setResultFilter(e.target.value); setPage(0) }}>
                <MenuItem value="">{t('ppe.perf.allResult', '전체 결과')}</MenuItem>
                {resultCodes.map(c => <MenuItem key={c.code} value={c.code}>{getResultLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
            <IconButton onClick={handleResetSearch} size="small"><RefreshIcon /></IconButton>
          </Box>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAdd}>New</Button>
        </Box>

        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
          <ListSearchBar fullWidth placeholder={t('ppe.perf.searchPh', '품목명·성능기준·평가자')}
            value={searchInput} onChange={setSearchInput} onSearch={applySearch} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl size="small" sx={{ flex: 1 }}>
              <Select displayEmpty value={resultFilter} onChange={(e) => { setResultFilter(e.target.value); setPage(0) }}>
                <MenuItem value="">{t('ppe.perf.allResult', '전체 결과')}</MenuItem>
                {resultCodes.map(c => <MenuItem key={c.code} value={c.code}>{getResultLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
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
                      <TableCell align="center">{t('ppe.perf.date', '평가일')}</TableCell>
                      <TableCell align="center">{t('ppe.perf.item', '품목명')}</TableCell>
                      <TableCell align="center">{t('ppe.perf.std', '성능 기준')}</TableCell>
                      <TableCell align="center">{t('ppe.perf.req', '기준치')}</TableCell>
                      <TableCell align="center">{t('ppe.perf.measured', '측정값')}</TableCell>
                      <TableCell align="center">{t('ppe.perf.result', '결과')}</TableCell>
                      <TableCell align="center">{t('ppe.perf.evaluator', '평가자')}</TableCell>
                      <TableCell align="center">{t('common.createdBy', '작성자')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((it) => (
                      <TableRow key={it.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(it)}>
                        <TableCell align="center">{it.evaluationDate || '-'}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{it.itemName || '-'}</TableCell>
                        <TableCell align="center">{it.performanceStandard || '-'}</TableCell>
                        <TableCell align="center">{it.standardValue || '-'}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, color: it.result === 'BELOW' ? 'error.main' : 'success.main' }}>{it.measuredValue || '-'}</TableCell>
                        <TableCell align="center">
                          {it.result ? <Chip size="small" label={getResultLabel(it.result)} color={RESULT_COLOR[it.result] || 'default'} /> : '-'}
                        </TableCell>
                        <TableCell align="center">{it.evaluator || '-'}</TableCell>
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
                  <Typography variant="body2" color="text.secondary">{it.evaluationDate || '-'} | {it.evaluator || '-'}</Typography>
                  <Typography variant="body2" color="text.secondary">{it.performanceStandard || '-'} | 기준 {it.standardValue || '-'} / 측정 {it.measuredValue || '-'}</Typography>
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
  const items = itemList?.content || []

  return (
    <Box sx={{ position: 'relative' }}>
      <LoadingOverlay open={isProcessing} />

      <Paper sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
        <Box sx={rowSx}>
          <Typography sx={labelSx}>
            {t('ppe.perf.date', '평가일')}
            {isEdit && <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>}
          </Typography>
          {isEdit ? (
            <Box sx={valueBorderSx}>
              <DatePickerField value={form.evaluationDate || null} onChange={(d) => setForm({ ...form, evaluationDate: d || undefined })} />
            </Box>
          ) : <Box sx={valueBorderSx}>{v.evaluationDate || '-'}</Box>}
          <Typography sx={labelSx}>{t('ppe.perf.result', '결과')}</Typography>
          {isEdit ? (
            <Box sx={valueSx}>
              <Select fullWidth size="small" value={form.result || 'MEET'} onChange={(e) => setForm({ ...form, result: e.target.value })}>
                {resultCodes.map(c => <MenuItem key={c.code} value={c.code}>{getResultLabel(c.code)}</MenuItem>)}
              </Select>
            </Box>
          ) : <Box sx={valueSx}>
            {v.result ? <Chip size="small" label={getResultLabel(v.result)} color={RESULT_COLOR[v.result] || 'default'} /> : '-'}
          </Box>}
        </Box>

        <Box sx={rowSx}>
          <Typography sx={labelSx}>
            {t('ppe.perf.item', '품목')}
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
          <Typography sx={labelSx}>{t('ppe.perf.evaluator', '평가자')}</Typography>
          {isEdit ? (
            <Box sx={{ ...valueSx, display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField fullWidth size="small" value={form.evaluator || ''} InputProps={{ readOnly: true }}
                placeholder={t('common.selectFromOrg', '조직도에서 선택') as string} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setShowEvaluatorModal(true)}>
                <PersonSearchIcon fontSize="small" />
              </Button>
            </Box>
          ) : <Box sx={valueSx}>{v.evaluator || '-'}</Box>}
        </Box>

        <Box sx={rowSx}>
          <Typography sx={labelSx}>
            {t('ppe.perf.std', '성능 기준')}
            {isEdit && <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>}
          </Typography>
          {isEdit ? (
            <Box sx={valueBorderSx}>
              <TextField fullWidth size="small" value={form.performanceStandard || ''}
                onChange={(e) => setForm({ ...form, performanceStandard: e.target.value })}
                placeholder="예) 분진포집효율" />
            </Box>
          ) : <Box sx={valueBorderSx}>{v.performanceStandard || '-'}</Box>}
          <Typography sx={labelSx}>{t('ppe.perf.req', '기준치')}</Typography>
          {isEdit ? (
            <Box sx={valueSx}>
              <TextField fullWidth size="small" value={form.standardValue || ''}
                onChange={(e) => setForm({ ...form, standardValue: e.target.value })}
                placeholder="예) 80% 이상" />
            </Box>
          ) : <Box sx={valueSx}>{v.standardValue || '-'}</Box>}
        </Box>

        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('ppe.perf.measured', '측정값')}</Typography>
          {isEdit ? (
            <Box sx={{ ...valueSx, p: 1 }}>
              <TextField fullWidth size="small" value={form.measuredValue || ''}
                onChange={(e) => setForm({ ...form, measuredValue: e.target.value })}
                placeholder="예) 85.3%" />
            </Box>
          ) : <Box sx={valueSx}>{v.measuredValue || '-'}</Box>}
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
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.perf.date', '평가일')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography></Typography>
            <DatePickerField value={form.evaluationDate || null} onChange={(d) => setForm({ ...form, evaluationDate: d || undefined })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.perf.result', '결과')}</Typography>
            <Select fullWidth size="small" value={form.result || 'MEET'} onChange={(e) => setForm({ ...form, result: e.target.value })}>
              {resultCodes.map(c => <MenuItem key={c.code} value={c.code}>{getResultLabel(c.code)}</MenuItem>)}
            </Select>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.perf.item', '품목')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography></Typography>
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
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.perf.evaluator', '평가자')}</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField fullWidth size="small" value={form.evaluator || ''} InputProps={{ readOnly: true }} placeholder={t('common.selectFromOrg', '조직도에서 선택') as string} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setShowEvaluatorModal(true)}><PersonSearchIcon fontSize="small" /></Button>
            </Box>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.perf.std', '성능 기준')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography></Typography>
            <TextField fullWidth size="small" value={form.performanceStandard || ''} onChange={(e) => setForm({ ...form, performanceStandard: e.target.value })} placeholder="예) 분진포집효율" />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.perf.req', '기준치')}</Typography>
            <TextField fullWidth size="small" value={form.standardValue || ''} onChange={(e) => setForm({ ...form, standardValue: e.target.value })} placeholder="예) 80% 이상" />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.perf.measured', '측정값')}</Typography>
            <TextField fullWidth size="small" value={form.measuredValue || ''} onChange={(e) => setForm({ ...form, measuredValue: e.target.value })} placeholder="예) 85.3%" />
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
            [t('ppe.perf.date', '평가일'), v.evaluationDate || '-'],
            [t('ppe.perf.item', '품목명'), v.itemName || '-'],
            [t('ppe.perf.std', '성능 기준'), v.performanceStandard || '-'],
            [t('ppe.perf.req', '기준치'), v.standardValue || '-'],
            [t('ppe.perf.measured', '측정값'), v.measuredValue || '-'],
            [t('ppe.perf.result', '결과'), v.result ? (getResultLabel(v.result) || '-') : '-'],
            [t('ppe.perf.evaluator', '평가자'), v.evaluator || '-'],
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
        open={showEvaluatorModal}
        onClose={() => setShowEvaluatorModal(false)}
        selectedUsers={[]}
        singleSelect
        useCompanyTree
        onConfirm={handleEvaluatorSelect}
        title={t('ppe.perf.selectEvaluator', '평가자 선택') as string}
      />
    </Box>
  )
}

export default PpePerformanceTab
