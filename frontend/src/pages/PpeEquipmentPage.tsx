import React, { useState, useMemo } from 'react'
import { useMenuRule } from '../hooks/useMenuRule'
import { useButtonRules } from '../hooks/useButtonRules'
import { todayStr, formatDateTime } from '../utils/dateDefaults'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, TextField, Select, MenuItem,
  FormControl, FormControlLabel, Radio, RadioGroup, Chip, LinearProgress, Pagination, CircularProgress, Alert,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import CategoryIcon from '@mui/icons-material/Category'
import EventNoteIcon from '@mui/icons-material/EventNote'
import HistoryIcon from '@mui/icons-material/History'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'
import DatePickerField from '../components/common/DatePickerField'
import NumberField from '../components/common/NumberField'
import { useAlert } from '../contexts/AlertContext'
import { useAuth } from '../context/AuthContext'
import { ppeEquipmentApi, ppeHistoryApi } from '../api/ppeEquipmentApi'
import { PpeEquipment, PpeEquipmentRequest, PpeEquipmentStatus, PpeActionType } from '../types/ppeEquipment.types'
import useCodeMap from '../hooks/useCodeMap'
import { Tabs, Tab, IconButton } from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import PpeRequestTab from '../components/environment/PpeRequestTab'
import StatCard from '../components/legalCompliance/StatCard'
import ListSearchBar from '../components/common/ListSearchBar'
import DepartmentSelectModal from '../components/common/DepartmentSelectModal'
import DevTestFillButton from '../components/common/DevTestFillButton'

const STATUS_CHIP: Record<PpeEquipmentStatus, { color: 'success' | 'warning' | 'error' | 'info'; label: string }> = {
  NORMAL: { color: 'success', label: 'ppe.statusNormal' },
  EXPIRY_SOON: { color: 'warning', label: 'ppe.statusExpirySoon' },
  EXPIRED: { color: 'error', label: 'ppe.statusExpired' },
  LOW_STOCK: { color: 'info', label: 'ppe.statusLowStock' },
}

const labelSx = { width: 130, minWidth: 130, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all' as const }
const valSx = { flex: 1, px: 2, py: 1.5, display: 'flex', alignItems: 'center' }
const valBorderSx = { ...valSx, borderRight: 1, borderColor: 'divider' }
const rowSx = { display: 'flex', borderBottom: 1, borderColor: 'divider' }

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const PpeEquipmentPage: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { isMenuHidden } = useMenuRule()
  const { canSee } = useButtonRules()
  const queryClient = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()
  const MENU_STOCK = '안전 관리 › 보호구 장비 › 재고'
  const stockRoles = useMemo(() => {
    const roles: string[] = ['guest']
    if (user?.role === 'SYSTEM_ADMIN') roles.push('superAdmin')
    else if (user?.role) roles.push(user.role)
    return roles
  }, [user])
  const canCreate = canSee(MENU_STOCK, 'LIST', '신규 등록', stockRoles)
  const canEditDelete = canSee(MENU_STOCK, 'DETAIL', '수정', stockRoles)
  const { codeList: categoryCodes, getLabel: getCategoryLabel } = useCodeMap('PPE_CATEGORY')
  const { codeList: inspectCycleCodes, getLabel: getInspectCycleLabel } = useCodeMap('INSPECT_CYCLE')

  const [activeTab, setActiveTab] = useState(0)

  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<PpeEquipment | null>(null)
  const [form, setForm] = useState<PpeEquipmentRequest>({
    name: '', category: '', stockQuantity: 1,
  })
  const [deptModalOpen, setDeptModalOpen] = useState(false)

  const pageSize = 10

  // Queries
  const { data: kpi } = useQuery({
    queryKey: ['ppeEquipmentKpi'],
    queryFn: ppeEquipmentApi.getKpi,
  })

  // 전체 데이터 (알림/분류/점검 패널용 - 페이징 무관)
  const { data: allData } = useQuery({
    queryKey: ['ppeEquipmentAll'],
    queryFn: () => ppeEquipmentApi.getAll(0, 500),
  })
  const allItems = allData?.content || []

  const { data: historyData } = useQuery({
    queryKey: ['ppeHistory'],
    queryFn: () => ppeHistoryApi.getAll(0, 10),
  })

  const ACTION_TYPE_CHIP: Record<PpeActionType, { color: 'primary' | 'warning' | 'error'; label: string }> = {
    ISSUE: { color: 'primary', label: t('ppe.actionIssue') },
    RETURN: { color: 'warning', label: t('ppe.actionReturn') },
    DISPOSE: { color: 'error', label: t('ppe.actionDispose') },
  }

  const queryKey = searchText
    ? ['ppeEquipmentSearch', searchText, page]
    : statusFilter
    ? ['ppeEquipmentStatus', statusFilter, page]
    : categoryFilter
    ? ['ppeEquipmentCategory', categoryFilter, page]
    : ['ppeEquipment', page]

  const queryFn = () => {
    if (searchText) return ppeEquipmentApi.search(searchText, page, pageSize)
    if (statusFilter) return ppeEquipmentApi.getByStatus(statusFilter, page, pageSize)
    if (categoryFilter) return ppeEquipmentApi.getByCategory(categoryFilter, page, pageSize)
    return ppeEquipmentApi.getAll(page, pageSize)
  }

  const { data, isLoading } = useQuery({ queryKey, queryFn, enabled: viewMode === 'list' })

  const handleBackToList = () => { setViewMode('list'); setSelectedItem(null) }

  const createMutation = useMutation({
    mutationFn: (req: PpeEquipmentRequest) => ppeEquipmentApi.create(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ppeEquipment'] })
      queryClient.invalidateQueries({ queryKey: ['ppeEquipmentKpi'] })
      showSuccess(t('common.saved'))
      handleBackToList()
    },
    onError: () => showError(t('common.error')),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, req }: { id: number; req: PpeEquipmentRequest }) => ppeEquipmentApi.update(id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ppeEquipment'] })
      queryClient.invalidateQueries({ queryKey: ['ppeEquipmentKpi'] })
      showSuccess(t('common.saved'))
      handleBackToList()
    },
    onError: () => showError(t('common.error')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => ppeEquipmentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ppeEquipment'] })
      queryClient.invalidateQueries({ queryKey: ['ppeEquipmentKpi'] })
      showSuccess(t('common.deleted'))
      handleBackToList()
    },
    onError: () => showError(t('common.error')),
  })

  const handleOpenCreate = () => {
    setSelectedItem(null)
    setForm({ name: '', category: '', stockQuantity: 1, expiryDate: todayStr() })
    setViewMode('create')
  }

  const handleOpenEdit = (item: PpeEquipment) => {
    setSelectedItem(item)
    setForm({
      name: item.name, nameEn: item.nameEn, nameZh: item.nameZh,
      category: item.category, categoryEn: item.categoryEn, categoryZh: item.categoryZh,
      model: item.model, certification: item.certification,
      stockQuantity: item.stockQuantity, minStock: item.minStock, maxStock: item.maxStock,
      isConsumable: item.isConsumable, expiryDate: item.expiryDate,
      inspectCycle: item.inspectCycle, lastInspectDate: item.lastInspectDate,
      nextInspectDate: item.nextInspectDate, storageLocation: item.storageLocation,
      department: item.department, status: item.status, notes: item.notes,
    })
    setViewMode('edit')
  }

  const handleRowClick = (item: PpeEquipment) => { setSelectedItem(item); setViewMode('detail') }

  const handleSave = () => {
    if (selectedItem) {
      updateMutation.mutate({ id: selectedItem.id, req: form })
    } else {
      createMutation.mutate(form)
    }
  }

  const handleDelete = async (item: PpeEquipment) => {
    const confirmed = await showConfirm(`${item.name}\n${t('common.delete')}하시겠습니까?`)
    if (confirmed) deleteMutation.mutate(item.id)
  }

  // DEV ONLY — 비어있는 항목을 보호구 장비 더미데이터로 채움 (입력값 보존)
  const fillTestData = () => setForm((prev) => ({
    ...prev,
    name: prev.name || '안전모 (낙하물 방지용)',
    category: prev.category || categoryCodes[0]?.code || '',
    model: prev.model || 'SH-2000',
    certification: prev.certification || 'KCs 제2024-1234호',
    stockQuantity: prev.stockQuantity || 50,
    minStock: prev.minStock ?? 10,
    maxStock: prev.maxStock ?? 100,
    expiryDate: prev.expiryDate || todayStr(),
    inspectCycle: prev.inspectCycle || inspectCycleCodes[0]?.code || '',
    lastInspectDate: prev.lastInspectDate || todayStr(),
    nextInspectDate: prev.nextInspectDate || todayStr(),
    storageLocation: prev.storageLocation || '안전관리실 A-3 캐비닛',
    notes: prev.notes || '정기 지급 품목 (테스트 데이터)',
  }))

  const calcStockRate = (item: { stockQuantity: number; maxStock?: number; isConsumable?: boolean }): number | null => {
    if (item.isConsumable || !item.maxStock || item.maxStock === 0) return null
    return Math.min(100, Math.round((item.stockQuantity / item.maxStock) * 100))
  }

  const getStockRateColor = (rate: number | null) => {
    if (rate === null) return 'inherit'
    if (rate >= 50) return 'success'
    if (rate >= 20) return 'warning'
    return 'error'
  }

  const items = data?.content || []
  const totalPages = data?.totalPages || 0

  const headerCellSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }

  // 알림 목록: 만료/만료임박/재고부족 항목
  const alertItems = useMemo(() => {
    return allItems.filter((i) => i.status !== 'NORMAL').map((i) => ({
      name: i.name,
      status: i.status,
      department: i.department || '',
      notes: i.notes || '',
      severity: i.status === 'EXPIRED' ? 'error' : i.status === 'LOW_STOCK' ? 'warning' : 'warning',
    }))
  }, [allItems])

  // 분류별 현황
  const categoryStats = useMemo(() => {
    const map: Record<string, { count: number; totalRate: number; rateCount: number }> = {}
    allItems.forEach((i) => {
      if (!map[i.category]) map[i.category] = { count: 0, totalRate: 0, rateCount: 0 }
      map[i.category].count += i.stockQuantity
      const rate = calcStockRate(i)
      if (rate !== null) { map[i.category].totalRate += rate; map[i.category].rateCount++ }
    })
    const total = Object.values(map).reduce((s, v) => s + v.count, 0) || 1
    return Object.entries(map).map(([code, v]) => ({
      code,
      label: getCategoryLabel(code),
      count: v.count,
      pct: Math.round((v.count / total) * 100),
      avgWear: v.rateCount ? Math.round(v.totalRate / v.rateCount) : 0,
    }))
  }, [allItems, getCategoryLabel])

  // 점검 예정 일정: nextInspectDate 기준
  const scheduleItems = useMemo(() => {
    return allItems
      .filter((i) => i.nextInspectDate)
      .sort((a, b) => (a.nextInspectDate || '').localeCompare(b.nextInspectDate || ''))
      .slice(0, 6)
      .map((i) => ({
        name: i.name,
        date: i.nextInspectDate || '',
        department: i.department || '',
        cycle: getInspectCycleLabel(i.inspectCycle || ''),
        isPast: new Date(i.nextInspectDate || '') < new Date(),
      }))
  }, [allItems, getInspectCycleLabel])

  const CATEGORY_COLORS = ['primary.main', 'secondary.main', 'success.main', 'warning.main', 'info.main']

  /* ── DETAIL VIEW ── */
  const renderDetailView = () => {
    if (!selectedItem) return null
    const sc = STATUS_CHIP[selectedItem.status] || STATUS_CHIP.NORMAL
    return (
      <>
        {/* PC Detail */}
        <Paper sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('ppe.itemName')}</Typography>
            <Box sx={valBorderSx}><Typography variant="body2">{selectedItem.name}</Typography></Box>
            <Typography sx={labelSx}>{t('ppe.category')}</Typography>
            <Box sx={valSx}><Typography variant="body2">{getCategoryLabel(selectedItem.category)}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('ppe.model')}</Typography>
            <Box sx={valBorderSx}><Typography variant="body2">{selectedItem.model || ''}</Typography></Box>
            <Typography sx={labelSx}>{t('ppe.certification')}</Typography>
            <Box sx={valSx}><Typography variant="body2">{selectedItem.certification || ''}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('ppe.stock')}</Typography>
            <Box sx={valBorderSx}><Typography variant="body2">{selectedItem.stockQuantity}</Typography></Box>
            <Typography sx={labelSx}>{t('ppe.minStock')}</Typography>
            <Box sx={valSx}><Typography variant="body2">{selectedItem.minStock ?? ''}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{'재고율'}</Typography>
            <Box sx={valBorderSx}>
              {(() => {
                const rate = calcStockRate(selectedItem)
                return rate === null ? (
                  <Typography variant="body2" color="text.disabled">-</Typography>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <LinearProgress variant="determinate" value={rate}
                      color={getStockRateColor(rate) as 'success' | 'warning' | 'error' | 'inherit'}
                      sx={{ flex: 1, height: 8, borderRadius: 4, maxWidth: 200 }}
                    />
                    <Typography variant="body2" fontFamily="monospace">{rate}%</Typography>
                  </Box>
                )
              })()}
            </Box>
            <Typography sx={labelSx}>{t('ppe.isConsumable', '소모품')}</Typography>
            <Box sx={valSx}>
              <Chip
                label={selectedItem.isConsumable ? t('ppe.consumable', '소모품 (반납 없음)') : t('ppe.notConsumable', '일반 (반납 있음)')}
                color={selectedItem.isConsumable ? 'warning' : 'default'}
                size="small"
              />
            </Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('ppe.expiryDate')}</Typography>
            <Box sx={valSx}><Typography variant="body2" fontFamily="monospace">{selectedItem.expiryDate || ''}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('ppe.inspectCycle')}</Typography>
            <Box sx={valBorderSx}><Typography variant="body2">{getInspectCycleLabel(selectedItem.inspectCycle || '') || ''}</Typography></Box>
            <Typography sx={labelSx}>{t('ppe.lastInspectDate')}</Typography>
            <Box sx={valSx}><Typography variant="body2" fontFamily="monospace">{selectedItem.lastInspectDate || ''}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('ppe.nextInspectDate')}</Typography>
            <Box sx={valBorderSx}><Typography variant="body2" fontFamily="monospace">{selectedItem.nextInspectDate || ''}</Typography></Box>
            <Typography sx={labelSx}>{t('ppe.storageLocation')}</Typography>
            <Box sx={valSx}><Typography variant="body2">{selectedItem.storageLocation || ''}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('ppe.department')}</Typography>
            <Box sx={valBorderSx}><Typography variant="body2">{selectedItem.department || ''}</Typography></Box>
            <Typography sx={labelSx}>{t('ppe.status')}</Typography>
            <Box sx={valSx}><Chip label={t(sc.label)} color={sc.color} size="small" /></Box>
          </Box>
          <Box sx={{ display: 'flex' }}>
            <Typography sx={labelSx}>{t('ppe.notes')}</Typography>
            <Box sx={valSx}><Typography variant="body2">{selectedItem.notes || ''}</Typography></Box>
          </Box>
        </Paper>

        {/* Mobile Detail */}
        <Paper sx={{ display: { xs: 'block', md: 'none' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
          {[
            [t('ppe.itemName'), selectedItem.name],
            [t('ppe.category'), getCategoryLabel(selectedItem.category)],
            [t('ppe.model'), selectedItem.model || ''],
            [t('ppe.certification'), selectedItem.certification || ''],
            [t('ppe.stock'), String(selectedItem.stockQuantity)],
            [t('ppe.minStock'), String(selectedItem.minStock ?? '')],
            [t('ppe.expiryDate'), selectedItem.expiryDate || ''],
            [t('ppe.storageLocation'), selectedItem.storageLocation || ''],
            [t('ppe.department'), selectedItem.department || ''],
            [t('ppe.notes'), selectedItem.notes || ''],
          ].map(([label, value], i) => (
            <Box key={i} sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={{ ...labelSx, width: 110, minWidth: 110 }}>{label}</Typography>
              <Box sx={valSx}><Typography variant="body2">{value}</Typography></Box>
            </Box>
          ))}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={{ ...labelSx, width: 110, minWidth: 110 }}>{'재고율'}</Typography>
            <Box sx={valSx}>
              {(() => {
                const rate = calcStockRate(selectedItem)
                return rate === null ? (
                  <Typography variant="body2" color="text.disabled">-</Typography>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinearProgress variant="determinate" value={rate}
                      color={getStockRateColor(rate) as 'success' | 'warning' | 'error' | 'inherit'}
                      sx={{ flex: 1, height: 8, borderRadius: 4, maxWidth: 120 }}
                    />
                    <Typography variant="body2" fontFamily="monospace">{rate}%</Typography>
                  </Box>
                )
              })()}
            </Box>
          </Box>
          <Box sx={{ display: 'flex' }}>
            <Typography sx={{ ...labelSx, width: 110, minWidth: 110 }}>{t('ppe.status')}</Typography>
            <Box sx={valSx}><Chip label={t(sc.label)} color={sc.color} size="small" /></Box>
          </Box>
        </Paper>

        {/* Buttons */}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', sm: 'flex-end' } }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: 1, sm: 'none' } }}>{t('common.list')}</Button>
          {canEditDelete && (
            <>
              <Button variant="contained" onClick={() => handleOpenEdit(selectedItem)} sx={{ flex: { xs: 1, sm: 'none' } }}>{t('common.edit')}</Button>
              <Button variant="contained" color="error" onClick={() => handleDelete(selectedItem)} sx={{ flex: { xs: 1, sm: 'none' } }}>{t('common.delete')}</Button>
            </>
          )}
        </Box>
      </>
    )
  }

  /* ── FORM VIEW (create / edit) ── */
  const renderFormView = () => {
    return (
      <>
        {/* PC Form */}
        <Paper sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
          {/* Row 1: 항목명 + 분류 */}
          <Box sx={rowSx}>
            <Typography sx={labelSx}>
              {t('ppe.itemName')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
            </Typography>
            <Box sx={valBorderSx}>
              <TextField fullWidth size="small" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Box>
            <Typography sx={labelSx}>
              {t('ppe.category')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
            </Typography>
            <Box sx={valSx}>
              <Select fullWidth size="small" displayEmpty value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <MenuItem value="" disabled>{t('ppe.selectCategory')}</MenuItem>
                {categoryCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getCategoryLabel(c.code)}</MenuItem>)}
              </Select>
            </Box>
          </Box>
          {/* Row 2: 모델/규격 + KCs 인증번호 */}
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('ppe.model')}</Typography>
            <Box sx={valBorderSx}>
              <TextField fullWidth size="small" value={form.model || ''} onChange={(e) => setForm({ ...form, model: e.target.value })} />
            </Box>
            <Typography sx={labelSx}>{t('ppe.certification')}</Typography>
            <Box sx={valSx}>
              <TextField fullWidth size="small" value={form.certification || ''} onChange={(e) => setForm({ ...form, certification: e.target.value })} />
            </Box>
          </Box>
          {/* Row 3: 재고 + 최소 재고 */}
          <Box sx={rowSx}>
            <Typography sx={labelSx}>
              {t('ppe.stock')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
            </Typography>
            <Box sx={valBorderSx}>
              <NumberField fullWidth size="small" min={0} step={1} value={form.stockQuantity} onChange={(v) => setForm({ ...form, stockQuantity: Math.max(1, v ?? 0) })} />
            </Box>
            <Typography sx={labelSx}>{t('ppe.minStock')}</Typography>
            <Box sx={valSx}>
              <NumberField fullWidth size="small" min={0} step={1} value={form.minStock || 0} onChange={(v) => setForm({ ...form, minStock: v ?? 0 })} />
            </Box>
          </Box>
          {/* Row 3-1: 총 재고량 + 소모품 여부 */}
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{'총 재고량'}</Typography>
            <Box sx={{ ...valBorderSx, display: 'flex', alignItems: 'center', gap: 1 }}>
              <NumberField fullWidth size="small" min={0} step={1}
                value={form.maxStock || 0}
                onChange={(v) => setForm({ ...form, maxStock: v ?? 0 })}
              />
            </Box>
            <Typography sx={labelSx}>{t('ppe.isConsumable', '소모품')}</Typography>
            <Box sx={valSx}>
              <RadioGroup row value={form.isConsumable ? 'Y' : 'N'} onChange={e => setForm({ ...form, isConsumable: e.target.value === 'Y' })}>
                <FormControlLabel value="Y" control={<Radio size="small" />} label={<Typography variant="body2">Y (반납 없음)</Typography>} />
                <FormControlLabel value="N" control={<Radio size="small" />} label={<Typography variant="body2">N (반납 있음)</Typography>} />
              </RadioGroup>
            </Box>
          </Box>
          {/* Row 4: 유효기간 + 점검 주기 */}
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('ppe.expiryDate')}</Typography>
            <Box sx={valBorderSx}>
              <DatePickerField value={form.expiryDate || null} onChange={(v) => setForm({ ...form, expiryDate: v })} size="small" />
            </Box>
            <Typography sx={labelSx}>{t('ppe.inspectCycle')}</Typography>
            <Box sx={valSx}>
              <Select fullWidth size="small" displayEmpty value={form.inspectCycle || ''} onChange={(e) => setForm({ ...form, inspectCycle: e.target.value })}>
                <MenuItem value="">{t('ppe.inspectCycle')}</MenuItem>
                {inspectCycleCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getInspectCycleLabel(c.code)}</MenuItem>)}
              </Select>
            </Box>
          </Box>
          {/* Row 5: 보관 위치 + 담당 부서 */}
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('ppe.storageLocation')}</Typography>
            <Box sx={valBorderSx}>
              <TextField fullWidth size="small" value={form.storageLocation || ''} onChange={(e) => setForm({ ...form, storageLocation: e.target.value })} />
            </Box>
            <Typography sx={labelSx}>{t('ppe.department')}</Typography>
            <Box sx={{ ...valSx, gap: 1 }}>
              <TextField fullWidth size="small" InputProps={{ readOnly: true }}
                value={form.department || ''} placeholder={t('common.selectFromOrg', '조직도에서 선택')} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setDeptModalOpen(true)}>
                <PersonSearchIcon fontSize="small" />
              </Button>
            </Box>
          </Box>
          {/* Row 6: 비고 */}
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('ppe.notes')}</Typography>
            <Box sx={valSx}>
              <TextField fullWidth size="small" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Box>
          </Box>
          {/* Row 7: 작성자 | 작성일자 */}
          <Box sx={{ display: 'flex' }}>
            <Typography sx={labelSx}>{t('common.creator', '작성자')}</Typography>
            <Box sx={valBorderSx}>
              <Typography variant="body2">{user?.name || user?.username || ''}</Typography>
            </Box>
            <Typography sx={labelSx}>{t('audit.createdAt', '작성일자')}</Typography>
            <Box sx={valSx}>
              <Typography variant="body2" fontFamily="monospace">
                {viewMode === 'edit' && selectedItem?.createdAt ? formatDateTime(selectedItem.createdAt) : todayStr()}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Mobile Form */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 2 }}>
          <TextField fullWidth size="small" label={t('ppe.itemName')} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <FormControl fullWidth size="small">
            <Select displayEmpty value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <MenuItem value="" disabled>{t('ppe.selectCategory')}</MenuItem>
              {categoryCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getCategoryLabel(c.code)}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField fullWidth size="small" label={t('ppe.model')} value={form.model || ''} onChange={(e) => setForm({ ...form, model: e.target.value })} />
          <TextField fullWidth size="small" label={t('ppe.certification')} value={form.certification || ''} onChange={(e) => setForm({ ...form, certification: e.target.value })} />
          <NumberField fullWidth size="small" label={t('ppe.stock')} min={0} step={1} value={form.stockQuantity} onChange={(v) => setForm({ ...form, stockQuantity: Math.max(1, v ?? 0) })} />
          <NumberField fullWidth size="small" label={t('ppe.minStock')} min={0} step={1} value={form.minStock || 0} onChange={(v) => setForm({ ...form, minStock: v ?? 0 })} />
          <NumberField fullWidth size="small" label={'총 재고량'} min={0} step={1}
            value={form.maxStock || 0}
            onChange={(v) => setForm({ ...form, maxStock: v ?? 0 })}
          />
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 'bold' }}>{t('ppe.isConsumable', '소모품')}</Typography>
            <RadioGroup row value={form.isConsumable ? 'Y' : 'N'} onChange={e => setForm({ ...form, isConsumable: e.target.value === 'Y' })}>
              <FormControlLabel value="Y" control={<Radio size="small" />} label={<Typography variant="body2">Y (반납 없음)</Typography>} />
              <FormControlLabel value="N" control={<Radio size="small" />} label={<Typography variant="body2">N (반납 있음)</Typography>} />
            </RadioGroup>
          </Box>
          <DatePickerField label={t('ppe.expiryDate')} value={form.expiryDate || null} onChange={(v) => setForm({ ...form, expiryDate: v })} size="small" />
          <TextField fullWidth size="small" label={t('ppe.storageLocation')} value={form.storageLocation || ''} onChange={(e) => setForm({ ...form, storageLocation: e.target.value })} />
          <TextField fullWidth size="small" label={t('ppe.department')} value={form.department || ''} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          <TextField fullWidth size="small" label={t('ppe.notes')} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </Box>

        {/* Buttons */}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', sm: 'flex-end' } }}>
          {viewMode === 'create' && <DevTestFillButton onFill={fillTestData} />}
          <Button variant="outlined" onClick={() => viewMode === 'edit' ? setViewMode('detail') : handleBackToList()} sx={{ flex: { xs: 1, sm: 'none' } }}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleSave} sx={{ flex: { xs: 1, sm: 'none' } }}>{t('common.save')}</Button>
        </Box>

        <DepartmentSelectModal
          open={deptModalOpen}
          onClose={() => setDeptModalOpen(false)}
          onConfirm={(deptName) => { setForm({ ...form, department: deptName }); setDeptModalOpen(false) }}
          initialDepartment={form.department || ''}
          title={t('ppe.selectDepartment', '담당부서 선택')}
        />
      </>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {/* Tabs */}
      <Tabs value={activeTab} onChange={(_, v) => { setActiveTab(v); if (v !== activeTab) handleBackToList() }} variant="scrollable" scrollButtons="auto"
        sx={{ mb: 2, '& .MuiTab-root': { minWidth: 'auto', px: 2, fontSize: '0.85rem' } }}>
        {!isMenuHidden('ppe.tabs.inventory') && <Tab label={t('ppe.tabs.inventory')} />}
        {!isMenuHidden('ppe.tabs.request')   && <Tab label={t('ppe.tabs.request')} />}
      </Tabs>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, flexShrink: 0 }}>
        {activeTab === 0 ? t('ppe.tabs.inventory') : t('ppe.tabs.request')}
      </Typography>

      {activeTab === 1 && !isMenuHidden('ppe.tabs.request') && <PpeRequestTab />}

      {activeTab === 0 && <>
      {/* Detail View */}
      {viewMode === 'detail' && renderDetailView()}

      {/* Create / Edit Form View */}
      {(viewMode === 'create' || viewMode === 'edit') && renderFormView()}

      {/* List View */}
      {viewMode === 'list' && <>
      {/* KPI Cards */}
      {kpi && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3, flexShrink: 0 }}>
          <StatCard value={kpi.totalItems} label={t('ppe.totalItems')} />
          <StatCard value={`${Number(kpi.avgWearRate || 0).toFixed(1)}%`} label={'평균 재고율'} />
          <StatCard value={kpi.expirySoonCount} label={t('ppe.expirySoon')} />
          <StatCard value={kpi.expiredCount + kpi.lowStockCount} label={t('ppe.expiredOrLow')} />
        </Box>
      )}

      {/* Search & Filter Bar - PC */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, alignItems: 'center', mb: 2, flexShrink: 0 }}>
        <ListSearchBar
          value={searchInput}
          onChange={setSearchInput}
          onSearch={() => { setSearchText(searchInput); setPage(0); setStatusFilter(''); setCategoryFilter('') }}
          placeholder={t('ppe.searchPlaceholder', '품목명/모델/위치로 검색')}
          sx={{ minWidth: 240 }}
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <Select displayEmpty value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); setSearchInput(''); setSearchText(''); setCategoryFilter('') }}>
            <MenuItem value="">{t('ppe.allStatus')}</MenuItem>
            <MenuItem value="NORMAL">{t('ppe.statusNormal')}</MenuItem>
            <MenuItem value="EXPIRY_SOON">{t('ppe.statusExpirySoon')}</MenuItem>
            <MenuItem value="EXPIRED">{t('ppe.statusExpired')}</MenuItem>
            <MenuItem value="LOW_STOCK">{t('ppe.statusLowStock')}</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <Select displayEmpty value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); setSearchInput(''); setSearchText(''); setStatusFilter('') }}>
            <MenuItem value="">{t('ppe.allCategory')}</MenuItem>
            {categoryCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getCategoryLabel(c.code)}</MenuItem>)}
          </Select>
        </FormControl>
        <IconButton size="small" onClick={() => { setSearchInput(''); setSearchText(''); setStatusFilter(''); setCategoryFilter(''); setPage(0) }}><RefreshIcon /></IconButton>
        <Box sx={{ flex: 1 }} />
        {canCreate && (
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate}>
            {t('common.new', 'New')}
          </Button>
        )}
      </Box>
      {/* Search & Filter Bar - Mobile */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2, flexShrink: 0 }}>
        <ListSearchBar
          fullWidth
          value={searchInput}
          onChange={setSearchInput}
          onSearch={() => { setSearchText(searchInput); setPage(0); setStatusFilter(''); setCategoryFilter('') }}
          placeholder={t('ppe.searchPlaceholder', '품목명/모델/위치로 검색')}
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <FormControl size="small" sx={{ flex: 1 }}>
            <Select displayEmpty value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); setSearchInput(''); setSearchText(''); setCategoryFilter('') }}>
              <MenuItem value="">{t('ppe.allStatus')}</MenuItem>
              <MenuItem value="NORMAL">{t('ppe.statusNormal')}</MenuItem>
              <MenuItem value="EXPIRY_SOON">{t('ppe.statusExpirySoon')}</MenuItem>
              <MenuItem value="EXPIRED">{t('ppe.statusExpired')}</MenuItem>
              <MenuItem value="LOW_STOCK">{t('ppe.statusLowStock')}</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ flex: 1 }}>
            <Select displayEmpty value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); setSearchInput(''); setSearchText(''); setStatusFilter('') }}>
              <MenuItem value="">{t('ppe.allCategory')}</MenuItem>
              {categoryCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getCategoryLabel(c.code)}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
        {canCreate && (
          <Button variant="contained" size="small" fullWidth startIcon={<AddIcon />} onClick={handleOpenCreate}>
            {t('common.new', 'New')}
          </Button>
        )}
      </Box>

      {/* Table */}
      <Box>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : items.length === 0 ? (
          <Alert severity="info" sx={{ m: 2 }}>{t('common.noData')}</Alert>
        ) : (
          <>
            {/* PC Table */}
            <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
              <Table size="small" stickyHeader sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={headerCellSx}>{t('ppe.itemName')}</TableCell>
                    <TableCell sx={headerCellSx}>{t('ppe.category')}</TableCell>
                    <TableCell sx={headerCellSx}>{t('ppe.model')}</TableCell>
                    <TableCell sx={headerCellSx} align="center">{t('ppe.stock')}</TableCell>
                    <TableCell sx={headerCellSx} align="center">{'재고율'}</TableCell>
                    <TableCell sx={headerCellSx}>{t('ppe.expiryDate')}</TableCell>
                    <TableCell sx={headerCellSx} align="center">{t('ppe.status')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => {
                    const sc = STATUS_CHIP[item.status] || STATUS_CHIP.NORMAL
                    return (
                      <TableRow key={item.id} hover onClick={() => handleRowClick(item)} sx={{ cursor: 'pointer' }}>
                        <TableCell><Typography fontWeight={600} variant="body2">{item.name}</Typography></TableCell>
                        <TableCell align="center">{getCategoryLabel(item.category)}</TableCell>
                        <TableCell align="center" sx={{ color: 'text.secondary', fontFamily: 'monospace', fontSize: '0.8rem' }}>{item.model || ''}</TableCell>
                        <TableCell align="center" sx={{ color: item.stockQuantity < item.minStock ? 'warning.main' : 'inherit', fontFamily: 'monospace' }}>
                          {item.stockQuantity}
                        </TableCell>
                        <TableCell align="center">
                          {(() => {
                            const rate = calcStockRate(item)
                            return rate === null ? (
                              <Typography variant="caption" color="text.disabled">-</Typography>
                            ) : (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                                <LinearProgress variant="determinate" value={rate}
                                  color={getStockRateColor(rate) as 'success' | 'warning' | 'error' | 'inherit'}
                                  sx={{ width: 60, height: 6, borderRadius: 3 }}
                                />
                                <Typography variant="caption" fontFamily="monospace">{rate}%</Typography>
                              </Box>
                            )
                          })()}
                        </TableCell>
                        <TableCell align="center" sx={{
                          fontFamily: 'monospace', fontSize: '0.8rem',
                          color: item.status === 'EXPIRED' ? 'error.main' : item.status === 'EXPIRY_SOON' ? 'warning.main' : 'text.secondary'
                        }}>
                          {item.expiryDate || ''}
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={t(sc.label)} color={sc.color} size="small" />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            {/* Mobile Cards */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5, pb: 1 }}>
              {items.map((item) => {
                const sc = STATUS_CHIP[item.status] || STATUS_CHIP.NORMAL
                return (
                  <Paper
                    key={item.id}
                    variant="outlined"
                    sx={{ p: 2, cursor: 'pointer' }}
                    onClick={() => handleRowClick(item)}
                  >
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1, flexWrap: 'wrap' }}>
                      <Chip label={getCategoryLabel(item.category)} size="small" variant="outlined" />
                      <Box sx={{ flex: 1 }} />
                      <Chip label={t(sc.label)} color={sc.color} size="small" />
                    </Box>
                    <Typography fontWeight="bold" color="primary" sx={{ mb: 0.25 }}>{item.name}</Typography>
                    {item.model && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontFamily: 'monospace', mb: 0.75 }}>
                        {item.model}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 70 }}>{t('ppe.stock')}</Typography>
                        <Typography variant="body2" fontFamily="monospace" sx={{ color: item.stockQuantity < item.minStock ? 'warning.main' : 'inherit', fontWeight: item.stockQuantity < item.minStock ? 'bold' : 'normal' }}>
                          {item.stockQuantity}
                        </Typography>
                      </Box>
                      {(() => {
                        const rate = calcStockRate(item)
                        return (
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 70 }}>{'재고율'}</Typography>
                            {rate === null ? (
                              <Typography variant="caption" color="text.disabled">-</Typography>
                            ) : (
                              <>
                                <LinearProgress variant="determinate" value={rate}
                                  color={getStockRateColor(rate) as 'success' | 'warning' | 'error' | 'inherit'}
                                  sx={{ flex: 1, height: 6, borderRadius: 3 }}
                                />
                                <Typography variant="caption" fontFamily="monospace">{rate}%</Typography>
                              </>
                            )}
                          </Box>
                        )
                      })()}
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 70 }}>{t('ppe.expiryDate')}</Typography>
                        <Typography variant="body2" fontFamily="monospace" sx={{
                          color: item.status === 'EXPIRED' ? 'error.main' : item.status === 'EXPIRY_SOON' ? 'warning.main' : 'text.secondary'
                        }}>
                          {item.expiryDate || ''}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                )
              })}
            </Box>
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <Pagination count={totalPages} page={page + 1} onChange={(_, p) => setPage(p - 1)} color="primary" />
              </Box>
            )}
          </>
        )}
      </Box>

      {/* 3-Column Panels: 알림 + 분류별 현황 + 점검 일정 */}
      {allItems.length > 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2, mt: 2, flexShrink: 0 }}>

          {/* 교체·점검 알림 */}
          <Paper sx={(theme: any) => ({ ...(theme.isYesco && { border: 1, borderColor: '#0F2147' }) })}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <NotificationsActiveIcon color="warning" fontSize="small" />
              <Typography variant="subtitle2" fontWeight="bold" sx={{ flex: 1 }}>{t('ppe.alertTitle')}</Typography>
              <Chip label={`${alertItems.length}${t('ppe.count')}`} size="small" color={alertItems.length > 0 ? 'error' : 'default'} />
            </Box>
            <List dense sx={{ maxHeight: 280, overflow: 'auto' }}>
              {alertItems.length === 0 ? (
                <ListItem><ListItemText secondary={t('ppe.noAlerts')} /></ListItem>
              ) : alertItems.map((a, i) => (
                <ListItem key={i} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <FiberManualRecordIcon sx={{ fontSize: 10, color: a.severity === 'error' ? 'error.main' : 'warning.main' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={<Typography variant="body2" fontWeight={500}>{a.name}</Typography>}
                    secondary={`${a.department} · ${t(`ppe.status${a.status === 'EXPIRED' ? 'Expired' : a.status === 'LOW_STOCK' ? 'LowStock' : 'ExpirySoon'}`)}`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>

          {/* 분류별 보호구 현황 */}
          <Paper sx={(theme: any) => ({ ...(theme.isYesco && { border: 1, borderColor: '#0F2147' }) })}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <CategoryIcon color="info" fontSize="small" />
              <Typography variant="subtitle2" fontWeight="bold">{t('ppe.categoryStats')}</Typography>
            </Box>
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {categoryStats.map((cat, i) => (
                <Box key={cat.code}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ width: 90, flexShrink: 0 }}>{cat.label}</Typography>
                    <Box sx={{ flex: 1 }}>
                      <LinearProgress variant="determinate" value={cat.pct} sx={{ height: 8, borderRadius: 4, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] } }} />
                    </Box>
                    <Typography variant="body2" fontFamily="monospace" sx={{ width: 30, textAlign: 'right' }}>{cat.count}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ width: 36, textAlign: 'right' }}>{cat.pct}%</Typography>
                  </Box>
                </Box>
              ))}
              {categoryStats.length > 0 && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>{'분류별 평균 재고율'}</Typography>
                  {categoryStats.map((cat) => (
                    <Box key={`wr-${cat.code}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ width: 90, flexShrink: 0 }}>{cat.label}</Typography>
                      <LinearProgress
                        variant="determinate"
                        value={cat.avgWear}
                        color={cat.avgWear >= 50 ? 'success' : cat.avgWear >= 20 ? 'warning' : 'error'}
                        sx={{ flex: 1, height: 5, borderRadius: 3 }}
                      />
                      <Typography variant="body2" fontFamily="monospace" sx={{ width: 36, textAlign: 'right', color: cat.avgWear >= 50 ? 'success.main' : cat.avgWear >= 20 ? 'warning.main' : 'error.main' }}>
                        {cat.avgWear}%
                      </Typography>
                    </Box>
                  ))}
                </>
              )}
            </Box>
          </Paper>

          {/* 점검·교체 일정 */}
          <Paper sx={(theme: any) => ({ ...(theme.isYesco && { border: 1, borderColor: '#0F2147' }) })}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <EventNoteIcon color="success" fontSize="small" />
              <Typography variant="subtitle2" fontWeight="bold">{t('ppe.scheduleTitle')}</Typography>
            </Box>
            <List dense sx={{ maxHeight: 280, overflow: 'auto' }}>
              {scheduleItems.length === 0 ? (
                <ListItem><ListItemText secondary={t('ppe.noSchedule')} /></ListItem>
              ) : scheduleItems.map((s, i) => (
                <ListItem key={i} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <ListItemIcon sx={{ minWidth: 24 }}>
                    <FiberManualRecordIcon sx={{ fontSize: 8, color: s.isPast ? 'error.main' : 'success.main' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={<Typography variant="body2" fontWeight={500}>{s.name}</Typography>}
                    secondary={`${s.department} · ${s.cycle}`}
                  />
                  <Typography variant="caption" fontFamily="monospace" color={s.isPast ? 'error.main' : 'text.secondary'}>{s.date}</Typography>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>
      )}

      {/* 최근 지급·반납 이력 (PPE Issuance) */}
      {allItems.length > 0 && (
        <Paper sx={{ mt: 2, px: 2, pb: 2, flexShrink: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1.5 }}>
            <HistoryIcon color="secondary" fontSize="small" />
            <Typography variant="subtitle2" fontWeight="bold" sx={{ flex: 1 }}>{t('ppe.issuanceHistory')}</Typography>
            <Chip label={t('ppe.recent30days')} size="small" variant="outlined" />
          </Box>
          {/* PC Table */}
          <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={headerCellSx}>{t('ppe.issuanceDate')}</TableCell>
                  <TableCell sx={headerCellSx}>{t('ppe.issuanceType')}</TableCell>
                  <TableCell sx={headerCellSx}>{t('ppe.itemName')}</TableCell>
                  <TableCell sx={headerCellSx} align="center">{t('ppe.quantity')}</TableCell>
                  <TableCell sx={headerCellSx}>{t('ppe.recipient')}</TableCell>
                  <TableCell sx={headerCellSx}>{t('ppe.department')}</TableCell>
                  <TableCell sx={headerCellSx}>{t('ppe.notes')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(historyData?.content || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>{t('common.noData')}</TableCell>
                  </TableRow>
                ) : (historyData?.content || []).map((h) => {
                  const ac = ACTION_TYPE_CHIP[h.actionType as PpeActionType] || ACTION_TYPE_CHIP.ISSUE
                  return (
                    <TableRow key={h.id} hover>
                      <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{formatDateTime(h.actionDate)}</TableCell>
                      <TableCell align="center"><Chip label={ac.label} color={ac.color} size="small" /></TableCell>
                      <TableCell>{h.itemName}</TableCell>
                      <TableCell align="center">{h.quantity}</TableCell>
                      <TableCell align="center">{h.recipientName || ''}</TableCell>
                      <TableCell align="center">{h.recipientDept || ''}</TableCell>
                      <TableCell sx={{ color: h.actionType === 'DISPOSE' ? 'error.main' : 'text.secondary' }}>{h.notes || ''}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
          {/* Mobile Cards */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1 }}>
            {(historyData?.content || []).length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>{t('common.noData')}</Typography>
            ) : (historyData?.content || []).map((h) => {
              const ac = ACTION_TYPE_CHIP[h.actionType as PpeActionType] || ACTION_TYPE_CHIP.ISSUE
              return (
                <Paper key={h.id} variant="outlined" sx={{ p: 1.5 }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.75 }}>
                    <Chip label={ac.label} color={ac.color} size="small" />
                    <Box sx={{ flex: 1 }} />
                    <Typography variant="caption" fontFamily="monospace" color="text.secondary">
                      {formatDateTime(h.actionDate)}
                    </Typography>
                  </Box>
                  <Typography fontWeight="bold" color="primary" sx={{ mb: 0.5 }}>
                    {h.itemName} <Typography component="span" variant="body2" fontFamily="monospace">× {h.quantity}</Typography>
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 70 }}>{t('ppe.recipient')}</Typography>
                      <Typography variant="body2">{h.recipientName || ''} {h.recipientDept ? `(${h.recipientDept})` : ''}</Typography>
                    </Box>
                    {h.notes && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 70 }}>{t('ppe.notes')}</Typography>
                        <Typography variant="body2" sx={{ color: h.actionType === 'DISPOSE' ? 'error.main' : 'inherit' }}>{h.notes}</Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              )
            })}
          </Box>
        </Paper>
      )}
      </>}
      </>}
    </Box>
  )
}

export default PpeEquipmentPage
