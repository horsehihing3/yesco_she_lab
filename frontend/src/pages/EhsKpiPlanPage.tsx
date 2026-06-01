import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, TextField, Select, MenuItem,
  FormControl, Chip, Pagination, CircularProgress, Alert, IconButton,
  Tabs, Tab, Card, CardContent, LinearProgress, Grid,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import RefreshIcon from '@mui/icons-material/Refresh'
import DatePickerField from '../components/common/DatePickerField'
import NumberField from '../components/common/NumberField'
import { useAlert } from '../contexts/AlertContext'
import UserSelectModal, { UserInfo } from '../components/common/UserSelectModal'
import { ehsKpiPlanApi } from '../api/ehsKpiPlanApi'
import { EhsKpiPlan, EhsKpiPlanRequest } from '../types/ehsKpi.types'
import useCodeMap from '../hooks/useCodeMap'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const STATUS_COLORS: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  ACTIVE: 'success', ON_TRACK: 'success', AT_RISK: 'warning', OFF_TRACK: 'error', COMPLETED: 'info', INACTIVE: 'default',
}
const TYPE_COLORS: Record<string, 'primary' | 'secondary'> = {
  LEADING: 'primary', LAGGING: 'secondary',
}

const labelSx = {
  width: 120, minWidth: 120, fontWeight: 'bold', bgcolor: 'grey.100',
  px: 2, py: 1.5, borderRight: 1, borderColor: 'grey.300',
  display: 'flex', alignItems: 'center', fontSize: '0.875rem',
  justifyContent: 'center', wordBreak: 'keep-all' as const, textAlign: 'center',
}
const valSx = { flex: 1, px: 2, py: 1, bgcolor: 'background.paper', display: 'flex', alignItems: 'center' }
const valBorderSx = { ...valSx, borderRight: 1, borderColor: 'grey.300' }
const hSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }
const rowSx = { display: 'flex', borderBottom: 1, borderColor: 'grey.300' }

const EhsKpiPlanPage: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()
  const [searchParams, setSearchParams] = useSearchParams()

  const { codeList: indicatorTypes, getLabel: getTypeLabel } = useCodeMap('KPI_INDICATOR_TYPE')
  const { codeList: periodTypes, getLabel: getPeriodLabel } = useCodeMap('KPI_PERIOD')
  const { codeList: statusList, getLabel: getStatusLabel } = useCodeMap('KPI_STATUS')
  const { codeList: unitCodes, getLabel: getUnitLabel } = useCodeMap('KPI_UNIT')

  const tabParam = parseInt(searchParams.get('tab') || '0', 10)
  const [activeTab, setActiveTab] = useState(tabParam)

  useEffect(() => {
    const tab = parseInt(searchParams.get('tab') || '0', 10)
    setActiveTab(tab)
  }, [searchParams])

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
    setSearchParams({ tab: String(newValue) })
    handleBackToList()
  }

  // Tab 1 state
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<EhsKpiPlan | null>(null)
  const [page, setPage] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [form, setForm] = useState<EhsKpiPlanRequest>({ indicatorName: '', indicatorType: '' })
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedManager, setSelectedManager] = useState<UserInfo | null>(null)

  const getManagerDisplayName = (user: UserInfo | null) => {
    if (!user) return ''
    return user.name
  }

  const handleUserSelect = (users: UserInfo[]) => {
    if (users.length > 0) {
      const user = users[0]
      setSelectedManager(user)
      setForm({ ...form, responsiblePerson: getManagerDisplayName(user) })
    }
    setShowUserModal(false)
  }

  // Tab 3 state
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear())

  const queryKey = searchText || typeFilter
    ? ['kpiPlanSearch', searchText, typeFilter, page]
    : ['kpiPlan', page]
  const queryFn = () => {
    if (searchText || typeFilter) return ehsKpiPlanApi.search(searchText || undefined, typeFilter || undefined, page, 20)
    return ehsKpiPlanApi.getAll(page, 20)
  }
  const { data, isLoading } = useQuery({ queryKey, queryFn })

  // For tabs 2 & 3, load all data
  const { data: allData } = useQuery({
    queryKey: ['kpiPlanAll'],
    queryFn: () => ehsKpiPlanApi.getAll(0, 1000),
    enabled: activeTab === 1 || activeTab === 2,
  })

  const createMut = useMutation({
    mutationFn: (r: EhsKpiPlanRequest) => ehsKpiPlanApi.create(r),
    onSuccess: () => { invalidateAll(); showSuccess(t('common.saved', '저장되었습니다')); handleBackToList() },
    onError: () => showError(t('common.error', '오류가 발생했습니다')),
  })
  const updateMut = useMutation({
    mutationFn: ({ id, r }: { id: number; r: EhsKpiPlanRequest }) => ehsKpiPlanApi.update(id, r),
    onSuccess: () => { invalidateAll(); showSuccess(t('common.saved', '저장되었습니다')); handleBackToList() },
    onError: () => showError(t('common.error', '오류가 발생했습니다')),
  })
  const deleteMut = useMutation({
    mutationFn: (id: number) => ehsKpiPlanApi.delete(id),
    onSuccess: () => { invalidateAll(); showSuccess(t('common.deleted', '삭제되었습니다')); handleBackToList() },
    onError: () => showError(t('common.error', '오류가 발생했습니다')),
  })

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['kpiPlan'] })
    queryClient.invalidateQueries({ queryKey: ['kpiPlanSearch'] })
    queryClient.invalidateQueries({ queryKey: ['kpiPlanAll'] })
  }

  const handleBackToList = () => { setViewMode('list'); setSelectedItem(null); setForm({ indicatorName: '', indicatorType: '' }) }
  const handleRowClick = (item: EhsKpiPlan) => { setSelectedItem(item); setViewMode('detail') }
  const handleOpenCreate = () => { setSelectedItem(null); setForm({ indicatorName: '', indicatorType: '', planYear: new Date().getFullYear() }); setViewMode('create') }
  const handleOpenEdit = (item: EhsKpiPlan) => {
    setSelectedItem(item)
    setForm({
      indicatorName: item.indicatorName, indicatorType: item.indicatorType,
      planYear: item.planYear, description: item.description, department: item.department,
      responsiblePerson: item.responsiblePerson, measurementPeriod: item.measurementPeriod,
      unit: item.unit, targetValue: item.targetValue, currentValue: item.currentValue,
      achievementRate: item.achievementRate, status: item.status,
      startDate: item.startDate, endDate: item.endDate, notes: item.notes,
    })
    setViewMode('edit')
  }
  const handleSave = () => { selectedItem ? updateMut.mutate({ id: selectedItem.id, r: form }) : createMut.mutate(form) }
  const handleDelete = async (item: EhsKpiPlan) => {
    const ok = await showConfirm(`${item.indicatorName}\n${t('common.delete', '삭제')}하시겠습니까?`)
    if (ok) deleteMut.mutate(item.id)
  }
  const handleReset = () => { setSearchText(''); setTypeFilter(''); setPage(0) }

  const items = data?.content || []
  const totalPages = data?.totalPages || 0
  const allItems = allData?.content || []

  // ===== Tab 1: Indicator Settings =====
  const renderIndicatorSettings = () => {
    if (viewMode === 'detail') return renderDetailView()
    if (viewMode === 'create' || viewMode === 'edit') return renderFormView()

    return (
      <>
        {/* PC search bar */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField size="small" placeholder={t('kpiPlan.searchPlaceholder', '지표명, 부서, 담당자 검색')}
              value={searchText} onChange={(e) => { setSearchText(e.target.value); setPage(0) }}
              onKeyDown={(e) => { if (e.key === 'Enter') setPage(0) }}
              sx={{ minWidth: 220 }}
            />
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <Select displayEmpty value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0) }}>
                <MenuItem value="">{t('kpiPlan.allTypes', '전체 유형')}</MenuItem>
                {indicatorTypes.map((c) => <MenuItem key={c.code} value={c.code}>{getTypeLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
            <IconButton onClick={handleReset} size="small"><RefreshIcon /></IconButton>
          </Box>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate}>New</Button>
        </Box>

        {/* Mobile search bar */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5, mb: 2 }}>
          <TextField size="small" placeholder={t('kpiPlan.searchPlaceholder', '지표명, 부서, 담당자 검색')}
            value={searchText} onChange={(e) => { setSearchText(e.target.value); setPage(0) }} fullWidth
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl size="small" sx={{ flex: 1 }}>
              <Select displayEmpty value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0) }}>
                <MenuItem value="">{t('kpiPlan.allTypes', '전체 유형')}</MenuItem>
                {indicatorTypes.map((c) => <MenuItem key={c.code} value={c.code}>{getTypeLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
            <Button variant="outlined" size="small" onClick={handleReset} startIcon={<RefreshIcon />} sx={{ flex: 1 }}>{t('common.reset', '초기화')}</Button>
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate} sx={{ flex: 1 }}>New</Button>
          </Box>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : items.length === 0 ? (
          <Alert severity="info" sx={{ m: 2 }}>{t('common.noData', '데이터가 없습니다')}</Alert>
        ) : (
          <>
            {/* PC Table */}
            <Paper sx={{ display: { xs: 'none', md: 'block' } }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={hSx}>{t('kpiPlan.indicatorType', '지표유형')}</TableCell>
                      <TableCell sx={hSx}>{t('kpiPlan.indicatorName', '지표명')}</TableCell>
                      <TableCell sx={hSx}>{t('kpiPlan.department', '부서')}</TableCell>
                      <TableCell sx={hSx}>{t('kpiPlan.responsiblePerson', '담당자')}</TableCell>
                      <TableCell sx={hSx}>{t('kpiPlan.period', '측정주기')}</TableCell>
                      <TableCell sx={hSx}>{t('kpiPlan.unit', '단위')}</TableCell>
                      <TableCell sx={hSx} align="right">{t('kpiPlan.targetValue', '목표값')}</TableCell>
                      <TableCell sx={hSx} align="right">{t('kpiPlan.currentValue', '현재값')}</TableCell>
                      <TableCell sx={hSx} align="center" width={150}>{t('kpiPlan.achievementRate', '달성률')}</TableCell>
                      <TableCell sx={hSx} align="center">{t('kpiPlan.status', '상태')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                        <TableCell align="center">
                          <Chip label={getTypeLabel(item.indicatorType) || item.indicatorType} color={TYPE_COLORS[item.indicatorType] || 'default'} size="small" />
                        </TableCell>
                        <TableCell><Typography variant="body2" fontWeight={600}>{item.indicatorName}</Typography></TableCell>
                        <TableCell>{item.department || ''}</TableCell>
                        <TableCell>{item.responsiblePerson || ''}</TableCell>
                        <TableCell>{getPeriodLabel(item.measurementPeriod || '') || item.measurementPeriod || ''}</TableCell>
                        <TableCell>{item.unit || ''}</TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{item.targetValue ?? ''}</TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{item.currentValue ?? ''}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress variant="determinate" value={Math.min(item.achievementRate ?? 0, 100)} sx={{ flex: 1, height: 8, borderRadius: 4 }} />
                            <Typography variant="caption" sx={{ minWidth: 36 }}>{item.achievementRate ?? 0}%</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={getStatusLabel(item.status) || item.status} color={STATUS_COLORS[item.status] || 'default'} size="small" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {/* Mobile cards */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
              {items.map((item) => (
                <Paper key={item.id} sx={{ p: 2, border: 1, borderColor: 'grey.300', cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography fontWeight="bold">{item.indicatorName}</Typography>
                    <Chip label={getTypeLabel(item.indicatorType) || item.indicatorType} color={TYPE_COLORS[item.indicatorType] || 'default'} size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {item.department || ''} | {item.responsiblePerson || ''}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <LinearProgress variant="determinate" value={Math.min(item.achievementRate ?? 0, 100)} sx={{ flex: 1, height: 6, borderRadius: 3 }} />
                    <Typography variant="caption">{item.achievementRate ?? 0}%</Typography>
                    <Chip label={getStatusLabel(item.status) || item.status} color={STATUS_COLORS[item.status] || 'default'} size="small" />
                  </Box>
                </Paper>
              ))}
            </Box>

            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <Pagination count={totalPages} page={page + 1} onChange={(_, p) => setPage(p - 1)} color="primary" />
              </Box>
            )}
          </>
        )}
      </>
    )
  }

  // ===== Detail View =====
  const renderDetailView = () => {
    if (!selectedItem) return null
    const dLabelSx = { ...labelSx, width: 140, minWidth: 140 }
    const dValSx = { flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper' }
    const dValBorderSx = { ...dValSx, borderRight: 1, borderColor: 'grey.300' }

    return (
      <>
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
          <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden' }}>
            <Box sx={rowSx}>
              <Typography sx={dLabelSx}>{t('kpiPlan.indicatorType', '지표유형')}</Typography>
              <Box sx={dValBorderSx}><Chip label={getTypeLabel(selectedItem.indicatorType) || selectedItem.indicatorType} color={TYPE_COLORS[selectedItem.indicatorType] || 'default'} size="small" /></Box>
              <Typography sx={dLabelSx}>{t('kpiPlan.indicatorName', '지표명')}</Typography>
              <Box sx={dValSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.indicatorName}</Typography></Box>
            </Box>
            <Box sx={rowSx}>
              <Typography sx={dLabelSx}>{t('kpiPlan.department', '부서')}</Typography>
              <Box sx={dValBorderSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.department || ''}</Typography></Box>
              <Typography sx={dLabelSx}>{t('kpiPlan.responsiblePerson', '담당자')}</Typography>
              <Box sx={dValSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.responsiblePerson || ''}</Typography></Box>
            </Box>
            <Box sx={rowSx}>
              <Typography sx={dLabelSx}>{t('kpiPlan.planYear', '계획연도')}</Typography>
              <Box sx={dValBorderSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.planYear}</Typography></Box>
              <Typography sx={dLabelSx}>{t('kpiPlan.period', '측정주기')}</Typography>
              <Box sx={dValSx}><Typography variant="body2" sx={{ py: 0.5 }}>{getPeriodLabel(selectedItem.measurementPeriod || '') || selectedItem.measurementPeriod || ''}</Typography></Box>
            </Box>
            <Box sx={rowSx}>
              <Typography sx={dLabelSx}>{t('kpiPlan.unit', '단위')}</Typography>
              <Box sx={dValBorderSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.unit || ''}</Typography></Box>
              <Typography sx={dLabelSx}>{t('kpiPlan.status', '상태')}</Typography>
              <Box sx={dValSx}><Chip label={getStatusLabel(selectedItem.status) || selectedItem.status} color={STATUS_COLORS[selectedItem.status] || 'default'} size="small" /></Box>
            </Box>
            <Box sx={rowSx}>
              <Typography sx={dLabelSx}>{t('kpiPlan.targetValue', '목표값')}</Typography>
              <Box sx={dValBorderSx}><Typography variant="body2" sx={{ py: 0.5, fontFamily: 'monospace', fontWeight: 'bold' }}>{selectedItem.targetValue ?? ''}</Typography></Box>
              <Typography sx={dLabelSx}>{t('kpiPlan.currentValue', '현재값')}</Typography>
              <Box sx={dValSx}><Typography variant="body2" sx={{ py: 0.5, fontFamily: 'monospace', fontWeight: 'bold' }}>{selectedItem.currentValue ?? ''}</Typography></Box>
            </Box>
            <Box sx={rowSx}>
              <Typography sx={dLabelSx}>{t('kpiPlan.achievementRate', '달성률')}</Typography>
              <Box sx={dValSx}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                  <LinearProgress variant="determinate" value={Math.min(selectedItem.achievementRate ?? 0, 100)} sx={{ flex: 1, height: 10, borderRadius: 5 }} />
                  <Typography variant="body2" fontWeight="bold">{selectedItem.achievementRate ?? 0}%</Typography>
                </Box>
              </Box>
            </Box>
            <Box sx={rowSx}>
              <Typography sx={dLabelSx}>{t('kpiPlan.startDate', '시작일')}</Typography>
              <Box sx={dValBorderSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.startDate || ''}</Typography></Box>
              <Typography sx={dLabelSx}>{t('kpiPlan.endDate', '종료일')}</Typography>
              <Box sx={dValSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.endDate || ''}</Typography></Box>
            </Box>
            {selectedItem.description && <Box sx={rowSx}>
              <Typography sx={dLabelSx}>{t('kpiPlan.description', '설명')}</Typography>
              <Box sx={dValSx}><Typography variant="body2" sx={{ py: 0.5, whiteSpace: 'pre-wrap' }}>{selectedItem.description}</Typography></Box>
            </Box>}
            {selectedItem.notes && <Box sx={{ display: 'flex' }}>
              <Typography sx={dLabelSx}>{t('common.notes', '비고')}</Typography>
              <Box sx={dValSx}><Typography variant="body2" sx={{ py: 0.5, whiteSpace: 'pre-wrap' }}>{selectedItem.notes}</Typography></Box>
            </Box>}
          </Box>

          {/* Mobile detail */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 2 }}>
            {[
              [t('kpiPlan.indicatorType', '지표유형'), getTypeLabel(selectedItem.indicatorType) || selectedItem.indicatorType],
              [t('kpiPlan.indicatorName', '지표명'), selectedItem.indicatorName],
              [t('kpiPlan.department', '부서'), selectedItem.department],
              [t('kpiPlan.responsiblePerson', '담당자'), selectedItem.responsiblePerson],
              [t('kpiPlan.planYear', '계획연도'), selectedItem.planYear?.toString()],
              [t('kpiPlan.period', '측정주기'), getPeriodLabel(selectedItem.measurementPeriod || '') || selectedItem.measurementPeriod],
              [t('kpiPlan.unit', '단위'), selectedItem.unit],
              [t('kpiPlan.targetValue', '목표값'), selectedItem.targetValue?.toString()],
              [t('kpiPlan.currentValue', '현재값'), selectedItem.currentValue?.toString()],
              [t('kpiPlan.achievementRate', '달성률'), `${selectedItem.achievementRate ?? 0}%`],
              [t('kpiPlan.status', '상태'), getStatusLabel(selectedItem.status) || selectedItem.status],
              [t('kpiPlan.startDate', '시작일'), selectedItem.startDate],
              [t('kpiPlan.endDate', '종료일'), selectedItem.endDate],
              [t('kpiPlan.description', '설명'), selectedItem.description],
              [t('common.notes', '비고'), selectedItem.notes],
            ].filter(([, v]) => v).map(([label, value], i) => (
              <Box key={i}>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{label}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5, whiteSpace: 'pre-wrap' }}>{value}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>

        <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.list', '목록')}</Button>
          <Button variant="contained" onClick={() => handleOpenEdit(selectedItem)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.edit', '수정')}</Button>
          <Button variant="contained" color="error" onClick={() => handleDelete(selectedItem)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.delete', '삭제')}</Button>
        </Box>
      </>
    )
  }

  // ===== Form View =====
  const renderFormView = () => (
    <>
      {/* PC form */}
      <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
          <Typography sx={labelSx}>{t('kpiPlan.indicatorType', '지표유형')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
          <Box sx={valBorderSx}>
            <Select fullWidth size="small" displayEmpty value={form.indicatorType} onChange={(e) => setForm({ ...form, indicatorType: e.target.value })}>
              <MenuItem value="" disabled>{t('kpiPlan.selectType', '유형 선택')}</MenuItem>
              {indicatorTypes.map((c) => <MenuItem key={c.code} value={c.code}>{getTypeLabel(c.code)}</MenuItem>)}
            </Select>
          </Box>
          <Typography sx={labelSx}>{t('kpiPlan.indicatorName', '지표명')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
          <Box sx={valSx}>
            <TextField fullWidth size="small" value={form.indicatorName} onChange={(e) => setForm({ ...form, indicatorName: e.target.value })} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
          <Typography sx={labelSx}>{t('kpiPlan.planYear', '계획연도')}</Typography>
          <Box sx={valBorderSx}>
            <NumberField fullWidth size="small" thousandSeparator={false} value={form.planYear ?? null} onChange={(v) => setForm({ ...form, planYear: v ?? undefined })} />
          </Box>
          <Typography sx={labelSx}>{t('kpiPlan.status', '상태')}</Typography>
          <Box sx={valSx}>
            <Select fullWidth size="small" displayEmpty value={form.status ?? ''} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <MenuItem value="">{t('kpiPlan.selectStatus', '상태 선택')}</MenuItem>
              {statusList.map((c) => <MenuItem key={c.code} value={c.code}>{getStatusLabel(c.code)}</MenuItem>)}
            </Select>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
          <Typography sx={labelSx}>{t('kpiPlan.department', '부서')}</Typography>
          <Box sx={valBorderSx}>
            <TextField fullWidth size="small" value={form.department ?? ''} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          </Box>
          <Typography sx={labelSx}>{t('kpiPlan.responsiblePerson', '담당자')}</Typography>
          <Box sx={{ ...valSx, display: 'flex', gap: 0 }}>
            <TextField fullWidth size="small" value={selectedManager ? getManagerDisplayName(selectedManager) : (form.responsiblePerson || '')} InputProps={{ readOnly: true }} placeholder={t('environment.selectManager')} />
            <Button variant="outlined" size="small" sx={{ ml: 1, minWidth: 40 }} onClick={() => setShowUserModal(true)}><PersonSearchIcon fontSize="small" /></Button>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
          <Typography sx={labelSx}>{t('kpiPlan.period', '측정주기')}</Typography>
          <Box sx={valBorderSx}>
            <Select fullWidth size="small" displayEmpty value={form.measurementPeriod ?? ''} onChange={(e) => setForm({ ...form, measurementPeriod: e.target.value })}>
              <MenuItem value="">{t('kpiPlan.selectPeriod', '주기 선택')}</MenuItem>
              {periodTypes.map((c) => <MenuItem key={c.code} value={c.code}>{getPeriodLabel(c.code)}</MenuItem>)}
            </Select>
          </Box>
          <Typography sx={labelSx}>{t('kpiPlan.unit', '단위')}</Typography>
          <Box sx={valSx}>
            <Select fullWidth size="small" displayEmpty value={form.unit ?? ''} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
              <MenuItem value="" disabled>{t('chem.selectUnit', '단위 선택')}</MenuItem>
              {unitCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getUnitLabel(c.code)}</MenuItem>)}
            </Select>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
          <Typography sx={labelSx}>{t('kpiPlan.targetValue', '목표값')}</Typography>
          <Box sx={valBorderSx}>
            <NumberField fullWidth size="small" value={form.targetValue ?? null} onChange={(v) => setForm({ ...form, targetValue: v ?? undefined })} />
          </Box>
          <Typography sx={labelSx}>{t('kpiPlan.currentValue', '현재값')}</Typography>
          <Box sx={valSx}>
            <NumberField fullWidth size="small" value={form.currentValue ?? null} onChange={(v) => setForm({ ...form, currentValue: v ?? undefined })} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
          <Typography sx={labelSx}>{t('kpiPlan.achievementRate', '달성률')}</Typography>
          <Box sx={valSx}>
            <NumberField fullWidth size="small" value={form.achievementRate ?? null} onChange={(v) => setForm({ ...form, achievementRate: v ?? undefined })} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
          <Typography sx={labelSx}>{t('kpiPlan.startDate', '시작일')}</Typography>
          <Box sx={valBorderSx}>
            <DatePickerField value={form.startDate || null} onChange={(v) => setForm({ ...form, startDate: v })} size="small" />
          </Box>
          <Typography sx={labelSx}>{t('kpiPlan.endDate', '종료일')}</Typography>
          <Box sx={valSx}>
            <DatePickerField value={form.endDate || null} onChange={(v) => setForm({ ...form, endDate: v })} size="small" />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
          <Typography sx={labelSx}>{t('kpiPlan.description', '설명')}</Typography>
          <Box sx={valSx}>
            <TextField fullWidth size="small" multiline rows={2} value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex' }}>
          <Typography sx={labelSx}>{t('common.notes', '비고')}</Typography>
          <Box sx={valSx}>
            <TextField fullWidth size="small" multiline rows={2} value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Box>
        </Box>
      </Box>

      {/* Mobile form */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 2 }}>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
            {t('kpiPlan.indicatorType', '지표유형')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
          </Typography>
          <FormControl fullWidth size="small">
            <Select displayEmpty value={form.indicatorType} onChange={(e) => setForm({ ...form, indicatorType: e.target.value })}>
              <MenuItem value="" disabled>{t('kpiPlan.selectType', '유형 선택')}</MenuItem>
              {indicatorTypes.map((c) => <MenuItem key={c.code} value={c.code}>{getTypeLabel(c.code)}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
            {t('kpiPlan.indicatorName', '지표명')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
          </Typography>
          <TextField size="small" fullWidth value={form.indicatorName} onChange={(e) => setForm({ ...form, indicatorName: e.target.value })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('kpiPlan.planYear', '계획연도')}</Typography>
          <NumberField size="small" fullWidth thousandSeparator={false} value={form.planYear ?? null} onChange={(v) => setForm({ ...form, planYear: v ?? undefined })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('kpiPlan.department', '부서')}</Typography>
          <TextField size="small" fullWidth value={form.department ?? ''} onChange={(e) => setForm({ ...form, department: e.target.value })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('kpiPlan.responsiblePerson', '담당자')}</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField size="small" fullWidth value={selectedManager ? getManagerDisplayName(selectedManager) : (form.responsiblePerson || '')} InputProps={{ readOnly: true }} placeholder={t('environment.selectManager')} />
            <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setShowUserModal(true)}><PersonSearchIcon fontSize="small" /></Button>
          </Box>
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('kpiPlan.targetValue', '목표값')}</Typography>
          <NumberField size="small" fullWidth value={form.targetValue ?? null} onChange={(v) => setForm({ ...form, targetValue: v ?? undefined })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('kpiPlan.currentValue', '현재값')}</Typography>
          <NumberField size="small" fullWidth value={form.currentValue ?? null} onChange={(v) => setForm({ ...form, currentValue: v ?? undefined })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('kpiPlan.achievementRate', '달성률')}</Typography>
          <NumberField size="small" fullWidth value={form.achievementRate ?? null} onChange={(v) => setForm({ ...form, achievementRate: v ?? undefined })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('kpiPlan.startDate', '시작일')}</Typography>
          <DatePickerField value={form.startDate || null} onChange={(v) => setForm({ ...form, startDate: v })} size="small" />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('kpiPlan.endDate', '종료일')}</Typography>
          <DatePickerField value={form.endDate || null} onChange={(v) => setForm({ ...form, endDate: v })} size="small" />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('kpiPlan.description', '설명')}</Typography>
          <TextField size="small" fullWidth multiline rows={2} value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.notes', '비고')}</Typography>
          <TextField size="small" fullWidth multiline rows={2} value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={() => viewMode === 'edit' ? setViewMode('detail') : handleBackToList()} sx={{ flex: { xs: 1, md: 0 } }}>{t('common.cancel', '취소')}</Button>
        <Button variant="contained" onClick={handleSave} sx={{ flex: { xs: 1, md: 0 } }}>{t('common.save', '저장')}</Button>
      </Box>
    </>
  )

  // ===== Tab 2: KPI Status =====
  const renderKpiStatus = () => {
    const leading = allItems.filter(i => i.indicatorType === 'LEADING')
    const lagging = allItems.filter(i => i.indicatorType === 'LAGGING')
    const onTrack = allItems.filter(i => i.status === 'ON_TRACK' || i.status === 'ACTIVE').length
    const atRisk = allItems.filter(i => i.status === 'AT_RISK').length
    const offTrack = allItems.filter(i => i.status === 'OFF_TRACK').length

    const metricCards = [
      { label: t('kpiPlan.totalIndicators', '전체 지표'), value: allItems.length, color: 'primary.main' },
      { label: t('kpiPlan.onTrack', '정상'), value: onTrack, color: 'success.main' },
      { label: t('kpiPlan.atRisk', '주의'), value: atRisk, color: 'warning.main' },
      { label: t('kpiPlan.offTrack', '미달'), value: offTrack, color: 'error.main' },
    ]

    const renderSection = (title: string, items: EhsKpiPlan[]) => (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>{title} ({items.length})</Typography>
        {items.length === 0 ? (
          <Typography variant="body2" color="text.secondary">{t('common.noData', '데이터가 없습니다')}</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {items.map((item) => (
              <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, border: 1, borderColor: 'grey.200', borderRadius: 1 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight="bold">{item.indicatorName}</Typography>
                  <Typography variant="caption" color="text.secondary">{item.department || ''} | {item.responsiblePerson || ''}</Typography>
                </Box>
                <Box sx={{ width: 200, display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
                  <LinearProgress variant="determinate" value={Math.min(item.achievementRate ?? 0, 100)} sx={{ flex: 1, height: 8, borderRadius: 4 }}
                    color={(item.achievementRate ?? 0) >= 80 ? 'success' : (item.achievementRate ?? 0) >= 50 ? 'warning' : 'error'}
                  />
                  <Typography variant="caption" fontWeight="bold" sx={{ minWidth: 40 }}>{item.achievementRate ?? 0}%</Typography>
                </Box>
                <Chip label={getStatusLabel(item.status) || item.status} color={STATUS_COLORS[item.status] || 'default'} size="small" />
              </Box>
            ))}
          </Box>
        )}
      </Paper>
    )

    return (
      <>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {metricCards.map((card, i) => (
            <Grid item xs={6} md={3} key={i}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: card.color }}>{card.value}</Typography>
                  <Typography variant="body2" color="text.secondary">{card.label}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {renderSection(t('kpiPlan.leadingIndicators', '선행 지표'), leading)}
        {renderSection(t('kpiPlan.laggingIndicators', '후행 지표'), lagging)}
      </>
    )
  }

  // ===== Tab 3: Goal Management =====
  const renderGoalManagement = () => {
    const yearItems = allItems.filter(i => i.planYear === yearFilter)
    const avgAchievement = yearItems.length > 0
      ? Math.round(yearItems.reduce((sum, i) => sum + (i.achievementRate ?? 0), 0) / yearItems.length)
      : 0
    const completedCount = yearItems.filter(i => (i.achievementRate ?? 0) >= 100).length
    const years = [...new Set(allItems.map(i => i.planYear))].sort((a, b) => b - a)
    if (!years.includes(yearFilter)) years.unshift(yearFilter)

    return (
      <>
        <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select value={yearFilter} onChange={(e) => setYearFilter(Number(e.target.value))}>
              {years.map(y => <MenuItem key={y} value={y}>{y}{t('kpiPlan.year', '년')}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} md={3}>
            <Card><CardContent sx={{ textAlign: 'center', py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="h4" fontWeight="bold" color="primary.main">{yearItems.length}</Typography>
              <Typography variant="body2" color="text.secondary">{t('kpiPlan.totalIndicators', '전체 지표')}</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card><CardContent sx={{ textAlign: 'center', py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="h4" fontWeight="bold" color="info.main">{avgAchievement}%</Typography>
              <Typography variant="body2" color="text.secondary">{t('kpiPlan.avgAchievement', '평균 달성률')}</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card><CardContent sx={{ textAlign: 'center', py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="h4" fontWeight="bold" color="success.main">{completedCount}</Typography>
              <Typography variant="body2" color="text.secondary">{t('kpiPlan.completed', '목표 달성')}</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card><CardContent sx={{ textAlign: 'center', py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="h4" fontWeight="bold" color="warning.main">{yearItems.length - completedCount}</Typography>
              <Typography variant="body2" color="text.secondary">{t('kpiPlan.inProgress', '진행 중')}</Typography>
            </CardContent></Card>
          </Grid>
        </Grid>

        {yearItems.length === 0 ? (
          <Alert severity="info">{t('common.noData', '데이터가 없습니다')}</Alert>
        ) : (
          <Paper>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={hSx}>{t('kpiPlan.indicatorType', '지표유형')}</TableCell>
                    <TableCell sx={hSx}>{t('kpiPlan.indicatorName', '지표명')}</TableCell>
                    <TableCell sx={hSx}>{t('kpiPlan.department', '부서')}</TableCell>
                    <TableCell sx={hSx} align="right">{t('kpiPlan.targetValue', '목표값')}</TableCell>
                    <TableCell sx={hSx} align="right">{t('kpiPlan.currentValue', '현재값')}</TableCell>
                    <TableCell sx={hSx} align="center" width={180}>{t('kpiPlan.achievementRate', '달성률')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('kpiPlan.status', '상태')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {yearItems.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell align="center">
                        <Chip label={getTypeLabel(item.indicatorType) || item.indicatorType} color={TYPE_COLORS[item.indicatorType] || 'default'} size="small" />
                      </TableCell>
                      <TableCell><Typography variant="body2" fontWeight={600}>{item.indicatorName}</Typography></TableCell>
                      <TableCell>{item.department || ''}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{item.targetValue ?? ''}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{item.currentValue ?? ''}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress variant="determinate" value={Math.min(item.achievementRate ?? 0, 100)} sx={{ flex: 1, height: 8, borderRadius: 4 }}
                            color={(item.achievementRate ?? 0) >= 80 ? 'success' : (item.achievementRate ?? 0) >= 50 ? 'warning' : 'error'}
                          />
                          <Typography variant="caption" sx={{ minWidth: 36 }}>{item.achievementRate ?? 0}%</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={getStatusLabel(item.status) || item.status} color={STATUS_COLORS[item.status] || 'default'} size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </>
    )
  }

  const tabs = [
    { label: t('kpiPlan.tabs.settings', '지표 설정') },
    { label: t('kpiPlan.tabs.status', 'KPI 현황') },
    { label: t('kpiPlan.tabs.goals', '목표 관리') },
  ]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto"
          sx={{ '& .MuiTab-root': { minWidth: 'auto', px: 2, fontSize: '0.85rem' } }}
        >
          {tabs.map((tab, idx) => <Tab key={idx} label={tab.label} />)}
        </Tabs>
      </Box>

      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>{tabs[activeTab]?.label}</Typography>

      {activeTab === 0 && renderIndicatorSettings()}
      {activeTab === 1 && renderKpiStatus()}
      {activeTab === 2 && renderGoalManagement()}

      <UserSelectModal open={showUserModal} onClose={() => setShowUserModal(false)} selectedUsers={[]} onConfirm={handleUserSelect} singleSelect useCompanyTree title={t('environment.selectManager')} />
    </Box>
  )
}

export default EhsKpiPlanPage
