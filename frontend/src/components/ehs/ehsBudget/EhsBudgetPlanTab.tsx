import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, TextField, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Typography,
  CircularProgress, Alert, Chip, Select, MenuItem,
  FormControl, Grid,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../../contexts/AlertContext'
import axiosInstance from '../../../api/axiosInstance'
import { EhsBudgetPlan, EhsBudgetPlanRequest, EhsBudgetExpense } from '../../../types/ehsBudget.types'
import { ApiResponse } from '../../../types/common.types'
import NumberField from '../../common/NumberField'
import LoadingOverlay from '../../common/LoadingOverlay'
import useCodeMap from '../../../hooks/useCodeMap'
import { useAuth } from '../../../context/AuthContext'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const currentYear = new Date().getFullYear()

// ===== API =====
const fetchPlansByYear = async (year: number): Promise<EhsBudgetPlan[]> => {
  const res = await axiosInstance.get<ApiResponse<EhsBudgetPlan[] | { content: EhsBudgetPlan[] }>>(`/ehs-budget-plans?year=${year}`)
  const data = res.data.data
  return Array.isArray(data) ? data : (data?.content || [])
}

const fetchExpensesByYear = async (year: number): Promise<EhsBudgetExpense[]> => {
  const res = await axiosInstance.get<ApiResponse<EhsBudgetExpense[] | { content: EhsBudgetExpense[] }>>(`/ehs-budget-expenses/by-year/${year}`)
  const data = res.data.data
  return Array.isArray(data) ? data : (data?.content || [])
}

const fetchPlanDetail = async (id: number): Promise<EhsBudgetPlan> => {
  const res = await axiosInstance.get<ApiResponse<EhsBudgetPlan>>(`/ehs-budget-plans/${id}`)
  return res.data.data
}

const createPlan = async (data: EhsBudgetPlanRequest): Promise<EhsBudgetPlan> => {
  const res = await axiosInstance.post<ApiResponse<EhsBudgetPlan>>('/ehs-budget-plans', data)
  return res.data.data
}

const updatePlan = async ({ id, data }: { id: number; data: EhsBudgetPlanRequest }): Promise<EhsBudgetPlan> => {
  const res = await axiosInstance.put<ApiResponse<EhsBudgetPlan>>(`/ehs-budget-plans/${id}`, data)
  return res.data.data
}

const deletePlan = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/ehs-budget-plans/${id}`)
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

const EhsBudgetPlanTab: React.FC = () => {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const { showWarning, showSuccess, showConfirm } = useAlert()
  const { user } = useAuth()
  const { codeList: categoryCodes, getLabel: getCategoryLabel } = useCodeMap('EHS_BUDGET_CATEGORY')
  const currentWriter = user?.name || user?.username || ''

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<EhsBudgetPlan | null>(null)
  const [year, setYear] = useState(currentYear)
  const [categoryFilter, setCategoryFilter] = useState('')

  const emptyForm: EhsBudgetPlanRequest = {
    budgetYear: currentYear,
    category: '',
    itemName: '',
    planAmount: 0,
    note: '',
    writer: currentWriter,
  }
  const [formData, setFormData] = useState<EhsBudgetPlanRequest>(emptyForm)

  // ===== Queries =====
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['ehsBudgetPlans', year],
    queryFn: () => fetchPlansByYear(year),
    enabled: viewMode === 'list',
  })

  const { data: expenses = [] } = useQuery({
    queryKey: ['ehsBudgetExpenses-byYear', year],
    queryFn: () => fetchExpensesByYear(year),
    enabled: viewMode === 'list',
  })

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['ehsBudgetPlanDetail', selectedItem?.id],
    queryFn: () => fetchPlanDetail(selectedItem!.id),
    enabled: !!selectedItem?.id && (viewMode === 'detail' || viewMode === 'edit'),
  })

  // ===== Mutations =====
  const createMutation = useMutation({
    mutationFn: createPlan,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['ehsBudgetPlans'] })
      queryClient.invalidateQueries({ queryKey: ['ehsBudgetPlans-byYear'] })
      await showSuccess(t('common.saved', '저장되었습니다'))
      handleBackToList()
    },
  })

  const updateMutation = useMutation({
    mutationFn: updatePlan,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['ehsBudgetPlans'] })
      queryClient.invalidateQueries({ queryKey: ['ehsBudgetPlans-byYear'] })
      queryClient.invalidateQueries({ queryKey: ['ehsBudgetPlanDetail'] })
      await showSuccess(t('common.saved', '저장되었습니다'))
      handleBackToList()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deletePlan,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['ehsBudgetPlans'] })
      queryClient.invalidateQueries({ queryKey: ['ehsBudgetPlans-byYear'] })
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

  const handleRowClick = (item: EhsBudgetPlan) => {
    setSelectedItem(item)
    setViewMode('detail')
  }

  const handleAddClick = () => {
    setSelectedItem(null)
    setFormData({ ...emptyForm, budgetYear: year, writer: currentWriter })
    setViewMode('create')
  }

  const handleEditClick = () => {
    if (!detail) return
    setFormData({
      budgetYear: detail.budgetYear,
      category: detail.category,
      itemName: detail.itemName,
      planAmount: detail.planAmount,
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
    const confirmed = await showConfirm(t('common.confirmSave', '저장하시겠습니까?'))
    if (!confirmed) return

    if (viewMode === 'create') {
      createMutation.mutate(formData)
    } else if (viewMode === 'edit' && selectedItem) {
      updateMutation.mutate({ id: selectedItem.id, data: formData })
    }
  }

  const filteredItems = (categoryFilter ? items.filter(i => i.category === categoryFilter) : items)
    .slice()
    .sort((a, b) => {
      // 1) 연도 오름차순
      if ((a.budgetYear || 0) !== (b.budgetYear || 0)) return (a.budgetYear || 0) - (b.budgetYear || 0)
      // 2) 분류 이름 오름차순 (라벨 기준)
      const ca = getCategoryLabel(a.category) || a.category || ''
      const cb = getCategoryLabel(b.category) || b.category || ''
      const cmp = ca.localeCompare(cb)
      if (cmp !== 0) return cmp
      // 3) 항목명 오름차순
      return (a.itemName || '').localeCompare(b.itemName || '')
    })

  // ===== KPI / 점유율 계산 =====
  const totalPlanned = useMemo(
    () => items.reduce((s, i) => s + (i.planAmount || 0), 0),
    [items]
  )
  const totalUsed = useMemo(
    () => expenses.reduce((s, e) => s + (e.amount || 0), 0),
    [expenses]
  )
  const distinctCategories = useMemo(
    () => new Set(items.map(i => i.category)).size,
    [items]
  )

  const sharePercent = (amount: number) => {
    if (!totalPlanned || totalPlanned <= 0) return 0
    return Math.round((amount / totalPlanned) * 1000) / 10 // 소수 1자리
  }

  // ===== RENDER: List =====
  if (viewMode === 'list') {
    const kpiCards = [
      { label: t('budget.totalPlanned', '계획 총액'), value: formatNumber(totalPlanned), color: '#3b82f6' },
      { label: t('budget.totalUsed', '사용 총액'),    value: formatNumber(totalUsed),    color: '#22c55e' },
      { label: t('budget.categoryCount', '분류 수'),  value: distinctCategories,         color: '#8b5cf6' },
    ]
    return (
      <Box>
        {/* 상단 KPI 3개 */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {kpiCards.map((card, idx) => (
            <Grid item xs={12} md={4} key={idx}>
              <Paper sx={(theme: any) => ({ p: 2, borderLeft: 4, borderColor: card.color, borderLeftColor: card.color, ...(theme.isYesco && { borderTop: 1, borderRight: 1, borderBottom: 1, borderColor: '#0F2147', borderLeftColor: card.color }) })}>
                <Typography variant="caption" color="text.secondary">{card.label}</Typography>
                <Typography variant="h6" fontWeight="bold" sx={{ mt: 0.5 }}>{card.value}</Typography>
              </Paper>
            </Grid>
          ))}
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
            {/* 테이블 - PC : 번호 / 연도 / 분류 / 항목명 / 항목금액 / 계획총액 / 점유율 / 비고 */}
            <TableContainer sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={hSx} align="center">{t('common.no', 'No')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('budget.year', '연도')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('budget.category', '분류')}</TableCell>
                    <TableCell sx={hSx}>{t('budget.itemName', '항목명')}</TableCell>
                    <TableCell sx={hSx} align="right">{t('budget.itemAmount', '항목금액')}</TableCell>
                    <TableCell sx={hSx} align="right">{t('budget.totalPlanned', '계획총액')}</TableCell>
                    <TableCell sx={hSx} align="right">{t('budget.share', '점유율')}</TableCell>
                    <TableCell sx={hSx}>{t('budget.note', '비고')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredItems.map((item, idx) => (
                    <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                      <TableCell align="center">{idx + 1}</TableCell>
                      <TableCell align="center">{item.budgetYear}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={getCategoryLabel(item.category) || item.category}
                          color={CATEGORY_COLORS[item.category] || 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{item.itemName}</TableCell>
                      <TableCell align="right">{formatNumber(item.planAmount)}</TableCell>
                      <TableCell align="right">{formatNumber(totalPlanned)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>{sharePercent(item.planAmount || 0)}%</TableCell>
                      <TableCell>{item.note || ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Mobile Card List */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
              {filteredItems.map((item, idx) => (
                <Paper key={item.id} sx={{ p: 2, cursor: 'pointer', border: 1, borderColor: 'divider' }} onClick={() => handleRowClick(item)}>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">#{idx + 1}</Typography>
                    <Chip label={`${item.budgetYear}`} size="small" variant="outlined" />
                    <Chip
                      label={getCategoryLabel(item.category) || item.category}
                      color={CATEGORY_COLORS[item.category] || 'default'}
                      size="small"
                    />
                    <Typography fontWeight="bold" sx={{ flex: 1 }}>{item.itemName}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">{t('budget.itemAmount', '항목금액')}</Typography>
                      <Typography variant="body2">{formatNumber(item.planAmount)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">{t('budget.totalPlanned', '계획총액')}</Typography>
                      <Typography variant="body2">{formatNumber(totalPlanned)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">{t('budget.share', '점유율')}</Typography>
                      <Typography variant="body2" fontWeight="bold">{sharePercent(item.planAmount || 0)}%</Typography>
                    </Box>
                    {item.note && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">{t('budget.note', '비고')}</Typography>
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
            <Box sx={labelSx}>{t('budget.itemAmount', '항목금액')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2" fontWeight="bold">{formatNumber(d.planAmount)}</Typography></Box>
            <Box sx={labelSx}>{t('budget.share', '점유율')}</Box>
            <Box sx={valSx}><Typography variant="body2" fontWeight="bold">{sharePercent(d.planAmount || 0)}%</Typography></Box>
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
  // 점유율 = (입력 값 + 기존 계획총액) / (기존 계획총액 + 입력 값) - 단, 신규 등록 시점에서는 본인 항목 포함된 분모로 계산
  // 수정 시: 다른 항목 합 + 새 입력값 으로 분모 재계산
  const otherItemsTotal = viewMode === 'edit' && selectedItem
    ? items.filter(i => i.id !== selectedItem.id).reduce((s, i) => s + (i.planAmount || 0), 0)
    : items.reduce((s, i) => s + (i.planAmount || 0), 0)
  const projectedTotal = otherItemsTotal + (formData.planAmount || 0)
  const projectedShare = projectedTotal > 0
    ? Math.round(((formData.planAmount || 0) / projectedTotal) * 1000) / 10
    : 0

  return (
    <Box>
      <LoadingOverlay open={isProcessing} />
     <Box sx={{ overflowX: 'auto' }}>
      <Box sx={{ minWidth: 720, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
        <Box sx={rowSx}>
          <Box sx={labelSx}>{t('budget.year', '연도')}</Box>
          <Box sx={valBorderSx}>
            <NumberField
              size="small" fullWidth thousandSeparator={false}
              value={formData.budgetYear}
              onChange={(v) => setFormData({ ...formData, budgetYear: v ?? currentYear })}
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
                {categoryCodes.map(c => (
                  <MenuItem key={c.code} value={c.code}>{getCategoryLabel(c.code)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Box sx={labelSx}>{t('budget.itemName', '항목명')} <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Box>
          <Box sx={valSx}>
            <TextField
              size="small" fullWidth
              value={formData.itemName}
              onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
            />
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Box sx={labelSx}>{t('budget.itemAmount', '항목금액')}</Box>
          <Box sx={valBorderSx}>
            <NumberField
              size="small" fullWidth min={0}
              value={formData.planAmount ?? 0}
              onChange={(v) => setFormData({ ...formData, planAmount: v ?? 0 })}
            />
          </Box>
          <Box sx={labelSx}>{t('budget.totalPlanned', '계획총액')}</Box>
          <Box sx={valSx}>
            <Typography variant="body2" fontWeight="bold">{formatNumber(projectedTotal)}</Typography>
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Box sx={labelSx}>{t('budget.share', '점유율')}</Box>
          <Box sx={valSx}>
            <Typography variant="body2" fontWeight="bold">{projectedShare}%</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              ({t('budget.shareAutoCalc', '자동 계산')})
            </Typography>
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
            <Typography variant="body2">{formData.writer || currentWriter}</Typography>
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
    </Box>
  )
}

export default EhsBudgetPlanTab
