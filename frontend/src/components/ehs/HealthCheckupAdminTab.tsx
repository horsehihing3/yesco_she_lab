import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import ListSearchBar from '../common/ListSearchBar'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Select, MenuItem,
  FormControl, Chip, Pagination, CircularProgress, Alert, IconButton, Button,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import useCodeMap from '../../hooks/useCodeMap'
import axiosInstance from '../../api/axiosInstance'
import { ApiResponse, PageResponse } from '../../types/common.types'
import { HealthCheckup, BodyPart } from '../../types/healthCheckup.types'
import { HealthCheckupPlan } from '../../types/healthCheckupPlan.types'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import { useButtonRules } from '../../hooks/useButtonRules'
import BodyDiagram, { regionBodyParts } from '../common/BodyDiagram'

const headerCellSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }
const labelSx = {
  width: 120, minWidth: 120, fontWeight: 'bold', bgcolor: 'grey.100',
  px: 2, py: 1.5, borderRight: 1, borderColor: 'grey.300',
  display: 'flex', alignItems: 'center', fontSize: '0.875rem',
  justifyContent: 'center', wordBreak: 'keep-all' as const, textAlign: 'center',
}
const valueSx = { flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem', display: 'flex', alignItems: 'center' }
const valueBorderSx = { ...valueSx, borderRight: 1, borderColor: 'grey.300' }

const statusColors: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  COMPLETED: 'success', SCHEDULED: 'info', PENDING: 'warning', OVERDUE: 'error',
}
const resultColors: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  A: 'success', B: 'default', C1: 'warning', C2: 'warning', D1: 'error', D2: 'error',
}

const fetchCheckups = async (page: number, size: number) => {
  const res = await axiosInstance.get<ApiResponse<PageResponse<HealthCheckup>>>('/health-checkup', { params: { page, size } })
  return res.data.data
}
const fetchById = async (id: number) => {
  const res = await axiosInstance.get<ApiResponse<HealthCheckup>>(`/health-checkup/${id}`)
  return res.data.data
}
const fetchByStatus = async (status: string, page: number, size: number) => {
  const res = await axiosInstance.get<ApiResponse<PageResponse<HealthCheckup>>>(`/health-checkup/status/${status}`, { params: { page, size } })
  return res.data.data
}
const searchCheckups = async (name: string, page: number, size: number) => {
  const res = await axiosInstance.get<ApiResponse<PageResponse<HealthCheckup>>>('/health-checkup/search', { params: { name, page, size } })
  return res.data.data
}

// 완료 승인 대상 — 계획 승인 완료(IN_PROGRESS) 상태의 검진 계획
const fetchInProgressPlans = async (): Promise<HealthCheckupPlan[]> => {
  const res = await axiosInstance.get<ApiResponse<PageResponse<HealthCheckupPlan>>>('/health-checkup-plan', { params: { status: 'IN_PROGRESS', size: 100 } })
  return res.data.data.content || []
}
const completePlan = async (id: number): Promise<HealthCheckupPlan> => {
  const res = await axiosInstance.patch<ApiResponse<HealthCheckupPlan>>(`/health-checkup-plan/${id}/transition`, { action: 'complete' })
  return res.data.data
}

type ViewMode = 'list' | 'detail'

const MENU = '보건 관리 › 건강 검진 관리 › 검진 관리'

const HealthCheckupAdminTab: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()
  const { user } = useAuth()
  const { canSee } = useButtonRules()
  const isAdmin = user?.role === 'SYSTEM_ADMIN'
  const myRoles: string[] = ['guest', ...(isAdmin ? ['superAdmin'] : []), ...(user?.role ? [user.role] : [])]
  const { codeList: statusCodes, getLabel: getStatusLabel } = useCodeMap('CHECKUP_STATUS')

  // 완료 승인 대상 계획 목록
  const { data: pendingCompletionPlans = [] } = useQuery({
    queryKey: ['hcPlansPendingCompletion'],
    queryFn: fetchInProgressPlans,
  })
  const completeMutation = useMutation({
    mutationFn: completePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hcPlansPendingCompletion'] })
      queryClient.invalidateQueries({ queryKey: ['healthCheckupPlan'] })
      showSuccess(t('healthCheckupPlan.completionApproved', '완료 승인 처리되었습니다.'))
    },
    onError: () => showError(t('common.error', '오류가 발생했습니다.')),
  })
  const handleCompleteApprove = async (plan: HealthCheckupPlan) => {
    const ok = await showConfirm(t('healthCheckupPlan.confirmComplete', '완료 처리하시겠습니까?'))
    if (ok) completeMutation.mutate(plan.id)
  }

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<HealthCheckup | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const pageSize = 10
  const applySearch = () => { setSearchText(searchInput); setStatusFilter(''); setPage(0) }
  const handleResetSearch = () => { setSearchInput(''); setSearchText(''); setStatusFilter(''); setPage(0) }

  const queryKey = searchText
    ? ['hcSearch', searchText, page]
    : statusFilter
    ? ['hcStatus', statusFilter, page]
    : ['hcAll', page]

  const queryFn = () => {
    if (searchText) return searchCheckups(searchText, page, pageSize)
    if (statusFilter) return fetchByStatus(statusFilter, page, pageSize)
    return fetchCheckups(page, pageSize)
  }

  const { data, isLoading } = useQuery({ queryKey, queryFn, enabled: viewMode === 'list' })
  const items = data?.content || []
  const totalPages = data?.totalPages || 0

  const handleOpenDetail = async (item: HealthCheckup) => {
    try {
      const detail = await fetchById(item.id)
      setSelectedItem(detail)
    } catch {
      setSelectedItem(item)
    }
    setSelectedRegion(null)
    setViewMode('detail')
  }
  const handleBackToList = () => { setViewMode('list'); setSelectedItem(null); setSelectedRegion(null) }

  const filteredDetails = useMemo(() => {
    const details = selectedItem?.details || []
    if (!selectedRegion) return details
    const parts = regionBodyParts[selectedRegion] || []
    return details.filter((d) => parts.includes(d.bodyPart as BodyPart))
  }, [selectedItem, selectedRegion])

  // ── DETAIL VIEW ──
  if (viewMode === 'detail' && selectedItem) {
    const details = selectedItem.details || []
    return (
      <Box>
        {/* Checkup Info - PC */}
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50', display: { xs: 'none', md: 'block' } }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>{t('healthCheckup.checkupInfo')}</Typography>
          <Box sx={{ border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
              <Typography sx={labelSx}>{t('healthCheckup.checkupId')}</Typography>
              <Box sx={valueBorderSx}><Typography variant="body2" fontFamily="monospace">{selectedItem.checkupId}</Typography></Box>
              <Typography sx={labelSx}>{t('healthCheckup.checkupStatus')}</Typography>
              <Box sx={valueSx}><Chip label={getStatusLabel(selectedItem.checkupStatus) || selectedItem.checkupStatus} size="small" color={statusColors[selectedItem.checkupStatus] || 'default'} /></Box>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
              <Typography sx={labelSx}>{t('healthCheckup.employeeName')}</Typography>
              <Box sx={valueBorderSx}><Typography variant="body2" fontWeight={600}>{selectedItem.employeeName || ''}</Typography></Box>
              <Typography sx={labelSx}>{t('healthCheckup.employeeDept')}</Typography>
              <Box sx={valueSx}><Typography variant="body2">{selectedItem.employeeDept || ''}</Typography></Box>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
              <Typography sx={labelSx}>{t('healthCheckup.employeeId')}</Typography>
              <Box sx={valueBorderSx}><Typography variant="body2">{selectedItem.employeeId || ''}</Typography></Box>
              <Typography sx={labelSx}>{t('healthCheckup.employeeEmail')}</Typography>
              <Box sx={valueSx}><Typography variant="body2">{selectedItem.employeeEmail || ''}</Typography></Box>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
              <Typography sx={labelSx}>{t('healthCheckup.checkupYear')}</Typography>
              <Box sx={valueBorderSx}><Typography variant="body2">{selectedItem.checkupYear}</Typography></Box>
              <Typography sx={labelSx}>{t('healthCheckup.checkupType')}</Typography>
              <Box sx={valueSx}><Typography variant="body2">{selectedItem.checkupType || ''}</Typography></Box>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
              <Typography sx={labelSx}>{t('healthCheckup.checkupDate')}</Typography>
              <Box sx={valueBorderSx}><Typography variant="body2" fontFamily="monospace">{selectedItem.checkupDate?.substring(0, 10) || ''}</Typography></Box>
              <Typography sx={labelSx}>{t('healthCheckup.hospital')}</Typography>
              <Box sx={valueSx}><Typography variant="body2">{selectedItem.hospital || ''}</Typography></Box>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
              <Typography sx={labelSx}>{t('healthCheckup.overallResult')}</Typography>
              <Box sx={valueBorderSx}>
                {selectedItem.overallResult
                  ? <Chip label={selectedItem.overallResult} size="small" color={resultColors[selectedItem.overallResult] || 'default'} />
                  : null}
              </Box>
              <Typography sx={labelSx}>{t('healthCheckup.nextCheckupDate')}</Typography>
              <Box sx={valueSx}><Typography variant="body2" fontFamily="monospace">{selectedItem.nextCheckupDate?.substring(0, 10) || ''}</Typography></Box>
            </Box>
            <Box sx={{ display: 'flex' }}>
              <Typography sx={labelSx}>{t('healthCheckup.notes')}</Typography>
              <Box sx={valueSx}><Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selectedItem.notes || ''}</Typography></Box>
            </Box>
          </Box>
        </Paper>

        {/* Checkup Info - Mobile */}
        <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>{t('healthCheckup.checkupInfo')}</Typography>
          <Paper sx={{ p: 2, border: 1, borderColor: 'grey.300' }}>
            {[
              [t('healthCheckup.checkupId'), selectedItem.checkupId],
              [t('healthCheckup.checkupStatus'), getStatusLabel(selectedItem.checkupStatus) || selectedItem.checkupStatus],
              [t('healthCheckup.employeeName'), selectedItem.employeeName || ''],
              [t('healthCheckup.employeeDept'), selectedItem.employeeDept || ''],
              [t('healthCheckup.employeeId'), selectedItem.employeeId || ''],
              [t('healthCheckup.employeeEmail'), selectedItem.employeeEmail || ''],
              [t('healthCheckup.checkupYear'), String(selectedItem.checkupYear)],
              [t('healthCheckup.checkupType'), selectedItem.checkupType || ''],
              [t('healthCheckup.checkupDate'), selectedItem.checkupDate?.substring(0, 10) || ''],
              [t('healthCheckup.hospital'), selectedItem.hospital || ''],
              [t('healthCheckup.overallResult'), selectedItem.overallResult || ''],
              [t('healthCheckup.nextCheckupDate'), selectedItem.nextCheckupDate?.substring(0, 10) || ''],
              [t('healthCheckup.notes'), selectedItem.notes || ''],
            ].map(([label, value], i) => (
              <Box key={i} sx={{ mb: 1.5 }}>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{label}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{value}</Typography>
              </Box>
            ))}
          </Paper>
        </Box>

        {/* Body Diagram + Results */}
        {details.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>{t('healthCheckup.bodyDiagram')}</Typography>
            <BodyDiagram
              details={details}
              selectedRegion={selectedRegion}
              onRegionClick={(region) => setSelectedRegion(region || null)}
              filteredDetails={filteredDetails}
              t={t}
            />
          </Box>
        )}

        {details.length === 0 && (
          <Alert severity="info" sx={{ mb: 3 }}>{t('healthCheckup.noDetailResults')}</Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.list')}</Button>
        </Box>
      </Box>
    )
  }

  // ── LIST VIEW ──
  return (
    <Box>
      {/* 완료 승인 대상 — 계획 결재 완료된 검진 계획 목록 */}
      {pendingCompletionPlans.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
            {t('healthCheckupPlan.pendingCompletionTitle', '완료 승인 대상 검진 계획')}
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={headerCellSx} align="center">{t('healthCheckupPlan.planYear', '연도')}</TableCell>
                  <TableCell sx={headerCellSx}>{t('healthCheckupPlan.planName', '계획명')}</TableCell>
                  <TableCell sx={headerCellSx} align="center">{t('healthCheckupPlan.checkupType', '종류')}</TableCell>
                  <TableCell sx={headerCellSx} align="center">{t('healthCheckupPlan.period', '기간')}</TableCell>
                  <TableCell sx={headerCellSx} align="center">{t('healthCheckupPlan.completionApprover', '완료 승인자')}</TableCell>
                  <TableCell sx={{ ...headerCellSx, width: 120 }} align="center">{t('common.action', '조치')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingCompletionPlans.map(p => (
                  <TableRow key={p.id} hover>
                    <TableCell align="center">{p.planYear}</TableCell>
                    <TableCell>{p.planName}</TableCell>
                    <TableCell align="center">{p.checkupType}</TableCell>
                    <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {p.planStartDate || ''} ~ {p.planEndDate || ''}
                    </TableCell>
                    <TableCell align="center">{p.completionApproverName || '-'}</TableCell>
                    <TableCell align="center">
                      {(() => {
                        const itemRoles = [...myRoles]
                        if (p.completionApproverName && user?.name && p.completionApproverName === user.name) itemRoles.push('completionApprover')
                        return canSee(MENU, 'PENDING_COMPLETION', '완료 승인', itemRoles) && (
                          <Button variant="contained" size="small" color="info" onClick={() => handleCompleteApprove(p)} disabled={completeMutation.isPending}>
                            {t('healthCheckupPlan.approveCompletion', '완료 승인')}
                          </Button>
                        )
                      })()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      <Alert severity="info" sx={{ mb: 2 }}>{t('healthCheckup.adminDesc')}</Alert>

      {/* PC Search */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <ListSearchBar placeholder={t('healthCheckup.searchByName')}
            value={searchInput} onChange={setSearchInput} onSearch={applySearch}
            sx={{ minWidth: 200 }} />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select displayEmpty value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setSearchText(''); setPage(0) }}>
              <MenuItem value="">{t('healthCheckup.filterByStatus')}</MenuItem>
              {statusCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getStatusLabel(c.code)}</MenuItem>)}
            </Select>
          </FormControl>
          <IconButton onClick={handleResetSearch} size="small"><RefreshIcon /></IconButton>
        </Box>
      </Box>
      {/* Mobile Search */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
        <ListSearchBar fullWidth placeholder={t('healthCheckup.searchByName')}
          value={searchInput} onChange={setSearchInput} onSearch={applySearch} />
        <FormControl size="small" fullWidth>
          <Select displayEmpty value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setSearchText(''); setPage(0) }}>
            <MenuItem value="">{t('healthCheckup.filterByStatus')}</MenuItem>
            {statusCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getStatusLabel(c.code)}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : items.length === 0 ? (
        <Alert severity="info">{t('common.noData')}</Alert>
      ) : (
        <>
          {/* PC Table */}
          <Paper sx={{ display: { xs: 'none', md: 'block' } }}>
            <TableContainer>
              <Table size="small" stickyHeader sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'grey.300' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={headerCellSx} align="center">{t('healthCheckup.checkupId')}</TableCell>
                    <TableCell sx={headerCellSx} align="center">{t('healthCheckup.employeeName')}</TableCell>
                    <TableCell sx={headerCellSx} align="center">{t('healthCheckup.employeeDept')}</TableCell>
                    <TableCell sx={headerCellSx} align="center">{t('healthCheckup.checkupYear')}</TableCell>
                    <TableCell sx={headerCellSx} align="center">{t('healthCheckup.checkupType')}</TableCell>
                    <TableCell sx={headerCellSx} align="center">{t('healthCheckup.checkupDate')}</TableCell>
                    <TableCell sx={headerCellSx} align="center">{t('healthCheckup.hospital')}</TableCell>
                    <TableCell sx={headerCellSx} align="center">{t('healthCheckup.overallResult')}</TableCell>
                    <TableCell sx={headerCellSx} align="center">{t('healthCheckup.checkupStatus')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleOpenDetail(item)}>
                      <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{item.checkupId}</TableCell>
                      <TableCell align="center"><Typography fontWeight={600} variant="body2">{item.employeeName}</Typography></TableCell>
                      <TableCell align="center">{item.employeeDept || ''}</TableCell>
                      <TableCell align="center">{item.checkupYear}</TableCell>
                      <TableCell align="center">{item.checkupType || ''}</TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{item.checkupDate?.substring(0, 10) || ''}</TableCell>
                      <TableCell>{item.hospital || ''}</TableCell>
                      <TableCell align="center">
                        {item.overallResult
                          ? <Chip label={item.overallResult} size="small" color={resultColors[item.overallResult] || 'default'} />
                          : ''}
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={getStatusLabel(item.checkupStatus) || item.checkupStatus} size="small" color={statusColors[item.checkupStatus] || 'default'} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
          {/* Mobile Card List */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
            {items.map((item) => (
              <Paper key={item.id} sx={{ p: 2, border: 1, borderColor: 'grey.300', cursor: 'pointer' }} onClick={() => handleOpenDetail(item)}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography fontWeight="bold">{item.employeeName}</Typography>
                  <Chip label={getStatusLabel(item.checkupStatus) || item.checkupStatus} size="small" color={statusColors[item.checkupStatus] || 'default'} />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {item.employeeDept} | {item.checkupYear} | {item.checkupType || ''}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.checkupDate?.substring(0, 10) || ''} | {item.hospital || ''}
                </Typography>
                {item.overallResult && (
                  <Box sx={{ mt: 1 }}>
                    <Chip label={`${t('healthCheckup.overallResult')}: ${item.overallResult}`} size="small" color={resultColors[item.overallResult] || 'default'} />
                  </Box>
                )}
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
    </Box>
  )
}

export default HealthCheckupAdminTab
