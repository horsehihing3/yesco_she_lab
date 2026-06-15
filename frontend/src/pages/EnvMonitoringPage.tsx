import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, TextField, Select, MenuItem,
  FormControl, Chip, Pagination, CircularProgress, Alert,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import IconButton from '@mui/material/IconButton'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import ReportProblemIcon from '@mui/icons-material/ReportProblem'
import DatePickerField from '../components/common/DatePickerField'
import { todayStr, formatDate } from '../utils/dateDefaults'
import NumberField from '../components/common/NumberField'
import { useAlert } from '../contexts/AlertContext'
import { envMonitoringApi } from '../api/envMonitoringApi'
import { EnvMonitoring, EnvMonitoringRequest } from '../types/envMonitoring.types'
import useCodeMap from '../hooks/useCodeMap'
import StatCard from '../components/legalCompliance/StatCard'
import DevTestFillButton from '../components/common/DevTestFillButton'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const STATUS_CHIP: Record<string, { color: 'success' | 'warning' | 'info' | 'error'; icon: React.ReactNode }> = {
  NORMAL:  { color: 'success', icon: <CheckCircleOutlineIcon fontSize="small" /> },
  CAUTION: { color: 'info',    icon: <WarningAmberIcon fontSize="small" /> },
  WARNING: { color: 'warning', icon: <ReportProblemIcon fontSize="small" /> },
  DANGER:  { color: 'error',   icon: <ErrorOutlineIcon fontSize="small" /> },
}

// ===== Table-style form cell styles =====
const labelCellSx = {
  width: 130, minWidth: 130, fontWeight: 'bold', bgcolor: 'grey.100',
  px: 2, py: 1.5, borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider',
  display: 'flex', alignItems: 'center', fontSize: '0.875rem',
  justifyContent: 'center', wordBreak: 'keep-all' as const, textAlign: 'center' as const,
}
const valueCellSx = { flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem' }
const valueCellBorderSx = { ...valueCellSx, borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }

const EMPTY_FORM: EnvMonitoringRequest = {
  monitorType: '', status: 'NORMAL', location: '', measurementDate: '',
  parameterName: '', measuredValue: 0, unit: '', standardValue: undefined,
  standardName: '', exceedYn: false, exceedRate: undefined,
  measurerName: '', measurerDept: '', equipmentName: '', equipmentModel: '',
  correctiveAction: '', notes: '',
}

const EnvMonitoringPage: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()
  const { codeList: typeCodes, getLabel: getTypeLabel } = useCodeMap('ENV_MONITOR_TYPE')
  const { codeList: statusCodes, getLabel: getStatusLabel } = useCodeMap('ENV_MONITOR_STATUS')

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<EnvMonitoring | null>(null)

  const [page, setPage] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [form, setForm] = useState<EnvMonitoringRequest>({ ...EMPTY_FORM })

  const pageSize = 10

  // KPI
  const { data: kpi } = useQuery({
    queryKey: ['envMonitoringKpi'],
    queryFn: envMonitoringApi.getKpi,
  })

  // List query
  const queryKey = searchText
    ? ['envMonitoringSearch', searchText, page]
    : statusFilter
    ? ['envMonitoringStatus', statusFilter, page]
    : typeFilter
    ? ['envMonitoringType', typeFilter, page]
    : ['envMonitoring', page]

  const queryFn = () => {
    if (searchText) return envMonitoringApi.search(searchText, page, pageSize)
    if (statusFilter) return envMonitoringApi.getByStatus(statusFilter, page, pageSize)
    if (typeFilter) return envMonitoringApi.getByType(typeFilter, page, pageSize)
    return envMonitoringApi.getAll(page, pageSize)
  }

  const { data, isLoading } = useQuery({ queryKey, queryFn })

  const createMutation = useMutation({
    mutationFn: (req: EnvMonitoringRequest) => envMonitoringApi.create(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['envMonitoring'] })
      queryClient.invalidateQueries({ queryKey: ['envMonitoringKpi'] })
      showSuccess(t('common.saved'))
      setViewMode('list')
    },
    onError: () => showError(t('common.error')),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, req }: { id: number; req: EnvMonitoringRequest }) => envMonitoringApi.update(id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['envMonitoring'] })
      queryClient.invalidateQueries({ queryKey: ['envMonitoringKpi'] })
      showSuccess(t('common.saved'))
      setViewMode('list')
    },
    onError: () => showError(t('common.error')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => envMonitoringApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['envMonitoring'] })
      queryClient.invalidateQueries({ queryKey: ['envMonitoringKpi'] })
      showSuccess(t('common.deleted'))
      setViewMode('list')
    },
    onError: () => showError(t('common.error')),
  })

  const handleGoToList = () => {
    setViewMode('list')
    setSelectedItem(null)
  }

  const handleOpenCreate = () => {
    setSelectedItem(null)
    setForm({ ...EMPTY_FORM, measurementDate: todayStr() })
    setViewMode('create')
  }

  const handleOpenEdit = (item: EnvMonitoring) => {
    setSelectedItem(item)
    setForm({
      monitorType: item.monitorType, status: item.status, location: item.location || '',
      measurementDate: item.measurementDate, parameterName: item.parameterName,
      measuredValue: item.measuredValue, unit: item.unit,
      standardValue: item.standardValue, standardName: item.standardName || '',
      exceedYn: item.exceedYn, exceedRate: item.exceedRate,
      measurerName: item.measurerName || '', measurerDept: item.measurerDept || '',
      equipmentName: item.equipmentName || '', equipmentModel: item.equipmentModel || '',
      correctiveAction: item.correctiveAction || '', notes: item.notes || '',
    })
    setViewMode('edit')
  }

  const handleOpenDetail = (item: EnvMonitoring) => {
    setSelectedItem(item)
    setViewMode('detail')
  }

  const handleSave = () => {
    if (viewMode === 'edit' && selectedItem) {
      updateMutation.mutate({ id: selectedItem.id, req: form })
    } else {
      createMutation.mutate(form)
    }
  }

  const handleDelete = async (item: EnvMonitoring) => {
    const confirmed = await showConfirm(t('common.confirmDelete', '정말로 삭제하시겠습니까?'))
    if (confirmed) deleteMutation.mutate(item.id)
  }

  // DEV ONLY — 비어있는 항목을 환경 모니터링 더미데이터로 채움 (입력값 보존)
  // 측정자(사람)·초과율(초과여부 종속)은 채우지 않는다.
  const fillTestData = () => setForm(prev => ({
    ...prev,
    monitorType: prev.monitorType || typeCodes[0]?.code || '',
    status: prev.status || statusCodes[0]?.code || 'NORMAL',
    location: prev.location || '제1공장 배출구 A',
    parameterName: prev.parameterName || '미세먼지(PM10)',
    measuredValue: prev.measuredValue || 42.5,
    unit: prev.unit || 'µg/m³',
    standardValue: prev.standardValue ?? 80,
    standardName: prev.standardName || '대기환경보전법 배출허용기준',
    equipmentName: prev.equipmentName || '베타레이 먼지측정기',
    equipmentModel: prev.equipmentModel || 'BAM-1020',
    correctiveAction: prev.correctiveAction || '기준 이내 정상 측정, 추가 조치 불필요 (테스트 데이터)',
    notes: prev.notes || '정기 측정 건',
  }))

  const items = data?.content || []
  const totalPages = data?.totalPages || 0
  const headerCellSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const, textAlign: 'center' as const }

  // ===================== DETAIL VIEW =====================
  if (viewMode === 'detail' && selectedItem) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>{t('nav.envMonitoring')}</Typography>

        {/* PC Detail */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mb: 3 }}>
          {/* Row 1: Monitor ID / Status */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Box sx={labelCellSx}>{t('envMon.monitorId')}</Box>
            <Box sx={valueCellBorderSx}>{selectedItem.monitorId}</Box>
            <Box sx={labelCellSx}>{t('envMon.status')}</Box>
            <Box sx={valueCellSx}>
              <Chip
                size="small"
                color={STATUS_CHIP[selectedItem.status]?.color || 'default'}
                label={getStatusLabel(selectedItem.status)}
              />
            </Box>
          </Box>
          {/* Row 2: Type / Location */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Box sx={labelCellSx}>{t('envMon.type')}</Box>
            <Box sx={valueCellBorderSx}>{getTypeLabel(selectedItem.monitorType)}</Box>
            <Box sx={labelCellSx}>{t('envMon.location')}</Box>
            <Box sx={valueCellSx}>{selectedItem.location || ''}</Box>
          </Box>
          {/* Row 3: Measurement Date / Parameter */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Box sx={labelCellSx}>{t('envMon.measureDate')}</Box>
            <Box sx={valueCellBorderSx}>{selectedItem.measurementDate ? formatDate(selectedItem.measurementDate) : ''}</Box>
            <Box sx={labelCellSx}>{t('envMon.parameter')}</Box>
            <Box sx={valueCellSx}>{selectedItem.parameterName}</Box>
          </Box>
          {/* Row 4: Measured Value / Standard Value */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Box sx={labelCellSx}>{t('envMon.measuredValue')}</Box>
            <Box sx={valueCellBorderSx}>{selectedItem.measuredValue} {selectedItem.unit}</Box>
            <Box sx={labelCellSx}>{t('envMon.standardValue')}</Box>
            <Box sx={valueCellSx}>{selectedItem.standardValue != null ? `${selectedItem.standardValue} ${selectedItem.unit}` : ''}</Box>
          </Box>
          {/* Row 5: Standard Name / Exceed */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Box sx={labelCellSx}>{t('envMon.standardName')}</Box>
            <Box sx={valueCellBorderSx}>{selectedItem.standardName || ''}</Box>
            <Box sx={labelCellSx}>{t('envMon.exceedYn')}</Box>
            <Box sx={valueCellSx}>
              {selectedItem.exceedYn ? (
                <Chip size="small" color="error" label={selectedItem.exceedRate != null ? `Y (${selectedItem.exceedRate}%)` : 'Y'} />
              ) : (
                <Chip size="small" color="success" variant="outlined" label="N" />
              )}
            </Box>
          </Box>
          {/* Row 6: Measurer / Department */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Box sx={labelCellSx}>{t('envMon.measurer')}</Box>
            <Box sx={valueCellBorderSx}>{selectedItem.measurerName || ''}</Box>
            <Box sx={labelCellSx}>{t('common.department') || 'Department'}</Box>
            <Box sx={valueCellSx}>{selectedItem.measurerDept || ''}</Box>
          </Box>
          {/* Row 7: Equipment / Equipment Model */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Box sx={labelCellSx}>{t('envMon.equipment')}</Box>
            <Box sx={valueCellBorderSx}>{selectedItem.equipmentName || ''}</Box>
            <Box sx={labelCellSx}>{t('envMon.equipmentModel')}</Box>
            <Box sx={valueCellSx}>{selectedItem.equipmentModel || ''}</Box>
          </Box>
          {/* Row 8: Corrective Action */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Box sx={labelCellSx}>{t('envMon.correctiveAction')}</Box>
            <Box sx={valueCellSx}>{selectedItem.correctiveAction || ''}</Box>
          </Box>
          {/* Row 9: Notes */}
          <Box sx={{ display: 'flex' }}>
            <Box sx={labelCellSx}>{t('common.notes')}</Box>
            <Box sx={valueCellSx}>{selectedItem.notes || ''}</Box>
          </Box>
        </Box>
        {/* Mobile Detail */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 3 }}>
          {[
            [t('envMon.monitorId'), selectedItem.monitorId],
            [t('envMon.status'), getStatusLabel(selectedItem.status)],
            [t('envMon.type'), getTypeLabel(selectedItem.monitorType)],
            [t('envMon.location'), selectedItem.location || ''],
            [t('envMon.measureDate'), selectedItem.measurementDate ? formatDate(selectedItem.measurementDate) : ''],
            [t('envMon.parameter'), selectedItem.parameterName],
            [t('envMon.measuredValue'), `${selectedItem.measuredValue} ${selectedItem.unit}`],
            [t('envMon.standardValue'), selectedItem.standardValue != null ? `${selectedItem.standardValue} ${selectedItem.unit}` : ''],
            [t('envMon.standardName'), selectedItem.standardName || ''],
            [t('envMon.exceedYn'), selectedItem.exceedYn ? (selectedItem.exceedRate != null ? `Y (${selectedItem.exceedRate}%)` : 'Y') : 'N'],
            [t('envMon.measurer'), selectedItem.measurerName || ''],
            [t('common.department'), selectedItem.measurerDept || ''],
            [t('envMon.equipment'), selectedItem.equipmentName || ''],
            [t('envMon.equipmentModel'), selectedItem.equipmentModel || ''],
            [t('envMon.correctiveAction'), selectedItem.correctiveAction || ''],
            [t('common.notes'), selectedItem.notes || ''],
          ].map(([label, value], i) => (
            <Box key={i}>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{label}</Typography>
              <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{value}</Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          <Button variant="outlined" onClick={handleGoToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.list')}</Button>
          <Button variant="contained" onClick={() => handleOpenEdit(selectedItem)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.edit')}</Button>
          <Button variant="contained" color="error" onClick={() => handleDelete(selectedItem)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.delete')}</Button>
        </Box>
      </Box>
    )
  }

  // ===================== CREATE / EDIT VIEW =====================
  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>{t('nav.envMonitoring')}</Typography>

        {/* PC Form */}
        <Paper variant="outlined" sx={{ display: { xs: 'none', md: 'block' } }}>
          {/* Row 1: Type / Status */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Box sx={labelCellSx}>{t('envMon.type')}</Box>
            <Box sx={valueCellBorderSx}>
              <FormControl size="small" fullWidth>
                <Select
                  value={form.monitorType}
                  displayEmpty
                  onChange={(e) => setForm({ ...form, monitorType: e.target.value })}
                >
                  <MenuItem value="" disabled>{t('envMon.selectType')}</MenuItem>
                  {typeCodes.map((c) => (
                    <MenuItem key={c.code} value={c.code}>{getTypeLabel(c.code)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={labelCellSx}>{t('envMon.status')}</Box>
            <Box sx={valueCellSx}>
              <FormControl size="small" fullWidth>
                <Select
                  value={form.status || 'NORMAL'}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                 displayEmpty>
                  <MenuItem value="" disabled>선택하세요</MenuItem>
                  {statusCodes.map((c) => (
                    <MenuItem key={c.code} value={c.code}>{getStatusLabel(c.code)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
          {/* Row 2: Location / Measurement Date */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Box sx={labelCellSx}>{t('envMon.location')}</Box>
            <Box sx={valueCellBorderSx}>
              <TextField size="small" fullWidth value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </Box>
            <Box sx={labelCellSx}>{t('envMon.measureDate')}</Box>
            <Box sx={valueCellSx}>
              <DatePickerField
                value={form.measurementDate ? formatDate(form.measurementDate) : ''}
                onChange={(v) => setForm({ ...form, measurementDate: v ? `${v}T00:00:00` : '' })}
              />
            </Box>
          </Box>
          {/* Row 3: Parameter / Measured Value */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Box sx={labelCellSx}>{t('envMon.parameter')}</Box>
            <Box sx={valueCellBorderSx}>
              <TextField size="small" fullWidth value={form.parameterName} onChange={(e) => setForm({ ...form, parameterName: e.target.value })} />
            </Box>
            <Box sx={labelCellSx}>{t('envMon.measuredValue')}</Box>
            <Box sx={valueCellSx}>
              <NumberField size="small" fullWidth value={form.measuredValue} onChange={(v) => setForm({ ...form, measuredValue: v ?? 0 })} />
            </Box>
          </Box>
          {/* Row 4: Unit / Standard Value */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Box sx={labelCellSx}>{t('envMon.unit')}</Box>
            <Box sx={valueCellBorderSx}>
              <TextField size="small" fullWidth value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            </Box>
            <Box sx={labelCellSx}>{t('envMon.standardValue')}</Box>
            <Box sx={valueCellSx}>
              <NumberField size="small" fullWidth value={form.standardValue ?? ''} onChange={(v) => setForm({ ...form, standardValue: v ?? undefined })} />
            </Box>
          </Box>
          {/* Row 5: Standard Name / Exceed */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Box sx={labelCellSx}>{t('envMon.standardName')}</Box>
            <Box sx={valueCellBorderSx}>
              <TextField size="small" fullWidth value={form.standardName} onChange={(e) => setForm({ ...form, standardName: e.target.value })} />
            </Box>
            <Box sx={labelCellSx}>{t('envMon.exceedYn')}</Box>
            <Box sx={valueCellSx}>
              <FormControl size="small" fullWidth>
                <Select
                  value={form.exceedYn ? 'true' : 'false'}
                  onChange={(e) => setForm({ ...form, exceedYn: e.target.value === 'true' })}
                 displayEmpty>
                  <MenuItem value="" disabled>선택하세요</MenuItem>
                  <MenuItem value="false">N</MenuItem>
                  <MenuItem value="true">Y</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
          {/* Row 6: Exceed Rate / Measurer */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Box sx={labelCellSx}>{t('envMon.exceedRate')}</Box>
            <Box sx={valueCellBorderSx}>
              <NumberField size="small" fullWidth value={form.exceedRate ?? ''} onChange={(v) => setForm({ ...form, exceedRate: v ?? undefined })} />
            </Box>
            <Box sx={labelCellSx}>{t('envMon.measurer')}</Box>
            <Box sx={valueCellSx}>
              <TextField size="small" fullWidth value={form.measurerName} onChange={(e) => setForm({ ...form, measurerName: e.target.value })} />
            </Box>
          </Box>
          {/* Row 7: Department / Equipment */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Box sx={labelCellSx}>{t('common.department') || 'Department'}</Box>
            <Box sx={valueCellBorderSx}>
              <TextField size="small" fullWidth value={form.measurerDept} onChange={(e) => setForm({ ...form, measurerDept: e.target.value })} />
            </Box>
            <Box sx={labelCellSx}>{t('envMon.equipment')}</Box>
            <Box sx={valueCellSx}>
              <TextField size="small" fullWidth value={form.equipmentName} onChange={(e) => setForm({ ...form, equipmentName: e.target.value })} />
            </Box>
          </Box>
          {/* Row 8: Equipment Model / Notes */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Box sx={labelCellSx}>{t('envMon.equipmentModel')}</Box>
            <Box sx={valueCellBorderSx}>
              <TextField size="small" fullWidth value={form.equipmentModel} onChange={(e) => setForm({ ...form, equipmentModel: e.target.value })} />
            </Box>
            <Box sx={labelCellSx}>{t('common.notes') || 'Notes'}</Box>
            <Box sx={valueCellSx}>
              <TextField size="small" fullWidth value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Box>
          </Box>
          {/* Row 9: Corrective Action (full width) */}
          <Box sx={{ display: 'flex' }}>
            <Box sx={labelCellSx}>{t('envMon.correctiveAction')}</Box>
            <Box sx={valueCellSx}>
              <TextField size="small" fullWidth multiline minRows={2} value={form.correctiveAction} onChange={(e) => setForm({ ...form, correctiveAction: e.target.value })} />
            </Box>
          </Box>
        </Paper>

        {/* Mobile Form */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('envMon.monitorType')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <FormControl fullWidth size="small">
              <Select displayEmpty value={form.monitorType} onChange={(e) => setForm({ ...form, monitorType: e.target.value })}>
                <MenuItem value="" disabled>{t('envMon.selectType')}</MenuItem>
                {typeCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getTypeLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('envMon.status')}
            </Typography>
            <FormControl fullWidth size="small">
              <Select value={form.status || 'NORMAL'} onChange={(e) => setForm({ ...form, status: e.target.value })} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {statusCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getStatusLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('envMon.location')}
            </Typography>
            <TextField size="small" fullWidth value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </Box>
          <DatePickerField
            value={form.measurementDate ? formatDate(form.measurementDate) : ''}
            onChange={(v) => setForm({ ...form, measurementDate: v ? `${v}T00:00:00` : '' })}
          />
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('envMon.parameter')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <TextField size="small" fullWidth value={form.parameterName} onChange={(e) => setForm({ ...form, parameterName: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('envMon.measuredValue')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <NumberField size="small" fullWidth value={form.measuredValue} onChange={(v) => setForm({ ...form, measuredValue: v ?? 0 })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('envMon.unit')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <TextField size="small" fullWidth value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('envMon.standardValue')}
            </Typography>
            <NumberField size="small" fullWidth value={form.standardValue ?? ''} onChange={(v) => setForm({ ...form, standardValue: v ?? undefined })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('envMon.standardName')}
            </Typography>
            <TextField size="small" fullWidth value={form.standardName} onChange={(e) => setForm({ ...form, standardName: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('envMon.exceedYn')}
            </Typography>
            <FormControl fullWidth size="small">
              <Select value={form.exceedYn ? 'true' : 'false'} onChange={(e) => setForm({ ...form, exceedYn: e.target.value === 'true' })} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                <MenuItem value="false">{t('envMon.exceedYn')}: N</MenuItem>
                <MenuItem value="true">{t('envMon.exceedYn')}: Y</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('envMon.exceedRate')}
            </Typography>
            <NumberField size="small" fullWidth value={form.exceedRate ?? ''} onChange={(v) => setForm({ ...form, exceedRate: v ?? undefined })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('envMon.measurer')}
            </Typography>
            <TextField size="small" fullWidth value={form.measurerName} onChange={(e) => setForm({ ...form, measurerName: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('common.department')}
            </Typography>
            <TextField size="small" fullWidth value={form.measurerDept} onChange={(e) => setForm({ ...form, measurerDept: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('envMon.equipment')}
            </Typography>
            <TextField size="small" fullWidth value={form.equipmentName} onChange={(e) => setForm({ ...form, equipmentName: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('envMon.equipmentModel')}
            </Typography>
            <TextField size="small" fullWidth value={form.equipmentModel} onChange={(e) => setForm({ ...form, equipmentModel: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('common.notes')}
            </Typography>
            <TextField size="small" fullWidth value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('envMon.correctiveAction')}
            </Typography>
            <TextField size="small" fullWidth multiline minRows={2} value={form.correctiveAction} onChange={(e) => setForm({ ...form, correctiveAction: e.target.value })} />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mt: 3, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          {viewMode === 'create' && <DevTestFillButton onFill={fillTestData} />}
          <Button variant="outlined" onClick={handleGoToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleSave} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.save')}</Button>
        </Box>
      </Box>
    )
  }

  // ===================== LIST VIEW =====================
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, flexShrink: 0 }}>
        {t('nav.envMonitoring')}
      </Typography>

      {/* KPI Cards */}
      {kpi && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3, flexShrink: 0 }}>
          <StatCard value={kpi.NORMAL} label={getStatusLabel('NORMAL')} />
          <StatCard value={kpi.CAUTION} label={getStatusLabel('CAUTION')} />
          <StatCard value={kpi.WARNING} label={getStatusLabel('WARNING')} />
          <StatCard value={kpi.DANGER} label={getStatusLabel('DANGER')} />
        </Box>
      )}

      {/* 검색 - PC */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField size="small" placeholder={t('envMon.searchPlaceholder')} value={searchText}
            onChange={(e) => { setSearchText(e.target.value); setPage(0) }}
            sx={{ width: 300 }} />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select displayEmpty value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setTypeFilter(''); setSearchText(''); setPage(0) }}>
              <MenuItem value="">{t('envMon.allStatus')}</MenuItem>
              {statusCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getStatusLabel(c.code)}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select displayEmpty value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setStatusFilter(''); setSearchText(''); setPage(0) }}>
              <MenuItem value="">{t('envMon.allTypes')}</MenuItem>
              {typeCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getTypeLabel(c.code)}</MenuItem>)}
            </Select>
          </FormControl>
          <IconButton onClick={() => { setSearchText(''); setStatusFilter(''); setTypeFilter(''); setPage(0) }} size="small"><RefreshIcon /></IconButton>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate}>New</Button>
      </Box>
      {/* 검색 - Mobile */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2, flexShrink: 0 }}>
        <TextField size="small" fullWidth placeholder={t('envMon.searchPlaceholder')} value={searchText}
          onChange={(e) => { setSearchText(e.target.value); setPage(0) }} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <FormControl size="small" sx={{ flex: 1 }}>
            <Select displayEmpty value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setTypeFilter(''); setSearchText(''); setPage(0) }}>
              <MenuItem value="">{t('envMon.allStatus')}</MenuItem>
              {statusCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getStatusLabel(c.code)}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ flex: 1 }}>
            <Select displayEmpty value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setStatusFilter(''); setSearchText(''); setPage(0) }}>
              <MenuItem value="">{t('envMon.allTypes')}</MenuItem>
              {typeCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getTypeLabel(c.code)}</MenuItem>)}
            </Select>
          </FormControl>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate} sx={{ flex: 1 }}>New</Button>
        </Box>
      </Box>

      {/* Table */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
      ) : items.length === 0 ? (
        <Alert severity="info">{t('common.noData')}</Alert>
      ) : (
        <>
          {/* PC Table */}
          <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={headerCellSx}>{t('envMon.monitorId')}</TableCell>
                  <TableCell sx={headerCellSx}>{t('envMon.type')}</TableCell>
                  <TableCell sx={headerCellSx}>{t('envMon.status')}</TableCell>
                  <TableCell sx={headerCellSx}>{t('envMon.location')}</TableCell>
                  <TableCell sx={headerCellSx}>{t('envMon.parameter')}</TableCell>
                  <TableCell sx={headerCellSx}>{t('envMon.measuredValue')}</TableCell>
                  <TableCell sx={headerCellSx}>{t('envMon.standardValue')}</TableCell>
                  <TableCell sx={headerCellSx}>{t('envMon.exceedYn')}</TableCell>
                  <TableCell sx={headerCellSx}>{t('envMon.measureDate')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => {
                  const chipConf = STATUS_CHIP[item.status] || STATUS_CHIP.NORMAL
                  return (
                    <TableRow
                      key={item.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleOpenDetail(item)}
                    >
                      <TableCell align="center">{item.monitorId}</TableCell>
                      <TableCell align="center">{getTypeLabel(item.monitorType)}</TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          color={chipConf.color}
                          label={getStatusLabel(item.status)}
                        />
                      </TableCell>
                      <TableCell>{item.location || ''}</TableCell>
                      <TableCell>{item.parameterName}</TableCell>
                      <TableCell align="center">{item.measuredValue} {item.unit}</TableCell>
                      <TableCell align="center">{item.standardValue != null ? `${item.standardValue} ${item.unit}` : ''}</TableCell>
                      <TableCell align="center">
                        {item.exceedYn
                          ? (item.exceedRate != null ? `${item.exceedRate}%` : 'Y')
                          : 'N'}
                      </TableCell>
                      <TableCell align="center">{item.measurementDate ? formatDate(item.measurementDate) : ''}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
          {/* Mobile Card List */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5, mb: 2 }}>
            {items.map((item) => {
              const chipConf = STATUS_CHIP[item.status] || STATUS_CHIP.NORMAL
              return (
                <Paper key={item.id} sx={{ p: 2, border: 1, borderColor: 'divider', cursor: 'pointer' }} onClick={() => handleOpenDetail(item)}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography fontWeight="bold">{item.parameterName}</Typography>
                    <Chip size="small" color={chipConf.color} label={getStatusLabel(item.status)} />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {getTypeLabel(item.monitorType)} | {item.location || ''} | {item.measuredValue} {item.unit}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.measurementDate ? formatDate(item.measurementDate) : ''}
                  </Typography>
                </Paper>
              )
            })}
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Pagination
              count={totalPages}
              page={page + 1}
              onChange={(_, v) => setPage(v - 1)}
              color="primary"
            />
          </Box>
        </>
      )}
    </Box>
  )
}

export default EnvMonitoringPage
