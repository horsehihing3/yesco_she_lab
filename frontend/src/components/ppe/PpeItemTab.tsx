import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, TextField, Select, MenuItem,
  FormControl, Chip, Pagination, CircularProgress, Alert, IconButton, Grid,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
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
import { ppeItemApi } from '../../api/ppeApi'
import { PpeItem, PpeItemRequest } from '../../types/ppe.types'

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

const emptyForm: PpeItemRequest = {
  itemCode: '', name: '', category: 'HEAD', modelNo: '', kcCertNo: '',
  grade: '', supplier: '', unitPrice: 0, replaceCycle: 12, certExpiry: undefined,
  minStock: 10, note: '',
}

const PpeItemTab: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()
  const { user } = useAuth()
  const isAdmin = isSystemAdmin(user)

  const { codeList: categoryCodes, getLabel: getCategoryLabel } = useCodeMap('PPE_CATEGORY')

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selected, setSelected] = useState<PpeItem | null>(null)
  const [form, setForm] = useState<PpeItemRequest>({ ...emptyForm })
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [searchText, setSearchText] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const pageSize = 10

  const queryKey = ['ppeItems', searchText, categoryFilter, page]
  const queryFn = () => {
    if (searchText) return ppeItemApi.search(searchText, page, pageSize)
    if (categoryFilter) return ppeItemApi.getByCategory(categoryFilter, page, pageSize)
    return ppeItemApi.getAll(page, pageSize)
  }
  const { data, isLoading } = useQuery({ queryKey, queryFn, enabled: viewMode === 'list' })
  const { data: kpi } = useQuery({ queryKey: ['ppeItemKpi'], queryFn: ppeItemApi.getKpi })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['ppeItems'] })
    qc.invalidateQueries({ queryKey: ['ppeItemKpi'] })
  }
  const createMut = useMutation({
    mutationFn: (req: PpeItemRequest) => ppeItemApi.create(req),
    onSuccess: () => { invalidate(); showSuccess(t('common.saved', '저장되었습니다.')); handleBack() },
    onError: () => showError(t('common.error', '오류가 발생했습니다.')),
  })
  const updateMut = useMutation({
    mutationFn: ({ id, req }: { id: number; req: PpeItemRequest }) => ppeItemApi.update(id, req),
    onSuccess: () => { invalidate(); showSuccess(t('common.saved', '저장되었습니다.')); handleBack() },
  })
  const deleteMut = useMutation({
    mutationFn: (id: number) => ppeItemApi.delete(id),
    onSuccess: () => { invalidate(); showSuccess(t('common.deleted', '삭제되었습니다.')); handleBack() },
  })
  const isProcessing = createMut.isPending || updateMut.isPending || deleteMut.isPending

  const handleBack = () => { setViewMode('list'); setSelected(null); setForm({ ...emptyForm }) }
  const handleCancel = () => { if (viewMode === 'edit') { setViewMode('detail'); setForm({ ...emptyForm }) } else handleBack() }
  const handleRowClick = (item: PpeItem) => { setSelected(item); setViewMode('detail') }
  const handleAdd = () => { setSelected(null); setForm({ ...emptyForm }); setViewMode('create') }
  const handleEdit = () => {
    if (!selected) return
    setForm({
      itemCode: selected.itemCode, name: selected.name, category: selected.category,
      modelNo: selected.modelNo, kcCertNo: selected.kcCertNo, grade: selected.grade,
      supplier: selected.supplier, unitPrice: selected.unitPrice,
      replaceCycle: selected.replaceCycle, certExpiry: selected.certExpiry,
      minStock: selected.minStock, note: selected.note,
    })
    setViewMode('edit')
  }

  const fillPersonRef = (req: PpeItemRequest, isCreate: boolean): PpeItemRequest => isCreate
    ? { ...req,
        createdByUserId: (user as any)?.id, createdByName: user?.name, createdByTeam: (user as any)?.team, createdByPosition: (user as any)?.position,
        modifiedByUserId: (user as any)?.id, modifiedByName: user?.name, modifiedByTeam: (user as any)?.team, modifiedByPosition: (user as any)?.position }
    : { ...req,
        modifiedByUserId: (user as any)?.id, modifiedByName: user?.name, modifiedByTeam: (user as any)?.team, modifiedByPosition: (user as any)?.position }

  const handleSave = async () => {
    if (!form.name?.trim()) { showError(t('ppe.item.requireName', '품목명을 입력하세요.')); return }
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
  const handleResetSearch = () => { setSearchInput(''); setSearchText(''); setCategoryFilter(''); setPage(0) }

  // 표준 KPI 카드 — 좌측 4px 컬러 바
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

  // ──────────────────────────────────────────────
  // LIST VIEW
  // ──────────────────────────────────────────────
  if (viewMode === 'list') {
    const items = data?.content || []
    const totalPages = data?.totalPages || 0

    return (
      <Box sx={{ position: 'relative' }}>
        <LoadingOverlay open={isProcessing || isLoading} />

        {/* 상단 KPI */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={4}><KpiPaper label={t('ppe.item.kpiTotal', '전체 품목')} value={kpi?.totalItems ?? '-'} color="#2563eb" /></Grid>
          <Grid item xs={12} md={4}><KpiPaper label={t('ppe.item.kpiCategory', '카테고리 수')} value={kpi?.categoryCount ?? '-'} color="#2563eb" /></Grid>
          <Grid item xs={12} md={4}><KpiPaper label={t('ppe.item.kpiSupplier', '공급업체 수')} value={kpi?.supplierCount ?? '-'} color="#2563eb" /></Grid>
        </Grid>

        {/* PC Toolbar */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <ListSearchBar placeholder={t('ppe.item.searchPh', '품목명·모델·공급업체·코드')}
              value={searchInput} onChange={setSearchInput} onSearch={applySearch}
              sx={{ minWidth: 240 }} />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select displayEmpty value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(0) }}>
                <MenuItem value="">{t('ppe.item.allCategory', '전체 카테고리')}</MenuItem>
                {categoryCodes.map(c => <MenuItem key={c.code} value={c.code}>{getCategoryLabel(c.code)}</MenuItem>)}
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
          <ListSearchBar fullWidth placeholder={t('ppe.item.searchPh', '품목명·모델·공급업체·코드')}
            value={searchInput} onChange={setSearchInput} onSearch={applySearch} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl size="small" sx={{ flex: 1 }}>
              <Select displayEmpty value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(0) }}>
                <MenuItem value="">{t('ppe.item.allCategory', '전체 카테고리')}</MenuItem>
                {categoryCodes.map(c => <MenuItem key={c.code} value={c.code}>{getCategoryLabel(c.code)}</MenuItem>)}
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
                      <TableCell align="center">{t('ppe.item.code', '품목코드')}</TableCell>
                      <TableCell align="center">{t('ppe.item.name', '품목명')}</TableCell>
                      <TableCell align="center">{t('ppe.item.category', '카테고리')}</TableCell>
                      <TableCell align="center">{t('ppe.item.modelNo', '모델번호')}</TableCell>
                      <TableCell align="center">{t('ppe.item.kcCert', 'KC인증')}</TableCell>
                      <TableCell align="center">{t('ppe.item.grade', '등급')}</TableCell>
                      <TableCell align="center">{t('ppe.item.supplier', '공급업체')}</TableCell>
                      <TableCell align="center">{t('ppe.item.cycle', '교체주기')}</TableCell>
                      <TableCell align="center">{t('ppe.item.certExpiry', '인증만료')}</TableCell>
                      <TableCell align="center">{t('common.createdBy', '작성자')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((it) => (
                      <TableRow key={it.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(it)}>
                        <TableCell align="center"><Chip size="small" label={it.itemCode || '-'} color="primary" variant="outlined" /></TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{it.name}</TableCell>
                        <TableCell align="center"><Chip size="small" label={getCategoryLabel(it.category || '') || '-'} /></TableCell>
                        <TableCell align="center">{it.modelNo || '-'}</TableCell>
                        <TableCell align="center">{it.kcCertNo || '-'}</TableCell>
                        <TableCell align="center">{it.grade || '-'}</TableCell>
                        <TableCell align="center">{it.supplier || '-'}</TableCell>
                        <TableCell align="center">{it.replaceCycle ? `${it.replaceCycle}개월` : '-'}</TableCell>
                        <TableCell align="center">{it.certExpiry || '-'}</TableCell>
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
                  <Typography fontWeight="bold" sx={{ mb: 0.5 }}>{it.name}</Typography>
                  <Box sx={{ mb: 1 }}>
                    <Chip size="small" label={getCategoryLabel(it.category || '') || '-'} />
                  </Box>
                  <Typography variant="body2" color="text.secondary">{it.itemCode || '-'} | {it.modelNo || '-'}</Typography>
                  <Typography variant="body2" color="text.secondary">{it.supplier || '-'} | {it.replaceCycle ? `${it.replaceCycle}개월` : '-'}</Typography>
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

  // ──────────────────────────────────────────────
  // DETAIL / CREATE / EDIT VIEW — Paper에 overflow:hidden + borderRadius:1 (border 끊김 해결)
  // ──────────────────────────────────────────────
  const isEdit = viewMode === 'edit' || viewMode === 'create'
  const v: any = isEdit ? form : (selected || {})

  return (
    <Box sx={{ position: 'relative' }}>
      <LoadingOverlay open={isProcessing} />

      <Paper sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
        {/* 품목명 + 카테고리 */}
        <Box sx={rowSx}>
          <Typography sx={labelSx}>
            {t('ppe.item.name', '품목명')}
            {isEdit && <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>}
          </Typography>
          {isEdit ? (
            <Box sx={valueBorderSx}>
              <TextField fullWidth size="small" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Box>
          ) : <Box sx={valueBorderSx}>{v.name || '-'}</Box>}
          <Typography sx={labelSx}>{t('ppe.item.category', '카테고리')}</Typography>
          {isEdit ? (
            <Box sx={valueSx}>
              <Select fullWidth size="small" value={form.category || 'HEAD'} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {categoryCodes.map(c => <MenuItem key={c.code} value={c.code}>{getCategoryLabel(c.code)}</MenuItem>)}
              </Select>
            </Box>
          ) : <Box sx={valueSx}>{getCategoryLabel(v.category || '') || '-'}</Box>}
        </Box>

        {/* 모델 + KC인증 */}
        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('ppe.item.modelNo', '모델번호')}</Typography>
          {isEdit ? (
            <Box sx={valueBorderSx}>
              <TextField fullWidth size="small" value={form.modelNo || ''} onChange={(e) => setForm({ ...form, modelNo: e.target.value })} />
            </Box>
          ) : <Box sx={valueBorderSx}>{v.modelNo || '-'}</Box>}
          <Typography sx={labelSx}>{t('ppe.item.kcCert', 'KC 인증번호')}</Typography>
          {isEdit ? (
            <Box sx={valueSx}>
              <TextField fullWidth size="small" value={form.kcCertNo || ''} onChange={(e) => setForm({ ...form, kcCertNo: e.target.value })} />
            </Box>
          ) : <Box sx={valueSx}>{v.kcCertNo || '-'}</Box>}
        </Box>

        {/* 등급 + 공급업체 */}
        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('ppe.item.grade', '성능 등급')}</Typography>
          {isEdit ? (
            <Box sx={valueBorderSx}>
              <TextField fullWidth size="small" value={form.grade || ''} onChange={(e) => setForm({ ...form, grade: e.target.value })} />
            </Box>
          ) : <Box sx={valueBorderSx}>{v.grade || '-'}</Box>}
          <Typography sx={labelSx}>{t('ppe.item.supplier', '공급업체')}</Typography>
          {isEdit ? (
            <Box sx={valueSx}>
              <TextField fullWidth size="small" value={form.supplier || ''} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
            </Box>
          ) : <Box sx={valueSx}>{v.supplier || '-'}</Box>}
        </Box>

        {/* 단가 + 교체주기 (NumberField) */}
        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('ppe.item.price', '단가(원)')}</Typography>
          <Box sx={valueBorderSx}>
            <NumberField value={isEdit ? form.unitPrice : v.unitPrice} readOnly={!isEdit}
              onChange={(n) => setForm({ ...form, unitPrice: n ?? 0 })} min={0} />
          </Box>
          <Typography sx={labelSx}>{t('ppe.item.cycle', '교체주기(개월)')}</Typography>
          <Box sx={valueSx}>
            <NumberField value={isEdit ? form.replaceCycle : v.replaceCycle} readOnly={!isEdit}
              onChange={(n) => setForm({ ...form, replaceCycle: n ?? 12 })} min={1} thousandSeparator={false} />
          </Box>
        </Box>

        {/* 인증만료 + 최소재고 */}
        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('ppe.item.certExpiry', '인증 만료일')}</Typography>
          {isEdit ? (
            <Box sx={valueBorderSx}>
              <DatePickerField value={form.certExpiry || null} onChange={(d) => setForm({ ...form, certExpiry: d || undefined })} />
            </Box>
          ) : <Box sx={valueBorderSx}>{v.certExpiry || '-'}</Box>}
          <Typography sx={labelSx}>{t('ppe.item.minStock', '최소 재고')}</Typography>
          <Box sx={valueSx}>
            <NumberField value={isEdit ? form.minStock : v.minStock} readOnly={!isEdit}
              onChange={(n) => setForm({ ...form, minStock: n ?? 10 })} min={0} />
          </Box>
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
        {/* 수정자/수정일 — edit/detail 표시 */}
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
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.item.name', '품목명')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography></Typography>
            <TextField fullWidth size="small" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.item.category', '카테고리')}</Typography>
            <Select fullWidth size="small" value={form.category || 'HEAD'} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {categoryCodes.map(c => <MenuItem key={c.code} value={c.code}>{getCategoryLabel(c.code)}</MenuItem>)}
            </Select>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.item.modelNo', '모델번호')}</Typography>
            <TextField fullWidth size="small" value={form.modelNo || ''} onChange={(e) => setForm({ ...form, modelNo: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.item.kcCert', 'KC 인증번호')}</Typography>
            <TextField fullWidth size="small" value={form.kcCertNo || ''} onChange={(e) => setForm({ ...form, kcCertNo: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.item.grade', '성능 등급')}</Typography>
            <TextField fullWidth size="small" value={form.grade || ''} onChange={(e) => setForm({ ...form, grade: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.item.supplier', '공급업체')}</Typography>
            <TextField fullWidth size="small" value={form.supplier || ''} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.item.price', '단가(원)')}</Typography>
            <NumberField value={form.unitPrice} onChange={(n) => setForm({ ...form, unitPrice: n ?? 0 })} min={0} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.item.cycle', '교체주기(개월)')}</Typography>
            <NumberField value={form.replaceCycle} onChange={(n) => setForm({ ...form, replaceCycle: n ?? 12 })} min={1} thousandSeparator={false} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.item.certExpiry', '인증 만료일')}</Typography>
            <DatePickerField value={form.certExpiry || null} onChange={(d) => setForm({ ...form, certExpiry: d || undefined })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.item.minStock', '최소 재고')}</Typography>
            <NumberField value={form.minStock} onChange={(n) => setForm({ ...form, minStock: n ?? 10 })} min={0} />
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
            [t('ppe.item.code', '품목코드'), v.itemCode || '-'],
            [t('ppe.item.name', '품목명'), v.name || '-'],
            [t('ppe.item.category', '카테고리'), getCategoryLabel(v.category || '') || '-'],
            [t('ppe.item.modelNo', '모델번호'), v.modelNo || '-'],
            [t('ppe.item.kcCert', 'KC인증'), v.kcCertNo || '-'],
            [t('ppe.item.grade', '성능 등급'), v.grade || '-'],
            [t('ppe.item.supplier', '공급업체'), v.supplier || '-'],
            [t('ppe.item.unitPrice', '단가(원)'), (v.unitPrice ?? 0).toLocaleString()],
            [t('ppe.item.cycle', '교체주기(월)'), String(v.replaceCycle ?? '-')],
            [t('ppe.item.certExpiry', '인증 만료일'), v.certExpiry || '-'],
            [t('ppe.item.minStock', '최소 재고'), String(v.minStock ?? '-')],
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
    </Box>
  )
}

export default PpeItemTab
