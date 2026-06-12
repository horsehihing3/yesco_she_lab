import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, TextField, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Typography,
  CircularProgress, Alert, Chip, Select, MenuItem,
  FormControl, Grid,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../../contexts/AlertContext'
import axiosInstance from '../../../api/axiosInstance'
import {
  EhsBudgetExpense, EhsBudgetExpenseRequest, EhsBudgetPlan,
} from '../../../types/ehsBudget.types'
import { ApiResponse } from '../../../types/common.types'
import NumberField from '../../common/NumberField'
import DatePickerField from '../../common/DatePickerField'
import { todayStr } from '../../../utils/dateDefaults'
import LoadingOverlay from '../../common/LoadingOverlay'
import DepartmentSelectModal from '../../common/DepartmentSelectModal'
import useCodeMap from '../../../hooks/useCodeMap'
import { useAuth } from '../../../context/AuthContext'
import { formatUserName } from '../../../utils/userDisplay'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const currentYear = new Date().getFullYear()

// ===== API =====
const fetchExpensesByYear = async (year: number): Promise<EhsBudgetExpense[]> => {
  const res = await axiosInstance.get<ApiResponse<EhsBudgetExpense[] | { content: EhsBudgetExpense[] }>>(`/ehs-budget-expenses?year=${year}`)
  const data = res.data.data
  return Array.isArray(data) ? data : (data?.content || [])
}

const fetchPlansByYear = async (year: number): Promise<EhsBudgetPlan[]> => {
  const res = await axiosInstance.get<ApiResponse<EhsBudgetPlan[] | { content: EhsBudgetPlan[] }>>(`/ehs-budget-plans?year=${year}`)
  const data = res.data.data
  return Array.isArray(data) ? data : (data?.content || [])
}

const fetchExpenseDetail = async (id: number): Promise<EhsBudgetExpense> => {
  const res = await axiosInstance.get<ApiResponse<EhsBudgetExpense>>(`/ehs-budget-expenses/${id}`)
  return res.data.data
}

const createExpense = async (data: EhsBudgetExpenseRequest): Promise<EhsBudgetExpense> => {
  const res = await axiosInstance.post<ApiResponse<EhsBudgetExpense>>('/ehs-budget-expenses', data)
  return res.data.data
}

const updateExpense = async ({ id, data }: { id: number; data: EhsBudgetExpenseRequest }): Promise<EhsBudgetExpense> => {
  const res = await axiosInstance.put<ApiResponse<EhsBudgetExpense>>(`/ehs-budget-expenses/${id}`, data)
  return res.data.data
}

const deleteExpense = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/ehs-budget-expenses/${id}`)
}

// ===== Constants =====
const CATEGORY_COLORS: Record<string, 'error' | 'success' | 'info' | 'warning' | 'secondary' | 'default' | 'primary'> = {
  SAFETY: 'error',
  PPE: 'warning',
  TRAINING: 'info',
  HEALTH: 'success',
  ENV_MEASURE: 'primary',
  EMERGENCY: 'secondary',
  FACILITY: 'default',
  ETC: 'default',
}

// 예산 수립 KPI 카드와 같은 borderLeft 색상 패턴 (분류별 색상)
const CATEGORY_BORDER_COLORS: Record<string, string> = {
  SAFETY:      '#ef4444', // red
  PPE:         '#f59e0b', // amber
  TRAINING:    '#3b82f6', // blue
  HEALTH:      '#22c55e', // green
  ENV_MEASURE: '#06b6d4', // cyan
  EMERGENCY:   '#8b5cf6', // violet
  FACILITY:    '#64748b', // slate
  ETC:         '#a3a3a3', // neutral
}

const labelSx = {
  width: 120, minWidth: 120, fontWeight: 'bold', bgcolor: 'grey.100',
  px: 2, py: 1.5, borderRight: 1, borderColor: 'divider',
  display: 'flex', alignItems: 'center', fontSize: '0.875rem',
  justifyContent: 'center', wordBreak: 'keep-all' as const, textAlign: 'center' as const,
}
const valSx = { flex: 1, px: 2, py: 1, bgcolor: 'background.paper', display: 'flex', alignItems: 'center' }
const valBorderSx = { ...valSx, borderRight: 1, borderColor: 'divider' }
const hSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }
const rowSx = { display: 'flex', borderBottom: 1, borderColor: 'divider' }
const lastRowSx = { display: 'flex', borderColor: 'divider' }

const formatNumber = (n: number | null | undefined): string => {
  if (n == null) return '0'
  return Number(n).toLocaleString()
}

const formatDateTime = (dateString?: string | null) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}`
}

const EhsBudgetExpenseTab: React.FC = () => {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const { showWarning, showSuccess, showConfirm, showError } = useAlert()
  const { user } = useAuth()
  const { codeList: categoryCodes, getLabel: getCategoryLabel } = useCodeMap('EHS_BUDGET_CATEGORY')
  const currentWriter = user?.name || user?.username || ''

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<EhsBudgetExpense | null>(null)
  const [year, setYear] = useState(currentYear)
  const [categoryFilter, setCategoryFilter] = useState('')

  const emptyForm: EhsBudgetExpenseRequest = {
    budgetYear: currentYear,
    category: '',
    itemName: '',
    amount: 0,
    expenseDate: '',
    department: '',
    note: '',
    writer: currentWriter,
  }
  const [formData, setFormData] = useState<EhsBudgetExpenseRequest>(emptyForm)
  const [deptModalOpen, setDeptModalOpen] = useState(false)

  // ===== Queries =====
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['ehsBudgetExpenses', year],
    queryFn: () => fetchExpensesByYear(year),
    enabled: viewMode === 'list',
  })

  const { data: plans = [] } = useQuery({
    queryKey: ['ehsBudgetPlans-byYear', year],
    queryFn: () => fetchPlansByYear(year),
    enabled: viewMode === 'list',
  })

  // 등록/수정 폼에서 선택한 분류의 예산/사용 금액 요약용
  const { data: formYearPlans = [] } = useQuery({
    queryKey: ['ehsBudgetPlans-byYear', formData.budgetYear],
    queryFn: () => fetchPlansByYear(formData.budgetYear),
    enabled: viewMode === 'create' || viewMode === 'edit',
  })
  const { data: formYearExpenses = [] } = useQuery({
    queryKey: ['ehsBudgetExpenses-byYear', formData.budgetYear],
    queryFn: () => fetchExpensesByYear(formData.budgetYear),
    enabled: viewMode === 'create' || viewMode === 'edit',
  })

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['ehsBudgetExpenseDetail', selectedItem?.id],
    queryFn: () => fetchExpenseDetail(selectedItem!.id),
    enabled: !!selectedItem?.id && (viewMode === 'detail' || viewMode === 'edit'),
  })

  // ===== Mutations =====
  const createMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['ehsBudgetExpenses'] })
      queryClient.invalidateQueries({ queryKey: ['ehsBudgetExpenses-byYear'] })
      await showSuccess(t('common.saved', '저장되었습니다'))
      handleBackToList()
    },
    onError: (err: unknown) => {
      const msg = (err as any)?.response?.data?.message
      showError(msg || t('common.saveFailed', '저장에 실패했습니다'))
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateExpense,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['ehsBudgetExpenses'] })
      queryClient.invalidateQueries({ queryKey: ['ehsBudgetExpenses-byYear'] })
      queryClient.invalidateQueries({ queryKey: ['ehsBudgetExpenseDetail'] })
      await showSuccess(t('common.saved', '저장되었습니다'))
      handleBackToList()
    },
    onError: (err: unknown) => {
      const msg = (err as any)?.response?.data?.message
      showError(msg || t('common.saveFailed', '저장에 실패했습니다'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['ehsBudgetExpenses'] })
      queryClient.invalidateQueries({ queryKey: ['ehsBudgetExpenses-byYear'] })
      await showSuccess(t('common.deleted', '삭제되었습니다'))
      handleBackToList()
    },
  })

  const isProcessing = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  // ===== Handlers =====
  const handleBackToList = () => {
    setViewMode('list')
    setSelectedItem(null)
    setFormData({ ...emptyForm, budgetYear: year })
  }

  const handleRowClick = (item: EhsBudgetExpense) => {
    setSelectedItem(item)
    setViewMode('detail')
  }

  const handleAddClick = () => {
    setSelectedItem(null)
    setFormData({ ...emptyForm, budgetYear: year, writer: currentWriter, expenseDate: todayStr() })
    setViewMode('create')
  }

  const handleEditClick = () => {
    if (!detail) return
    setFormData({
      budgetYear: detail.budgetYear,
      category: detail.category,
      itemName: detail.itemName,
      amount: detail.amount,
      expenseDate: detail.expenseDate || '',
      department: detail.department || '',
      note: detail.note || '',
      writer: detail.writer || currentWriter,
    })
    setViewMode('edit')
  }

  const handleDeleteClick = async () => {
    if (!selectedItem) return
    const confirmed = await showConfirm(
      t('common.confirmDelete', '정말로 삭제하시겠습니까?'),
      { title: t('common.delete', '삭제') }
    )
    if (confirmed) {
      deleteMutation.mutate(selectedItem.id)
    }
  }

  const handleSubmit = async () => {
    if (!formData.category) {
      showWarning(t('budget.category', '분류') + ' ' + t('common.required', '필수입니다'))
      return
    }
    if (!formData.itemName) {
      showWarning(t('budget.itemName', '항목명') + ' ' + t('common.required', '필수입니다'))
      return
    }
    if (!formData.amount || formData.amount <= 0) {
      showWarning(t('budget.amount', '금액') + ' ' + t('common.required', '필수입니다'))
      return
    }
    const confirmed = await showConfirm(t('common.confirmSave', '저장하시겠습니까?'))
    if (!confirmed) return

    const payload = {
      ...formData,
      expenseDate: formData.expenseDate || undefined,
    }
    if (viewMode === 'create') {
      createMutation.mutate(payload)
    } else if (viewMode === 'edit' && selectedItem) {
      updateMutation.mutate({ id: selectedItem.id, data: payload })
    }
  }

  const filteredItems = categoryFilter ? items.filter(i => i.category === categoryFilter) : items

  // 분류별 사용금액 집계
  const sumByCategory: Record<string, number> = items.reduce((acc, i) => {
    if (i.category) acc[i.category] = (acc[i.category] || 0) + (i.amount || 0)
    return acc
  }, {} as Record<string, number>)

  // 분류별 예산수립 금액 집계 — 같은 연도 plan 들 합산
  const planByCategory: Record<string, number> = plans.reduce((acc, p) => {
    if (p.category) acc[p.category] = (acc[p.category] || 0) + (p.planAmount || 0)
    return acc
  }, {} as Record<string, number>)

  // 계획 총액 / 사용 총액 — 예산 수립 탭과 동일 계산
  const totalPlanned = useMemo(
    () => plans.reduce((s, p) => s + (p.planAmount || 0), 0),
    [plans]
  )
  const totalUsed = useMemo(
    () => items.reduce((s, e) => s + (e.amount || 0), 0),
    [items]
  )

  // ===== RENDER: List =====
  if (viewMode === 'list') {
    return (
      <Box>
        {/* 상단 KPI — 계획 총액 / 사용 총액 (예산 수립 탭과 동일) */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={(theme: any) => ({ p: 2.5, pl: 3, position: 'relative', overflow: 'hidden', ...(theme.isYesco && { border: 1, borderColor: '#0F2147' }), '&::before': { content: '""', position: 'absolute', top: 0, bottom: 0, left: 0, width: 4, backgroundColor: theme.isYesco ? '#E60012' : '#2563eb', borderTopLeftRadius: 'inherit', borderBottomLeftRadius: 'inherit' } })}>
              <Typography variant="caption" color="text.secondary">{t('budget.totalPlanned', '계획 총액')}</Typography>
              <Typography variant="h6" fontWeight="bold" sx={{ mt: 0.5 }}>{formatNumber(totalPlanned)}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={(theme: any) => ({ p: 2.5, pl: 3, position: 'relative', overflow: 'hidden', ...(theme.isYesco && { border: 1, borderColor: '#0F2147' }), '&::before': { content: '""', position: 'absolute', top: 0, bottom: 0, left: 0, width: 4, backgroundColor: theme.isYesco ? '#E60012' : '#2563eb', borderTopLeftRadius: 'inherit', borderBottomLeftRadius: 'inherit' } })}>
              <Typography variant="caption" color="text.secondary">{t('budget.totalUsed', '사용 총액')}</Typography>
              <Typography variant="h6" fontWeight="bold" sx={{ mt: 0.5 }}>{formatNumber(totalUsed)}</Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* 분류별 카드 — 예산수립 금액 / 사용금액 / 잔여 노출, 분류별 borderLeft 색상 */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          {categoryCodes.map((c) => {
            const planned = planByCategory[c.code] || 0
            const used = sumByCategory[c.code] || 0
            const remaining = planned - used
            const overspent = remaining < 0
            const borderColor = CATEGORY_BORDER_COLORS[c.code] || '#a3a3a3'
            return (
              <Grid item xs={6} sm={4} md={3} lg={1.5} key={c.code}>
                <Paper sx={(theme: any) => ({ p: 2.5, pl: 3, position: 'relative', overflow: 'hidden', ...(theme.isYesco && { border: 1, borderColor: '#0F2147' }), '&::before': { content: '""', position: 'absolute', top: 0, bottom: 0, left: 0, width: 4, backgroundColor: theme.isYesco ? '#E60012' : '#2563eb', borderTopLeftRadius: 'inherit', borderBottomLeftRadius: 'inherit' } })}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>
                    {getCategoryLabel(c.code) || c.code}
                  </Typography>
                  <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <Typography variant="caption" color="text.secondary">예산</Typography>
                      <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.85rem' }}>
                        {formatNumber(planned)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <Typography variant="caption" color="text.secondary">사용</Typography>
                      <Typography variant="body2" fontWeight="bold" color="#22c55e" sx={{ fontSize: '0.85rem' }}>
                        {formatNumber(used)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: 1, borderColor: 'grey.200', pt: 0.25, mt: 0.25 }}>
                      <Typography variant="caption" color="text.secondary">잔여</Typography>
                      <Typography variant="body2" fontWeight="bold"
                        color={overspent ? 'error.main' : 'text.primary'}
                        sx={{ fontSize: '0.85rem' }}>
                        {formatNumber(remaining)}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            )
          })}
        </Grid>

        {/* Toolbar - PC */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, mb: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <Select value={year} onChange={(e) => setYear(Number(e.target.value))} displayEmpty>
              <MenuItem value="" disabled>선택하세요</MenuItem>
              {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} displayEmpty>
              <MenuItem value="">{t('common.all', '전체')}</MenuItem>
              {categoryCodes.map(c => (
                <MenuItem key={c.code} value={c.code}>{getCategoryLabel(c.code)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddClick} size="small">
            {t('common.new', '신규')}
          </Button>
        </Box>
        {/* Toolbar - Mobile */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <Select value={year} onChange={(e) => setYear(Number(e.target.value))} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ flex: 1 }}>
              <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} displayEmpty>
                <MenuItem value="">{t('common.all', '전체')}</MenuItem>
                {categoryCodes.map(c => (
                  <MenuItem key={c.code} value={c.code}>{getCategoryLabel(c.code)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Button variant="contained" fullWidth startIcon={<AddIcon />} onClick={handleAddClick} size="small">
            {t('common.new', '신규')}
          </Button>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : filteredItems.length === 0 ? (
          <Alert severity="info">{t('common.noData', '데이터가 없습니다')}</Alert>
        ) : (
          <>
            {/* Table - PC */}
            <TableContainer sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={hSx} align="center">{t('budget.expenseDate', '지출일자')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('budget.category', '분류')}</TableCell>
                    <TableCell sx={hSx}>{t('budget.itemName', '항목명')}</TableCell>
                    <TableCell sx={hSx}>{t('budget.executionDepartment', '집행 부서')}</TableCell>
                    <TableCell sx={hSx} align="right">{t('budget.amount', '금액')}</TableCell>
                    <TableCell sx={hSx}>{t('budget.note', '비고')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                      <TableCell align="center">{item.expenseDate || ''}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={getCategoryLabel(item.category) || item.category}
                          color={CATEGORY_COLORS[item.category] || 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{item.itemName}</TableCell>
                      <TableCell>{item.department || ''}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatNumber(item.amount)}</TableCell>
                      <TableCell>{item.note || ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Mobile Card List */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
              {filteredItems.map((item) => (
                <Paper key={item.id} sx={{ p: 2, cursor: 'pointer', border: 1, borderColor: 'divider' }} onClick={() => handleRowClick(item)}>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                    <Chip
                      label={getCategoryLabel(item.category) || item.category}
                      color={CATEGORY_COLORS[item.category] || 'default'}
                      size="small"
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>{item.expenseDate || ''}</Typography>
                    <Typography variant="body2" fontWeight="bold">{formatNumber(item.amount)}</Typography>
                  </Box>
                  <Typography fontWeight="bold" sx={{ mb: 0.5 }}>{item.itemName}</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('budget.executionDepartment', '집행 부서')}</Typography>
                      <Typography variant="body2">{item.department || ''}</Typography>
                    </Box>
                    {item.note && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('budget.note', '비고')}</Typography>
                        <Typography variant="body2">{item.note}</Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              ))}
            </Box>
          </>
        )}
      </Box>
    )
  }

  // ===== RENDER: Detail =====
  if (viewMode === 'detail') {
    if (detailLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
    const d = detail
    if (!d) return <Alert severity="error">{t('common.noData', '데이터가 없습니다')}</Alert>

    return (
      <Box>
       <Box sx={{ overflowX: 'auto' }}>
        <Box sx={{ minWidth: 720, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('budget.year', '연도')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2">{d.budgetYear}</Typography></Box>
            <Box sx={labelSx}>{t('budget.category', '분류')}</Box>
            <Box sx={valSx}>
              <Chip
                label={getCategoryLabel(d.category) || d.category}
                color={CATEGORY_COLORS[d.category] || 'default'}
                size="small"
              />
            </Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('budget.itemName', '항목명')}</Box>
            <Box sx={valSx}><Typography variant="body2">{d.itemName}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('budget.expenseDate', '지출일자')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2">{d.expenseDate || ''}</Typography></Box>
            <Box sx={labelSx}>{t('budget.amount', '금액')}</Box>
            <Box sx={valSx}><Typography variant="body2" fontWeight="bold">{formatNumber(d.amount)}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('budget.executionDepartment', '집행 부서')}</Box>
            <Box sx={valSx}><Typography variant="body2">{d.department || ''}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('budget.note', '비고')}</Box>
            <Box sx={valSx}><Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{d.note || ''}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('budget.writer', '작성자')}</Box>
            <Box sx={valSx}><Typography variant="body2">{d.writer || '-'}</Typography></Box>
          </Box>
          <Box sx={lastRowSx}>
            <Box sx={labelSx}>{t('common.registered', '등록일')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2">{formatDateTime(d.createdAt)}</Typography></Box>
            <Box sx={labelSx}>{t('common.modified', '수정일')}</Box>
            <Box sx={valSx}><Typography variant="body2">{formatDateTime(d.modifiedAt)}</Typography></Box>
          </Box>
        </Box>
       </Box>

        <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' }, gap: 1, mt: 2 }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
            {t('common.backToList', '목록')}
          </Button>
          <Button variant="contained" onClick={handleEditClick} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
            {t('common.edit', '수정')}
          </Button>
          <Button variant="contained" color="error" onClick={handleDeleteClick} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
            {t('common.delete', '삭제')}
          </Button>
        </Box>
      </Box>
    )
  }

  // ===== RENDER: Create / Edit =====
  const selectedCategoryPlan = formData.category
    ? formYearPlans.find(p => p.category === formData.category)
    : undefined
  const selectedCategoryPlanAmount = selectedCategoryPlan?.planAmount ?? 0
  const selectedCategoryUsedAmount = formData.category
    ? formYearExpenses
        .filter(e => e.category === formData.category && (viewMode !== 'edit' || e.id !== selectedItem?.id))
        .reduce((s, e) => s + (e.amount || 0), 0)
    : 0
  const selectedCategoryRemaining = selectedCategoryPlanAmount - selectedCategoryUsedAmount

  return (
    <Box>
      <LoadingOverlay open={isProcessing} />
      {formData.category && (
        <Paper variant="outlined" sx={{ p: 1.5, mb: 2, display: 'flex', gap: { xs: 1, md: 3 }, flexWrap: 'wrap', bgcolor: 'grey.50' }}>
          <Box>
            <Typography variant="caption" color="text.secondary">{t('budget.category', '분류')}</Typography>
            <Typography variant="body2" fontWeight="bold">{getCategoryLabel(formData.category)}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">{t('budget.planAmount', '예산 금액')}</Typography>
            <Typography variant="body2" fontWeight="bold" color="primary">{formatNumber(selectedCategoryPlanAmount)}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">{t('budget.usedAmount', '사용 금액')}</Typography>
            <Typography variant="body2" fontWeight="bold" color={selectedCategoryUsedAmount > selectedCategoryPlanAmount ? 'error' : 'text.primary'}>
              {formatNumber(selectedCategoryUsedAmount)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">{t('budget.remainingAmount', '잔여 금액')}</Typography>
            <Typography variant="body2" fontWeight="bold" color={selectedCategoryRemaining < 0 ? 'error' : 'success.main'}>
              {formatNumber(selectedCategoryRemaining)}
            </Typography>
          </Box>
        </Paper>
      )}
     <Box sx={{ overflowX: 'auto' }}>
      <Box sx={{ minWidth: 720, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
        <Box sx={rowSx}>
          <Box sx={labelSx}>{t('budget.year', '연도')}</Box>
          <Box sx={valBorderSx}>
            <NumberField
              size="small" fullWidth thousandSeparator={false}
              value={formData.budgetYear}
              onChange={(v) => setFormData({ ...formData, budgetYear: v ?? currentYear, category: '' })}
            />
          </Box>
          <Box sx={labelSx}>{t('budget.category', '분류')} <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Box>
          <Box sx={valSx}>
            <FormControl size="small" fullWidth>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                displayEmpty
              >
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {formYearPlans.length === 0 ? (
                  <MenuItem value="" disabled>{t('budget.noPlanForYear', '해당 연도의 예산수립이 없습니다')}</MenuItem>
                ) : formYearPlans.map(p => (
                  <MenuItem key={p.category} value={p.category}>{getCategoryLabel(p.category) || p.category}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Box sx={labelSx}>{t('budget.itemName', '항목명')} <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Box>
          <Box sx={valBorderSx}>
            <TextField
              size="small" fullWidth
              value={formData.itemName}
              onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
            />
          </Box>
          <Box sx={labelSx}>{t('budget.amount', '금액')} <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Box>
          <Box sx={valSx}>
            <NumberField
              size="small" fullWidth min={0}
              value={formData.amount ?? 0}
              onChange={(v) => setFormData({ ...formData, amount: v ?? 0 })}
            />
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Box sx={labelSx}>{t('budget.expenseDate', '지출일자')}</Box>
          <Box sx={valBorderSx}>
            <DatePickerField
              value={formData.expenseDate || ''}
              onChange={(v) => setFormData({ ...formData, expenseDate: v })}
            />
          </Box>
          <Box sx={labelSx}>{t('budget.executionDepartment', '집행 부서')}</Box>
          <Box sx={valSx}>
            <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
              <TextField
                size="small" fullWidth
                value={formData.department || ''}
                InputProps={{ readOnly: true }}
                placeholder={t('common.selectFromOrg', '조직도에서 선택')}
              />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setDeptModalOpen(true)}>
                <PersonSearchIcon fontSize="small" />
              </Button>
            </Box>
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Box sx={labelSx}>{t('budget.note', '비고')}</Box>
          <Box sx={valSx}>
            <TextField
              size="small" fullWidth multiline rows={3}
              value={formData.note || ''}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            />
          </Box>
        </Box>
        <Box sx={lastRowSx}>
          <Box sx={labelSx}>{t('budget.writer', '작성자')}</Box>
          <Box sx={valSx}>
            <Typography variant="body2">{formatUserName(user?.department, user?.name, user?.position) || formData.writer || currentWriter}</Typography>
          </Box>
        </Box>
      </Box>
     </Box>

      <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, gap: 1, mt: 2 }}>
        <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: 1, sm: 'none' } }}>
          {t('common.cancel', '취소')}
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={isProcessing} sx={{ flex: { xs: 1, sm: 'none' } }}>
          {t('common.save', '저장')}
        </Button>
      </Box>

      <DepartmentSelectModal
        open={deptModalOpen}
        onClose={() => setDeptModalOpen(false)}
        initialDepartment={formData.department || ''}
        onConfirm={(dept) => {
          setFormData({ ...formData, department: dept })
          setDeptModalOpen(false)
        }}
      />
    </Box>
  )
}

export default EhsBudgetExpenseTab
