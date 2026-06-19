import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, TextField, Select, MenuItem,
  FormControl, Pagination, Alert, IconButton, Grid, LinearProgress, Chip,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import DepartmentSelectModal from '../common/DepartmentSelectModal'
import NumberField from '../common/NumberField'
import LoadingOverlay from '../common/LoadingOverlay'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import { isSystemAdmin } from '../../utils/auth'
import { formatDateTime } from '../../utils/dateDefaults'
import { formatUserName } from '../../utils/userDisplay'
import { ppeBudgetApi } from '../../api/ppeApi'
import { PpeBudget, PpeBudgetRequest } from '../../types/ppe.types'

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

const currentYear = new Date().getFullYear()
const emptyForm: PpeBudgetRequest = {
  budgetYear: currentYear, department: '',
  budgetAmount: 0, spentAmount: 0, note: '',
}

const PpeBudgetTab: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()
  const { user } = useAuth()
  const isAdmin = isSystemAdmin(user)

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selected, setSelected] = useState<PpeBudget | null>(null)
  const [form, setForm] = useState<PpeBudgetRequest>({ ...emptyForm })
  const [page, setPage] = useState(0)
  const [yearFilter, setYearFilter] = useState<number>(currentYear)
  const [showDeptModal, setShowDeptModal] = useState(false)
  const pageSize = 10

  const handleDeptSelect = (deptName: string) => {
    setForm({ ...form, department: deptName })
    setShowDeptModal(false)
  }

  const queryKey = ['ppeBudgets', yearFilter, page]
  const queryFn = () => ppeBudgetApi.getAll(page, pageSize)
  const { data, isLoading } = useQuery({ queryKey, queryFn, enabled: viewMode === 'list' })
  const { data: kpi } = useQuery({ queryKey: ['ppeBudgetKpi', yearFilter], queryFn: () => ppeBudgetApi.getKpi(yearFilter) })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['ppeBudgets'] })
    qc.invalidateQueries({ queryKey: ['ppeBudgetKpi'] })
  }
  const createMut = useMutation({
    mutationFn: (req: PpeBudgetRequest) => ppeBudgetApi.create(req),
    onSuccess: () => { invalidate(); showSuccess(t('common.saved', '저장되었습니다.')); handleBack() },
    onError: () => showError(t('common.error', '오류가 발생했습니다.')),
  })
  const updateMut = useMutation({
    mutationFn: ({ id, req }: { id: number; req: PpeBudgetRequest }) => ppeBudgetApi.update(id, req),
    onSuccess: () => { invalidate(); showSuccess(t('common.saved', '저장되었습니다.')); handleBack() },
  })
  const deleteMut = useMutation({
    mutationFn: (id: number) => ppeBudgetApi.delete(id),
    onSuccess: () => { invalidate(); showSuccess(t('common.deleted', '삭제되었습니다.')); handleBack() },
  })
  const isProcessing = createMut.isPending || updateMut.isPending || deleteMut.isPending

  const handleBack = () => { setViewMode('list'); setSelected(null); setForm({ ...emptyForm }) }
  const handleRowClick = (item: PpeBudget) => { setSelected(item); setViewMode('detail') }
  const handleAdd = () => { setSelected(null); setForm({ ...emptyForm }); setViewMode('create') }
  const handleEdit = () => {
    if (!selected) return
    setForm({
      budgetYear: selected.budgetYear, department: selected.department,
      budgetAmount: selected.budgetAmount, spentAmount: selected.spentAmount, note: selected.note,
    })
    setViewMode('edit')
  }

  const fillPersonRef = (req: PpeBudgetRequest, isCreate: boolean): PpeBudgetRequest => isCreate
    ? { ...req,
        createdByUserId: (user as any)?.id, createdByName: user?.name, createdByTeam: (user as any)?.team, createdByPosition: (user as any)?.position,
        modifiedByUserId: (user as any)?.id, modifiedByName: user?.name, modifiedByTeam: (user as any)?.team, modifiedByPosition: (user as any)?.position }
    : { ...req,
        modifiedByUserId: (user as any)?.id, modifiedByName: user?.name, modifiedByTeam: (user as any)?.team, modifiedByPosition: (user as any)?.position }

  const handleSave = async () => {
    if (!form.department?.trim()) { showError(t('ppe.budget.requireDept', '부서를 선택하세요.')); return }
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
          <Grid item xs={6} md={3}><KpiPaper label={t('ppe.budget.kpiTotal', '연간 예산')} value={(kpi?.totalBudget || 0).toLocaleString()} color="#2563eb" /></Grid>
          <Grid item xs={6} md={3}><KpiPaper label={t('ppe.budget.kpiSpent', '집행 금액')} value={(kpi?.totalSpent || 0).toLocaleString()} color="#2563eb" /></Grid>
          <Grid item xs={6} md={3}><KpiPaper label={t('ppe.budget.kpiRemain', '잔여 예산')} value={(kpi?.remaining || 0).toLocaleString()} color="#2563eb" /></Grid>
          <Grid item xs={6} md={3}><KpiPaper label={t('ppe.budget.kpiRate', '집행율')} value={`${kpi?.spentRate ?? 0}%`} color="#2563eb" /></Grid>
        </Grid>

        <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select displayEmpty value={yearFilter} onChange={(e) => { setYearFilter(Number(e.target.value)); setPage(0) }}>
                {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                  <MenuItem key={y} value={y}>{y}년</MenuItem>
                ))}
              </Select>
            </FormControl>
            <IconButton onClick={() => { setYearFilter(currentYear); setPage(0) }} size="small"><RefreshIcon /></IconButton>
          </Box>
          {isAdmin && (
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAdd}>New</Button>
          )}
        </Box>

        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl size="small" sx={{ flex: 1 }}>
              <Select displayEmpty value={yearFilter} onChange={(e) => { setYearFilter(Number(e.target.value)); setPage(0) }}>
                {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                  <MenuItem key={y} value={y}>{y}년</MenuItem>
                ))}
              </Select>
            </FormControl>
            <IconButton onClick={() => { setYearFilter(currentYear); setPage(0) }} size="small"><RefreshIcon /></IconButton>
          </Box>
          {isAdmin && (
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAdd} fullWidth>New</Button>
          )}
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
                      <TableCell align="center">{t('ppe.budget.year', '연도')}</TableCell>
                      <TableCell align="center">{t('ppe.budget.dept', '부서')}</TableCell>
                      <TableCell align="right">{t('ppe.budget.budget', '배정 예산(원)')}</TableCell>
                      <TableCell align="right">{t('ppe.budget.spent', '집행(원)')}</TableCell>
                      <TableCell align="center">{t('ppe.budget.rate', '집행율')}</TableCell>
                      <TableCell align="right">{t('ppe.budget.remain', '잔여(원)')}</TableCell>
                      <TableCell align="center">{t('common.createdBy', '작성자')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((it) => {
                      const rate = it.spentRate || 0
                      const pc = rate >= 90 ? 'warning' : rate >= 70 ? 'primary' : 'success'
                      return (
                        <TableRow key={it.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(it)}>
                          <TableCell align="center">{it.budgetYear}</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600 }}>{it.department || '-'}</TableCell>
                          <TableCell align="right">{(it.budgetAmount || 0).toLocaleString()}</TableCell>
                          <TableCell align="right" sx={{ color: 'info.main' }}>{(it.spentAmount || 0).toLocaleString()}</TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress variant="determinate" value={Math.min(100, rate)} color={pc} sx={{ flex: 1, height: 6, borderRadius: 1 }} />
                              <Typography variant="caption" sx={{ minWidth: 36, fontFamily: 'monospace' }}>{rate}%</Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right" sx={{ color: 'success.main' }}>{(it.remainingAmount || 0).toLocaleString()}</TableCell>
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
                const rate = it.spentRate || 0
                const pc: 'warning' | 'primary' | 'success' = rate >= 90 ? 'warning' : rate >= 70 ? 'primary' : 'success'
                return (
                  <Paper key={it.id} sx={{ p: 2, border: 1, borderColor: 'divider', cursor: 'pointer' }} onClick={() => handleRowClick(it)}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography fontWeight="bold">{it.department || '-'}</Typography>
                      <Chip size="small" label={`${rate}%`} color={pc} />
                    </Box>
                    <Typography variant="body2" color="text.secondary">{it.budgetYear} | 예산 {(it.budgetAmount || 0).toLocaleString()}</Typography>
                    <Typography variant="body2" color="text.secondary">집행 {(it.spentAmount || 0).toLocaleString()} / 잔여 {(it.remainingAmount || 0).toLocaleString()}</Typography>
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

  const isEdit = viewMode === 'edit' || viewMode === 'create'
  const v: any = isEdit ? form : (selected || {})

  return (
    <Box sx={{ position: 'relative' }}>
      <LoadingOverlay open={isProcessing} />

      <Paper sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
        <Box sx={rowSx}>
          <Typography sx={labelSx}>
            {t('ppe.budget.year', '연도')}
            {isEdit && <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>}
          </Typography>
          <Box sx={valueBorderSx}>
            <NumberField value={isEdit ? form.budgetYear : v.budgetYear} readOnly={!isEdit}
              onChange={(n) => setForm({ ...form, budgetYear: n ?? currentYear })}
              min={2000} max={2100} thousandSeparator={false} />
          </Box>
          <Typography sx={labelSx}>
            {t('ppe.budget.dept', '부서')}
            {isEdit && <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>}
          </Typography>
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
          <Typography sx={labelSx}>{t('ppe.budget.budget', '배정 예산(원)')}</Typography>
          <Box sx={valueBorderSx}>
            <NumberField value={isEdit ? form.budgetAmount : v.budgetAmount} readOnly={!isEdit}
              onChange={(n) => setForm({ ...form, budgetAmount: n ?? 0 })} min={0} />
          </Box>
          <Typography sx={labelSx}>{t('ppe.budget.spent', '집행 금액(원)')}</Typography>
          <Box sx={valueSx}>
            <NumberField value={isEdit ? form.spentAmount : v.spentAmount} readOnly={!isEdit}
              onChange={(n) => setForm({ ...form, spentAmount: n ?? 0 })} min={0} />
          </Box>
        </Box>

        {viewMode === 'detail' && selected && (
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('ppe.budget.rate', '집행율')}</Typography>
            <Box sx={valueBorderSx}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <LinearProgress variant="determinate" value={Math.min(100, selected.spentRate || 0)}
                  color={(selected.spentRate || 0) >= 90 ? 'warning' : 'success'}
                  sx={{ flex: 1, height: 8, borderRadius: 1 }} />
                <Typography variant="body2" fontWeight="bold">{selected.spentRate}%</Typography>
              </Box>
            </Box>
            <Typography sx={labelSx}>{t('ppe.budget.remain', '잔여 예산(원)')}</Typography>
            <Box sx={{ ...valueSx, color: 'success.main', fontWeight: 'bold' }}>{(selected.remainingAmount || 0).toLocaleString()}</Box>
          </Box>
        )}

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
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.budget.year', '연도')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography></Typography>
            <NumberField value={form.budgetYear} onChange={(n) => setForm({ ...form, budgetYear: n ?? currentYear })} min={2000} max={2100} thousandSeparator={false} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.budget.dept', '부서')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography></Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField fullWidth size="small" value={form.department || ''} InputProps={{ readOnly: true }} placeholder={t('common.selectDept', '부서 선택') as string} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setShowDeptModal(true)}><PersonSearchIcon fontSize="small" /></Button>
            </Box>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.budget.budget', '배정 예산(원)')}</Typography>
            <NumberField value={form.budgetAmount} onChange={(n) => setForm({ ...form, budgetAmount: n ?? 0 })} min={0} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppe.budget.spent', '집행 금액(원)')}</Typography>
            <NumberField value={form.spentAmount} onChange={(n) => setForm({ ...form, spentAmount: n ?? 0 })} min={0} />
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
            [t('ppe.budget.year', '연도'), String(v.budgetYear ?? '-')],
            [t('ppe.budget.dept', '부서'), v.department || '-'],
            [t('ppe.budget.budget', '배정 예산(원)'), (v.budgetAmount ?? 0).toLocaleString()],
            [t('ppe.budget.spent', '집행 금액(원)'), (v.spentAmount ?? 0).toLocaleString()],
            [t('ppe.budget.remain', '잔여 예산(원)'), (v.remainingAmount ?? 0).toLocaleString()],
            [t('ppe.budget.rate', '집행율'), `${v.spentRate ?? 0}%`],
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

      <DepartmentSelectModal
        open={showDeptModal}
        onClose={() => setShowDeptModal(false)}
        onConfirm={handleDeptSelect}
        initialDepartment={form.department || ''}
        title={t('ppe.budget.selectDept', '부서 선택') as string}
      />
    </Box>
  )
}

export default PpeBudgetTab
