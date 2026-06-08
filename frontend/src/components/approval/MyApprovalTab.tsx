import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Pagination, Paper, CircularProgress, Alert, Button, TextField,
} from '@mui/material'
import { Approval } from '../../types/approval.types'
import { fetchMyPending, fetchMyDrafted, fetchMyHistory, updateApproval } from '../../api/approvalApi'
import useCodeMap from '../../hooks/useCodeMap'
import { useAuth } from '../../context/AuthContext'
import { useAlert } from '../../contexts/AlertContext'

const ROWS_PER_PAGE = 10

const headerCellSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }
const labelSx = {
  width: 130, minWidth: 130, fontWeight: 'bold', bgcolor: 'grey.100',
  px: 2, py: 1.5, borderRight: 1, borderColor: 'divider',
  display: 'flex', alignItems: 'center', fontSize: '0.875rem',
  justifyContent: 'center', wordBreak: 'keep-all' as const, textAlign: 'center',
}
const valueSx = { flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem', display: 'flex', alignItems: 'center' }

const formatDate = (dateString?: string | null) => {
  if (!dateString) return ''
  return dateString.substring(0, 10)
}

const getTypeChipColor = (type: string): 'info' | 'warning' | 'success' | 'error' | 'default' => {
  switch (type) {
    case 'PPE_REQUEST': return 'info'
    case 'PERMIT_TO_WORK': return 'warning'
    case 'TRAINING': return 'success'
    case 'CHEMICAL': return 'error'
    default: return 'default'
  }
}

const MyApprovalTab: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { showSuccess, showError, showConfirm } = useAlert()

  const { codeList: approvalStatusList, getLabel: getStatusLabel } = useCodeMap('APPROVAL_STATUS')
  const { getLabel: getTypeLabel } = useCodeMap('APPROVAL_TYPE')

  const getStatusColor = (status: string): 'warning' | 'success' | 'error' | 'default' => {
    const found = approvalStatusList.find((c) => c.code === status)
    const val = found?.codeValue
    if (val === 'warning' || val === 'success' || val === 'error') return val
    return 'default'
  }

  const [selectedItem, setSelectedItem] = useState<Approval | null>(null)
  const [rejectMode, setRejectMode] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [historyPage, setHistoryPage] = useState(1)

  const email = user?.email || ''

  // ---- Queries ----
  const { data: pendingData, isLoading: isLoadingPending } = useQuery({
    queryKey: ['myPending', email],
    queryFn: () => fetchMyPending(email, 0, 50),
    enabled: !!email,
  })

  const { data: draftedData, isLoading: isLoadingDrafted } = useQuery({
    queryKey: ['myDrafted', email],
    queryFn: () => fetchMyDrafted(email, 0, 50),
    enabled: !!email,
  })

  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['myHistory', email, historyPage],
    queryFn: () => fetchMyHistory(email, historyPage - 1, ROWS_PER_PAGE),
    enabled: !!email,
  })

  const pendingList = pendingData?.content || []
  const draftedList = draftedData?.content || []
  const historyList = historyData?.content || []
  const historyTotalPages = historyData?.totalPages || 1

  // ---- Mutations ----
  const toRequest = (item: Approval) => ({
    type: item.type || '',
    title: item.title || '',
    content: item.content || '',
    applicantName: item.applicantName || '',
    applicantDept: item.applicantDept || '',
    applicantEmail: item.applicantEmail || '',
    requestDate: item.requestDate || new Date().toISOString().substring(0, 10),
  })

  const approveMut = useMutation({
    mutationFn: (id: number) => updateApproval(id, {
      ...toRequest(selectedItem!), status: 'APPROVED',
      approverName: user?.name || '', approvalDate: new Date().toISOString().substring(0, 10),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPending'] })
      queryClient.invalidateQueries({ queryKey: ['myDrafted'] })
      queryClient.invalidateQueries({ queryKey: ['myHistory'] })
      queryClient.invalidateQueries({ queryKey: ['approvals'] })
      showSuccess(t('approval.approved'))
      setSelectedItem(null)
      setRejectMode(false)
      setRejectReason('')
    },
    onError: () => showError(t('common.error')),
  })

  const rejectMut = useMutation({
    mutationFn: (id: number) => updateApproval(id, {
      ...toRequest(selectedItem!), status: 'REJECTED',
      approverName: user?.name || '', approvalDate: new Date().toISOString().substring(0, 10), rejectReason,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPending'] })
      queryClient.invalidateQueries({ queryKey: ['myDrafted'] })
      queryClient.invalidateQueries({ queryKey: ['myHistory'] })
      queryClient.invalidateQueries({ queryKey: ['approvals'] })
      showSuccess(t('approval.rejected'))
      setSelectedItem(null)
      setRejectMode(false)
      setRejectReason('')
    },
    onError: () => showError(t('common.error')),
  })

  const handleApprove = async () => {
    if (!selectedItem) return
    const confirmed = await showConfirm(t('approval.confirmApprove'))
    if (!confirmed) return
    approveMut.mutate(selectedItem.id)
  }

  const handleReject = async () => {
    if (!selectedItem || !rejectReason.trim()) return
    const confirmed = await showConfirm(t('approval.confirmReject'))
    if (!confirmed) return
    rejectMut.mutate(selectedItem.id)
  }

  const handleSelectPending = (item: Approval) => {
    setSelectedItem(item)
    setRejectMode(false)
    setRejectReason('')
  }

  // content parsing
  const parseContent = (content?: string) => {
    if (!content) return { refId: '', description: '' }
    const parts = content.split('|')
    return { refId: parts[0]?.trim() || '', description: parts.slice(1).join('|').trim() || '' }
  }

  const tableSx = {
    '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' },
    '& .MuiTableCell-root:last-child': { borderRight: 'none' },
    '& tbody tr:last-child td': { borderBottom: 'none' },
  }

  return (
    <Box>
      {/* ============ TOP SECTION: Pending + Preview ============ */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 3 }}>
        {/* Left: Pending List */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
            {t('approval.pendingApprovals')}
          </Typography>
          <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
            {isLoadingPending ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
            ) : pendingList.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: 0 }}>{t('approval.noPending')}</Alert>
            ) : (
              <>
                {/* PC Table */}
                <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                  <TableContainer>
                    <Table size="small" sx={tableSx}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={headerCellSx} align="center">{t('approval.approvalId')}</TableCell>
                          <TableCell sx={headerCellSx} align="center">{t('approval.type')}</TableCell>
                          <TableCell sx={headerCellSx} align="center">{t('approval.title')}</TableCell>
                          <TableCell sx={headerCellSx} align="center">{t('approval.applicant')}</TableCell>
                          <TableCell sx={headerCellSx} align="center">{t('approval.requestDate')}</TableCell>
                          <TableCell sx={headerCellSx} align="center">{t('approval.status')}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {pendingList.map((row) => (
                          <TableRow
                            key={row.id}
                            hover
                            selected={selectedItem?.id === row.id}
                            sx={{ cursor: 'pointer' }}
                            onClick={() => handleSelectPending(row)}
                          >
                            <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{row.approvalId}</TableCell>
                            <TableCell align="center">
                              <Chip label={getTypeLabel(row.type)} size="small" color={getTypeChipColor(row.type)} />
                            </TableCell>
                            <TableCell><Typography fontWeight={600} variant="body2">{row.title}</Typography></TableCell>
                            <TableCell align="center">{row.applicantName}</TableCell>
                            <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{formatDate(row.requestDate)}</TableCell>
                            <TableCell align="center">
                              <Chip label={getStatusLabel(row.status)} size="small" color={getStatusColor(row.status)} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
                {/* Mobile Cards */}
                <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column' }}>
                  {pendingList.map((row) => (
                    <Box
                      key={row.id}
                      sx={{
                        p: 1.5, cursor: 'pointer', borderBottom: 1, borderColor: 'divider',
                        bgcolor: selectedItem?.id === row.id ? 'action.selected' : 'transparent',
                        '&:last-child': { borderBottom: 0 },
                      }}
                      onClick={() => handleSelectPending(row)}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography fontWeight="bold" variant="body2">{row.title}</Typography>
                        <Chip label={getStatusLabel(row.status)} size="small" color={getStatusColor(row.status)} />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip label={getTypeLabel(row.type)} size="small" color={getTypeChipColor(row.type)} variant="outlined" />
                        <Typography variant="caption" color="text.secondary">{row.applicantName}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{formatDate(row.requestDate)}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </Box>
        </Box>

        {/* Right: Preview Panel */}
        <Box sx={{ width: { xs: '100%', md: 400 }, flexShrink: 0, display: { xs: selectedItem ? 'block' : 'none', md: 'block' } }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
            {t('approval.preview')}
          </Typography>
          <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', minHeight: 300 }}>
            {!selectedItem ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                <Typography color="text.secondary" variant="body2">{t('approval.selectToPreview')}</Typography>
              </Box>
            ) : (
              <Box>
                {/* Preview Fields */}
                {[
                  { label: t('approval.approvalId'), value: selectedItem.approvalId },
                  { label: t('approval.type'), value: getTypeLabel(selectedItem.type), chip: true, chipColor: getTypeChipColor(selectedItem.type) },
                  { label: t('approval.title'), value: selectedItem.title },
                  { label: t('approval.applicant'), value: selectedItem.applicantName },
                  { label: t('approval.department'), value: selectedItem.applicantDept },
                  { label: t('approval.requestDate'), value: formatDate(selectedItem.requestDate) },
                  { label: t('approval.content'), value: parseContent(selectedItem.content).description || selectedItem.content || '' },
                ].map((field, idx, arr) => (
                  <Box key={idx} sx={{ display: 'flex', borderBottom: idx < arr.length - 1 ? 1 : 0, borderColor: 'divider' }}>
                    <Typography sx={labelSx}>{field.label}</Typography>
                    <Box sx={valueSx}>
                      {field.chip ? (
                        <Chip label={field.value} size="small" color={field.chipColor as any} />
                      ) : (
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{field.value || ''}</Typography>
                      )}
                    </Box>
                  </Box>
                ))}

                {/* Reject Reason Input */}
                {rejectMode && (
                  <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>{t('approval.rejectReason')}</Typography>
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder={t('approval.enterRejectReason')}
                    />
                  </Box>
                )}

                {/* Action Buttons */}
                {selectedItem.status === 'PENDING' && (
                  <Box sx={{ display: 'flex', gap: 1, p: 2, borderTop: 1, borderColor: 'divider', justifyContent: 'flex-end' }}>
                    {!rejectMode ? (
                      <>
                        <Button variant="contained" color="success" onClick={handleApprove} disabled={approveMut.isPending}>
                          {t('approval.approve')}
                        </Button>
                        <Button variant="contained" color="error" onClick={() => { setRejectMode(true); setRejectReason('') }}>
                          {t('approval.reject')}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outlined" onClick={() => setRejectMode(false)}>
                          {t('approval.cancel')}
                        </Button>
                        <Button variant="contained" color="error" onClick={handleReject} disabled={!rejectReason.trim() || rejectMut.isPending}>
                          {t('approval.confirmReject')}
                        </Button>
                      </>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* ============ MIDDLE SECTION: My Drafted ============ */}
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
        {t('approval.myDrafted')}
      </Typography>
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mb: 3 }}>
        {isLoadingDrafted ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
        ) : draftedList.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 0 }}>{t('approval.noData')}</Alert>
        ) : (
          <>
            {/* PC Table */}
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <TableContainer>
                <Table size="small" sx={tableSx}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={headerCellSx} align="center">{t('approval.approvalId')}</TableCell>
                      <TableCell sx={headerCellSx} align="center">{t('approval.type')}</TableCell>
                      <TableCell sx={headerCellSx} align="center">{t('approval.title')}</TableCell>
                      <TableCell sx={headerCellSx} align="center">{t('approval.requestDate')}</TableCell>
                      <TableCell sx={headerCellSx} align="center">{t('approval.status')}</TableCell>
                      <TableCell sx={headerCellSx} align="center">{t('approval.approver')}</TableCell>
                      <TableCell sx={headerCellSx} align="center">{t('approval.approvalDate')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {draftedList.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{row.approvalId}</TableCell>
                        <TableCell align="center">
                          <Chip label={getTypeLabel(row.type)} size="small" color={getTypeChipColor(row.type)} />
                        </TableCell>
                        <TableCell><Typography fontWeight={600} variant="body2">{row.title}</Typography></TableCell>
                        <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{formatDate(row.requestDate)}</TableCell>
                        <TableCell align="center">
                          <Chip label={getStatusLabel(row.status)} size="small" color={getStatusColor(row.status)} />
                        </TableCell>
                        <TableCell align="center">{row.approverName || ''}</TableCell>
                        <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{formatDate(row.approvalDate)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
            {/* Mobile Cards */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, p: 1 }}>
              {draftedList.map((row) => (
                <Paper key={row.id} sx={{ p: 1.5, border: 1, borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography fontWeight="bold" variant="body2">{row.title}</Typography>
                    <Chip label={getStatusLabel(row.status)} size="small" color={getStatusColor(row.status)} />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {getTypeLabel(row.type)} | {formatDate(row.requestDate)} | {row.approverName || ''}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </>
        )}
      </Box>

      {/* ============ BOTTOM SECTION: History ============ */}
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
        {t('approval.approvalHistory')}
      </Typography>
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
        {isLoadingHistory ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
        ) : historyList.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 0 }}>{t('approval.noData')}</Alert>
        ) : (
          <>
            {/* PC Table */}
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <TableContainer>
                <Table size="small" sx={tableSx}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={headerCellSx} align="center">{t('approval.approvalId')}</TableCell>
                      <TableCell sx={headerCellSx} align="center">{t('approval.type')}</TableCell>
                      <TableCell sx={headerCellSx} align="center">{t('approval.title')}</TableCell>
                      <TableCell sx={headerCellSx} align="center">{t('approval.applicant')}/{t('approval.approver')}</TableCell>
                      <TableCell sx={headerCellSx} align="center">{t('approval.approvalDate')}</TableCell>
                      <TableCell sx={headerCellSx} align="center">{t('approval.status')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {historyList.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{row.approvalId}</TableCell>
                        <TableCell align="center">
                          <Chip label={getTypeLabel(row.type)} size="small" color={getTypeChipColor(row.type)} />
                        </TableCell>
                        <TableCell><Typography fontWeight={600} variant="body2">{row.title}</Typography></TableCell>
                        <TableCell align="center">{row.applicantName} / {row.approverName || ''}</TableCell>
                        <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{formatDate(row.approvalDate)}</TableCell>
                        <TableCell align="center">
                          <Chip label={getStatusLabel(row.status)} size="small" color={getStatusColor(row.status)} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
            {/* Mobile Cards */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, p: 1 }}>
              {historyList.map((row) => (
                <Paper key={row.id} sx={{ p: 1.5, border: 1, borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography fontWeight="bold" variant="body2">{row.title}</Typography>
                    <Chip label={getStatusLabel(row.status)} size="small" color={getStatusColor(row.status)} />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {getTypeLabel(row.type)} | {row.applicantName}/{row.approverName || ''} | {formatDate(row.approvalDate)}
                  </Typography>
                </Paper>
              ))}
            </Box>
            {historyTotalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <Pagination count={historyTotalPages} page={historyPage} onChange={(_, p) => setHistoryPage(p)} color="primary" />
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  )
}

export default MyApprovalTab
