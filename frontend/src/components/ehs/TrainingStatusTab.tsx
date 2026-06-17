import { useMemo, useState } from 'react'
import { isSystemAdmin } from '../../utils/auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Typography, Paper, Grid, Select, MenuItem, FormControl,
  Chip, CircularProgress, Alert, Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  Pagination, Button, IconButton,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import ListSearchBar from '../common/ListSearchBar'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import { useButtonRules } from '../../hooks/useButtonRules'
import { trainingApplicationApi } from '../../api/trainingApi'
import { TrainingApplication } from '../../types/trainingApplication.types'
import { formatUserName } from '../../utils/userDisplay'
import useCodeMap from '../../hooks/useCodeMap'
import RejectReasonDialog from '../common/RejectReasonDialog'

type ViewMode = 'list' | 'detail'

const STATUS_COLOR: Record<string, 'default' | 'primary' | 'warning' | 'success' | 'error'> = {
  PENDING: 'warning', APPROVED: 'primary', COMPLETED: 'success', REJECTED: 'error', CANCELLED: 'default',
}

const labelSx = {
  width: 130, minWidth: 130, fontWeight: 'bold', bgcolor: 'grey.100',
  px: 2, py: 1.5, borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider',
  display: 'flex', alignItems: 'center', fontSize: '0.875rem',
  justifyContent: 'center', wordBreak: 'keep-all' as const, textAlign: 'center',
}
const valSx = { flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', display: 'flex', alignItems: 'center' }
const valBorderSx = { ...valSx, borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }
const rowSx = { display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }
const lastRowSx = { display: 'flex', borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }

const TrainingStatusTab: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()
  const { user } = useAuth()
  const { canSee } = useButtonRules()
  const MENU = 'SHE 경영 › 교육·훈련 › 교육현황 (관리자)'
  const isAdmin = isSystemAdmin(user)
  const getRoles = (record?: { applicantName?: string | null }): string[] => {
    const roles: string[] = ['guest']
    if (isAdmin) roles.push('superAdmin')
    else if (user?.role) roles.push(user.role)
    // 작성자(신청자 본인) — userId 미보유 메뉴라 이름으로 매칭
    if (record?.applicantName && user?.name && record.applicantName === user.name) roles.push('writer')
    return roles
  }
  const { getLabel: getStatusLabel, codeList: statusCodes } = useCodeMap('TRAINING_APPLICATION_STATUS')

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const [page, setPage] = useState(0)
  const pageSize = 15
  const [statusFilter, setStatusFilter] = useState('')
  const [deptInput, setDeptInput] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [nameFilter, setNameFilter] = useState('')
  const [courseNameInput, setCourseNameInput] = useState('')
  const [courseNameFilter, setCourseNameFilter] = useState('')
  const applyNameSearch = () => { setNameFilter(nameInput); setPage(0) }
  const applyDeptSearch = () => { setDeptFilter(deptInput); setPage(0) }
  const applyCourseNameSearch = () => { setCourseNameFilter(courseNameInput); setPage(0) }
  const handleResetSearch = () => {
    setNameInput(''); setNameFilter('')
    setDeptInput(''); setDeptFilter('')
    setCourseNameInput(''); setCourseNameFilter('')
    setStatusFilter(''); setPage(0)
  }

  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; reason: string }>({ open: false, reason: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['trainingApplicationsAdmin', page, statusFilter, deptFilter, nameFilter, courseNameFilter],
    queryFn: () => trainingApplicationApi.list({
      page, size: pageSize,
      status: statusFilter || undefined,
      dept: deptFilter || undefined,
      name: nameFilter || undefined,
      courseName: courseNameFilter || undefined,
    }),
    enabled: viewMode === 'list',
  })
  const items: TrainingApplication[] = data?.content || []
  const totalPages = data?.totalPages || 0

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['trainingApplicationDetail', selectedId],
    queryFn: () => trainingApplicationApi.get(selectedId!),
    enabled: viewMode === 'detail' && !!selectedId,
  })

  const all = items
  const stats = useMemo(() => ({
    total: data?.totalElements ?? items.length,
    pending: all.filter(a => a.status === 'PENDING').length,
    confirmed: all.filter(a => a.status === 'APPROVED' || a.status === 'COMPLETED').length,
    rejected: all.filter(a => a.status === 'REJECTED' || a.status === 'CANCELLED').length,
  }), [all, data?.totalElements, items.length])

  const statusMutation = useMutation({
    mutationFn: ({ id, status, rejectReason }: { id: number; status: string; rejectReason?: string }) =>
      trainingApplicationApi.changeStatus(id, status, { rejectReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainingApplicationsAdmin'] })
      queryClient.invalidateQueries({ queryKey: ['trainingApplicationDetail'] })
      queryClient.invalidateQueries({ queryKey: ['myTrainingApplications'] })
      queryClient.invalidateQueries({ queryKey: ['trainingHistory'] })
      showSuccess(t('common.saved', '저장되었습니다'))
      setRejectDialog({ open: false, reason: '' })
    },
    onError: () => showError(t('common.error')),
  })

  const handleOpenDetail = (a: TrainingApplication) => {
    setSelectedId(a.id)
    setViewMode('detail')
  }
  const handleBackToList = () => {
    setViewMode('list')
    setSelectedId(null)
  }

  const handleApprove = async (a: TrainingApplication) => {
    const ok = await showConfirm(t('training.confirmApprove', '이 신청을 승인하시겠습니까?'))
    if (ok) statusMutation.mutate({ id: a.id, status: 'APPROVED' })
  }
  const handleComplete = async (a: TrainingApplication) => {
    const ok = await showConfirm(t('training.confirmComplete', '수료 처리하시겠습니까?'))
    if (ok) statusMutation.mutate({ id: a.id, status: 'COMPLETED' })
  }
  const handleCancel = async (a: TrainingApplication) => {
    const ok = await showConfirm(t('training.confirmCancel', '취소 처리하시겠습니까?'))
    if (ok) statusMutation.mutate({ id: a.id, status: 'CANCELLED' })
  }

  // ==================== DETAIL VIEW ====================
  if (viewMode === 'detail') {
    if (detailLoading || !detail) {
      return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
    }
    return (
      <Box>
        <Paper sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mb: 3 }}>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('training.applicationNo', '신청번호')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2" fontFamily="monospace">{detail.applicationNo}</Typography></Box>
            <Box sx={labelSx}>{t('training.applyDate', '신청일')}</Box>
            <Box sx={valSx}><Typography variant="body2" fontFamily="monospace">{detail.applyDate || ''}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('training.courseName', '교육과정')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2" fontWeight={600}>{detail.courseName}</Typography></Box>
            <Box sx={labelSx}>{t('common.status', '상태')}</Box>
            <Box sx={valSx}><Chip size="small" label={getStatusLabel(detail.status) || detail.status} color={STATUS_COLOR[detail.status]} /></Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('training.courseDate', '교육일')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2" fontFamily="monospace">{detail.courseDate || ''}</Typography></Box>
            <Box sx={labelSx}>{t('training.completionDate', '수료일')}</Box>
            <Box sx={valSx}><Typography variant="body2" fontFamily="monospace">{detail.completionDate || ''}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('training.applicant', '신청자')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2">{formatUserName(detail.applicantDept, detail.applicantName, detail.applicantPosition) || ''}</Typography></Box>
            <Box sx={labelSx}>{t('training.deptName', '부서명')}</Box>
            <Box sx={valSx}><Typography variant="body2">{detail.applicantDept || ''}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('training.empNo', '사번')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2">{detail.applicantEmpNo || ''}</Typography></Box>
            <Box sx={labelSx}>{t('training.phone', '연락처')}</Box>
            <Box sx={valSx}><Typography variant="body2">{detail.applicantPhone || ''}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('training.transportOption', '교통편')}</Box>
            <Box sx={{ ...valSx, flex: 3 }}><Typography variant="body2">{detail.transportOption || 'N/A'}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('training.reason', '신청사유')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{detail.reason || ''}</Typography></Box>
            <Box sx={labelSx}>{t('training.approvedBy', '승인자')}</Box>
            <Box sx={valSx}><Typography variant="body2">{detail.approvedBy || ''}</Typography></Box>
          </Box>
          {detail.rejectReason && (
            <Box sx={lastRowSx}>
              <Box sx={labelSx}>{t('training.rejectReason', '반려사유')}</Box>
              <Box sx={{ ...valSx, flex: 3 }}>
                <Typography variant="body2" color="error" sx={{ whiteSpace: 'pre-wrap' }}>{detail.rejectReason}</Typography>
              </Box>
            </Box>
          )}
        </Paper>

        <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', md: 'flex-end' }, flexWrap: 'wrap' }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.list', '목록')}</Button>
          {detail.status === 'PENDING' && (
            <>
              {canSee(MENU, 'PENDING', '반려', getRoles(detail)) && (
                <Button color="warning" variant="contained" onClick={() => setRejectDialog({ open: true, reason: '' })} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('training.reject', '반려')}</Button>
              )}
              {canSee(MENU, 'PENDING', '승인', getRoles(detail)) && (
                <Button color="success" variant="contained" onClick={() => handleApprove(detail)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('training.approve', '승인')}</Button>
              )}
            </>
          )}
          {detail.status === 'APPROVED' && canSee(MENU, 'APPROVED', '수료', getRoles(detail)) && (
            <Button color="success" variant="contained" onClick={() => handleComplete(detail)}>{t('training.complete', '수료')}</Button>
          )}
          {(detail.status === 'PENDING' || detail.status === 'APPROVED') && canSee(MENU, detail.status, '신청 취소', getRoles(detail)) && (
            <Button color="error" variant="contained" onClick={() => handleCancel(detail)}>{t('training.cancelApplication', '신청 취소')}</Button>
          )}
        </Box>

        {/* 반려 사유 입력 다이얼로그 — 다른 모듈과 동일한 공용 컴포넌트 사용 */}
        <RejectReasonDialog
          open={rejectDialog.open}
          stage={t('training.rejectReason', '반려 사유')}
          onClose={() => setRejectDialog({ open: false, reason: '' })}
          onConfirm={(reason) => {
            statusMutation.mutate({ id: detail.id, status: 'REJECTED', rejectReason: reason })
          }}
          loading={statusMutation.isPending}
        />
      </Box>
    )
  }

  // ==================== LIST VIEW ====================
  return (
    <Box>
      {/* KPI */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {[
          { label: t('training.statTotal', '전체 신청'), value: stats.total, color: '#3b82f6' },
          { label: t('training.statPending', '승인 대기'), value: stats.pending, color: '#f59e0b' },
          { label: t('training.statConfirmed', '수강 확정'), value: stats.confirmed, color: '#10b981' },
          { label: t('training.statRejected', '반려/취소'), value: stats.rejected, color: '#ef4444' },
        ].map((c, i) => (
          <Grid item xs={6} md={3} key={i}>
            <Paper sx={(theme: any) => ({ p: 2.5, pl: 3, position: 'relative', overflow: 'hidden', ...(theme.isYesco && { border: 1, borderColor: '#0F2147' }), '&::before': { content: '""', position: 'absolute', top: 0, bottom: 0, left: 0, width: 4, backgroundColor: theme.isYesco ? '#E60012' : '#2563eb', borderTopLeftRadius: 'inherit', borderBottomLeftRadius: 'inherit' } })}>
              <Typography variant="caption" color="text.secondary">{c.label}</Typography>
              <Typography variant="h5" fontWeight="bold">{c.value}{t('common.cntSuffix', '건')}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Filter */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <ListSearchBar placeholder={t('training.searchNamePh', '이름 검색')}
          value={nameInput} onChange={setNameInput} onSearch={applyNameSearch} sx={{ minWidth: 160 }} />
        <ListSearchBar placeholder={t('training.searchDeptPh', '부서 검색')}
          value={deptInput} onChange={setDeptInput} onSearch={applyDeptSearch} sx={{ minWidth: 160 }} />
        <ListSearchBar placeholder={t('training.searchCoursePh2', '교육명 검색')}
          value={courseNameInput} onChange={setCourseNameInput} onSearch={applyCourseNameSearch} sx={{ minWidth: 200 }} />
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <Select displayEmpty value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}>
            <MenuItem value="">{t('common.allStatus', '전체 상태')}</MenuItem>
            {statusCodes.map((c) => (
              <MenuItem key={c.code} value={c.code}>{getStatusLabel(c.code)}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <IconButton size="small" onClick={handleResetSearch}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ overflowX: 'auto', border: 1, borderColor: 'divider' }}>
        <Table size="small" sx={{ '& td, & th': { borderRight: '1px solid', borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }, '& td:last-child, & th:last-child': { borderRight: 'none' } }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell align="center" sx={{ fontWeight: 'bold', width: 60 }}>No</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>{t('training.applicationNo', '신청번호')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>{t('common.name', '신청자')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>{t('training.dept', '부서')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>{t('training.courseName', '교육과정')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>{t('training.courseDate', '교육일')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>{t('training.applyDate', '신청일')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>{t('common.status', '상태')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}><Alert severity="info">{t('common.noData', '데이터가 없습니다')}</Alert></TableCell></TableRow>
            ) : items.map((a, idx) => (
              <TableRow key={a.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleOpenDetail(a)}>
                <TableCell align="center">{page * pageSize + idx + 1}</TableCell>
                <TableCell align="center"><code>{a.applicationNo}</code></TableCell>
                <TableCell align="center">{a.applicantName}</TableCell>
                <TableCell align="center">{a.applicantDept || ''}</TableCell>
                <TableCell>{a.courseName}</TableCell>
                <TableCell align="center">{a.courseDate || ''}</TableCell>
                <TableCell align="center">{a.applyDate || ''}</TableCell>
                <TableCell align="center">
                  <Chip label={getStatusLabel(a.status) || a.status} size="small" color={STATUS_COLOR[a.status]} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination count={totalPages} page={page + 1} onChange={(_, p) => setPage(p - 1)} color="primary" />
        </Box>
      )}
    </Box>
  )
}

export default TrainingStatusTab
