import { useState, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, TextField,
  Chip, Pagination, CircularProgress, Alert, LinearProgress,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import IconButton from '@mui/material/IconButton'
import { useAlert } from '../../contexts/AlertContext'
import { auditApi, auditPlanApi } from '../../api/auditApi'
import { fetchSafetyTemplateDetail } from '../../api/safetyChecklistApi'
import { SafetyChecklistTemplate } from '../../types/safetyChecklist.types'
import { Audit } from '../../types/audit.types'
import useCodeMap from '../../hooks/useCodeMap'
import SafetyChecklistTab, { SafetyChecklistTabRef } from './SafetyChecklistTab'

type ViewMode = 'list' | 'detail'

const statusColors: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  PLAN: 'default', PREPARING: 'warning', IN_PROGRESS: 'info', PENDING_CLOSE: 'info', COMPLETED: 'success',
}

const headerCellSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const, textAlign: 'center' as const }
const labelSx = {
  width: 130, minWidth: 130, fontWeight: 'bold', bgcolor: 'grey.100',
  px: 2, py: 1.5, borderRight: 1, borderColor: 'grey.300',
  display: 'flex', alignItems: 'center', fontSize: '0.875rem',
  justifyContent: 'center', textAlign: 'center' as const, wordBreak: 'keep-all' as const,
}
const valSx = { flex: 1, px: 2, py: 1.5, display: 'flex', alignItems: 'center' }
const valBorderSx = { ...valSx, borderRight: 1, borderColor: 'grey.300' }
const rowSx = { display: 'flex', borderBottom: 1, borderColor: 'grey.300' }

const AuditFindingTab: React.FC = () => {
  const { t } = useTranslation()
  const { showSuccess, showError } = useAlert()
  const { getLabel: getAuditStatusLabel } = useCodeMap('AUDIT_STATUS')
  const { getLabel: getAuditTypeLabel } = useCodeMap('AUDIT_TYPE')

  const checklistRef = useRef<SafetyChecklistTabRef>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<Audit | null>(null)
  const [page, setPage] = useState(0)
  const [searchText, setSearchText] = useState('')
  const pageSize = 10

  // 전체 감사 실시 목록 조회
  const { data, isLoading } = useQuery({
    queryKey: ['auditExecFindings', page],
    queryFn: () => auditApi.getAll(page, pageSize),
    enabled: viewMode === 'list',
  })

  // findingCount > 0인 항목만 필터링
  let items = (data?.content || []).filter(i => i.findingCount > 0)

  if (searchText) {
    const s = searchText.toLowerCase()
    items = items.filter(i =>
      i.auditName.toLowerCase().includes(s) ||
      i.auditId?.toLowerCase().includes(s) ||
      i.targetDept?.toLowerCase().includes(s)
    )
  }

  // 상세 - 연결된 체크리스트
  const { data: linkedPlan } = useQuery({
    queryKey: ['auditPlanForFinding', selectedItem?.planId],
    queryFn: () => auditPlanApi.getById(selectedItem!.planId!),
    enabled: !!selectedItem?.planId && viewMode === 'detail',
  })
  const checklistTemplateId = linkedPlan?.checklistTemplateId

  const handleBackToList = () => { setViewMode('list'); setSelectedItem(null) }
  const handleRowClick = (item: Audit) => { setSelectedItem(item); setViewMode('detail') }
  const handleSave = async () => {
    if (checklistRef.current) {
      await checklistRef.current.save()
      try {
        const updated = await auditApi.getById(selectedItem!.id)
        setSelectedItem(updated)
        showSuccess(t('common.saved'))
      } catch { showError(t('common.error')) }
    }
  }

  // ==================== DETAIL ====================
  if (viewMode === 'detail' && selectedItem) {
    const progress = selectedItem.totalChecklist > 0 ? Math.round((selectedItem.completedChecklist / selectedItem.totalChecklist) * 100) : 0
    return (
      <Box>
        <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden', mb: 3 }}>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('audit.auditId')}</Typography>
            <Box sx={valBorderSx}><Typography variant="body2" fontFamily="monospace">{selectedItem.auditId}</Typography></Box>
            <Typography sx={labelSx}>{t('audit.auditName')}</Typography>
            <Box sx={valSx}><Typography variant="body2" fontWeight={600}>{selectedItem.auditName}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('audit.auditType')}</Typography>
            <Box sx={valBorderSx}><Typography variant="body2">{getAuditTypeLabel(selectedItem.auditType)}</Typography></Box>
            <Typography sx={labelSx}>{t('audit.targetDept')}</Typography>
            <Box sx={valSx}><Typography variant="body2">{selectedItem.targetDept || ''}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('audit.checklistProgress')}</Typography>
            <Box sx={valBorderSx}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <LinearProgress variant="determinate" value={progress} sx={{ flex: 1, height: 8, borderRadius: 4 }} />
                <Typography variant="body2" fontWeight="bold">{selectedItem.completedChecklist}/{selectedItem.totalChecklist}</Typography>
              </Box>
            </Box>
            <Typography sx={labelSx}>{t('audit.findingCount')}</Typography>
            <Box sx={valSx}><Typography variant="body2">{selectedItem.findingCount}</Typography></Box>
          </Box>
          <Box sx={{ display: 'flex' }}>
            <Typography sx={labelSx}>{t('common.status')}</Typography>
            <Box sx={valSx}><Chip label={getAuditStatusLabel(selectedItem.status)} color={statusColors[selectedItem.status]} size="small" /></Box>
          </Box>
        </Box>

        {/* Mobile */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 3 }}>
          {[
            [t('audit.auditId'), selectedItem.auditId],
            [t('audit.auditName'), selectedItem.auditName],
            [t('audit.auditType'), getAuditTypeLabel(selectedItem.auditType)],
            [t('audit.targetDept'), selectedItem.targetDept],
            [t('audit.findingCount'), String(selectedItem.findingCount)],
            [t('common.status'), getAuditStatusLabel(selectedItem.status)],
          ].filter(([, v]) => v).map(([label, value], i) => (
            <Box key={i}>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{label}</Typography>
              <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{value}</Typography>
            </Box>
          ))}
        </Box>

        {/* 체크리스트 */}
        {checklistTemplateId && (
          <Box sx={{ mb: 3 }}>
            <SafetyChecklistTab ref={checklistRef} templateId={checklistTemplateId} embedded showSummary hideSignatures />
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.list')}</Button>
          <Button variant="contained" onClick={handleSave} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.save')}</Button>
        </Box>
      </Box>
    )
  }

  // ==================== LIST ====================
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField size="small" placeholder={t('audit.searchPlaceholder')} value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{ minWidth: 200 }} />
          <IconButton onClick={() => setSearchText('')} size="small"><RefreshIcon /></IconButton>
        </Box>
      </Box>
      {/* Mobile search */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, mb: 2 }}>
        <TextField size="small" fullWidth placeholder={t('audit.searchPlaceholder')} value={searchText}
          onChange={(e) => setSearchText(e.target.value)} />
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : items.length === 0 ? (
        <Alert severity="success" sx={{ m: 2 }}>{t('audit.noFindings', '부적합 사항이 없습니다.')}</Alert>
      ) : (
        <>
          <Paper sx={{ display: { xs: 'none', md: 'block' } }}>
            <TableContainer>
              <Table size="small" stickyHeader sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'grey.300' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={headerCellSx}>{t('audit.auditId')}</TableCell>
                    <TableCell sx={headerCellSx}>{t('audit.auditName')}</TableCell>
                    <TableCell sx={headerCellSx}>{t('audit.targetDept')}</TableCell>
                    <TableCell sx={headerCellSx}>{t('audit.findingCount')}</TableCell>
                    <TableCell sx={headerCellSx}>{t('audit.checklistProgress')}</TableCell>
                    <TableCell sx={headerCellSx} align="center">{t('common.status')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => {
                    const prog = item.totalChecklist > 0 ? Math.round((item.completedChecklist / item.totalChecklist) * 100) : 0
                    return (
                      <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                        <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{item.auditId}</TableCell>
                        <TableCell><Typography fontWeight={600} variant="body2">{item.auditName}</Typography></TableCell>
                        <TableCell align="center">{item.targetDept || ''}</TableCell>
                        <TableCell align="center"><Typography variant="body2">{item.findingCount}</Typography></TableCell>
                        <TableCell align="center" sx={{ minWidth: 150 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress variant="determinate" value={prog} sx={{ flex: 1, height: 6, borderRadius: 3 }} />
                            <Typography variant="caption" fontWeight="bold">{item.completedChecklist}/{item.totalChecklist}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={getAuditStatusLabel(item.status)} color={statusColors[item.status]} size="small" />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
          {/* Mobile */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
            {items.map((item) => (
              <Paper key={item.id} sx={{ p: 2, border: 1, borderColor: 'grey.300', cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography fontWeight="bold">{item.auditName}</Typography>
                  <Typography variant="body2">{item.findingCount}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {item.targetDept || ''} | {getAuditStatusLabel(item.status)}
                </Typography>
              </Paper>
            ))}
          </Box>
        </>
      )}
    </Box>
  )
}

export default AuditFindingTab
