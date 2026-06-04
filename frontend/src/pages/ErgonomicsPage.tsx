import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, TextField, Select, MenuItem,
  FormControl, Chip, Pagination, CircularProgress, Alert, IconButton,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import DatePickerField from '../components/common/DatePickerField'
import { todayStr } from '../utils/dateDefaults'
import NumberField from '../components/common/NumberField'
import UserSelectModal, { UserInfo } from '../components/common/UserSelectModal'
import { useAlert } from '../contexts/AlertContext'
import { ergonomicsApi } from '../api/ergonomicsApi'
import { ErgonomicsAssessment, ErgonomicsAssessmentRequest } from '../types/ergonomics.types'
import useCodeMap from '../hooks/useCodeMap'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const RISK_COLORS: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  NEGLIGIBLE: 'default', LOW: 'success', MEDIUM: 'warning', HIGH: 'error', VERY_HIGH: 'error',
}
const IMPROVE_COLORS: Record<string, 'default' | 'warning' | 'info' | 'success'> = {
  PENDING: 'warning', IN_PROGRESS: 'info', COMPLETED: 'success',
}

// Style constants
const labelSx = {
  width: 120, minWidth: 120, fontWeight: 'bold', bgcolor: 'grey.100',
  px: 2, py: 1.5, borderRight: 1, borderColor: 'grey.300',
  display: 'flex', alignItems: 'center', fontSize: '0.875rem',
  justifyContent: 'center', wordBreak: 'keep-all' as const, textAlign: 'center',
}
const valSx = { flex: 1, px: 2, py: 1, bgcolor: 'background.paper', display: 'flex', alignItems: 'center' }
const valBorderSx = { ...valSx, borderRight: 1, borderColor: 'grey.300' }
const hSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }

const ErgonomicsPage: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()
  const { codeList: assessTypes, getLabel: getAssessTypeLabel } = useCodeMap('ERGO_ASSESS_TYPE')
  const { codeList: riskLevels, getLabel: getRiskLabel } = useCodeMap('ERGO_RISK_LEVEL')
  const { codeList: bodyParts, getLabel: getBodyPartLabel } = useCodeMap('BODY_PART')

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<ErgonomicsAssessment | null>(null)

  // List filters
  const [page, setPage] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [riskFilter, setRiskFilter] = useState('')

  // Form state
  const [form, setForm] = useState<ErgonomicsAssessmentRequest>({ assessType: '', workProcess: '', assessDate: '' })
  const [workerModalOpen, setWorkerModalOpen] = useState(false)
  const [assessorModalOpen, setAssessorModalOpen] = useState(false)

  const queryKey = searchText ? ['ergoSearch', searchText, page] : riskFilter ? ['ergoRisk', riskFilter, page] : ['ergo', page]
  const queryFn = () => {
    if (searchText) return ergonomicsApi.search(searchText, page, 10)
    if (riskFilter) return ergonomicsApi.getByRisk(riskFilter, page, 10)
    return ergonomicsApi.getAll(page, 10)
  }
  const { data, isLoading } = useQuery({ queryKey, queryFn, enabled: viewMode === 'list' })

  const createMut = useMutation({
    mutationFn: (r: ErgonomicsAssessmentRequest) => ergonomicsApi.create(r),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ergo'] })
      queryClient.invalidateQueries({ queryKey: ['ergoSearch'] })
      queryClient.invalidateQueries({ queryKey: ['ergoRisk'] })
      showSuccess(t('common.saved'))
      handleBackToList()
    },
    onError: () => showError(t('common.error')),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, r }: { id: number; r: ErgonomicsAssessmentRequest }) => ergonomicsApi.update(id, r),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ergo'] })
      queryClient.invalidateQueries({ queryKey: ['ergoSearch'] })
      queryClient.invalidateQueries({ queryKey: ['ergoRisk'] })
      showSuccess(t('common.saved'))
      handleBackToList()
    },
    onError: () => showError(t('common.error')),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => ergonomicsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ergo'] })
      queryClient.invalidateQueries({ queryKey: ['ergoSearch'] })
      queryClient.invalidateQueries({ queryKey: ['ergoRisk'] })
      showSuccess(t('common.deleted'))
      handleBackToList()
    },
    onError: () => showError(t('common.error')),
  })

  // Handlers
  const handleBackToList = () => {
    setViewMode('list')
    setSelectedItem(null)
    setForm({ assessType: '', workProcess: '', assessDate: '' })
  }

  const handleRowClick = (item: ErgonomicsAssessment) => {
    setSelectedItem(item)
    setViewMode('detail')
  }

  const handleOpenCreate = () => {
    setSelectedItem(null)
    setForm({ assessType: '', workProcess: '', assessDate: todayStr(), improvementDeadline: todayStr() })
    setViewMode('create')
  }

  const handleOpenEdit = (item: ErgonomicsAssessment) => {
    setSelectedItem(item)
    setForm({
      assessType: item.assessType,
      department: item.department,
      workProcess: item.workProcess,
      workDescription: item.workDescription,
      workerName: item.workerName,
      assessDate: item.assessDate,
      assessorName: item.assessorName,
      score: item.score,
      riskLevel: item.riskLevel,
      affectedBodyParts: item.affectedBodyParts,
      symptoms: item.symptoms,
      improvementAction: item.improvementAction,
      improvementDeadline: item.improvementDeadline,
      improvementStatus: item.improvementStatus,
      notes: item.notes,
    })
    setViewMode('edit')
  }

  const handleSave = () => {
    if (selectedItem) {
      updateMut.mutate({ id: selectedItem.id, r: form })
    } else {
      createMut.mutate(form)
    }
  }

  const handleDelete = async (item: ErgonomicsAssessment) => {
    const ok = await showConfirm(`${item.workProcess}\n${t('common.delete')}하시겠습니까?`)
    if (ok) deleteMut.mutate(item.id)
  }

  const handleWorkerSelect = (users: UserInfo[]) => {
    if (users.length > 0) {
      const u = users[0]
      setForm({ ...form, workerName: u.name, department: u.department || '' })
    }
    setWorkerModalOpen(false)
  }

  const handleAssessorSelect = (users: UserInfo[]) => {
    if (users.length > 0) {
      const u = users[0]
      setForm({ ...form, assessorName: u.name })
    }
    setAssessorModalOpen(false)
  }

  const handleReset = () => {
    setSearchText('')
    setRiskFilter('')
    setPage(0)
  }

  const items = data?.content || []
  const totalPages = data?.totalPages || 0

  // ===== List View =====
  const renderListView = () => (
    <>
      {/* Search / Filter bar - PC */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder={t('ergo.searchPlaceholder')}
            value={searchText}
            onChange={(e) => { setSearchText(e.target.value); setPage(0); setRiskFilter('') }}
            onKeyDown={(e) => { if (e.key === 'Enter') setPage(0) }}
            sx={{ minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select displayEmpty value={riskFilter} onChange={(e) => { setRiskFilter(e.target.value); setPage(0); setSearchText('') }}>
              <MenuItem value="">{t('ergo.allRisk')}</MenuItem>
              {riskLevels.map((c) => <MenuItem key={c.code} value={c.code}>{getRiskLabel(c.code)}</MenuItem>)}
            </Select>
          </FormControl>
          <IconButton onClick={handleReset} size="small"><RefreshIcon /></IconButton>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          New
        </Button>
      </Box>

      {/* Search / Filter bar - Mobile */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            placeholder={t('ergo.searchPlaceholder')}
            value={searchText}
            onChange={(e) => { setSearchText(e.target.value); setPage(0); setRiskFilter('') }}
            fullWidth
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <FormControl size="small" sx={{ flex: 1 }}>
            <Select displayEmpty value={riskFilter} onChange={(e) => { setRiskFilter(e.target.value); setPage(0); setSearchText('') }}>
              <MenuItem value="">{t('ergo.allRisk')}</MenuItem>
              {riskLevels.map((c) => <MenuItem key={c.code} value={c.code}>{getRiskLabel(c.code)}</MenuItem>)}
            </Select>
          </FormControl>
          <Button variant="outlined" size="small" onClick={handleReset} startIcon={<RefreshIcon />} sx={{ flex: 1 }}>
            {t('common.reset') || '초기화'}
          </Button>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate} sx={{ flex: 1 }}>
            New
          </Button>
        </Box>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : items.length === 0 ? (
        <Alert severity="info" sx={{ m: 2 }}>{t('common.noData')}</Alert>
      ) : (
        <>
          {/* PC Table */}
          <Paper sx={{ display: { xs: 'none', md: 'block' } }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={hSx}>{t('ergo.assessId')}</TableCell>
                    <TableCell sx={hSx}>{t('ergo.assessType')}</TableCell>
                    <TableCell sx={hSx}>{t('ergo.workProcess')}</TableCell>
                    <TableCell sx={hSx}>{t('ergo.worker')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('ergo.score')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('ergo.riskLevel')}</TableCell>
                    <TableCell sx={hSx}>{t('ergo.bodyParts')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('ergo.improveStatus')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                      <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{item.assessmentId}</TableCell>
                      <TableCell>{getAssessTypeLabel(item.assessType)}</TableCell>
                      <TableCell><Typography variant="body2" fontWeight={600}>{item.workProcess}</Typography></TableCell>
                      <TableCell align="center">{item.workerName || ''}</TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace', fontWeight: 'bold', color: (item.score || 0) >= 8 ? 'error.main' : (item.score || 0) >= 4 ? 'warning.main' : 'success.main' }}>{item.score || ''}</TableCell>
                      <TableCell align="center"><Chip label={getRiskLabel(item.riskLevel || '')} color={RISK_COLORS[item.riskLevel || ''] || 'default'} size="small" /></TableCell>
                      <TableCell sx={{ maxWidth: 150 }}>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {(item.affectedBodyParts || '').split(',').filter(Boolean).map((p) => <Chip key={p} label={getBodyPartLabel(p.trim())} size="small" variant="outlined" />)}
                        </Box>
                      </TableCell>
                      <TableCell align="center"><Chip label={t(`ergo.${item.improvementStatus?.toLowerCase() || 'pending'}`)} color={IMPROVE_COLORS[item.improvementStatus || 'PENDING'] || 'default'} size="small" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Mobile Card List */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
            {items.map((item) => (
              <Paper key={item.id} sx={{ p: 2, border: 1, borderColor: 'grey.300', cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography fontWeight="bold">{item.workProcess}</Typography>
                  <Chip label={getRiskLabel(item.riskLevel || '')} color={RISK_COLORS[item.riskLevel || ''] || 'default'} size="small" />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {getAssessTypeLabel(item.assessType)} | {item.workerName || ''} | {t('ergo.score')}: {item.score || ''}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                  <Chip label={t(`ergo.${item.improvementStatus?.toLowerCase() || 'pending'}`)} color={IMPROVE_COLORS[item.improvementStatus || 'PENDING'] || 'default'} size="small" />
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

  // ===== Detail View =====
  const renderDetailView = () => {
    if (!selectedItem) return null

    // 2열 배치: [라벨1, 값1, 라벨2, 값2] 또는 전체폭 [라벨, 값]
    const dLabelSx = { ...labelSx, width: 140, minWidth: 140 }
    const dValSx = { flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper' }
    const dValBorderSx = { ...dValSx, borderRight: 1, borderColor: 'grey.300' }
    const rowSx = { display: 'flex', borderBottom: 1, borderColor: 'grey.300' }

    return (
      <>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>{t('nav.ergonomics')}</Typography>

        <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
        {/* PC: 2열 배치 */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden' }}>
          <Box sx={rowSx}>
            <Typography sx={dLabelSx}>{t('ergo.assessId')}</Typography>
            <Box sx={dValBorderSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.assessmentId}</Typography></Box>
            <Typography sx={dLabelSx}>{t('ergo.assessType')}</Typography>
            <Box sx={dValSx}><Typography variant="body2" sx={{ py: 0.5 }}>{getAssessTypeLabel(selectedItem.assessType)}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={dLabelSx}>{t('ergo.workProcess')}</Typography>
            <Box sx={dValBorderSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.workProcess}</Typography></Box>
            <Typography sx={dLabelSx}>{t('ergo.assessDate')}</Typography>
            <Box sx={dValSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.assessDate}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={dLabelSx}>{t('ergo.worker')}</Typography>
            <Box sx={dValBorderSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.workerName || ''} ({selectedItem.department || ''})</Typography></Box>
            <Typography sx={dLabelSx}>{t('ergo.assessor')}</Typography>
            <Box sx={dValSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.assessorName || ''}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={dLabelSx}>{t('ergo.score')}</Typography>
            <Box sx={dValBorderSx}><Typography variant="body2" sx={{ py: 0.5, fontWeight: 'bold', color: (selectedItem.score || 0) >= 8 ? 'error.main' : (selectedItem.score || 0) >= 4 ? 'warning.main' : 'success.main' }}>{selectedItem.score || ''}</Typography></Box>
            <Typography sx={dLabelSx}>{t('ergo.riskLevel')}</Typography>
            <Box sx={dValSx}><Typography variant="body2" sx={{ py: 0.5 }}>{getRiskLabel(selectedItem.riskLevel || '')}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={dLabelSx}>{t('ergo.deadline')}</Typography>
            <Box sx={dValBorderSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.improvementDeadline || ''}</Typography></Box>
            <Typography sx={dLabelSx}>{t('ergo.improveStatus')}</Typography>
            <Box sx={dValSx}><Typography variant="body2" sx={{ py: 0.5 }}>{t(`ergo.${selectedItem.improvementStatus?.toLowerCase() || 'pending'}`)}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={dLabelSx}>{t('ergo.bodyParts')}</Typography>
            <Box sx={dValSx}><Typography variant="body2" sx={{ py: 0.5 }}>{(selectedItem.affectedBodyParts || '').split(',').map(p => getBodyPartLabel(p.trim())).join(', ') || ''}</Typography></Box>
          </Box>
          {selectedItem.workDescription && <Box sx={rowSx}>
            <Typography sx={dLabelSx}>{t('ergo.description')}</Typography>
            <Box sx={dValSx}><Typography variant="body2" sx={{ py: 0.5, whiteSpace: 'pre-wrap' }}>{selectedItem.workDescription}</Typography></Box>
          </Box>}
          {selectedItem.symptoms && <Box sx={rowSx}>
            <Typography sx={dLabelSx}>{t('ergo.symptoms')}</Typography>
            <Box sx={dValSx}><Typography variant="body2" sx={{ py: 0.5, whiteSpace: 'pre-wrap' }}>{selectedItem.symptoms}</Typography></Box>
          </Box>}
          {selectedItem.improvementAction && <Box sx={rowSx}>
            <Typography sx={dLabelSx}>{t('ergo.improvementAction')}</Typography>
            <Box sx={dValSx}><Typography variant="body2" sx={{ py: 0.5, whiteSpace: 'pre-wrap' }}>{selectedItem.improvementAction}</Typography></Box>
          </Box>}
          {selectedItem.notes && <Box sx={{ display: 'flex' }}>
            <Typography sx={dLabelSx}>{t('common.notes')}</Typography>
            <Box sx={dValSx}><Typography variant="body2" sx={{ py: 0.5, whiteSpace: 'pre-wrap' }}>{selectedItem.notes}</Typography></Box>
          </Box>}
        </Box>

        {/* Mobile: 1열 배치 */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 2 }}>
          {[
            [t('ergo.assessId'), selectedItem.assessmentId],
            [t('ergo.assessType'), getAssessTypeLabel(selectedItem.assessType)],
            [t('ergo.workProcess'), selectedItem.workProcess],
            [t('ergo.assessDate'), selectedItem.assessDate],
            [t('ergo.worker'), `${selectedItem.workerName || ''} (${selectedItem.department || ''})`],
            [t('ergo.assessor'), selectedItem.assessorName],
            [t('ergo.score'), selectedItem.score?.toString()],
            [t('ergo.riskLevel'), getRiskLabel(selectedItem.riskLevel || '')],
            [t('ergo.deadline'), selectedItem.improvementDeadline],
            [t('ergo.improveStatus'), t(`ergo.${selectedItem.improvementStatus?.toLowerCase() || 'pending'}`)],
            [t('ergo.bodyParts'), (selectedItem.affectedBodyParts || '').split(',').map(p => getBodyPartLabel(p.trim())).join(', ')],
            [t('ergo.description'), selectedItem.workDescription],
            [t('ergo.symptoms'), selectedItem.symptoms],
            [t('ergo.improvementAction'), selectedItem.improvementAction],
            [t('common.notes'), selectedItem.notes],
          ].filter(([, v]) => v).map(([label, value], i) => (
            <Box key={i}>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{label}</Typography>
              <Typography variant="body2" sx={{ px: 1.5, py: 0.5, whiteSpace: 'pre-wrap' }}>{value}</Typography>
            </Box>
          ))}
        </Box>
        </Paper>

        <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.list')}</Button>
          <Button variant="contained" onClick={() => handleOpenEdit(selectedItem)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.edit')}</Button>
          <Button variant="contained" color="error" onClick={() => handleDelete(selectedItem)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.delete')}</Button>
        </Box>
      </>
    )
  }

  // ===== Create / Edit Form View =====
  const renderFormView = () => (
    <>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
        {t('nav.ergonomics')}
      </Typography>

      {/* PC form - table-style layout */}
      <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
          <Typography sx={labelSx}>{t('ergo.assessType')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
          <Box sx={valBorderSx}>
            <Select fullWidth size="small" displayEmpty value={form.assessType} onChange={(e) => setForm({ ...form, assessType: e.target.value })}>
              <MenuItem value="" disabled>{t('ergo.selectType')}</MenuItem>
              {assessTypes.map((c) => <MenuItem key={c.code} value={c.code}>{getAssessTypeLabel(c.code)}</MenuItem>)}
            </Select>
          </Box>
          <Typography sx={labelSx}>{t('ergo.assessDate')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
          <Box sx={valSx}>
            <DatePickerField value={form.assessDate || null} onChange={(v) => setForm({ ...form, assessDate: v })} size="small" />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
          <Typography sx={labelSx}>{t('ergo.workProcess')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
          <Box sx={valSx}>
            <TextField fullWidth size="small" value={form.workProcess} onChange={(e) => setForm({ ...form, workProcess: e.target.value })} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
          <Typography sx={labelSx}>{t('ergo.description')}</Typography>
          <Box sx={valSx}>
            <TextField fullWidth size="small" multiline rows={2} value={form.workDescription || ''} onChange={(e) => setForm({ ...form, workDescription: e.target.value })} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
          <Typography sx={labelSx}>{t('ergo.worker')}</Typography>
          <Box sx={{ ...valBorderSx, display: 'flex', alignItems: 'center' }}>
            <TextField fullWidth size="small" value={form.workerName || ''} InputProps={{ readOnly: true }} placeholder={t('ergo.worker')} />
            <Button variant="outlined" size="small" sx={{ ml: 1, minWidth: 40 }} onClick={() => setWorkerModalOpen(true)}><PersonSearchIcon fontSize="small" /></Button>
          </Box>
          <Typography sx={labelSx}>{t('ppe.department')}</Typography>
          <Box sx={valSx}>
            <TextField fullWidth size="small" value={form.department || ''} InputProps={{ readOnly: true }} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
          <Typography sx={labelSx}>{t('ergo.assessor')}</Typography>
          <Box sx={{ ...valSx, display: 'flex', alignItems: 'center' }}>
            <TextField fullWidth size="small" value={form.assessorName || ''} InputProps={{ readOnly: true }} placeholder={t('ergo.assessor')} />
            <Button variant="outlined" size="small" sx={{ ml: 1, minWidth: 40 }} onClick={() => setAssessorModalOpen(true)}><PersonSearchIcon fontSize="small" /></Button>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
          <Typography sx={labelSx}>{t('ergo.score')}</Typography>
          <Box sx={valBorderSx}>
            <NumberField fullWidth size="small" value={form.score || ''} onChange={(v) => setForm({ ...form, score: v ?? 0 })} />
          </Box>
          <Typography sx={labelSx}>{t('ergo.riskLevel')}</Typography>
          <Box sx={valSx}>
            <Select fullWidth size="small" displayEmpty value={form.riskLevel || ''} onChange={(e) => setForm({ ...form, riskLevel: e.target.value })}>
              <MenuItem value="">{t('ergo.selectRisk')}</MenuItem>
              {riskLevels.map((c) => <MenuItem key={c.code} value={c.code}>{getRiskLabel(c.code)}</MenuItem>)}
            </Select>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
          <Typography sx={labelSx}>{t('ergo.bodyParts')}</Typography>
          <Box sx={valSx}>
            <TextField fullWidth size="small" placeholder="SHOULDER,LOWER_BACK" value={form.affectedBodyParts || ''} onChange={(e) => setForm({ ...form, affectedBodyParts: e.target.value })} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
          <Typography sx={labelSx}>{t('ergo.symptoms')}</Typography>
          <Box sx={valSx}>
            <TextField fullWidth size="small" multiline rows={2} value={form.symptoms || ''} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
          <Typography sx={labelSx}>{t('ergo.improvementAction')}</Typography>
          <Box sx={valSx}>
            <TextField fullWidth size="small" multiline rows={2} value={form.improvementAction || ''} onChange={(e) => setForm({ ...form, improvementAction: e.target.value })} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
          <Typography sx={labelSx}>{t('ppe.notes')}</Typography>
          <Box sx={valSx}>
            <TextField fullWidth size="small" multiline rows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex' }}>
          <Typography sx={labelSx}>{t('ergo.deadline')}</Typography>
          <Box sx={valBorderSx}>
            <DatePickerField value={form.improvementDeadline || null} onChange={(v) => setForm({ ...form, improvementDeadline: v })} size="small" />
          </Box>
          <Typography sx={labelSx}>{t('ergo.improveStatus')}</Typography>
          <Box sx={valSx}>
            <Select fullWidth size="small" value={form.improvementStatus || 'PENDING'} onChange={(e) => setForm({ ...form, improvementStatus: e.target.value })} displayEmpty>
              <MenuItem value="" disabled>선택</MenuItem>
              <MenuItem value="PENDING">{t('ergo.pending')}</MenuItem>
              <MenuItem value="IN_PROGRESS">{t('ergo.in_progress')}</MenuItem>
              <MenuItem value="COMPLETED">{t('ergo.completed')}</MenuItem>
            </Select>
          </Box>
        </Box>
      </Box>

      {/* Mobile form */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 2 }}>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
            {t('ergo.assessType')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
          </Typography>
          <FormControl fullWidth size="small">
            <Select displayEmpty value={form.assessType} onChange={(e) => setForm({ ...form, assessType: e.target.value })}>
              <MenuItem value="" disabled>{t('ergo.selectType')}</MenuItem>
              {assessTypes.map((c) => <MenuItem key={c.code} value={c.code}>{getAssessTypeLabel(c.code)}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
            {t('ergo.assessDate')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
          </Typography>
          <DatePickerField value={form.assessDate || null} onChange={(v) => setForm({ ...form, assessDate: v })} size="small" />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
            {t('ergo.workProcess')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
          </Typography>
          <TextField size="small" fullWidth value={form.workProcess} onChange={(e) => setForm({ ...form, workProcess: e.target.value })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
            {t('ergo.worker')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField size="small" fullWidth value={form.workerName || ''} InputProps={{ readOnly: true }} placeholder={t('ergo.worker')} />
            <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setWorkerModalOpen(true)}><PersonSearchIcon fontSize="small" /></Button>
          </Box>
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
            {t('ppe.department')}
          </Typography>
          <TextField size="small" fullWidth value={form.department || ''} InputProps={{ readOnly: true }} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
            {t('ergo.assessor')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField size="small" fullWidth value={form.assessorName || ''} InputProps={{ readOnly: true }} placeholder={t('ergo.assessor')} />
            <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setAssessorModalOpen(true)}><PersonSearchIcon fontSize="small" /></Button>
          </Box>
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
            {t('ergo.description')}
          </Typography>
          <TextField size="small" fullWidth multiline rows={2} value={form.workDescription || ''} onChange={(e) => setForm({ ...form, workDescription: e.target.value })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
            {t('ergo.score')}
          </Typography>
          <NumberField size="small" fullWidth value={form.score || ''} onChange={(v) => setForm({ ...form, score: v ?? 0 })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
            {t('ergo.riskLevel')}
          </Typography>
          <FormControl fullWidth size="small">
            <Select displayEmpty value={form.riskLevel || ''} onChange={(e) => setForm({ ...form, riskLevel: e.target.value })}>
              <MenuItem value="">{t('ergo.selectRisk')}</MenuItem>
              {riskLevels.map((c) => <MenuItem key={c.code} value={c.code}>{getRiskLabel(c.code)}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
            {t('ergo.bodyParts')}
          </Typography>
          <TextField size="small" fullWidth placeholder="SHOULDER,LOWER_BACK" value={form.affectedBodyParts || ''} onChange={(e) => setForm({ ...form, affectedBodyParts: e.target.value })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
            {t('ergo.symptoms')}
          </Typography>
          <TextField size="small" fullWidth multiline rows={2} value={form.symptoms || ''} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
            {t('ergo.improvementAction')}
          </Typography>
          <TextField size="small" fullWidth multiline rows={2} value={form.improvementAction || ''} onChange={(e) => setForm({ ...form, improvementAction: e.target.value })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
            {t('ppe.notes')}
          </Typography>
          <TextField size="small" fullWidth multiline rows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
            {t('ergo.deadline')}
          </Typography>
          <DatePickerField value={form.improvementDeadline || null} onChange={(v) => setForm({ ...form, improvementDeadline: v })} size="small" />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
            {t('ergo.improveStatus')}
          </Typography>
          <FormControl fullWidth size="small">
            <Select value={form.improvementStatus || 'PENDING'} onChange={(e) => setForm({ ...form, improvementStatus: e.target.value })} displayEmpty>
              <MenuItem value="" disabled>선택</MenuItem>
              <MenuItem value="PENDING">{t('ergo.pending')}</MenuItem>
              <MenuItem value="IN_PROGRESS">{t('ergo.in_progress')}</MenuItem>
              <MenuItem value="COMPLETED">{t('ergo.completed')}</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Action buttons */}
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={() => viewMode === 'edit' ? setViewMode('detail') : handleBackToList()} sx={{ flex: { xs: 1, md: 0 } }}>{t('common.cancel')}</Button>
        <Button variant="contained" onClick={handleSave} sx={{ flex: { xs: 1, md: 0 } }}>{t('common.save')}</Button>
      </Box>
    </>
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>

      {/* Page title for list view */}
      {viewMode === 'list' && (
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>{t('nav.ergonomics')}</Typography>
      )}

      {/* View mode routing */}
      {viewMode === 'list' && renderListView()}
      {viewMode === 'detail' && renderDetailView()}
      {(viewMode === 'create' || viewMode === 'edit') && renderFormView()}
      <UserSelectModal open={workerModalOpen} onClose={() => setWorkerModalOpen(false)} selectedUsers={[]} onConfirm={handleWorkerSelect} singleSelect useCompanyTree title={t('ergo.worker')} />
      <UserSelectModal open={assessorModalOpen} onClose={() => setAssessorModalOpen(false)} selectedUsers={[]} onConfirm={handleAssessorSelect} singleSelect useCompanyTree title={t('ergo.assessor')} />
    </Box>
  )
}

export default ErgonomicsPage
