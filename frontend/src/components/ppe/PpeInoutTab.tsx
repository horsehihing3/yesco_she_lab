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
import NumberField from '../common/NumberField'
import LoadingOverlay from '../common/LoadingOverlay'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import { isSystemAdmin } from '../../utils/auth'
import { formatDateTime, todayStr } from '../../utils/dateDefaults'
import { formatUserName } from '../../utils/userDisplay'
import useCodeMap from '../../hooks/useCodeMap'
import { ppeInoutApi, ppeItemApi } from '../../api/ppeApi'
import { PpeInout, PpeInoutRequest, PpeInoutType } from '../../types/ppe.types'

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

const emptyForm: PpeInoutRequest = {
  inoutDate: todayStr(), itemId: undefined, itemName: '',
  inoutType: 'IN', quantity: 1, location: 'CENTRAL',
  expiryDate: undefined, manager: '', note: '',
}

const PpeInoutTab: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()
  const { user } = useAuth()
  const isAdmin = isSystemAdmin(user)

  const { codeList: typeCodes, getLabel: getTypeLabel } = useCodeMap('PPE_INOUT_TYPE')
  const { codeList: locationCodes, getLabel: getLocationLabel } = useCodeMap('PPE_LOCATION')

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selected, setSelected] = useState<PpeInout | null>(null)
  const [form, setForm] = useState<PpeInoutRequest>({ ...emptyForm })
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [searchText, setSearchText] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showManagerModal, setShowManagerModal] = useState(false)
  const pageSize = 10

  const handleManagerSelect = (users: UserInfo[]) => {
    if (users.length > 0) setForm({ ...form, manager: users[0].name })
    setShowManagerModal(false)
  }

  const queryKey = ['ppeInouts', searchText, typeFilter, page]
  const queryFn = () => {
    if (searchText) return ppeInoutApi.search(searchText, page, pageSize)
    if (typeFilter) return ppeInoutApi.getByType(typeFilter as PpeInoutType, page, pageSize)
    return ppeInoutApi.getAll(page, pageSize)
  }
  const { data, isLoading } = useQuery({ queryKey, queryFn, enabled: viewMode === 'list' })
  const { data: kpi } = useQuery({ queryKey: ['ppeInoutKpi'], queryFn: ppeInoutApi.getKpi })
  const { data: itemList } = useQuery({ queryKey: ['ppeItemsForInout'], queryFn: () => ppeItemApi.getAll(0, 200) })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['ppeInouts'] })
    qc.invalidateQueries({ queryKey: ['ppeInoutKpi'] })
  }
  const createMut = useMutation({
    mutationFn: (req: PpeInoutRequest) => ppeInoutApi.create(req),
    onSuccess: () => { invalidate(); showSuccess(t('common.saved', '저장되었습니다.')); handleBack() },
    onError: () => showError(t('common.error', '오류가 발생했습니다.')),
  })
  const updateMut = useMutation({
    mutationFn: ({ id, req }: { id: number; req: PpeInoutRequest }) => ppeInoutApi.update(id, req),
    onSuccess: () => { invalidate(); showSuccess(t('common.saved', '저장되었습니다.')); handleBack() },
  })
  const deleteMut = useMutation({
    mutationFn: (id: number) => ppeInoutApi.delete(id),
    onSuccess: () => { invalidate(); showSuccess(t('common.deleted', '삭제되었습니다.')); handleBack() },
  })
  const isProcessing = createMut.isPending || updateMut.isPending || deleteMut.isPending

  const handleBack = () => { setViewMode('list'); setSelected(null); setForm({ ...emptyForm }) }
  const handleRowClick = (item: PpeInout) => { setSelected(item); setViewMode('detail') }
  const handleAdd = () => { setSelected(null); setForm({ ...emptyForm, inoutDate: todayStr() }); setViewMode('create') }
  const handleEdit = () => {
    if (!selected) return
    setForm({
      inoutDate: selected.inoutDate, itemId: selected.itemId, itemName: selected.itemName,
      inoutType: selected.inoutType, quantity: selected.quantity, location: selected.location,
      expiryDate: selected.expiryDate, manager: selected.manager, note: selected.note,
    })
    setViewMode('edit')
  }

  const fillPersonRef = (req: PpeInoutRequest, isCreate: boolean): PpeInoutRequest => isCreate
    ? { ...req,
        createdByUserId: (user as any)?.id, createdByName: user?.name, createdByTeam: (user as any)?.team, createdByPosition: (user as any)?.position,
        modifiedByUserId: (user as any)?.id, modifiedByName: user?.name, modifiedByTeam: (user as any)?.team, modifiedByPosition: (user as any)?.position }
    : { ...req,
        modifiedByUserId: (user as any)?.id, modifiedByName: user?.name, modifiedByTeam: (user as any)?.team, modifiedByPosition: (user as any)?.position }

  const handleSave = async () => {
    if (!form.itemName?.trim()) { showError(t('ppe.inout.requireItem', '품목을 선택하세요.')); return }
    if (!form.quantity || form.quantity <= 0) { showError(t('ppe.inout.requireQty', '수량을 입력하세요.')); return }
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
  const handleResetSearch = () => { setSearchInput(''); setSearchText(''); setTypeFilter(''); setPage(0) }

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
          <Grid item xs={12} md={6}><KpiPaper label={t('ppe.inout.kpiIn', '이번달 입고')} value={kpi?.inThisMonth ?? '-'} color="#2563eb" /></Grid>
          <Grid item xs={12} md={6}><KpiPaper label={t('ppe.inout.kpiOut', '이번달 출고')} value={kpi?.outThisMonth ?? '-'} color="#2563eb" /></Grid>
        </Grid>

        <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <ListSearchBar placeholder={t('ppe.inout.searchPh', '품목명·담당자·창고')}
              value={searchInput} onChange={setSearchInput} onSearch={applySearch}
              sx={{ minWidth: 240 }} />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select displayEmpty value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0) }}>
                <MenuItem value="">{t('ppe.inout.allType', '전체 유형')}</MenuItem>
                {typeCodes.map(c => <MenuItem key={c.code} value={c.code}>{getTypeLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
            <IconButton onClick={handleResetSearch} size="small"><RefreshIcon /></IconButton>
          </Box>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAdd}>New</Button>
        </Box>

        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
          <ListSearchBar fullWidth placeholder={t('ppe.inout.searchPh', '품목명·담당자·창고')}
            value={searchInput} onChange={setSearchInput} onSearch={applySearch} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl size="small" sx={{ flex: 1 }}>
              <Select displayEmpty value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0) }}>
                <MenuItem value="">{t('ppe.inout.allType', '전체 유형')}</MenuItem>
                {typeCodes.map(c => <MenuItem key={c.code} value={c.code}>{getTypeLabel(c.code)}</MenuItem>)}
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
                      <TableCell align="center">{t('ppe.inout.date', '일자')}</TableCell>
                      <TableCell align="center">{t('ppe.inout.item', '품목명')}</TableCell>
                      <TableCell align="center">{t('ppe.inout.type', '구분')}</TableCell>
                      <TableCell align="center">{t('ppe.inout.qty', '수량')}</TableCell>
                      <TableCell align="center">{t('ppe.inout.location', '창고')}</TableCell>
                      <TableCell align="center">{t('ppe.inout.manager', '담당자')}</TableCell>
                      <TableCell align="center">{t('common.createdBy', '작성자')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((it) => (
                      <TableRow key={it.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(it)}>
                        <TableCell align="center">{it.inoutDate || '-'}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{it.itemName || '-'}</TableCell>
                        <TableCell align="center">
                          {it.inoutType ? <Chip size="small" label={getTypeLabel(it.inoutType)} color={it.inoutType === 'IN' ? 'success' : 'warning'} variant="outlined" /> : '-'}
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>{it.quantity ?? '-'}</TableCell>
                        <TableCell align="center">{getLocationLabel(it.location || '') || '-'}</TableCell>
                        <TableCell align="center">{it.manager || '-'}</TableCell>
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
                    {it.inoutType && <Chip size="small" label={getTypeLabel(it.inoutType)} color={it.inoutType === 'IN' ? 'success' : 'warning'} variant="outlined" />}
                  </Box>
                  <Typography variant="body2" color="text.secondary">{it.inoutDate || '-'} | 수량 {it.quantity ?? '-'}</Typography>
                  <Typography variant="body2" color="text.secondary">{getLocationLabel(it.location || '') || '-'} | {it.manager || '-'}</Typography>
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
            {t('ppe.inout.date', '일자')}
            {isEdit && <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>}
          </Typography>
          {isEdit ? (
            <Box sx={valueBorderSx}>
              <DatePickerField value={form.inoutDate || null} onChange={(d) => setForm({ ...form, inoutDate: d || undefined })} />
            </Box>
          ) : <Box sx={valueBorderSx}>{v.inoutDate || '-'}</Box>}
          <Typography sx={labelSx}>{t('ppe.inout.type', '구분')}</Typography>
          {isEdit ? (
            <Box sx={valueSx}>
              <Select fullWidth size="small" value={form.inoutType || 'IN'} onChange={(e) => setForm({ ...form, inoutType: e.target.value as PpeInoutType })}>
                {typeCodes.map(c => <MenuItem key={c.code} value={c.code}>{getTypeLabel(c.code)}</MenuItem>)}
              </Select>
            </Box>
          ) : <Box sx={valueSx}>
            {v.inoutType ? <Chip size="small" label={getTypeLabel(v.inoutType)} color={v.inoutType === 'IN' ? 'success' : 'warning'} /> : '-'}
          </Box>}
        </Box>

        <Box sx={rowSx}>
          <Typography sx={labelSx}>
            {t('ppe.inout.item', '품목')}
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
          <Typography sx={labelSx}>
            {t('ppe.inout.qty', '수량')}
            {isEdit && <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>}
          </Typography>
          <Box sx={valueSx}>
            <NumberField value={isEdit ? form.quantity : v.quantity} readOnly={!isEdit}
              onChange={(n) => setForm({ ...form, quantity: n ?? 1 })} min={1} />
          </Box>
        </Box>

        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('ppe.inout.location', '창고')}</Typography>
          {isEdit ? (
            <Box sx={valueBorderSx}>
              <Select fullWidth size="small" value={form.location || 'CENTRAL'} onChange={(e) => setForm({ ...form, location: e.target.value })}>
                {locationCodes.map(c => <MenuItem key={c.code} value={c.code}>{getLocationLabel(c.code)}</MenuItem>)}
              </Select>
            </Box>
          ) : <Box sx={valueBorderSx}>{getLocationLabel(v.location || '') || '-'}</Box>}
          <Typography sx={labelSx}>{t('ppe.inout.expiry', '유효기간(입고)')}</Typography>
          {isEdit ? (
            <Box sx={valueSx}>
              <DatePickerField value={form.expiryDate || null} onChange={(d) => setForm({ ...form, expiryDate: d || undefined })} />
            </Box>
          ) : <Box sx={valueSx}>{v.expiryDate || '-'}</Box>}
        </Box>

        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('ppe.inout.manager', '담당자')}</Typography>
          {isEdit ? (
            <Box sx={{ ...valueSx, display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField fullWidth size="small" value={form.manager || ''} InputProps={{ readOnly: true }}
                placeholder={t('common.selectFromOrg', '조직도에서 선택') as string} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setShowManagerModal(true)}>
                <PersonSearchIcon fontSize="small" />
              </Button>
            </Box>
          ) : <Box sx={valueSx}>{v.manager || '-'}</Box>}
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
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.inout.date', '일자')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography></Typography>
            <DatePickerField value={form.inoutDate || null} onChange={(d) => setForm({ ...form, inoutDate: d || undefined })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.inout.type', '구분')}</Typography>
            <Select fullWidth size="small" value={form.inoutType || 'IN'} onChange={(e) => setForm({ ...form, inoutType: e.target.value as PpeInoutType })}>
              {typeCodes.map(c => <MenuItem key={c.code} value={c.code}>{getTypeLabel(c.code)}</MenuItem>)}
            </Select>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.inout.item', '품목')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography></Typography>
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
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.inout.qty', '수량')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography></Typography>
            <NumberField value={form.quantity} onChange={(n) => setForm({ ...form, quantity: n ?? 1 })} min={1} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.inout.location', '창고')}</Typography>
            <Select fullWidth size="small" value={form.location || 'CENTRAL'} onChange={(e) => setForm({ ...form, location: e.target.value })}>
              {locationCodes.map(c => <MenuItem key={c.code} value={c.code}>{getLocationLabel(c.code)}</MenuItem>)}
            </Select>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.inout.expiry', '유효기간(입고)')}</Typography>
            <DatePickerField value={form.expiryDate || null} onChange={(d) => setForm({ ...form, expiryDate: d || undefined })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.inout.manager', '담당자')}</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField fullWidth size="small" value={form.manager || ''} InputProps={{ readOnly: true }} placeholder={t('common.selectFromOrg', '조직도에서 선택') as string} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setShowManagerModal(true)}><PersonSearchIcon fontSize="small" /></Button>
            </Box>
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
            [t('ppe.inout.date', '일자'), v.inoutDate || '-'],
            [t('ppe.inout.item', '품목명'), v.itemName || '-'],
            [t('ppe.inout.type', '구분'), v.inoutType ? (getTypeLabel(v.inoutType) || '-') : '-'],
            [t('ppe.inout.qty', '수량'), String(v.quantity ?? '-')],
            [t('ppe.inout.location', '창고'), getLocationLabel(v.location || '') || '-'],
            [t('ppe.inout.expiryDate', '유효기간'), v.expiryDate || '-'],
            [t('ppe.inout.manager', '담당자'), v.manager || '-'],
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
        open={showManagerModal}
        onClose={() => setShowManagerModal(false)}
        selectedUsers={[]}
        singleSelect
        useCompanyTree
        onConfirm={handleManagerSelect}
        title={t('ppe.inout.selectManager', '담당자 선택') as string}
      />
    </Box>
  )
}

export default PpeInoutTab
