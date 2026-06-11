import { useState, useMemo } from 'react'
import { isEhsManager } from '../utils/auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useButtonRules } from '../hooks/useButtonRules'
import { useForm, Controller } from 'react-hook-form'
import { useAlert } from '../contexts/AlertContext'
import useCodeMap from '../hooks/useCodeMap'
import {
  Box,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Button,
  TextField,
  MenuItem,
  Select,
  Switch,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import InputAdornment from '@mui/material/InputAdornment'
import BodyDiagram, { regionBodyParts } from '../components/common/BodyDiagram'
import FormBodyDiagram, { DetailRowWithRegion, allBodyParts, emptyDetailRow, getRegionForBodyPart } from '../components/common/FormBodyDiagram'
import DatePickerField from '../components/common/DatePickerField'
import HospitalSearchModal from '../components/common/HospitalSearchModal'
import AiReportModal from '../components/common/AiReportModal'
import axiosInstance from '../api/axiosInstance'
import { ApiResponse } from '../types/common.types'
import {
  HealthCheckup,
  HealthCheckupRequest,
  HealthCheckupDetailRequest,
  BodyPart,
} from '../types/healthCheckup.types'

const MENU = '보건 관리 › 건강 검진 관리 › 내 검진 이력'

// ===== DB Korean value -> i18n key mapping =====
const checkupTypeMap: Record<string, string> = {
  '일반': 'GENERAL', '특수': 'SPECIAL', '채용시': 'HIRING',
  GENERAL: 'GENERAL', SPECIAL: 'SPECIAL', HIRING: 'HIRING',
}
const checkupTypeToKorean: Record<string, string> = {
  GENERAL: '일반', SPECIAL: '특수', HIRING: '채용시',
}

// ===== API =====
const fetchMyCheckups = async (email: string): Promise<HealthCheckup[]> => {
  const response = await axiosInstance.get<ApiResponse<HealthCheckup[]>>('/health-checkup/my', {
    params: { email },
  })
  return response.data.data
}

const createCheckup = async (data: HealthCheckupRequest): Promise<HealthCheckup> => {
  const response = await axiosInstance.post<ApiResponse<HealthCheckup>>('/health-checkup', data)
  return response.data.data
}

const updateCheckup = async (id: number, data: HealthCheckupRequest): Promise<HealthCheckup> => {
  const response = await axiosInstance.put<ApiResponse<HealthCheckup>>(`/health-checkup/${id}`, data)
  return response.data.data
}

const deleteCheckup = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/health-checkup/${id}`)
}

// ===== Helper =====
const getOverallResultColor = (result?: string): 'success' | 'warning' | 'error' | 'default' => {
  if (!result) return 'default'
  if (result.includes('A') || result === 'A') return 'success'
  if (result.includes('B') || result === 'B') return 'default'
  if (result.includes('C') || result.includes('D')) return 'warning'
  return 'default'
}

const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
  switch (status) {
    case 'COMPLETED': return 'success'
    case 'SCHEDULED': return 'warning'
    case 'OVERDUE': return 'error'
    default: return 'default'
  }
}

// ===== Table Cell Styles =====
const labelCellSx = {
  width: 110, minWidth: 110, fontWeight: 'bold', bgcolor: 'grey.100',
  px: 2, py: 1.5, borderRight: 1, borderColor: 'divider',
  display: 'flex', alignItems: 'center', fontSize: '0.875rem',
  justifyContent: 'center', wordBreak: 'keep-all' as const, textAlign: 'center' as const,
}
const valueCellSx = {
  flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem', display: 'flex', alignItems: 'center',
}
const valueCellBorderSx = { ...valueCellSx, borderRight: 1, borderColor: 'divider' }
const formLabelSx = { ...labelCellSx, width: 100, minWidth: 100 }
const formValueSx = { flex: 1, px: 2, py: 1, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider' }

// ===== View Mode =====
type MyViewMode = 'list' | 'detail' | 'create' | 'edit'

// ===== Component =====
const MyHealthCheckupPage: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { canSee } = useButtonRules()
  const isAdmin = isEhsManager(user)
  const myRoles: string[] = ['guest', ...(user?.role === 'SYSTEM_ADMIN' ? ['superAdmin'] : (user?.role ? [user.role] : []))]
  const getRoles = (item: { authorName?: string | null }): string[] => {
    const roles = [...myRoles]
    if (item.authorName && user?.name && item.authorName === user.name) roles.push('writer')
    return roles
  }
  const queryClient = useQueryClient()
  const { showAlert, showConfirm, showSuccess } = useAlert()
  const { getLocalizedName, codeList: checkupStatusCodes } = useCodeMap('CHECKUP_STATUS')
  const { codeList: checkupTypeCodes } = useCodeMap('CHECKUP_TYPE')
  const { codeList: overallResultCodes } = useCodeMap('CHECKUP_OVERALL_RESULT')

  const [viewMode, setViewMode] = useState<MyViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<HealthCheckup | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)

  // Form state
  const [detailRows, setDetailRows] = useState<DetailRowWithRegion[]>([])
  const [detailRowErrors, setDetailRowErrors] = useState<Set<number>>(new Set())
  const [hospitalModalOpen, setHospitalModalOpen] = useState(false)
  const [aiReportOpen, setAiReportOpen] = useState(false)

  const years = useMemo(() => {
    const cur = new Date().getFullYear()
    return Array.from({ length: 10 }, (_, i) => cur - i)
  }, [])

  const { control, handleSubmit, reset, setValue, watch } = useForm<HealthCheckupRequest>({
    defaultValues: {
      employeeId: '', employeeName: '', employeeDept: '', employeeEmail: '',
      checkupYear: new Date().getFullYear(), checkupType: 'GENERAL', isTarget: true,
      checkupStatus: 'PENDING', checkupDate: '', hospital: '', overallResult: '',
      nextCheckupDate: '', notes: '',
    },
  })

  // ===== Queries =====
  const myIdentifier = user?.email || user?.username || ''
  const { data: checkups, isLoading } = useQuery({
    queryKey: ['myHealthCheckups', myIdentifier],
    queryFn: () => fetchMyCheckups(myIdentifier),
    enabled: !!myIdentifier,
  })

  const filteredDetails = useMemo(() => {
    const details = selectedItem?.details || []
    if (!selectedRegion) return details
    const parts = regionBodyParts[selectedRegion] || []
    return details.filter((d) => parts.includes(d.bodyPart as BodyPart))
  }, [selectedItem, selectedRegion])

  // ===== Mutations =====
  const createMutation = useMutation({
    mutationFn: createCheckup,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['myHealthCheckups'] })
      await showSuccess(t('common.saveSuccess'))
      setViewMode('list')
    },
    onError: () => showAlert('error', t('healthCheckup.loadFailed')),
  })

  const updateMutation = useMutation({
    mutationFn: (data: HealthCheckupRequest) => updateCheckup(selectedItem!.id, data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['myHealthCheckups'] })
      await showSuccess(t('common.saveSuccess'))
      setViewMode('list')
    },
    onError: () => showAlert('error', t('healthCheckup.loadFailed')),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCheckup,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['myHealthCheckups'] })
      setSelectedItem(null)
      setViewMode('list')
      await showSuccess(t('common.deleteSuccess'))
    },
    onError: () => showAlert('error', t('healthCheckup.loadFailed')),
  })

  // ===== Handlers =====
  const getUserDefaults = () => ({
    employeeId: user?.username || '',
    employeeName: user?.name || '',
    employeeDept: user?.department || '',
    employeeEmail: user?.email || '',
  })

  const handleDelete = async () => {
    if (!selectedItem) return
    const confirmed = await showConfirm(t('healthCheckup.confirmDelete'))
    if (confirmed) {
      deleteMutation.mutate(selectedItem.id)
    }
  }

  const handleOpenDetail = (item: HealthCheckup) => {
    setSelectedItem(item)
    setSelectedRegion(null)
    setViewMode('detail')
  }

  const handleBackToList = () => {
    setViewMode('list')
    setSelectedItem(null)
    setSelectedRegion(null)
  }

  const handleCreate = () => {
    reset({
      ...getUserDefaults(),
      checkupYear: new Date().getFullYear(), checkupType: 'GENERAL', isTarget: true,
      checkupStatus: 'PENDING', checkupDate: '', hospital: '', overallResult: '',
      nextCheckupDate: '', notes: '',
    })
    setDetailRows([])
    setDetailRowErrors(new Set())
    setViewMode('create')
  }

  const handleEdit = () => {
    if (!selectedItem) return
    const d = selectedItem
    reset({
      ...getUserDefaults(),
      checkupYear: d.checkupYear,
      checkupType: checkupTypeMap[d.checkupType || ''] || 'GENERAL',
      isTarget: d.isTarget ?? true,
      checkupStatus: d.checkupStatus,
      checkupDate: d.checkupDate || '',
      hospital: d.hospital || '',
      overallResult: d.overallResult || '',
      nextCheckupDate: d.nextCheckupDate || '',
      notes: d.notes || '',
    })
    setDetailRows(
      (d.details || []).map((dt) => ({
        bodyPart: dt.bodyPart,
        category: dt.category,
        resultValue: dt.resultValue || '',
        referenceRange: dt.referenceRange || '',
        resultStatus: dt.resultStatus || 'normal',
        notes: dt.notes || '',
        _region: getRegionForBodyPart(dt.bodyPart),
      }))
    )
    setDetailRowErrors(new Set())
    setViewMode('edit')
  }

  const onSubmit = async (data: HealthCheckupRequest) => {
    const errorIndices = new Set<number>()
    detailRows.forEach((row, idx) => { if (!row.bodyPart) errorIndices.add(idx) })
    if (errorIndices.size > 0) {
      setDetailRowErrors(errorIndices)
      showAlert('error', t('healthCheckup.bodyPartRequired'))
      return
    }
    setDetailRowErrors(new Set())

    const confirmed = await showConfirm(t('common.confirmSave'))
    if (!confirmed) return

    const validDetails = detailRows.filter((r) => r.bodyPart && r.category).map(({ _region, ...rest }) => rest)
    const payload: HealthCheckupRequest = {
      ...data,
      ...getUserDefaults(),
      checkupType: checkupTypeToKorean[data.checkupType || ''] || data.checkupType,
      checkupDate: data.checkupDate || undefined,
      nextCheckupDate: data.nextCheckupDate || undefined,
      details: validDetails.length > 0 ? validDetails : undefined,
      authorName: user?.name,
      authorEmail: user?.email,
    }
    if (viewMode === 'create') createMutation.mutate(payload)
    else if (viewMode === 'edit') updateMutation.mutate(payload)
  }

  const handleDetailRowChange = (index: number, field: keyof HealthCheckupDetailRequest, value: string) => {
    setDetailRows((prev) => prev.map((row, i) => i === index ? { ...row, [field]: value } : row))
    if (field === 'bodyPart' && value) {
      setDetailRowErrors((prev) => { const next = new Set(prev); next.delete(index); return next })
    }
  }

  const handleAddDetailRow = () => {
    setDetailRows((prev) => [...prev, { ...emptyDetailRow(), _region: 'all' }])
  }

  const handleRemoveDetailRow = (index: number) => {
    setDetailRows((prev) => prev.filter((_, i) => i !== index))
    setDetailRowErrors((prev) => {
      const next = new Set<number>()
      prev.forEach((i) => { if (i < index) next.add(i); else if (i > index) next.add(i - 1) })
      return next
    })
  }

  const handleFormBodyPartClick = (region: string) => {
    const parts = regionBodyParts[region] || []
    const firstPart = parts[0] || ''
    setDetailRows((prev) => [...prev, { ...emptyDetailRow(), bodyPart: firstPart, _region: region }])
  }

  // ======================================================
  // ===== LIST VIEW =====
  // ======================================================
  const renderListView = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, mb: 2 }}>
        {canSee(MENU, 'LIST', '신규 등록', myRoles) && (
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleCreate} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            {t('common.new')}
          </Button>
        )}
      </Box>
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : !checkups || checkups.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <Typography color="text.secondary">{t('healthCheckup.noCheckups')}</Typography>
        </Box>
      ) : (
        <>
          {/* PC Table */}
          <Paper sx={{ display: { xs: 'none', md: 'block' } }}>
            <TableContainer>
              <Table size="small" stickyHeader sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }} align="center">{t('healthCheckup.checkupYear')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }} align="center">{t('healthCheckup.checkupType')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }} align="center">{t('healthCheckup.checkupDate')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }} align="center">{t('healthCheckup.hospital')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }} align="center">{t('healthCheckup.overallResult')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }} align="center">{t('healthCheckup.checkupStatus')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }} align="center">{t('healthCheckup.nextCheckupDate')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {checkups.map((item) => (
                    <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleOpenDetail(item)}>
                      <TableCell align="center">{item.checkupYear}</TableCell>
                      <TableCell align="center">{item.checkupType || ''}</TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{item.checkupDate?.substring(0, 10) || ''}</TableCell>
                      <TableCell>{item.hospital || ''}</TableCell>
                      <TableCell align="center">
                        {item.overallResult ? <Chip label={item.overallResult} size="small" color={getOverallResultColor(item.overallResult)} /> : ''}
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={t(`healthCheckup.statusLabels.${item.checkupStatus}`)} size="small" color={getStatusColor(item.checkupStatus)} />
                      </TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{item.nextCheckupDate?.substring(0, 10) || ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
          {/* Mobile Card List */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
            {checkups.map((item) => (
              <Paper key={item.id} sx={{ p: 2, border: 1, borderColor: 'divider', cursor: 'pointer' }} onClick={() => handleOpenDetail(item)}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography fontWeight="bold">{item.checkupYear} - {item.checkupType || ''}</Typography>
                  <Chip label={t(`healthCheckup.statusLabels.${item.checkupStatus}`)} size="small" color={getStatusColor(item.checkupStatus)} />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {item.checkupDate?.substring(0, 10) || ''} | {item.hospital || ''}
                  {item.overallResult ? ` | ${item.overallResult}` : ''}
                </Typography>
              </Paper>
            ))}
          </Box>
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
            {t('healthCheckup.totalRecords', { count: checkups.length })}
          </Typography>
        </>
      )}
    </Box>
  )

  // ======================================================
  // ===== DETAIL VIEW =====
  // ======================================================
  const renderDetailView = () => {
    if (!selectedItem) return null
    const details = selectedItem.details || []
    return (
      <Box>
        {/* Checkup Info - PC */}
        <Paper sx={{ display: { xs: 'none', md: 'block' }, p: 3, bgcolor: 'grey.50', mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
            {t('healthCheckup.checkupInfo')}
          </Typography>
          <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={labelCellSx}>{t('healthCheckup.employeeId')}</Typography>
              <Typography sx={valueCellBorderSx}>{selectedItem.employeeId || ''}</Typography>
              <Typography sx={labelCellSx}>{t('healthCheckup.employeeName')}</Typography>
              <Typography sx={valueCellSx}>{selectedItem.employeeName || ''}</Typography>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={labelCellSx}>{t('healthCheckup.employeeDept')}</Typography>
              <Typography sx={valueCellBorderSx}>{selectedItem.employeeDept || ''}</Typography>
              <Typography sx={labelCellSx}>{t('healthCheckup.employeeEmail')}</Typography>
              <Typography sx={valueCellSx}>{selectedItem.employeeEmail || ''}</Typography>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={labelCellSx}>{t('healthCheckup.checkupYear')}</Typography>
              <Typography sx={valueCellBorderSx}>{selectedItem.checkupYear}</Typography>
              <Typography sx={labelCellSx}>{t('healthCheckup.checkupType')}</Typography>
              <Typography sx={valueCellSx}>{selectedItem.checkupType || ''}</Typography>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={labelCellSx}>{t('healthCheckup.checkupDate')}</Typography>
              <Typography sx={valueCellBorderSx}>{selectedItem.checkupDate?.substring(0, 10) || ''}</Typography>
              <Typography sx={labelCellSx}>{t('healthCheckup.hospital')}</Typography>
              <Typography sx={valueCellSx}>{selectedItem.hospital || ''}</Typography>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={labelCellSx}>{t('healthCheckup.overallResult')}</Typography>
              <Box sx={valueCellBorderSx}>
                {selectedItem.overallResult ? <Chip label={selectedItem.overallResult} size="small" color={getOverallResultColor(selectedItem.overallResult)} /> : ''}
              </Box>
              <Typography sx={labelCellSx}>{t('healthCheckup.checkupStatus')}</Typography>
              <Box sx={valueCellSx}>
                <Chip label={t(`healthCheckup.statusLabels.${selectedItem.checkupStatus}`)} size="small" color={getStatusColor(selectedItem.checkupStatus)} />
              </Box>
            </Box>
            <Box sx={{ display: 'flex' }}>
              <Typography sx={labelCellSx}>{t('healthCheckup.nextCheckupDate')}</Typography>
              <Typography sx={valueCellBorderSx}>{selectedItem.nextCheckupDate?.substring(0, 10) || ''}</Typography>
              <Typography sx={labelCellSx}>{t('healthCheckup.notes')}</Typography>
              <Typography sx={{ ...valueCellSx, whiteSpace: 'pre-wrap' }}>{selectedItem.notes || ''}</Typography>
            </Box>
          </Box>
        </Paper>

        {/* Checkup Info - Mobile */}
        <Paper sx={{ display: { xs: 'block', md: 'none' }, p: 2, mb: 3, bgcolor: 'grey.50' }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>{t('healthCheckup.checkupInfo')}</Typography>
          <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
            {[
              { label: t('healthCheckup.employeeId'), value: selectedItem.employeeId || '' },
              { label: t('healthCheckup.employeeName'), value: selectedItem.employeeName || '' },
              { label: t('healthCheckup.employeeDept'), value: selectedItem.employeeDept || '' },
              { label: t('healthCheckup.employeeEmail'), value: selectedItem.employeeEmail || '' },
              { label: t('healthCheckup.checkupYear'), value: String(selectedItem.checkupYear) },
              { label: t('healthCheckup.checkupType'), value: selectedItem.checkupType || '' },
              { label: t('healthCheckup.checkupDate'), value: selectedItem.checkupDate?.substring(0, 10) || '' },
              { label: t('healthCheckup.hospital'), value: selectedItem.hospital || '' },
              { label: t('healthCheckup.overallResult'), value: selectedItem.overallResult || '' },
              { label: t('healthCheckup.nextCheckupDate'), value: selectedItem.nextCheckupDate?.substring(0, 10) || '' },
              { label: t('healthCheckup.notes'), value: selectedItem.notes || '' },
            ].map((row, idx, arr) => (
              <Box key={idx} sx={{ mb: idx < arr.length - 1 ? 1.5 : 0 }}>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{row.label}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{row.value}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>

        {/* Body Diagram + Results */}
        {details.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">{t('healthCheckup.bodyDiagram')}</Typography>
              <Button variant="contained" size="small" onClick={() => setAiReportOpen(true)}>
                {t('healthCheckup.aiReport.button')}
              </Button>
            </Box>
            <BodyDiagram
              details={details}
              selectedRegion={selectedRegion}
              onRegionClick={(region) => setSelectedRegion(region || null)}
              filteredDetails={filteredDetails}
              t={t}
            />
          </Box>
        )}

        {/* Action buttons */}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', md: 'flex-end' }, mt: 3 }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
            {t('common.list')}
          </Button>
          {canSee(MENU, 'DETAIL', '수정', getRoles(selectedItem ?? {})) && (
            <Button variant="contained" onClick={handleEdit} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
              {t('common.edit')}
            </Button>
          )}
          {canSee(MENU, 'DETAIL', '삭제', getRoles(selectedItem ?? {})) && (
            <Button variant="contained" color="error" onClick={handleDelete} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
              {t('common.delete')}
            </Button>
          )}
        </Box>

        <AiReportModal open={aiReportOpen} onClose={() => setAiReportOpen(false)} checkup={selectedItem} />
      </Box>
    )
  }

  // ======================================================
  // ===== CREATE / EDIT FORM VIEW =====
  // ======================================================
  const renderFormView = () => (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight="bold">
          {viewMode === 'create' ? t('healthCheckup.myCheckupRegister') : t('healthCheckup.myCheckupEdit')}
        </Typography>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Form - PC */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mb: 3 }}>
          {/* Employee info - auto-filled & disabled */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={formLabelSx}>{t('healthCheckup.employeeId')}</Typography>
            <Box sx={formValueSx}>
              <Controller name="employeeId" control={control} render={({ field }) => (
                <TextField {...field} size="small" fullWidth disabled />
              )} />
            </Box>
            <Typography sx={formLabelSx}>{t('healthCheckup.employeeName')}</Typography>
            <Box sx={{ ...formValueSx, borderRight: 0 }}>
              <Controller name="employeeName" control={control} render={({ field }) => (
                <TextField {...field} size="small" fullWidth disabled />
              )} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={formLabelSx}>{t('healthCheckup.employeeDept')}</Typography>
            <Box sx={formValueSx}>
              <Controller name="employeeDept" control={control} render={({ field }) => (
                <TextField {...field} size="small" fullWidth disabled />
              )} />
            </Box>
            <Typography sx={formLabelSx}>{t('healthCheckup.employeeEmail')}</Typography>
            <Box sx={{ ...formValueSx, borderRight: 0 }}>
              <Controller name="employeeEmail" control={control} render={({ field }) => (
                <TextField {...field} size="small" fullWidth disabled />
              )} />
            </Box>
          </Box>
          {/* Editable fields */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={formLabelSx}>
              {t('healthCheckup.checkupYear')}
              <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
            </Typography>
            <Box sx={formValueSx}>
              <Controller name="checkupYear" control={control} rules={{ required: true }} render={({ field }) => (
                <Select value={field.value || new Date().getFullYear()} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} size="small" fullWidth displayEmpty>
                  <MenuItem value="" disabled>선택하세요</MenuItem>
                  {years.map((y) => (<MenuItem key={y} value={y}>{y}</MenuItem>))}
                </Select>
              )} />
            </Box>
            <Typography sx={formLabelSx}>
              {t('healthCheckup.checkupType')}
              <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
            </Typography>
            <Box sx={{ ...formValueSx, borderRight: 0 }}>
              <Controller name="checkupType" control={control} rules={{ required: true }} render={({ field, fieldState }) => (
                <Select value={field.value || 'GENERAL'} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} size="small" fullWidth error={!!fieldState.error} displayEmpty>
                  <MenuItem value="" disabled>선택하세요</MenuItem>
                  {checkupTypeCodes.map((item) => (
                    <MenuItem key={item.code} value={item.code}>{getLocalizedName(item)}</MenuItem>
                  ))}
                </Select>
              )} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={formLabelSx}>
              {t('healthCheckup.checkupStatus')}
              <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
            </Typography>
            <Box sx={formValueSx}>
              <Controller name="checkupStatus" control={control} rules={{ required: true }} render={({ field, fieldState }) => (
                <Select value={field.value || 'PENDING'} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} size="small" fullWidth error={!!fieldState.error} displayEmpty>
                  <MenuItem value="" disabled>선택하세요</MenuItem>
                  {checkupStatusCodes.map((item) => (
                    <MenuItem key={item.code} value={item.code}>{getLocalizedName(item)}</MenuItem>
                  ))}
                </Select>
              )} />
            </Box>
            <Typography sx={formLabelSx}>{t('healthCheckup.overallResult')}</Typography>
            <Box sx={{ ...formValueSx, borderRight: 0 }}>
              <Controller name="overallResult" control={control} render={({ field }) => (
                <Select {...field} size="small" fullWidth displayEmpty>
                  <MenuItem value="" disabled>선택하세요</MenuItem>
                  {overallResultCodes.map((item) => (
                    <MenuItem key={item.code} value={item.code}>{getLocalizedName(item)}</MenuItem>
                  ))}
                </Select>
              )} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={formLabelSx}>
              {t('healthCheckup.checkupDate')}
              <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
            </Typography>
            <Box sx={formValueSx}>
              <Controller name="checkupDate" control={control} rules={{ required: true }} render={({ field, fieldState }) => (
                <DatePickerField value={field.value || ''} onChange={field.onChange} size="small" error={!!fieldState.error} />
              )} />
            </Box>
            <Typography sx={formLabelSx}>
              {t('healthCheckup.hospital')}
              <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
            </Typography>
            <Box sx={{ ...formValueSx, borderRight: 0 }}>
              <Controller name="hospital" control={control} rules={{ required: true }} render={({ field, fieldState }) => (
                <TextField
                  value={field.value}
                  size="small"
                  fullWidth
                  error={!!fieldState.error}
                  placeholder={t('healthCheckup.hospitalSearch')}
                  onClick={() => setHospitalModalOpen(true)}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setHospitalModalOpen(true)}>
                          <SearchIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& input': { cursor: 'pointer' } }}
                />
              )} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={formLabelSx}>{t('healthCheckup.nextCheckupDate')}</Typography>
            <Box sx={formValueSx}>
              <Controller name="nextCheckupDate" control={control} render={({ field }) => (
                <DatePickerField value={field.value || ''} onChange={field.onChange} size="small" />
              )} />
            </Box>
            <Typography sx={formLabelSx}>{t('healthCheckup.isTarget')}</Typography>
            <Box sx={{ ...formValueSx, borderRight: 0, display: 'flex', alignItems: 'center' }}>
              <Controller name="isTarget" control={control} render={({ field }) => (
                <Switch checked={field.value ?? true} onChange={field.onChange} size="small" />
              )} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex' }}>
            <Typography sx={formLabelSx}>{t('healthCheckup.notes')}</Typography>
            <Box sx={{ ...formValueSx, borderRight: 0 }}>
              <Controller name="notes" control={control} render={({ field }) => (
                <TextField {...field} size="small" fullWidth multiline minRows={2} placeholder={t('healthCheckup.notes')} />
              )} />
            </Box>
          </Box>
        </Box>

        {/* Form - Mobile */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 3 }}>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('healthCheckup.employeeId')}</Typography>
            <Controller name="employeeId" control={control} render={({ field }) => (
              <TextField {...field} size="small" fullWidth disabled />
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('healthCheckup.employeeName')}</Typography>
            <Controller name="employeeName" control={control} render={({ field }) => (
              <TextField {...field} size="small" fullWidth disabled />
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('healthCheckup.employeeDept')}</Typography>
            <Controller name="employeeDept" control={control} render={({ field }) => (
              <TextField {...field} size="small" fullWidth disabled />
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('healthCheckup.employeeEmail')}</Typography>
            <Controller name="employeeEmail" control={control} render={({ field }) => (
              <TextField {...field} size="small" fullWidth disabled />
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('healthCheckup.checkupYear')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <Controller name="checkupYear" control={control} rules={{ required: true }} render={({ field }) => (
              <Select value={field.value || new Date().getFullYear()} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} size="small" fullWidth displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {years.map((y) => (<MenuItem key={y} value={y}>{y}</MenuItem>))}
              </Select>
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('healthCheckup.checkupType')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <Controller name="checkupType" control={control} rules={{ required: true }} render={({ field, fieldState }) => (
              <Select value={field.value || 'GENERAL'} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} size="small" fullWidth error={!!fieldState.error} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {checkupTypeCodes.map((item) => (
                  <MenuItem key={item.code} value={item.code}>{getLocalizedName(item)}</MenuItem>
                ))}
              </Select>
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('healthCheckup.checkupStatus')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <Controller name="checkupStatus" control={control} rules={{ required: true }} render={({ field, fieldState }) => (
              <Select value={field.value || 'PENDING'} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} size="small" fullWidth error={!!fieldState.error} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {checkupStatusCodes.map((item) => (
                  <MenuItem key={item.code} value={item.code}>{getLocalizedName(item)}</MenuItem>
                ))}
              </Select>
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('healthCheckup.overallResult')}</Typography>
            <Controller name="overallResult" control={control} render={({ field }) => (
              <Select {...field} size="small" fullWidth displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {overallResultCodes.map((item) => (
                  <MenuItem key={item.code} value={item.code}>{getLocalizedName(item)}</MenuItem>
                ))}
              </Select>
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('healthCheckup.checkupDate')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <Controller name="checkupDate" control={control} rules={{ required: true }} render={({ field, fieldState }) => (
              <DatePickerField value={field.value || ''} onChange={field.onChange} size="small" error={!!fieldState.error} />
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('healthCheckup.hospital')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <Controller name="hospital" control={control} rules={{ required: true }} render={({ field, fieldState }) => (
              <TextField
                value={field.value}
                size="small"
                fullWidth
                error={!!fieldState.error}
                placeholder={t('healthCheckup.hospitalSearch')}
                onClick={() => setHospitalModalOpen(true)}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setHospitalModalOpen(true)}>
                        <SearchIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ '& input': { cursor: 'pointer' } }}
              />
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('healthCheckup.nextCheckupDate')}</Typography>
            <Controller name="nextCheckupDate" control={control} render={({ field }) => (
              <DatePickerField value={field.value || ''} onChange={field.onChange} size="small" />
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('healthCheckup.isTarget')}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Controller name="isTarget" control={control} render={({ field }) => (
                <Switch checked={field.value ?? true} onChange={field.onChange} size="small" />
              )} />
            </Box>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('healthCheckup.notes')}</Typography>
            <Controller name="notes" control={control} render={({ field }) => (
              <TextField {...field} size="small" fullWidth multiline minRows={2} placeholder={t('healthCheckup.notes')} />
            )} />
          </Box>
        </Box>

        {/* ===== Detail Results Section (Body Diagram + Editable Table) ===== */}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
          {t('healthCheckup.bodyDiagram')}
        </Typography>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: { xs: 'center', md: 'flex-start' } }}>
            <FormBodyDiagram detailRows={detailRows} onBodyPartClick={handleFormBodyPartClick} t={t} />
            <Box sx={{ flex: 1, minWidth: 300 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {t('healthCheckup.bodyPartResult')}
                </Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={handleAddDetailRow}>
                  {t('healthCheckup.allBodyParts')}
                </Button>
              </Box>
              <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 700, '& .MuiTableCell-root': { borderColor: 'divider' } }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                      <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', width: 140 }} align="center">{t('healthCheckup.bodyPart')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></TableCell>
                      <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', width: 120 }} align="center">{t('healthCheckup.category')}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider' }} align="center">{t('healthCheckup.resultValue')}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', display: { xs: 'none', md: 'table-cell' } }} align="center">{t('healthCheckup.referenceRange')}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', width: 100 }} align="center">{t('healthCheckup.resultStatus')}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', width: 80 }} align="center">{t('common.delete')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detailRows.length > 0 ? (
                      detailRows.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell sx={{ borderRight: 1, borderColor: 'divider', p: 0.5 }}>
                            <Select
                              value={row.bodyPart}
                              onChange={(e) => handleDetailRowChange(idx, 'bodyPart', e.target.value)}
                              size="small" fullWidth displayEmpty
                              error={detailRowErrors.has(idx)}
                            >
                              <MenuItem value="" disabled></MenuItem>
                              {(row._region === 'all' ? allBodyParts : (row._region ? (regionBodyParts[row._region] || []) : [])).map((bp) => (
                                <MenuItem key={bp} value={bp}>{t(`healthCheckup.bodyParts.${bp}`)}</MenuItem>
                              ))}
                            </Select>
                          </TableCell>
                          <TableCell sx={{ borderRight: 1, borderColor: 'divider', p: 0.5 }}>
                            <TextField value={row.category} onChange={(e) => handleDetailRowChange(idx, 'category', e.target.value)} size="small" fullWidth placeholder={t('healthCheckup.category')} />
                          </TableCell>
                          <TableCell sx={{ borderRight: 1, borderColor: 'divider', p: 0.5 }}>
                            <TextField value={row.resultValue} onChange={(e) => handleDetailRowChange(idx, 'resultValue', e.target.value)} size="small" fullWidth placeholder={t('healthCheckup.resultValue')} />
                          </TableCell>
                          <TableCell sx={{ borderRight: 1, borderColor: 'divider', p: 0.5, display: { xs: 'none', md: 'table-cell' } }}>
                            <TextField value={row.referenceRange} onChange={(e) => handleDetailRowChange(idx, 'referenceRange', e.target.value)} size="small" fullWidth placeholder={t('healthCheckup.referenceRange')} />
                          </TableCell>
                          <TableCell sx={{ borderRight: 1, borderColor: 'divider', p: 0.5 }}>
                            <Select value={row.resultStatus || 'normal'} onChange={(e) => handleDetailRowChange(idx, 'resultStatus', e.target.value)} size="small" fullWidth displayEmpty>
                              <MenuItem value="" disabled>선택하세요</MenuItem>
                              <MenuItem value="normal">{t('healthCheckup.resultStatusLabels.normal')}</MenuItem>
                              <MenuItem value="caution">{t('healthCheckup.resultStatusLabels.caution')}</MenuItem>
                              <MenuItem value="abnormal">{t('healthCheckup.resultStatusLabels.abnormal')}</MenuItem>
                            </Select>
                          </TableCell>
                          <TableCell sx={{ p: 0.5 }} align="center">
                            <IconButton size="small" onClick={() => handleRemoveDetailRow(idx)} sx={{ color: 'text.primary' }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                          <Typography variant="body2" color="text.secondary">{t('healthCheckup.noDetailResults')}</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
        </Paper>

        {/* Form Actions */}
        <Box sx={{ display: 'flex', gap: 1, mt: 3, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          <Button variant="outlined" onClick={() => setViewMode('list')} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
            {t('common.cancel')}
          </Button>
          {canSee(MENU, 'DETAIL', '저장', getRoles(selectedItem ?? {})) && (
            <Button type="submit" variant="contained" disabled={createMutation.isPending || updateMutation.isPending} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
              {createMutation.isPending || updateMutation.isPending ? <CircularProgress size={20} /> : t('common.save')}
            </Button>
          )}
        </Box>
      </form>

      <HospitalSearchModal
        open={hospitalModalOpen}
        onClose={() => setHospitalModalOpen(false)}
        onSelect={(hospital) => {
          setValue('hospital', hospital, { shouldValidate: true })
          setHospitalModalOpen(false)
        }}
        initialValue={watch('hospital')}
      />
    </>
  )

  // ===== RENDER =====
  return (
    <Box sx={{ overflow: 'hidden' }}>
      {viewMode === 'list' && renderListView()}
      {viewMode === 'detail' && renderDetailView()}
      {(viewMode === 'create' || viewMode === 'edit') && renderFormView()}
    </Box>
  )
}

export default MyHealthCheckupPage
