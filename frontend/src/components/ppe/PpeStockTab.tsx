import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Select, MenuItem, TextField,
  FormControl, Chip, Pagination, CircularProgress, Alert, IconButton, Grid, LinearProgress,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import ListSearchBar from '../common/ListSearchBar'
import DatePickerField from '../common/DatePickerField'
import NumberField from '../common/NumberField'
import LoadingOverlay from '../common/LoadingOverlay'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import { isSystemAdmin } from '../../utils/auth'
import { formatDateTime } from '../../utils/dateDefaults'
import { formatUserName } from '../../utils/userDisplay'
import useCodeMap from '../../hooks/useCodeMap'
import { ppeStockApi, ppeItemApi } from '../../api/ppeApi'
import { PpeStock, PpeStockRequest } from '../../types/ppe.types'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

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

const emptyForm: PpeStockRequest = {
  itemId: undefined, itemName: '', location: 'CENTRAL',
  quantity: 0, minQty: 10, optQty: 50, expiryDate: undefined, note: '',
}

const stockStatus = (qty?: number, min?: number, opt?: number): { label: string; color: 'success' | 'warning' | 'info' } => {
  const q = qty ?? 0, m = min ?? 0, o = opt ?? 0
  if (q < m) return { label: '부족', color: 'warning' }
  if (o > 0 && q > o * 2) return { label: '과잉', color: 'info' }
  return { label: '정상', color: 'success' }
}

const PpeStockTab: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()
  const { user } = useAuth()
  const isAdmin = isSystemAdmin(user)

  const { codeList: locationCodes, getLabel: getLocationLabel } = useCodeMap('PPE_LOCATION')

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selected, setSelected] = useState<PpeStock | null>(null)
  const [form, setForm] = useState<PpeStockRequest>({ ...emptyForm })
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [searchText, setSearchText] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const pageSize = 10

  const queryKey = ['ppeStocks', searchText, locationFilter, page]
  const queryFn = () => {
    if (searchText) return ppeStockApi.search(searchText, page, pageSize)
    if (locationFilter) return ppeStockApi.getByLocation(locationFilter, page, pageSize)
    return ppeStockApi.getAll(page, pageSize)
  }
  const { data, isLoading } = useQuery({ queryKey, queryFn, enabled: viewMode === 'list' })
  const { data: kpi } = useQuery({ queryKey: ['ppeStockKpi'], queryFn: ppeStockApi.getKpi })
  const { data: lowStock } = useQuery({ queryKey: ['ppeStockLow'], queryFn: ppeStockApi.getLowStock })
  const { data: itemList } = useQuery({ queryKey: ['ppeItemsForStock'], queryFn: () => ppeItemApi.getAll(0, 200) })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['ppeStocks'] })
    qc.invalidateQueries({ queryKey: ['ppeStockKpi'] })
    qc.invalidateQueries({ queryKey: ['ppeStockLow'] })
  }
  const createMut = useMutation({
    mutationFn: (req: PpeStockRequest) => ppeStockApi.create(req),
    onSuccess: () => { invalidate(); showSuccess(t('common.saved', '저장되었습니다.')); handleBack() },
    onError: () => showError(t('common.error', '오류가 발생했습니다.')),
  })
  const updateMut = useMutation({
    mutationFn: ({ id, req }: { id: number; req: PpeStockRequest }) => ppeStockApi.update(id, req),
    onSuccess: () => { invalidate(); showSuccess(t('common.saved', '저장되었습니다.')); handleBack() },
  })
  const deleteMut = useMutation({
    mutationFn: (id: number) => ppeStockApi.delete(id),
    onSuccess: () => { invalidate(); showSuccess(t('common.deleted', '삭제되었습니다.')); handleBack() },
  })
  const isProcessing = createMut.isPending || updateMut.isPending || deleteMut.isPending

  const handleBack = () => { setViewMode('list'); setSelected(null); setForm({ ...emptyForm }) }
  const handleRowClick = (item: PpeStock) => { setSelected(item); setViewMode('detail') }
  const handleAdd = () => { setSelected(null); setForm({ ...emptyForm }); setViewMode('create') }
  const handleEdit = () => {
    if (!selected) return
    setForm({
      itemId: selected.itemId, itemName: selected.itemName, location: selected.location,
      quantity: selected.quantity, minQty: selected.minQty, optQty: selected.optQty,
      expiryDate: selected.expiryDate, note: selected.note,
    })
    setViewMode('edit')
  }

  const fillPersonRef = (req: PpeStockRequest, isCreate: boolean): PpeStockRequest => isCreate
    ? { ...req,
        createdByUserId: (user as any)?.id, createdByName: user?.name, createdByTeam: (user as any)?.team, createdByPosition: (user as any)?.position,
        modifiedByUserId: (user as any)?.id, modifiedByName: user?.name, modifiedByTeam: (user as any)?.team, modifiedByPosition: (user as any)?.position }
    : { ...req,
        modifiedByUserId: (user as any)?.id, modifiedByName: user?.name, modifiedByTeam: (user as any)?.team, modifiedByPosition: (user as any)?.position }

  const handleSave = async () => {
    if (!form.itemName?.trim()) { showError(t('ppe.stock.requireItem', '품목을 선택하세요.')); return }
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
  const handleResetSearch = () => { setSearchInput(''); setSearchText(''); setLocationFilter(''); setPage(0) }

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

  // ── LIST VIEW ──
  if (viewMode === 'list') {
    const items = data?.content || []
    const totalPages = data?.totalPages || 0

    return (
      <Box sx={{ position: 'relative' }}>
        <LoadingOverlay open={isProcessing || isLoading} />

        {/* 상단 KPI */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={4}><KpiPaper label={t('ppe.stock.kpiTotal', '총 재고')} value={kpi?.totalQuantity ?? '-'} color="#2563eb" /></Grid>
          <Grid item xs={12} md={4}><KpiPaper label={t('ppe.stock.kpiLow', '부족 품목')} value={kpi?.lowStockCount ?? '-'} color="#2563eb" /></Grid>
          <Grid item xs={12} md={4}><KpiPaper label={t('ppe.stock.kpiExpiring', '만료 임박(30일)')} value={kpi?.expiringCount ?? '-'} color="#2563eb" /></Grid>
        </Grid>

        {/* 부족 알림 */}
        {lowStock && lowStock.length > 0 && (
          <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 2 }}>
            <strong>{t('ppe.stock.lowAlert', '재고 부족 품목')}</strong> — {lowStock.slice(0, 5).map(s => `${s.itemName}(${s.quantity}개)`).join(', ')}
            {lowStock.length > 5 && ` 외 ${lowStock.length - 5}건`}
          </Alert>
        )}

        {/* PC Toolbar */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <ListSearchBar placeholder={t('ppe.stock.searchPh', '품목명·창고 검색')}
              value={searchInput} onChange={setSearchInput} onSearch={applySearch}
              sx={{ minWidth: 240 }} />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select displayEmpty value={locationFilter} onChange={(e) => { setLocationFilter(e.target.value); setPage(0) }}>
                <MenuItem value="">{t('ppe.stock.allLocation', '전체 창고')}</MenuItem>
                {locationCodes.map(l => <MenuItem key={l.code} value={l.code}>{getLocationLabel(l.code)}</MenuItem>)}
              </Select>
            </FormControl>
            <IconButton onClick={handleResetSearch} size="small"><RefreshIcon /></IconButton>
          </Box>
          {isAdmin && (
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAdd}>New</Button>
          )}
        </Box>

        {/* Mobile Toolbar */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
          <ListSearchBar fullWidth placeholder={t('ppe.stock.searchPh', '품목명·창고 검색')}
            value={searchInput} onChange={setSearchInput} onSearch={applySearch} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl size="small" sx={{ flex: 1 }}>
              <Select displayEmpty value={locationFilter} onChange={(e) => { setLocationFilter(e.target.value); setPage(0) }}>
                <MenuItem value="">{t('ppe.stock.allLocation', '전체 창고')}</MenuItem>
                {locationCodes.map(l => <MenuItem key={l.code} value={l.code}>{getLocationLabel(l.code)}</MenuItem>)}
              </Select>
            </FormControl>
            <IconButton onClick={handleResetSearch} size="small"><RefreshIcon /></IconButton>
          </Box>
          {isAdmin && (
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAdd} fullWidth>New</Button>
          )}
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
                      <TableCell align="center">{t('ppe.stock.itemName', '품목명')}</TableCell>
                      <TableCell align="center">{t('ppe.stock.location', '창고')}</TableCell>
                      <TableCell align="center">{t('ppe.stock.quantity', '현재고')}</TableCell>
                      <TableCell align="center">{t('ppe.stock.minQty', '최소')}</TableCell>
                      <TableCell align="center">{t('ppe.stock.optQty', '적정')}</TableCell>
                      <TableCell align="center">{t('ppe.stock.expiryDate', '유효기간')}</TableCell>
                      <TableCell align="center">{t('ppe.stock.status', '상태')}</TableCell>
                      <TableCell align="center">{t('common.createdBy', '작성자')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((it) => {
                      const status = stockStatus(it.quantity, it.minQty, it.optQty)
                      const pct = it.optQty && it.optQty > 0 ? Math.min(100, Math.round((it.quantity || 0) / it.optQty * 100)) : 0
                      return (
                        <TableRow key={it.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(it)}>
                          <TableCell sx={{ fontWeight: 600 }}>{it.itemName || '-'}</TableCell>
                          <TableCell align="center">{getLocationLabel(it.location || '') || '-'}</TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                              <Typography variant="body2" fontWeight="bold">{it.quantity ?? 0}</Typography>
                              <LinearProgress variant="determinate" value={pct}
                                color={status.color === 'warning' ? 'warning' : status.color === 'info' ? 'info' : 'success'}
                                sx={{ width: 50, height: 5, borderRadius: 1 }} />
                            </Box>
                          </TableCell>
                          <TableCell align="center">{it.minQty ?? '-'}</TableCell>
                          <TableCell align="center">{it.optQty ?? '-'}</TableCell>
                          <TableCell align="center">{it.expiryDate || '-'}</TableCell>
                          <TableCell align="center"><Chip size="small" label={status.label} color={status.color} /></TableCell>
                          <TableCell align="center">{formatUserName(it.createdByTeam, it.createdByName, it.createdByPosition) || '-'}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
            {/* Mobile card list */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
              {items.map((it) => {
                const status = stockStatus(it.quantity, it.minQty, it.optQty)
                return (
                  <Paper key={it.id} sx={{ p: 2, border: 1, borderColor: 'divider', cursor: 'pointer' }} onClick={() => handleRowClick(it)}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography fontWeight="bold">{it.itemName || '-'}</Typography>
                      <Chip size="small" label={status.label} color={status.color} />
                    </Box>
                    <Typography variant="body2" color="text.secondary">{getLocationLabel(it.location || '') || '-'} | 현재고: {it.quantity ?? 0}</Typography>
                    <Typography variant="body2" color="text.secondary">최소: {it.minQty ?? '-'} / 적정: {it.optQty ?? '-'}</Typography>
                  </Paper>
                )
              })}
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

  // ── DETAIL / CREATE / EDIT VIEW ──
  const isEdit = viewMode === 'edit' || viewMode === 'create'
  const v: any = isEdit ? form : (selected || {})
  const items = itemList?.content || []

  return (
    <Box sx={{ position: 'relative' }}>
      <LoadingOverlay open={isProcessing} />

      <Paper sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
        {/* 품목 + 창고 */}
        <Box sx={rowSx}>
          <Typography sx={labelSx}>
            {t('ppe.stock.itemName', '품목')}
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
          <Typography sx={labelSx}>{t('ppe.stock.location', '창고')}</Typography>
          {isEdit ? (
            <Box sx={valueSx}>
              <Select fullWidth size="small" value={form.location || 'CENTRAL'} onChange={(e) => setForm({ ...form, location: e.target.value })}>
                {locationCodes.map(l => <MenuItem key={l.code} value={l.code}>{getLocationLabel(l.code)}</MenuItem>)}
              </Select>
            </Box>
          ) : <Box sx={valueSx}>{getLocationLabel(v.location || '') || '-'}</Box>}
        </Box>

        {/* 현재고 + 최소기준 (NumberField) */}
        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('ppe.stock.quantity', '현재고')}</Typography>
          <Box sx={valueBorderSx}>
            <NumberField value={isEdit ? form.quantity : v.quantity} readOnly={!isEdit}
              onChange={(n) => setForm({ ...form, quantity: n ?? 0 })} min={0} />
          </Box>
          <Typography sx={labelSx}>{t('ppe.stock.minQty', '최소 기준')}</Typography>
          <Box sx={valueSx}>
            <NumberField value={isEdit ? form.minQty : v.minQty} readOnly={!isEdit}
              onChange={(n) => setForm({ ...form, minQty: n ?? 0 })} min={0} />
          </Box>
        </Box>

        {/* 적정재고 + 유효기간 */}
        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('ppe.stock.optQty', '적정 재고')}</Typography>
          <Box sx={valueBorderSx}>
            <NumberField value={isEdit ? form.optQty : v.optQty} readOnly={!isEdit}
              onChange={(n) => setForm({ ...form, optQty: n ?? 0 })} min={0} />
          </Box>
          <Typography sx={labelSx}>{t('ppe.stock.expiryDate', '유효 기간')}</Typography>
          {isEdit ? (
            <Box sx={valueSx}>
              <DatePickerField value={form.expiryDate || null} onChange={(d) => setForm({ ...form, expiryDate: d || undefined })} />
            </Box>
          ) : <Box sx={valueSx}>{v.expiryDate || '-'}</Box>}
        </Box>

        {/* 비고 */}
        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('common.note', '비고')}</Typography>
          {isEdit ? (
            <Box sx={{ ...valueSx, p: 1 }}>
              <TextField fullWidth size="small" multiline minRows={2} value={form.note || ''} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </Box>
          ) : <Box sx={valueSx}>{v.note || '-'}</Box>}
        </Box>

        {/* 작성자/작성일 — create/edit/detail 모두 표시 */}
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
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('ppe.stock.itemName', '품목')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
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
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.stock.location', '창고')}</Typography>
            <Select fullWidth size="small" value={form.location || 'CENTRAL'} onChange={(e) => setForm({ ...form, location: e.target.value })}>
              {locationCodes.map(l => <MenuItem key={l.code} value={l.code}>{getLocationLabel(l.code)}</MenuItem>)}
            </Select>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.stock.quantity', '현재고')}</Typography>
            <NumberField value={form.quantity} onChange={(n) => setForm({ ...form, quantity: n ?? 0 })} min={0} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.stock.minQty', '최소 기준')}</Typography>
            <NumberField value={form.minQty} onChange={(n) => setForm({ ...form, minQty: n ?? 0 })} min={0} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.stock.optQty', '적정 재고')}</Typography>
            <NumberField value={form.optQty} onChange={(n) => setForm({ ...form, optQty: n ?? 0 })} min={0} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.stock.expiryDate', '유효 기간')}</Typography>
            <DatePickerField value={form.expiryDate || null} onChange={(d) => setForm({ ...form, expiryDate: d || undefined })} />
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
            [t('ppe.stock.itemName', '품목명'), v.itemName || '-'],
            [t('ppe.stock.location', '창고'), getLocationLabel(v.location || '') || '-'],
            [t('ppe.stock.quantity', '현재고'), String(v.quantity ?? '-')],
            [t('ppe.stock.minQty', '최소기준'), String(v.minQty ?? '-')],
            [t('ppe.stock.optQty', '적정기준'), String(v.optQty ?? '-')],
            [t('ppe.stock.expiryDate', '유효기간'), v.expiryDate || '-'],
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

      {/* 액션 버튼 — 기본 크기 (AuditPlanTab 패턴) */}
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
    </Box>
  )
}

export default PpeStockTab
