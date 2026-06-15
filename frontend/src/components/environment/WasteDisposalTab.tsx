import { formatDate } from '../../utils/dateDefaults'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Paper, Typography, Button, TextField, Select, MenuItem,
  SelectChangeEvent, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material'
import { wasteManageApi, disposalCompanyApi } from '../../api/environmentApi'
import { useCodeMap } from '../../hooks/useCodeMap'
import { useAlert } from '../../contexts/AlertContext'
import { useThemeMode } from '../../context/ThemeContext'
import DatePickerField from '../../components/common/DatePickerField'
import { WasteManage } from '../../types/environment.types'

type WasteStatus = 'STORING' | 'DISPOSAL_REQUEST' | 'PROCESSING' | 'COMPLETED'

const STATUS_COLUMNS: WasteStatus[] = ['STORING', 'DISPOSAL_REQUEST', 'PROCESSING', 'COMPLETED']

const STATUS_COLORS: Record<WasteStatus, string> = {
  STORING: '#2196f3',
  DISPOSAL_REQUEST: '#ff9800',
  PROCESSING: '#00bcd4',
  COMPLETED: '#4caf50',
}

const WasteDisposalTab: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccess } = useAlert()
  const { isDarkMode } = useThemeMode()
  const { getLabel: getStatusLabel } = useCodeMap('WASTE_STATUS')
  const { getLabel: getWasteTypeLabel } = useCodeMap('WASTE_TYPE')
  const { getLabel: getUnitLabel } = useCodeMap('WASTE_UNIT')
  const { getLabel: getDepartmentLabel } = useCodeMap('WASTE_DEPARTMENT')

  // Disposal request form state
  const [selectedWasteId, setSelectedWasteId] = useState<string>('')
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [disposalDate, setDisposalDate] = useState<string>('')
  const [vehicleNumber, setVehicleNumber] = useState<string>('')
  const [disposalNotes, setDisposalNotes] = useState<string>('')

  // Detail dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCard, setSelectedCard] = useState<WasteManage | null>(null)

  // Queries
  const { data: wasteData } = useQuery({
    queryKey: ['wasteManageDisposal'],
    queryFn: () => wasteManageApi.findAll(0, 200),
  })

  const { data: companies } = useQuery({
    queryKey: ['disposalCompaniesActive'],
    queryFn: () => disposalCompanyApi.findAllActive(),
  })

  // Mutations
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => wasteManageApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wasteManageDisposal'] })
      showSuccess(t('common.saveSuccess'))
      setDialogOpen(false)
      setSelectedCard(null)
    },
  })

  const allWastes: WasteManage[] = wasteData?.content || []

  const getWastesByStatus = (status: WasteStatus): WasteManage[] =>
    allWastes.filter((w) => w.status === status)

  const storingWastes = getWastesByStatus('STORING')

  // Handle disposal request submit
  const handleDisposalRequest = () => {
    if (!selectedWasteId) return
    statusMutation.mutate({ id: Number(selectedWasteId), status: 'DISPOSAL_REQUEST' })
    setSelectedWasteId('')
    setSelectedCompanyId('')
    setDisposalDate('')
    setVehicleNumber('')
    setDisposalNotes('')
  }

  // Handle card click
  const handleCardClick = (waste: WasteManage) => {
    setSelectedCard(waste)
    setDialogOpen(true)
  }

  // Get next status
  const getNextStatus = (current?: string): WasteStatus | null => {
    switch (current) {
      case 'STORING': return 'DISPOSAL_REQUEST'
      case 'DISPOSAL_REQUEST': return 'PROCESSING'
      case 'PROCESSING': return 'COMPLETED'
      default: return null
    }
  }

  const handleStatusChange = (id: number, nextStatus: WasteStatus) => {
    statusMutation.mutate({ id, status: nextStatus })
  }

  const paperBg = isDarkMode ? '#18181b' : 'background.paper'

  const borderColorSx = (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider'
  const formLabelSx = { width: 120, minWidth: 120, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: borderColorSx, display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all' as const }
  const formValSx = { flex: 1, px: 2, py: 1, display: 'flex', alignItems: 'center' }
  const formValBorderSx = { ...formValSx, borderRight: 1, borderColor: borderColorSx }
  const formRowSx = { display: 'flex', borderBottom: 1, borderColor: borderColorSx }

  return (
    <Box>
      {/* Disposal Request Form */}
      <Paper sx={{ mb: 3, px: 2, bgcolor: paperBg }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ py: 2 }}>
          {t('waste.disposal.requestForm')}
        </Typography>
        {/* PC Form */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
          <Box sx={formRowSx}>
            <Typography sx={formLabelSx}>{t('waste.disposal.selectWaste')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={formValBorderSx}>
              <Select fullWidth size="small" value={selectedWasteId} onChange={(e: SelectChangeEvent) => setSelectedWasteId(e.target.value)} displayEmpty>
                <MenuItem value="" disabled>{t('waste.disposal.selectWaste')}</MenuItem>
                {storingWastes.map((w) => (
                  <MenuItem key={w.id} value={String(w.id)}>
                    {w.wasteCode ? `[${w.wasteCode}] ` : ''}{w.wasteName || ''}
                  </MenuItem>
                ))}
              </Select>
            </Box>
            <Typography sx={formLabelSx}>{t('waste.disposal.selectCompany')}</Typography>
            <Box sx={formValSx}>
              <Select fullWidth size="small" value={selectedCompanyId} onChange={(e: SelectChangeEvent) => setSelectedCompanyId(e.target.value)} displayEmpty>
                <MenuItem value="" disabled>{t('waste.disposal.selectCompany')}</MenuItem>
                {companies?.map((c) => (
                  <MenuItem key={c.id} value={String(c.id)}>{c.companyName || ''}</MenuItem>
                ))}
              </Select>
            </Box>
          </Box>
          <Box sx={formRowSx}>
            <Typography sx={formLabelSx}>{t('waste.disposal.date')}</Typography>
            <Box sx={formValBorderSx}><DatePickerField value={disposalDate} onChange={(v) => setDisposalDate(v)} size="small" /></Box>
            <Typography sx={formLabelSx}>{t('waste.disposal.vehicleNumber')}</Typography>
            <Box sx={formValSx}><TextField fullWidth size="small" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} /></Box>
          </Box>
          <Box sx={{ display: 'flex' }}>
            <Typography sx={formLabelSx}>{t('waste.disposal.notes')}</Typography>
            <Box sx={formValSx}><TextField fullWidth size="small" value={disposalNotes} onChange={(e) => setDisposalNotes(e.target.value)} /></Box>
          </Box>
        </Box>
        {/* Mobile Form */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, p: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('waste.disposal.selectWaste')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <Select fullWidth size="small" value={selectedWasteId} onChange={(e: SelectChangeEvent) => setSelectedWasteId(e.target.value)} displayEmpty>
              <MenuItem value="" disabled>{t('waste.disposal.selectWaste')}</MenuItem>
              {storingWastes.map((w) => (<MenuItem key={w.id} value={String(w.id)}>{w.wasteCode ? `[${w.wasteCode}] ` : ''}{w.wasteName || ''}</MenuItem>))}
            </Select>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('waste.disposal.selectCompany')}</Typography>
            <Select fullWidth size="small" value={selectedCompanyId} onChange={(e: SelectChangeEvent) => setSelectedCompanyId(e.target.value)} displayEmpty>
              <MenuItem value="" disabled>{t('waste.disposal.selectCompany')}</MenuItem>
              {companies?.map((c) => (<MenuItem key={c.id} value={String(c.id)}>{c.companyName || ''}</MenuItem>))}
            </Select>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('waste.disposal.date')}</Typography>
            <DatePickerField value={disposalDate} onChange={(v) => setDisposalDate(v)} size="small" />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('waste.disposal.vehicleNumber')}</Typography>
            <TextField fullWidth size="small" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('waste.disposal.notes')}</Typography>
            <TextField fullWidth size="small" value={disposalNotes} onChange={(e) => setDisposalNotes(e.target.value)} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', py: 2 }}>
          <Button variant="contained" onClick={handleDisposalRequest} disabled={!selectedWasteId || statusMutation.isPending}>
            {t('waste.disposal.submit')}
          </Button>
        </Box>
      </Paper>

      {/* Kanban Board */}
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
        {t('waste.disposal.title')}
      </Typography>

      <Box
        sx={{
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          pb: 2,
          flexDirection: { xs: 'column', md: 'row' },
        }}
      >
        {STATUS_COLUMNS.map((status) => {
          const wastes = getWastesByStatus(status)
          const color = STATUS_COLORS[status]
          return (
            <Paper
              key={status}
              sx={{
                minWidth: 280,
                p: 2,
                borderRadius: 2,
                flex: 1,
                bgcolor: paperBg,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Column Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Chip
                  label={getStatusLabel(status) || status}
                  size="small"
                  sx={{
                    bgcolor: color,
                    color: '#fff',
                    fontWeight: 'bold',
                  }}
                />
                <Chip
                  label={wastes.length}
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: color, color }}
                />
              </Box>

              {/* Cards */}
              <Box sx={{ flex: 1, minHeight: 100 }}>
                {wastes.length > 0 ? (
                  wastes.map((waste) => (
                    <Paper
                      key={waste.id}
                      elevation={1}
                      sx={{
                        p: 1.5,
                        mb: 1,
                        cursor: 'pointer',
                        borderLeft: `4px solid ${color}`,
                        '&:hover': { elevation: 4, boxShadow: 3 },
                        transition: 'box-shadow 0.2s',
                      }}
                      onClick={() => handleCardClick(waste)}
                    >
                      <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>
                        {waste.wasteCode || ''}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        {waste.wasteName || ''}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {waste.generationAmount != null
                          ? `${waste.generationAmount} ${getUnitLabel(waste.unit || '') || waste.unit || ''}`
                          : ''}
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        {getDepartmentLabel(waste.department || '') || waste.department || ''}
                      </Typography>
                    </Paper>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                    {t('common.noData')}
                  </Typography>
                )}
              </Box>
            </Paper>
          )
        })}
      </Box>

      {/* Detail / Status Change Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {t('waste.disposal.detail')}
        </DialogTitle>
        <DialogContent dividers>
          {selectedCard && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 120 }}>
                  {t('environment.wasteCode')}:
                </Typography>
                <Typography variant="body2">{selectedCard.wasteCode || ''}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 120 }}>
                  {t('environment.wasteName')}:
                </Typography>
                <Typography variant="body2">{selectedCard.wasteName || ''}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 120 }}>
                  {t('environment.wasteType')}:
                </Typography>
                <Typography variant="body2">{getWasteTypeLabel(selectedCard.wasteType || '') || ''}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 120 }}>
                  {t('environment.generationAmount')}:
                </Typography>
                <Typography variant="body2">
                  {selectedCard.generationAmount != null
                    ? `${selectedCard.generationAmount} ${getUnitLabel(selectedCard.unit || '') || selectedCard.unit || ''}`
                    : ''}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 120 }}>
                  {t('environment.department')}:
                </Typography>
                <Typography variant="body2">
                  {getDepartmentLabel(selectedCard.department || '') || selectedCard.department || ''}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 120 }}>
                  {t('waste.disposal.currentStatus')}:
                </Typography>
                <Chip
                  label={getStatusLabel(selectedCard.status || '') || selectedCard.status || ''}
                  size="small"
                  sx={{
                    bgcolor: STATUS_COLORS[selectedCard.status as WasteStatus] || '#999',
                    color: '#fff',
                  }}
                />
              </Box>
              {selectedCard.disposalCompany && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 120 }}>
                    {t('environment.disposalCompany')}:
                  </Typography>
                  <Typography variant="body2">{selectedCard.disposalCompany}</Typography>
                </Box>
              )}
              {selectedCard.vehicleNumber && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 120 }}>
                    {t('waste.disposal.vehicleNumber')}:
                  </Typography>
                  <Typography variant="body2">{selectedCard.vehicleNumber}</Typography>
                </Box>
              )}
              {selectedCard.disposalDate && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 120 }}>
                    {t('environment.disposalDate')}:
                  </Typography>
                  <Typography variant="body2">{formatDate(selectedCard.disposalDate)}</Typography>
                </Box>
              )}
              {selectedCard.disposalNotes && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 120 }}>
                    {t('waste.disposal.notes')}:
                  </Typography>
                  <Typography variant="body2">{selectedCard.disposalNotes}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} variant="outlined">
            {t('common.cancel')}
          </Button>
          {selectedCard && getNextStatus(selectedCard.status) && (
            <Button
              variant="contained"
              onClick={() => handleStatusChange(selectedCard.id, getNextStatus(selectedCard.status)!)}
              disabled={statusMutation.isPending}
              sx={{
                bgcolor: STATUS_COLORS[getNextStatus(selectedCard.status)!],
                '&:hover': { bgcolor: STATUS_COLORS[getNextStatus(selectedCard.status)!], opacity: 0.9 },
              }}
            >
              {getStatusLabel(getNextStatus(selectedCard.status)!) || getNextStatus(selectedCard.status)}
              {' '}{t('waste.disposal.moveTo')}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default WasteDisposalTab
