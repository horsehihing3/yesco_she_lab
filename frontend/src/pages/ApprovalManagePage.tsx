import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Chip, Pagination, IconButton, Button, Paper,
  CircularProgress, Alert,
} from '@mui/material'
import FormControl from '@mui/material/FormControl'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import RefreshIcon from '@mui/icons-material/Refresh'
import { Approval } from '../types/approval.types'
import { fetchApprovals, updateApproval } from '../api/approvalApi'
import useCodeMap from '../hooks/useCodeMap'
import { useAuth } from '../context/AuthContext'
import { useAlert } from '../contexts/AlertContext'
import FlowChartButton from '../components/common/FlowChartButton'

type ViewMode = 'list' | 'detail'

const ROWS_PER_PAGE = 10

const labelSx = {
  width: 130, minWidth: 130, fontWeight: 'bold', bgcolor: 'grey.100',
  px: 2, py: 1.5, borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider',
  display: 'flex', alignItems: 'center', fontSize: '0.875rem',
  justifyContent: 'center', wordBreak: 'keep-all' as const, textAlign: 'center',
}
const valueSx = { flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem', display: 'flex', alignItems: 'center' }
const valueBorderSx = { ...valueSx, borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }
const headerCellSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }

// content 파싱: "requestId | description"
const parseContent = (content?: string) => {
  if (!content) return { refId: '', description: '' }
  const parts = content.split('|')
  return { refId: parts[0]?.trim() || '', description: parts.slice(1).join('|').trim() || '' }
}

// 유형별 상세 필드 정의
type FieldDef = { key: string; label: string; onlyIf?: string; isStatusChip?: boolean; isChip?: boolean }

const getTypeFields = (type: string, t: (key: string) => string) => {
  const common: FieldDef[] = [
    { key: 'approvalId', label: t('approval.approvalId') },
    { key: 'type', label: t('approval.type'), isChip: true },
    { key: 'status', label: t('approval.status'), isStatusChip: true },
    { key: 'title', label: t('approval.title') },
    { key: 'applicantName', label: t('approval.applicant') },
    { key: 'applicantDept', label: t('approval.department') },
    { key: 'requestDate', label: t('approval.requestDate') },
  ]

  const typeSpecific: Record<string, { key: string; label: string; onlyIf?: string; isStatusChip?: boolean; isChip?: boolean }[]> = {
    PPE_REQUEST: [
      { key: 'refId', label: t('approval.refId') },
      { key: 'description', label: t('approval.ppeDetail') },
    ],
    PERMIT_TO_WORK: [
      { key: 'refId', label: t('approval.refId') },
      { key: 'description', label: t('approval.workDetail') },
    ],
    TRAINING: [
      { key: 'refId', label: t('approval.refId') },
      { key: 'description', label: t('approval.trainingDetail') },
    ],
  }

  const specific = typeSpecific[type] || [
    { key: 'content', label: t('approval.content') },
  ]

  const approval: FieldDef[] = [
    { key: 'approverName', label: t('approval.approver') },
    { key: 'approvalDate', label: t('approval.approvalDate') },
    { key: 'rejectReason', label: t('approval.rejectReason'), onlyIf: 'REJECTED' },
  ]

  return { common, specific, approval }
}

const ApprovalManagePage: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { showSuccess, showError, showConfirm } = useAlert()
  const isAdmin = user?.role === 'SYSTEM_ADMIN'

  const { codeList: approvalStatusList, getLabel: getStatusLabel } = useCodeMap('APPROVAL_STATUS')
  const { getLabel: getTypeLabel } = useCodeMap('APPROVAL_TYPE')

  const getStatusColor = (status: string): 'warning' | 'success' | 'error' | 'default' => {
    const found = approvalStatusList.find((c) => c.code === status)
    const val = found?.codeValue
    if (val === 'warning' || val === 'success' || val === 'error') return val
    return 'default'
  }

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchText, setSearchText] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [rejectMode, setRejectMode] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const { data: approvalsData, isLoading } = useQuery({
    queryKey: ['approvals', page, statusFilter, searchText],
    queryFn: () => fetchApprovals(page - 1, ROWS_PER_PAGE, statusFilter || undefined, searchText || undefined),
    enabled: viewMode === 'list',
  })

  const approvals = approvalsData?.content || []
  const totalPages = approvalsData?.totalPages || 1

  const approveMut = useMutation({
    mutationFn: (id: number) => updateApproval(id, {
      ...selectedApproval!, status: 'APPROVED',
      approverName: user?.name || '', approvalDate: new Date().toISOString().substring(0, 10),
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['approvals'] }); showSuccess(t('approval.approved')); handleBackToList() },
    onError: () => showError(t('common.error')),
  })

  const rejectMut = useMutation({
    mutationFn: (id: number) => updateApproval(id, {
      ...selectedApproval!, status: 'REJECTED',
      approverName: user?.name || '', approvalDate: new Date().toISOString().substring(0, 10), rejectReason,
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['approvals'] }); showSuccess(t('approval.rejected')); handleBackToList() },
    onError: () => showError(t('common.error')),
  })

  const handleBackToList = () => { setViewMode('list'); setSelectedApproval(null); setRejectMode(false); setRejectReason('') }
  const handleOpenDetail = (a: Approval) => { setSelectedApproval(a); setViewMode('detail'); setRejectMode(false); setRejectReason('') }

  const handleApprove = async () => {
    if (!selectedApproval) return
    const ok = await showConfirm(t('approval.confirmApprove'))
    if (ok) approveMut.mutate(selectedApproval.id)
  }
  const handleReject = () => {
    if (!selectedApproval || !rejectReason.trim()) return
    rejectMut.mutate(selectedApproval.id)
  }

  // ── DETAIL VIEW ──
  if (viewMode === 'detail' && selectedApproval) {
    const { common, specific, approval } = getTypeFields(selectedApproval.type, t)
    const { refId, description } = parseContent(selectedApproval.content)
    const dataMap: Record<string, string | undefined> = {
      approvalId: selectedApproval.approvalId,
      type: selectedApproval.type,
      status: selectedApproval.status,
      title: selectedApproval.title,
      applicantName: selectedApproval.applicantName,
      applicantDept: selectedApproval.applicantDept,
      applicantEmail: selectedApproval.applicantEmail,
      requestDate: selectedApproval.requestDate,
      content: selectedApproval.content,
      refId, description,
      approverName: selectedApproval.approverName,
      approvalDate: selectedApproval.approvalDate,
      rejectReason: selectedApproval.rejectReason,
    }

    const renderCell = (field: { key: string; label: string; isChip?: boolean; isStatusChip?: boolean }, useBorderRight = true) => {
      const val = dataMap[field.key] || ''
      return (
        <>
          <Typography sx={labelSx}>{field.label}</Typography>
          <Box sx={useBorderRight ? valueBorderSx : valueSx}>
            {field.isStatusChip ? (
              <Chip label={getStatusLabel(val)} size="small" color={getStatusColor(val)} />
            ) : field.isChip ? (
              <Typography variant="body2">{getTypeLabel(val)}</Typography>
            ) : (
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{val}</Typography>
            )}
          </Box>
        </>
      )
    }

    const allFields = [...common, ...specific, ...approval].filter(
      (f) => !f.onlyIf || selectedApproval.status === f.onlyIf
    )

    // 2개씩 묶기
    const fieldPairs: (typeof allFields[number][])[] = []
    for (let i = 0; i < allFields.length; i += 2) {
      fieldPairs.push(allFields.slice(i, i + 2))
    }

    return (
      <Box>
        {/* PC Detail */}
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50', display: { xs: 'none', md: 'block' } }}>
          <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
            {fieldPairs.map((pair, idx) => (
              <Box key={idx} sx={{ display: 'flex', borderBottom: idx < fieldPairs.length - 1 ? 1 : 0, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
                {pair.length === 2 ? (
                  <>
                    {renderCell(pair[0], true)}
                    {renderCell(pair[1], false)}
                  </>
                ) : (
                  <>
                    {renderCell(pair[0], false)}
                  </>
                )}
              </Box>
            ))}
          </Box>
        </Paper>

        {/* Mobile Detail */}
        <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 3 }}>
          <Paper sx={{ p: 2, border: 1, borderColor: 'divider' }}>
            {allFields.map((field, idx) => {
              const val = dataMap[field.key] || ''
              return (
                <Box key={field.key} sx={{ mb: idx < allFields.length - 1 ? 1.5 : 0 }}>
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
                    {field.label}
                  </Typography>
                  <Box sx={{ px: 1.5, py: 0.5 }}>
                    {field.isStatusChip ? (
                      <Chip label={getStatusLabel(val)} size="small" color={getStatusColor(val)} />
                    ) : field.isChip ? (
                      <Typography variant="body2">{getTypeLabel(val)}</Typography>
                    ) : (
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{val}</Typography>
                    )}
                  </Box>
                </Box>
              )
            })}
          </Paper>
        </Box>

        {/* Reject Reason Input */}
        {rejectMode && (
          <Paper sx={{ p: 2, mb: 2, border: 1, borderColor: 'error.main' }}>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>{t('approval.enterRejectReason')}</Typography>
            <TextField fullWidth size="small" multiline rows={2} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
          </Paper>
        )}

        {/* Buttons */}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', md: 'flex-end' }, flexWrap: 'wrap' }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.list')}</Button>
          {isAdmin && selectedApproval.status === 'PENDING' && !rejectMode && (
            <>
              <Button variant="contained" color="success" onClick={handleApprove} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('approval.approve')}</Button>
              <Button variant="contained" color="error" onClick={() => { setRejectMode(true); setRejectReason('') }} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('approval.reject')}</Button>
            </>
          )}
          {rejectMode && (
            <>
              <Button variant="outlined" onClick={() => setRejectMode(false)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.cancel')}</Button>
              <Button variant="contained" color="error" onClick={handleReject} disabled={!rejectReason.trim()} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('approval.confirmReject')}</Button>
            </>
          )}
        </Box>
      </Box>
    )
  }

  // ── LIST VIEW ──
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <FlowChartButton flowKey="approvalManage" />
      </Box>
      {/* PC Search */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField size="small" placeholder={t('approval.searchPlaceholder')} value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (setSearchText(searchInput), setPage(1))}
            sx={{ minWidth: 240 }} />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select displayEmpty value={statusFilter} onChange={(e: SelectChangeEvent) => { setStatusFilter(e.target.value); setPage(1) }}>
              <MenuItem value="">{t('approval.allStatus')}</MenuItem>
              {approvalStatusList.map((c) => <MenuItem key={c.code} value={c.code}>{getStatusLabel(c.code)}</MenuItem>)}
            </Select>
          </FormControl>
          <IconButton onClick={() => { setSearchInput(''); setSearchText(''); setStatusFilter(''); setPage(1) }} size="small"><RefreshIcon /></IconButton>
        </Box>
      </Box>
      {/* Mobile Search */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
        <TextField size="small" fullWidth placeholder={t('approval.searchPlaceholder')} value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (setSearchText(searchInput), setPage(1))} />
        <FormControl size="small" fullWidth>
          <Select displayEmpty value={statusFilter} onChange={(e: SelectChangeEvent) => { setStatusFilter(e.target.value); setPage(1) }}>
            <MenuItem value="">{t('approval.allStatus')}</MenuItem>
            {approvalStatusList.map((c) => <MenuItem key={c.code} value={c.code}>{getStatusLabel(c.code)}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : approvals.length === 0 ? (
        <Alert severity="info">{t('approval.noData')}</Alert>
      ) : (
        <>
          {/* PC Table */}
          <Paper sx={{ display: { xs: 'none', md: 'block' } }}>
            <TableContainer>
              <Table size="small" stickyHeader sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={headerCellSx} align="center">{t('approval.approvalId')}</TableCell>
                    <TableCell sx={headerCellSx} align="center">{t('approval.type')}</TableCell>
                    <TableCell sx={headerCellSx} align="center">{t('approval.title')}</TableCell>
                    <TableCell sx={headerCellSx} align="center">{t('approval.applicant')}</TableCell>
                    <TableCell sx={headerCellSx} align="center">{t('approval.department')}</TableCell>
                    <TableCell sx={headerCellSx} align="center">{t('approval.requestDate')}</TableCell>
                    <TableCell sx={headerCellSx} align="center">{t('approval.status')}</TableCell>
                    <TableCell sx={headerCellSx} align="center">{t('approval.approver')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {approvals.map((row) => (
                    <TableRow key={row.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleOpenDetail(row)}>
                      <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{row.approvalId}</TableCell>
                      <TableCell align="center">{getTypeLabel(row.type)}</TableCell>
                      <TableCell><Typography fontWeight={600} variant="body2">{row.title}</Typography></TableCell>
                      <TableCell align="center">{row.applicantName}</TableCell>
                      <TableCell align="center">{row.applicantDept}</TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{row.requestDate}</TableCell>
                      <TableCell align="center"><Chip label={getStatusLabel(row.status)} size="small" color={getStatusColor(row.status)} /></TableCell>
                      <TableCell align="center">{row.approverName || ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
          {/* Mobile Cards */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
            {approvals.map((row) => (
              <Paper key={row.id} sx={{ p: 2, border: 1, borderColor: 'divider', cursor: 'pointer' }} onClick={() => handleOpenDetail(row)}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography fontWeight="bold" variant="body2">{row.title}</Typography>
                  <Chip label={getStatusLabel(row.status)} size="small" color={getStatusColor(row.status)} />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {getTypeLabel(row.type)} |
                  {row.applicantName} | {row.applicantDept}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {row.requestDate} | {row.approverName || ''}
                </Typography>
              </Paper>
            ))}
          </Box>
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
            </Box>
          )}
        </>
      )}
    </Box>
  )
}

export default ApprovalManagePage
