import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box,
  TextField,
  InputAdornment,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Pagination,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../contexts/AlertContext'
// import { useAuth } from '../../context/AuthContext'
import axiosInstance from '../../api/axiosInstance'
import { HazardFactor, HazardFactorRequest } from '../../types/diseasePrevention.types'
import { ApiResponse, PageResponse } from '../../types/common.types'
import NumberField from '../common/NumberField'
import DatePickerField from '../common/DatePickerField'
import LoadingOverlay from '../common/LoadingOverlay'
import useCodeMap from '../../hooks/useCodeMap'
import UserSelectModal, { UserInfo } from '../common/UserSelectModal'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

interface HazardFactorTabProps {
  hazardType: string
}

// ===== API functions =====
const fetchHazardFactors = async (hazardType: string, page: number, size: number): Promise<PageResponse<HazardFactor>> => {
  const res = await axiosInstance.get<ApiResponse<PageResponse<HazardFactor>>>(`/hazard-factors/type/${hazardType}?page=${page}&size=${size}`)
  return res.data.data
}

const fetchHazardDetail = async (id: number): Promise<HazardFactor> => {
  const res = await axiosInstance.get<ApiResponse<HazardFactor>>(`/hazard-factors/${id}`)
  return res.data.data
}

const searchHazardFactors = async (hazardType: string, name: string, page: number, size: number): Promise<PageResponse<HazardFactor>> => {
  const res = await axiosInstance.get<ApiResponse<PageResponse<HazardFactor>>>(`/hazard-factors/type/${hazardType}/search?name=${encodeURIComponent(name)}&page=${page}&size=${size}`)
  return res.data.data
}

const createHazardFactor = async (data: HazardFactorRequest): Promise<HazardFactor> => {
  const res = await axiosInstance.post<ApiResponse<HazardFactor>>('/hazard-factors', data)
  return res.data.data
}

const updateHazardFactor = async ({ id, data }: { id: number; data: HazardFactorRequest }): Promise<HazardFactor> => {
  const res = await axiosInstance.put<ApiResponse<HazardFactor>>(`/hazard-factors/${id}`, data)
  return res.data.data
}

const deleteHazardFactor = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/hazard-factors/${id}`)
}

// ===== Constants =====
const RISK_COLORS: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  VERY_HIGH: 'error',
  HIGH: 'warning',
  MEDIUM: 'info',
  LOW: 'success',
}

const PREVENTION_COLORS: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  COMPLETED: 'success',
  IN_PROGRESS: 'info',
  PLANNED: 'default',
  NOT_STARTED: 'error',
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

const HazardFactorTab: React.FC<HazardFactorTabProps> = ({ hazardType }) => {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const { showWarning, showSuccess, showConfirm } = useAlert()
  const { codeList: riskCodes, getLabel: getRiskCodeLabel } = useCodeMap('HAZARD_RISK_LEVEL')
  const { codeList: preventionCodes, getLabel: getPreventionCodeLabel } = useCodeMap('PREVENTION_STATUS')
  const { codeList: vaccinationCodes, getLabel: getVaccinationCodeLabel } = useCodeMap('VACCINATION_STATUS')

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<HazardFactor | null>(null)
  const [searchText, setSearchText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [page, setPage] = useState(0)
  const rowsPerPage = 10

  const emptyForm: HazardFactorRequest = {
    hazardType,
    factorName: '',
  }
  const [formData, setFormData] = useState<HazardFactorRequest>(emptyForm)
  const [userSelectTarget, setUserSelectTarget] = useState<string | null>(null)

  const handleUserSelect = (users: UserInfo[]) => {
    if (users.length > 0 && userSelectTarget) {
      const u = users[0]
      setFormData((f) => ({ ...f, managerName: u.name, managerDept: u.department }))
    }
    setUserSelectTarget(null)
  }

  // ===== Queries =====
  const { data, isLoading } = useQuery({
    queryKey: ['hazardFactors', hazardType, page, searchQuery],
    queryFn: () =>
      searchQuery
        ? searchHazardFactors(hazardType, searchQuery, page, rowsPerPage)
        : fetchHazardFactors(hazardType, page, rowsPerPage),
    enabled: viewMode === 'list',
  })

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['hazardFactorDetail', selectedItem?.id],
    queryFn: () => fetchHazardDetail(selectedItem!.id),
    enabled: !!selectedItem?.id && (viewMode === 'detail' || viewMode === 'edit'),
  })

  // ===== Mutations =====
  const createMutation = useMutation({
    mutationFn: createHazardFactor,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['hazardFactors', hazardType] })
      await showSuccess(t('common.saved', '저장되었습니다'))
      handleBackToList()
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateHazardFactor,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['hazardFactors', hazardType] })
      queryClient.invalidateQueries({ queryKey: ['hazardFactorDetail'] })
      await showSuccess(t('common.saved', '저장되었습니다'))
      handleBackToList()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteHazardFactor,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['hazardFactors', hazardType] })
      await showSuccess(t('common.deleted', '삭제되었습니다'))
      handleBackToList()
    },
  })

  const isProcessing = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  // ===== Handlers =====
  const handleBackToList = () => {
    setViewMode('list')
    setSelectedItem(null)
    setFormData({ ...emptyForm })
  }

  const handleReset = () => {
    setSearchText('')
    setSearchQuery('')
    setRiskFilter('')
    setPage(0)
  }

  const handleSearch = () => {
    setSearchQuery(searchText)
    setPage(0)
  }

  const handleRowClick = (item: HazardFactor) => {
    setSelectedItem(item)
    setViewMode('detail')
  }

  const handleAddClick = () => {
    setSelectedItem(null)
    setFormData({ ...emptyForm })
    setViewMode('create')
  }

  const handleEditClick = () => {
    if (!detail) return
    setFormData({
      hazardType: detail.hazardType,
      factorName: detail.factorName,
      category: detail.category || '',
      process: detail.process || '',
      riskLevel: detail.riskLevel || '',
      measuredValue: detail.measuredValue || '',
      exposureStandard: detail.exposureStandard || '',
      assessmentMethod: detail.assessmentMethod || '',
      assessmentScore: detail.assessmentScore || '',
      casNumber: detail.casNumber || '',
      exposureRoute: detail.exposureRoute || '',
      vaccinationStatus: detail.vaccinationStatus || '',
      targetGroup: detail.targetGroup || '',
      targetCount: detail.targetCount ?? undefined,
      highRiskCount: detail.highRiskCount ?? undefined,
      preventionStatus: detail.preventionStatus || '',
      preventionDetail: detail.preventionDetail || '',
      preventionRate: detail.preventionRate ?? undefined,
      lastCheckDate: detail.lastCheckDate || '',
      managerName: detail.managerName || '',
      managerDept: detail.managerDept || '',
      remarks: detail.remarks || '',
    })
    setViewMode('edit')
  }

  const handleDeleteClick = async () => {
    if (!selectedItem) return
    const confirmed = await showConfirm(
      `${t('common.confirmDeleteMessage', '삭제하시겠습니까?')}\n${t('common.deleteWarning', '이 작업은 되돌릴 수 없습니다.')}`,
      { title: t('common.delete', '삭제') }
    )
    if (confirmed) {
      deleteMutation.mutate(selectedItem.id)
    }
  }

  const handleSubmit = async () => {
    if (!formData.factorName) {
      showWarning(t('dp.enterFactorName', '유해인자명을 입력하세요'))
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

  // ===== Helper functions =====
  const getRiskLabel = (level: string) => getRiskCodeLabel(level)
  const getPreventionLabel = (status: string) => getPreventionCodeLabel(status)
  const getVaccinationLabel = (status: string) => getVaccinationCodeLabel(status)

  const items = data?.content || []
  const filteredItems = riskFilter ? items.filter((i) => i.riskLevel === riskFilter) : items
  const totalPages = data?.totalPages || 0

  // ===== Column definitions by hazard type =====
  const getColumns = () => {
    switch (hazardType) {
      case 'CHEMICAL':
        return [
          { key: 'factorName', label: t('dp.factorName'), render: (r: HazardFactor) => r.factorName },
          { key: 'casNumber', label: t('dp.casNumber'), render: (r: HazardFactor) => r.casNumber || '' },
          { key: 'category', label: t('dp.category'), render: (r: HazardFactor) => r.category || '' },
          { key: 'process', label: t('dp.process'), render: (r: HazardFactor) => r.process || '' },
          { key: 'riskLevel', label: t('dp.riskLevel'), render: (r: HazardFactor) => r.riskLevel ? <Chip label={getRiskLabel(r.riskLevel)} color={RISK_COLORS[r.riskLevel] || 'default'} size="small" /> : '' },
          { key: 'measuredValue', label: t('dp.measuredValue'), render: (r: HazardFactor) => r.measuredValue || '' },
          { key: 'exposureStandard', label: t('dp.exposureStandard'), render: (r: HazardFactor) => r.exposureStandard || '' },
          { key: 'preventionStatus', label: t('dp.preventionStatus'), render: (r: HazardFactor) => r.preventionStatus ? <Chip label={getPreventionLabel(r.preventionStatus)} color={PREVENTION_COLORS[r.preventionStatus] || 'default'} size="small" /> : '' },
          { key: 'lastCheckDate', label: t('dp.lastCheckDate'), render: (r: HazardFactor) => r.lastCheckDate || '' },
        ]
      case 'PHYSICAL':
        return [
          { key: 'factorName', label: t('dp.factorName'), render: (r: HazardFactor) => r.factorName },
          { key: 'category', label: t('dp.category'), render: (r: HazardFactor) => r.category || '' },
          { key: 'process', label: t('dp.process'), render: (r: HazardFactor) => r.process || '' },
          { key: 'measuredValue', label: t('dp.measuredValue'), render: (r: HazardFactor) => r.measuredValue || '' },
          { key: 'riskLevel', label: t('dp.riskLevel'), render: (r: HazardFactor) => r.riskLevel ? <Chip label={getRiskLabel(r.riskLevel)} color={RISK_COLORS[r.riskLevel] || 'default'} size="small" /> : '' },
          { key: 'exposureStandard', label: t('dp.exposureStandard'), render: (r: HazardFactor) => r.exposureStandard || '' },
          { key: 'preventionStatus', label: t('dp.preventionStatus'), render: (r: HazardFactor) => r.preventionStatus ? <Chip label={getPreventionLabel(r.preventionStatus)} color={PREVENTION_COLORS[r.preventionStatus] || 'default'} size="small" /> : '' },
          { key: 'preventionRate', label: t('dp.preventionRate'), render: (r: HazardFactor) => r.preventionRate != null ? `${r.preventionRate}%` : '' },
        ]
      case 'BIOLOGICAL':
        return [
          { key: 'factorName', label: t('dp.factorName'), render: (r: HazardFactor) => r.factorName },
          { key: 'category', label: t('dp.category'), render: (r: HazardFactor) => r.category || '' },
          { key: 'exposureRoute', label: t('dp.exposureRoute'), render: (r: HazardFactor) => r.exposureRoute || '' },
          { key: 'process', label: t('dp.process'), render: (r: HazardFactor) => r.process || '' },
          { key: 'riskLevel', label: t('dp.riskLevel'), render: (r: HazardFactor) => r.riskLevel ? <Chip label={getRiskLabel(r.riskLevel)} color={RISK_COLORS[r.riskLevel] || 'default'} size="small" /> : '' },
          { key: 'vaccinationStatus', label: t('dp.vaccinationStatus'), render: (r: HazardFactor) => r.vaccinationStatus ? getVaccinationLabel(r.vaccinationStatus) : '' },
          { key: 'preventionStatus', label: t('dp.preventionStatus'), render: (r: HazardFactor) => r.preventionStatus ? <Chip label={getPreventionLabel(r.preventionStatus)} color={PREVENTION_COLORS[r.preventionStatus] || 'default'} size="small" /> : '' },
          { key: 'lastCheckDate', label: t('dp.lastCheckDate'), render: (r: HazardFactor) => r.lastCheckDate || '' },
        ]
      case 'ERGONOMIC':
        return [
          { key: 'factorName', label: t('dp.factorName'), render: (r: HazardFactor) => r.factorName },
          { key: 'category', label: t('dp.category'), render: (r: HazardFactor) => r.category || '' },
          { key: 'process', label: t('dp.process'), render: (r: HazardFactor) => r.process || '' },
          { key: 'assessmentMethod', label: t('dp.assessmentMethod'), render: (r: HazardFactor) => r.assessmentMethod || '' },
          { key: 'riskLevel', label: t('dp.riskLevel'), render: (r: HazardFactor) => r.riskLevel ? <Chip label={getRiskLabel(r.riskLevel)} color={RISK_COLORS[r.riskLevel] || 'default'} size="small" /> : '' },
          { key: 'assessmentScore', label: t('dp.assessmentScore'), render: (r: HazardFactor) => r.assessmentScore || '' },
          { key: 'preventionStatus', label: t('dp.preventionStatus'), render: (r: HazardFactor) => r.preventionStatus ? <Chip label={getPreventionLabel(r.preventionStatus)} color={PREVENTION_COLORS[r.preventionStatus] || 'default'} size="small" /> : '' },
          { key: 'lastCheckDate', label: t('dp.lastCheckDate'), render: (r: HazardFactor) => r.lastCheckDate || '' },
        ]
      case 'PSYCHOSOCIAL':
        return [
          { key: 'factorName', label: t('dp.factorName'), render: (r: HazardFactor) => r.factorName },
          { key: 'category', label: t('dp.category'), render: (r: HazardFactor) => r.category || '' },
          { key: 'targetGroup', label: t('dp.targetGroup'), render: (r: HazardFactor) => r.targetGroup || '' },
          { key: 'riskLevel', label: t('dp.riskLevel'), render: (r: HazardFactor) => r.riskLevel ? <Chip label={getRiskLabel(r.riskLevel)} color={RISK_COLORS[r.riskLevel] || 'default'} size="small" /> : '' },
          { key: 'targetCount', label: t('dp.targetCount'), render: (r: HazardFactor) => r.targetCount != null ? String(r.targetCount) : '' },
          { key: 'highRiskCount', label: t('dp.highRiskCount'), render: (r: HazardFactor) => r.highRiskCount != null ? String(r.highRiskCount) : '' },
          { key: 'preventionStatus', label: t('dp.preventionStatus'), render: (r: HazardFactor) => r.preventionStatus ? <Chip label={getPreventionLabel(r.preventionStatus)} color={PREVENTION_COLORS[r.preventionStatus] || 'default'} size="small" /> : '' },
          { key: 'lastCheckDate', label: t('dp.lastCheckDate'), render: (r: HazardFactor) => r.lastCheckDate || '' },
        ]
      default:
        return []
    }
  }

  const columns = getColumns()

  // ===== KPI / Dashboard computations =====
  const totalCount = data?.totalElements ?? items.length
  const highRiskCount_kpi = items.filter(i => i.riskLevel === 'VERY_HIGH' || i.riskLevel === 'HIGH').length
  const preventionIncomplete = items.filter(i => i.preventionStatus === 'NOT_STARTED' || i.preventionStatus === 'IN_PROGRESS').length
  const preventionCompleted = items.filter(i => i.preventionStatus === 'COMPLETED').length
  const completionRate = totalCount > 0 ? Math.round((preventionCompleted / totalCount) * 100) : 0
  const highRiskItems = items.filter(i => i.riskLevel === 'VERY_HIGH')

  const RISK_BAR_COLORS: Record<string, string> = {
    VERY_HIGH: '#f43f5e',
    HIGH: '#f59e0b',
    MEDIUM: '#3b82f6',
    LOW: '#10b981',
  }

  const PREVENTION_BORDER_COLORS: Record<string, string> = {
    COMPLETED: '#10b981',
    IN_PROGRESS: '#3b82f6',
    PLANNED: '#8b5cf6',
    NOT_STARTED: '#f43f5e',
  }

  const getProgressColor = (rate: number | undefined | null) => {
    if (rate == null) return '#9e9e9e'
    if (rate >= 80) return '#10b981'
    if (rate >= 50) return '#3b82f6'
    if (rate >= 20) return '#f59e0b'
    return '#f43f5e'
  }

  // ===== Render: List =====
  const renderListView = () => (
    <>
      {/* Section 1: KPI Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 2 }}>
        <Paper sx={{ p: 2, position: 'relative', overflow: 'hidden' }}>
          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, bgcolor: '#3b82f6' }} />
          <Typography variant="caption" color="text.secondary">관리 인자 수</Typography>
          <Typography variant="h4" fontWeight="bold" color="#3b82f6" sx={{ fontFamily: 'monospace' }}>{totalCount}</Typography>
          <Typography variant="caption" color="text.secondary">전체 등록 인자</Typography>
        </Paper>
        <Paper sx={{ p: 2, position: 'relative', overflow: 'hidden' }}>
          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, bgcolor: '#f43f5e' }} />
          <Typography variant="caption" color="text.secondary">고위험</Typography>
          <Typography variant="h4" fontWeight="bold" color="#f43f5e" sx={{ fontFamily: 'monospace' }}>{highRiskCount_kpi}</Typography>
          <Typography variant="caption" color="text.secondary">매우높음 + 높음</Typography>
        </Paper>
        <Paper sx={{ p: 2, position: 'relative', overflow: 'hidden' }}>
          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, bgcolor: '#f59e0b' }} />
          <Typography variant="caption" color="text.secondary">예방조치 미완료</Typography>
          <Typography variant="h4" fontWeight="bold" color="#f59e0b" sx={{ fontFamily: 'monospace' }}>{preventionIncomplete}</Typography>
          <Typography variant="caption" color="text.secondary">미시작 + 진행중</Typography>
        </Paper>
        <Paper sx={{ p: 2, position: 'relative', overflow: 'hidden' }}>
          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, bgcolor: '#10b981' }} />
          <Typography variant="caption" color="text.secondary">예방조치 완료율</Typography>
          <Typography variant="h4" fontWeight="bold" color="#10b981" sx={{ fontFamily: 'monospace' }}>{completionRate}%</Typography>
          <Typography variant="caption" color="text.secondary">완료 / 전체</Typography>
        </Paper>
      </Box>

      {/* Section 2: Alert Banner */}
      {highRiskItems.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <strong>{highRiskItems[0].factorName} ({highRiskItems[0].process || ''})</strong> — 위험도 '매우높음' · 즉시 조치 필요
        </Alert>
      )}

      {/* Section 3: Search, Filter, Table (existing) */}
      {/* PC search bar */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder={t('dp.searchByName', '유해인자명 검색')}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            sx={{ width: 280 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleSearch}><SearchIcon /></IconButton>
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <Select displayEmpty value={riskFilter} onChange={(e) => { setRiskFilter(e.target.value); setPage(0) }}>
              <MenuItem value="">{t('dp.riskLevel')}</MenuItem>
              {riskCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getRiskLabel(c.code)}</MenuItem>)}
            </Select>
          </FormControl>
          <IconButton onClick={handleReset} size="small"><RefreshIcon /></IconButton>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddClick}>New</Button>
      </Box>

      {/* Mobile search bar */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5, mb: 2 }}>
        <TextField
          size="small"
          placeholder={t('dp.searchByName', '유해인자명 검색')}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          fullWidth
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleSearch}><SearchIcon /></IconButton>
              </InputAdornment>
            ),
          }}
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <FormControl size="small" sx={{ flex: 1 }}>
            <Select displayEmpty value={riskFilter} onChange={(e) => { setRiskFilter(e.target.value); setPage(0) }}>
              <MenuItem value="">{t('dp.riskLevel')}</MenuItem>
              {riskCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getRiskLabel(c.code)}</MenuItem>)}
            </Select>
          </FormControl>
          <Button variant="outlined" size="small" onClick={handleReset} startIcon={<RefreshIcon />} sx={{ flex: 1 }}>
            {t('common.search', '검색')}
          </Button>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddClick} sx={{ flex: 1 }}>New</Button>
        </Box>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : filteredItems.length === 0 ? (
        <Alert severity="info" sx={{ m: 2 }}>{t('common.noData', '데이터가 없습니다')}</Alert>
      ) : (
        <>
          {/* PC Table */}
          <Paper sx={{ display: { xs: 'none', md: 'block' } }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {columns.map((col) => (
                      <TableCell key={col.key} sx={hSx} align="center">{col.label}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                      {columns.map((col) => (
                        <TableCell key={col.key} align="center">{col.render(item)}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Mobile cards */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
            {filteredItems.map((item) => (
              <Paper key={item.id} sx={{ p: 2, border: 1, borderColor: 'grey.300', cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography fontWeight="bold">{item.factorName}</Typography>
                  {item.riskLevel && <Chip label={getRiskLabel(item.riskLevel)} color={RISK_COLORS[item.riskLevel] || 'default'} size="small" />}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {item.category || ''} | {item.process || ''} | {item.managerName || ''}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                  {item.preventionStatus && <Chip label={getPreventionLabel(item.preventionStatus)} color={PREVENTION_COLORS[item.preventionStatus] || 'default'} size="small" />}
                  {item.lastCheckDate && <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto', alignSelf: 'center' }}>{item.lastCheckDate}</Typography>}
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

      {/* Section 4: Two-column grid - Prevention Status & Risk Distribution */}
      {items.length > 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mt: 2 }}>
          {/* Left: Prevention Status */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>예방조치 현황</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
              {items.filter(item => item.preventionDetail).slice(0, 4).map((item, idx) => {
                const borderColor = PREVENTION_BORDER_COLORS[item.preventionStatus || ''] || '#9e9e9e'
                const pColor = getProgressColor(item.preventionRate)
                return (
                  <Paper key={idx} variant="outlined" sx={{ p: 1.5, position: 'relative', borderLeft: 3, borderColor }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" fontWeight="bold">{item.factorName}</Typography>
                      {item.preventionStatus && (
                        <Chip label={getPreventionLabel(item.preventionStatus)} size="small" color={PREVENTION_COLORS[item.preventionStatus] || 'default'} />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary">{item.process || ''}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Box sx={{ flex: 1, height: 4, bgcolor: 'grey.200', borderRadius: 2, overflow: 'hidden' }}>
                        <Box sx={{ height: '100%', width: `${item.preventionRate ?? 0}%`, bgcolor: pColor, borderRadius: 2 }} />
                      </Box>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', color: pColor }}>{item.preventionRate ?? 0}%</Typography>
                    </Box>
                  </Paper>
                )
              })}
            </Box>
          </Paper>

          {/* Right: Risk Level Distribution */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>위험도 분포</Typography>
            {riskCodes.map(c => c.code).map(level => {
              const count = items.filter(i => i.riskLevel === level).length
              const pct = items.length > 0 ? (count / items.length * 100) : 0
              const barColor = RISK_BAR_COLORS[level]
              return (
                <Box key={level} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Typography variant="body2" sx={{ width: 70, textAlign: 'right' }}>{getRiskLabel(level)}</Typography>
                  <Box sx={{ flex: 1, height: 18, bgcolor: 'grey.100', borderRadius: 1, overflow: 'hidden' }}>
                    <Box sx={{ height: '100%', width: `${pct}%`, bgcolor: barColor, borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', pr: 0.5, minWidth: count > 0 ? 20 : 0 }}>
                      {count > 0 && (
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: 10, color: '#fff' }}>{count}</Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              )
            })}
          </Paper>
        </Box>
      )}
    </>
  )

  // ===== Render: Detail =====
  const renderDetailView = () => {
    if (detailLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
    const item = detail || selectedItem
    if (!item) return null

    const dLabelSx = { ...labelSx, width: 140, minWidth: 140 }
    const dValSx = { flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper' }
    const dValBorderSx = { ...dValSx, borderRight: 1, borderColor: 'grey.300' }

    const fields: [string, React.ReactNode][] = [
      [t('dp.factorName'), item.factorName],
      [t('dp.category'), item.category || ''],
      [t('dp.process'), item.process || ''],
      [t('dp.riskLevel'), item.riskLevel ? <Chip label={getRiskLabel(item.riskLevel)} color={RISK_COLORS[item.riskLevel] || 'default'} size="small" /> : ''],
      [t('dp.preventionStatus'), item.preventionStatus ? <Chip label={getPreventionLabel(item.preventionStatus)} color={PREVENTION_COLORS[item.preventionStatus] || 'default'} size="small" /> : ''],
      [t('dp.preventionRate'), item.preventionRate != null ? `${item.preventionRate}%` : ''],
      [t('dp.lastCheckDate'), item.lastCheckDate || ''],
      [t('dp.manager'), item.managerName || ''],
      [t('dp.managerDept'), item.managerDept || ''],
    ]

    // Type-specific fields
    if (hazardType === 'CHEMICAL') {
      fields.splice(2, 0, [t('dp.casNumber'), item.casNumber || ''])
      fields.push([t('dp.measuredValue'), item.measuredValue || ''])
      fields.push([t('dp.exposureStandard'), item.exposureStandard || ''])
    }
    if (hazardType === 'PHYSICAL') {
      fields.push([t('dp.measuredValue'), item.measuredValue || ''])
      fields.push([t('dp.exposureStandard'), item.exposureStandard || ''])
    }
    if (hazardType === 'BIOLOGICAL') {
      fields.push([t('dp.exposureRoute'), item.exposureRoute || ''])
      fields.push([t('dp.vaccinationStatus'), item.vaccinationStatus ? getVaccinationLabel(item.vaccinationStatus) : ''])
    }
    if (hazardType === 'ERGONOMIC') {
      fields.push([t('dp.assessmentMethod'), item.assessmentMethod || ''])
      fields.push([t('dp.assessmentScore'), item.assessmentScore || ''])
    }
    if (hazardType === 'PSYCHOSOCIAL') {
      fields.push([t('dp.targetGroup'), item.targetGroup || ''])
      fields.push([t('dp.targetCount'), item.targetCount != null ? String(item.targetCount) : ''])
      fields.push([t('dp.highRiskCount'), item.highRiskCount != null ? String(item.highRiskCount) : ''])
      fields.push([t('dp.assessmentMethod'), item.assessmentMethod || ''])
    }

    if (item.preventionDetail) {
      fields.push([t('dp.preventionDetail'), item.preventionDetail])
    }
    if (item.remarks) {
      fields.push([t('common.notes', '비고'), item.remarks])
    }

    return (
      <>
          {/* PC detail */}
          <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden', mb: 3 }}>
            {(() => {
              const rows: React.ReactNode[] = []
              for (let i = 0; i < fields.length; i += 2) {
                const f1 = fields[i]
                const f2 = fields[i + 1]
                rows.push(
                  <Box key={i} sx={i < fields.length - 2 || fields.length % 2 === 0 ? rowSx : { display: 'flex' }}>
                    <Typography sx={dLabelSx}>{f1[0]}</Typography>
                    <Box sx={f2 ? dValBorderSx : dValSx}>
                      <Typography variant="body2" sx={{ py: 0.5, whiteSpace: 'pre-wrap' }} component="div">{f1[1]}</Typography>
                    </Box>
                    {f2 && (
                      <>
                        <Typography sx={dLabelSx}>{f2[0]}</Typography>
                        <Box sx={dValSx}>
                          <Typography variant="body2" sx={{ py: 0.5, whiteSpace: 'pre-wrap' }} component="div">{f2[1]}</Typography>
                        </Box>
                      </>
                    )}
                  </Box>
                )
              }
              return rows
            })()}
          </Box>

          {/* Mobile detail */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 3 }}>
            {fields.map(([label, value], i) => (
              <Box key={i}>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{label}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5, whiteSpace: 'pre-wrap' }} component="div">{value}</Typography>
              </Box>
            ))}
          </Box>

        <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.list', '목록')}</Button>
          <Button variant="contained" onClick={handleEditClick} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.edit', '수정')}</Button>
          <Button variant="contained" color="error" onClick={handleDeleteClick} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.delete', '삭제')}</Button>
        </Box>
      </>
    )
  }

  // ===== Render: Form =====
  const renderFormView = () => {
    const f = formData
    const set = (patch: Partial<HazardFactorRequest>) => setFormData({ ...f, ...patch })

    // Common form rows for PC
    const renderPcForm = () => (
      <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
          <Typography sx={labelSx}>{t('dp.factorName')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
          <Box sx={valBorderSx}>
            <TextField fullWidth size="small" value={f.factorName} onChange={(e) => set({ factorName: e.target.value })} />
          </Box>
          <Typography sx={labelSx}>{t('dp.category')}</Typography>
          <Box sx={valSx}>
            <TextField fullWidth size="small" value={f.category ?? ''} onChange={(e) => set({ category: e.target.value })} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
          <Typography sx={labelSx}>{t('dp.process')}</Typography>
          <Box sx={valBorderSx}>
            <TextField fullWidth size="small" value={f.process ?? ''} onChange={(e) => set({ process: e.target.value })} />
          </Box>
          <Typography sx={labelSx}>{t('dp.riskLevel')}</Typography>
          <Box sx={valSx}>
            <Select fullWidth size="small" displayEmpty value={f.riskLevel ?? ''} onChange={(e) => set({ riskLevel: e.target.value })}>
              <MenuItem value="">{t('common.select', '선택')}</MenuItem>
              {riskCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getRiskLabel(c.code)}</MenuItem>)}
            </Select>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
          <Typography sx={labelSx}>{t('dp.preventionStatus')}</Typography>
          <Box sx={valBorderSx}>
            <Select fullWidth size="small" displayEmpty value={f.preventionStatus ?? ''} onChange={(e) => set({ preventionStatus: e.target.value })}>
              <MenuItem value="">{t('common.select', '선택')}</MenuItem>
              {preventionCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getPreventionLabel(c.code)}</MenuItem>)}
            </Select>
          </Box>
          <Typography sx={labelSx}>{t('dp.preventionRate')}</Typography>
          <Box sx={valSx}>
            <NumberField fullWidth size="small" value={f.preventionRate ?? null} onChange={(v) => set({ preventionRate: v ?? undefined })} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
          <Typography sx={labelSx}>{t('dp.lastCheckDate')}</Typography>
          <Box sx={valBorderSx}>
            <DatePickerField value={f.lastCheckDate || null} onChange={(v) => set({ lastCheckDate: v })} size="small" />
          </Box>
          <Typography sx={labelSx}>{t('dp.manager')}</Typography>
          <Box sx={{ ...valSx, gap: 1 }}>
            <TextField fullWidth size="small" value={f.managerName || ''} InputProps={{ readOnly: true }} />
            <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setUserSelectTarget('manager')}><PersonSearchIcon fontSize="small" /></Button>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
          <Typography sx={labelSx}>{t('dp.managerDept')}</Typography>
          <Box sx={valSx}>
            <TextField fullWidth size="small" value={f.managerDept || ''} InputProps={{ readOnly: true }} />
          </Box>
        </Box>

        {/* Type-specific fields */}
        {hazardType === 'CHEMICAL' && (
          <>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
              <Typography sx={labelSx}>{t('dp.casNumber')}</Typography>
              <Box sx={valBorderSx}>
                <TextField fullWidth size="small" value={f.casNumber ?? ''} onChange={(e) => set({ casNumber: e.target.value })} />
              </Box>
              <Typography sx={labelSx}>{t('dp.measuredValue')}</Typography>
              <Box sx={valSx}>
                <TextField fullWidth size="small" value={f.measuredValue ?? ''} onChange={(e) => set({ measuredValue: e.target.value })} />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
              <Typography sx={labelSx}>{t('dp.exposureStandard')}</Typography>
              <Box sx={valSx}>
                <TextField fullWidth size="small" value={f.exposureStandard ?? ''} onChange={(e) => set({ exposureStandard: e.target.value })} />
              </Box>
            </Box>
          </>
        )}
        {hazardType === 'PHYSICAL' && (
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
            <Typography sx={labelSx}>{t('dp.measuredValue')}</Typography>
            <Box sx={valBorderSx}>
              <TextField fullWidth size="small" value={f.measuredValue ?? ''} onChange={(e) => set({ measuredValue: e.target.value })} />
            </Box>
            <Typography sx={labelSx}>{t('dp.exposureStandard')}</Typography>
            <Box sx={valSx}>
              <TextField fullWidth size="small" value={f.exposureStandard ?? ''} onChange={(e) => set({ exposureStandard: e.target.value })} />
            </Box>
          </Box>
        )}
        {hazardType === 'BIOLOGICAL' && (
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
            <Typography sx={labelSx}>{t('dp.exposureRoute')}</Typography>
            <Box sx={valBorderSx}>
              <TextField fullWidth size="small" value={f.exposureRoute ?? ''} onChange={(e) => set({ exposureRoute: e.target.value })} />
            </Box>
            <Typography sx={labelSx}>{t('dp.vaccinationStatus')}</Typography>
            <Box sx={valSx}>
              <Select fullWidth size="small" displayEmpty value={f.vaccinationStatus ?? ''} onChange={(e) => set({ vaccinationStatus: e.target.value })}>
                <MenuItem value="">{t('common.select', '선택')}</MenuItem>
                {vaccinationCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getVaccinationLabel(c.code)}</MenuItem>)}
              </Select>
            </Box>
          </Box>
        )}
        {hazardType === 'ERGONOMIC' && (
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
            <Typography sx={labelSx}>{t('dp.assessmentMethod')}</Typography>
            <Box sx={valBorderSx}>
              <TextField fullWidth size="small" value={f.assessmentMethod ?? ''} onChange={(e) => set({ assessmentMethod: e.target.value })} />
            </Box>
            <Typography sx={labelSx}>{t('dp.assessmentScore')}</Typography>
            <Box sx={valSx}>
              <TextField fullWidth size="small" value={f.assessmentScore ?? ''} onChange={(e) => set({ assessmentScore: e.target.value })} />
            </Box>
          </Box>
        )}
        {hazardType === 'PSYCHOSOCIAL' && (
          <>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
              <Typography sx={labelSx}>{t('dp.targetGroup')}</Typography>
              <Box sx={valBorderSx}>
                <TextField fullWidth size="small" value={f.targetGroup ?? ''} onChange={(e) => set({ targetGroup: e.target.value })} />
              </Box>
              <Typography sx={labelSx}>{t('dp.assessmentMethod')}</Typography>
              <Box sx={valSx}>
                <TextField fullWidth size="small" value={f.assessmentMethod ?? ''} onChange={(e) => set({ assessmentMethod: e.target.value })} />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
              <Typography sx={labelSx}>{t('dp.targetCount')}</Typography>
              <Box sx={valBorderSx}>
                <NumberField fullWidth size="small" value={f.targetCount ?? null} onChange={(v) => set({ targetCount: v ?? undefined })} />
              </Box>
              <Typography sx={labelSx}>{t('dp.highRiskCount')}</Typography>
              <Box sx={valSx}>
                <NumberField fullWidth size="small" value={f.highRiskCount ?? null} onChange={(v) => set({ highRiskCount: v ?? undefined })} />
              </Box>
            </Box>
          </>
        )}

        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
          <Typography sx={labelSx}>{t('dp.preventionDetail')}</Typography>
          <Box sx={valSx}>
            <TextField fullWidth size="small" multiline rows={3} value={f.preventionDetail ?? ''} onChange={(e) => set({ preventionDetail: e.target.value })} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex' }}>
          <Typography sx={labelSx}>{t('common.notes', '비고')}</Typography>
          <Box sx={valSx}>
            <TextField fullWidth size="small" multiline rows={2} value={f.remarks ?? ''} onChange={(e) => set({ remarks: e.target.value })} />
          </Box>
        </Box>
      </Box>
    )

    // Mobile form
    const renderMobileForm = () => {
      const mobileField = (label: string, child: React.ReactNode, required = false) => (
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
            {label} {required && <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>}
          </Typography>
          {child}
        </Box>
      )

      return (
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 2 }}>
          {mobileField(t('dp.factorName'), <TextField size="small" fullWidth value={f.factorName} onChange={(e) => set({ factorName: e.target.value })} />, true)}
          {mobileField(t('dp.category'), <TextField size="small" fullWidth value={f.category ?? ''} onChange={(e) => set({ category: e.target.value })} />)}
          {mobileField(t('dp.process'), <TextField size="small" fullWidth value={f.process ?? ''} onChange={(e) => set({ process: e.target.value })} />)}
          {mobileField(t('dp.riskLevel'),
            <FormControl fullWidth size="small">
              <Select displayEmpty value={f.riskLevel ?? ''} onChange={(e) => set({ riskLevel: e.target.value })}>
                <MenuItem value="">{t('common.select', '선택')}</MenuItem>
                {riskCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getRiskLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
          )}
          {mobileField(t('dp.preventionStatus'),
            <FormControl fullWidth size="small">
              <Select displayEmpty value={f.preventionStatus ?? ''} onChange={(e) => set({ preventionStatus: e.target.value })}>
                <MenuItem value="">{t('common.select', '선택')}</MenuItem>
                {preventionCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getPreventionLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
          )}
          {mobileField(t('dp.preventionRate'), <NumberField size="small" fullWidth value={f.preventionRate ?? null} onChange={(v) => set({ preventionRate: v ?? undefined })} />)}
          {mobileField(t('dp.lastCheckDate'), <DatePickerField value={f.lastCheckDate || null} onChange={(v) => set({ lastCheckDate: v })} size="small" />)}
          {mobileField(t('dp.manager'),
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField fullWidth size="small" value={f.managerName || ''} InputProps={{ readOnly: true }} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setUserSelectTarget('manager')}><PersonSearchIcon fontSize="small" /></Button>
            </Box>
          )}
          {mobileField(t('dp.managerDept'), <TextField size="small" fullWidth value={f.managerDept || ''} InputProps={{ readOnly: true }} />)}

          {hazardType === 'CHEMICAL' && (
            <>
              {mobileField(t('dp.casNumber'), <TextField size="small" fullWidth value={f.casNumber ?? ''} onChange={(e) => set({ casNumber: e.target.value })} />)}
              {mobileField(t('dp.measuredValue'), <TextField size="small" fullWidth value={f.measuredValue ?? ''} onChange={(e) => set({ measuredValue: e.target.value })} />)}
              {mobileField(t('dp.exposureStandard'), <TextField size="small" fullWidth value={f.exposureStandard ?? ''} onChange={(e) => set({ exposureStandard: e.target.value })} />)}
            </>
          )}
          {hazardType === 'PHYSICAL' && (
            <>
              {mobileField(t('dp.measuredValue'), <TextField size="small" fullWidth value={f.measuredValue ?? ''} onChange={(e) => set({ measuredValue: e.target.value })} />)}
              {mobileField(t('dp.exposureStandard'), <TextField size="small" fullWidth value={f.exposureStandard ?? ''} onChange={(e) => set({ exposureStandard: e.target.value })} />)}
            </>
          )}
          {hazardType === 'BIOLOGICAL' && (
            <>
              {mobileField(t('dp.exposureRoute'), <TextField size="small" fullWidth value={f.exposureRoute ?? ''} onChange={(e) => set({ exposureRoute: e.target.value })} />)}
              {mobileField(t('dp.vaccinationStatus'),
                <FormControl fullWidth size="small">
                  <Select displayEmpty value={f.vaccinationStatus ?? ''} onChange={(e) => set({ vaccinationStatus: e.target.value })}>
                    <MenuItem value="">{t('common.select', '선택')}</MenuItem>
                    {vaccinationCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getVaccinationLabel(c.code)}</MenuItem>)}
                  </Select>
                </FormControl>
              )}
            </>
          )}
          {hazardType === 'ERGONOMIC' && (
            <>
              {mobileField(t('dp.assessmentMethod'), <TextField size="small" fullWidth value={f.assessmentMethod ?? ''} onChange={(e) => set({ assessmentMethod: e.target.value })} />)}
              {mobileField(t('dp.assessmentScore'), <TextField size="small" fullWidth value={f.assessmentScore ?? ''} onChange={(e) => set({ assessmentScore: e.target.value })} />)}
            </>
          )}
          {hazardType === 'PSYCHOSOCIAL' && (
            <>
              {mobileField(t('dp.targetGroup'), <TextField size="small" fullWidth value={f.targetGroup ?? ''} onChange={(e) => set({ targetGroup: e.target.value })} />)}
              {mobileField(t('dp.assessmentMethod'), <TextField size="small" fullWidth value={f.assessmentMethod ?? ''} onChange={(e) => set({ assessmentMethod: e.target.value })} />)}
              {mobileField(t('dp.targetCount'), <NumberField size="small" fullWidth value={f.targetCount ?? null} onChange={(v) => set({ targetCount: v ?? undefined })} />)}
              {mobileField(t('dp.highRiskCount'), <NumberField size="small" fullWidth value={f.highRiskCount ?? null} onChange={(v) => set({ highRiskCount: v ?? undefined })} />)}
            </>
          )}

          {mobileField(t('dp.preventionDetail'), <TextField size="small" fullWidth multiline rows={3} value={f.preventionDetail ?? ''} onChange={(e) => set({ preventionDetail: e.target.value })} />)}
          {mobileField(t('common.notes', '비고'), <TextField size="small" fullWidth multiline rows={2} value={f.remarks ?? ''} onChange={(e) => set({ remarks: e.target.value })} />)}
        </Box>
      )
    }

    return (
      <>
        {renderPcForm()}
        {renderMobileForm()}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={() => viewMode === 'edit' ? setViewMode('detail') : handleBackToList()} sx={{ flex: { xs: 1, md: 0 } }}>{t('common.cancel', '취소')}</Button>
          <Button variant="contained" onClick={handleSubmit} sx={{ flex: { xs: 1, md: 0 } }}>{t('common.save', '저장')}</Button>
        </Box>
      </>
    )
  }

  // ===== Main Render =====
  return (
    <Box>
      <LoadingOverlay open={isProcessing} />
      {viewMode === 'list' && renderListView()}
      {viewMode === 'detail' && renderDetailView()}
      {(viewMode === 'create' || viewMode === 'edit') && renderFormView()}
      <UserSelectModal
        open={userSelectTarget !== null}
        onClose={() => setUserSelectTarget(null)}
        selectedUsers={[]}
        onConfirm={handleUserSelect}
        singleSelect
        useCompanyTree
        title={t('common.selectEmployee', '담당자 지정')}
      />
    </Box>
  )
}

export default HazardFactorTab
