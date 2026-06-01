import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Checkbox,
  IconButton,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import useCodeMap from '../../hooks/useCodeMap'
import { useAlert } from '../../contexts/AlertContext'
import { accidentReportApi } from '../../api/accidentReportApi'
import { AccidentReportRequest } from '../../types/accidentReport.types'

const emptyRow: AccidentReportRequest = {
  caseDescription: '',
  disasterType: '',
  isNearMiss: false,
  isFatal: false,
  leaveOverMonth: false,
  leaveUnderMonth: false,
  freqNone: false,
  occurrenceCycle: '',
  relatedProcess: '',
  sortOrder: 0,
}

type DraftRow = AccidentReportRequest & { id?: number; _dirty?: boolean }

const AccidentReportTab: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showConfirm, showSuccess } = useAlert()
  const { codeList: disasterCodes, getLocalizedName } = useCodeMap('DISASTER_TYPE')

  const [rows, setRows] = useState<DraftRow[]>([])

  const { data, isLoading, error } = useQuery({
    queryKey: ['accidentReports'],
    queryFn: accidentReportApi.getAll,
  })

  useEffect(() => {
    if (data) {
      setRows(data.map(r => ({ ...r })))
    }
  }, [data])

  const createMutation = useMutation({
    mutationFn: accidentReportApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accidentReports'] }),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: AccidentReportRequest }) =>
      accidentReportApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accidentReports'] }),
  })
  const deleteMutation = useMutation({
    mutationFn: accidentReportApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accidentReports'] }),
  })

  const handleAddRow = () => {
    const nextOrder = rows.length > 0 ? Math.max(...rows.map(r => r.sortOrder)) + 1 : 1
    setRows(prev => [...prev, { ...emptyRow, sortOrder: nextOrder, _dirty: true }])
  }

  const handleFieldChange = (index: number, field: keyof AccidentReportRequest, value: unknown) => {
    setRows(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value, _dirty: true }
      return next
    })
  }

  const handleDeleteRow = async (index: number) => {
    const row = rows[index]
    if (row.id) {
      const confirmed = await showConfirm(t('common.confirmDelete', '삭제하시겠습니까?'))
      if (!confirmed) return
      await deleteMutation.mutateAsync(row.id)
    } else {
      setRows(prev => prev.filter((_, i) => i !== index))
    }
  }

  const handleSave = async () => {
    const confirmed = await showConfirm(t('common.confirmSave', '저장하시겠습니까?'))
    if (!confirmed) return
    for (const row of rows) {
      if (!row._dirty) continue
      const { id, _dirty, ...payload } = row
      if (id) {
        await updateMutation.mutateAsync({ id, data: payload as AccidentReportRequest })
      } else {
        await createMutation.mutateAsync(payload as AccidentReportRequest)
      }
    }
    await showSuccess(t('common.saveSuccess', '저장되었습니다.'))
  }

  const isSaving = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  const borderCell = {
    border: '1px solid',
    borderColor: 'grey.300',
    px: 1,
    py: 0.75,
    fontSize: '0.85rem',
    wordBreak: 'keep-all' as const,
  }
  const headerCell = {
    ...borderCell,
    fontWeight: 'bold',
    bgcolor: 'grey.100',
    textAlign: 'center' as const,
    whiteSpace: 'nowrap' as const,
  }

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
  }

  if (error) {
    return <Alert severity="error">{t('common.loadError', '데이터를 불러오지 못했습니다.')}</Alert>
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6" fontWeight="bold">
          {t('accidentReport.title', '보건안전 재해발생 정보 조사서')}
        </Typography>
        <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={handleAddRow}>
          {t('common.addRow', '행 추가')}
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 1400, borderCollapse: 'collapse' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...headerCell, minWidth: 260 }} rowSpan={2}>
                {t('accidentReport.caseDescription', '발생사례')}
              </TableCell>
              <TableCell sx={headerCell} colSpan={2}>
                {t('accidentReport.disasterTypeGroup', '재해형태/사고형태')}
              </TableCell>
              <TableCell sx={headerCell} colSpan={1}>
                {t('accidentReport.fatalGroup', '사망 재해')}
              </TableCell>
              <TableCell sx={headerCell} colSpan={2}>
                {t('accidentReport.leaveGroup', '휴업재해')}
              </TableCell>
              <TableCell sx={headerCell} colSpan={2}>
                {t('accidentReport.frequencyGroup', '발생빈도')}
              </TableCell>
              <TableCell sx={{ ...headerCell, minWidth: 200 }} rowSpan={2}>
                {t('accidentReport.relatedProcess', '해당 공정/활동 및 작업')}
              </TableCell>
              <TableCell sx={{ ...headerCell, width: 50 }} rowSpan={2}>
                {t('common.delete', '삭제')}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ ...headerCell, minWidth: 140 }}>{t('accidentReport.disasterType', '재해형태')}</TableCell>
              <TableCell sx={{ ...headerCell, width: 80 }}>{t('accidentReport.nearMiss', '아차사고')}</TableCell>
              <TableCell sx={{ ...headerCell, width: 90 }}>{t('accidentReport.fatal', '사망자 발생')}</TableCell>
              <TableCell sx={{ ...headerCell, width: 90 }}>{t('accidentReport.leaveOverMonth', '1개월 이상')}</TableCell>
              <TableCell sx={{ ...headerCell, width: 90 }}>{t('accidentReport.leaveUnderMonth', '1개월 미만')}</TableCell>
              <TableCell sx={{ ...headerCell, width: 70 }}>{t('accidentReport.none', '없음')}</TableCell>
              <TableCell sx={{ ...headerCell, minWidth: 140 }}>{t('accidentReport.occurrenceCycle', '발생주기')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ ...borderCell, py: 4, color: 'text.secondary' }}>
                  {t('accidentReport.empty', '등록된 사례가 없습니다.')}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, idx) => (
                <TableRow key={row.id ?? `new-${idx}`}>
                  <TableCell sx={borderCell}>
                    <TextField
                      size="small" fullWidth multiline maxRows={4}
                      value={row.caseDescription || ''}
                      onChange={(e) => handleFieldChange(idx, 'caseDescription', e.target.value)}
                    />
                  </TableCell>
                  <TableCell sx={borderCell}>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={row.disasterType || ''}
                        onChange={(e) => handleFieldChange(idx, 'disasterType', e.target.value)}
                        displayEmpty
                      >
                        <MenuItem value=""><em>{t('common.none', '선택')}</em></MenuItem>
                        {disasterCodes.map((c) => (
                          <MenuItem key={c.code} value={c.code}>{getLocalizedName(c)}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell sx={{ ...borderCell, textAlign: 'center' }}>
                    <Checkbox size="small" checked={row.isNearMiss}
                      onChange={(e) => handleFieldChange(idx, 'isNearMiss', e.target.checked)} />
                  </TableCell>
                  <TableCell sx={{ ...borderCell, textAlign: 'center' }}>
                    <Checkbox size="small" checked={row.isFatal}
                      onChange={(e) => handleFieldChange(idx, 'isFatal', e.target.checked)} />
                  </TableCell>
                  <TableCell sx={{ ...borderCell, textAlign: 'center' }}>
                    <Checkbox size="small" checked={row.leaveOverMonth}
                      onChange={(e) => handleFieldChange(idx, 'leaveOverMonth', e.target.checked)} />
                  </TableCell>
                  <TableCell sx={{ ...borderCell, textAlign: 'center' }}>
                    <Checkbox size="small" checked={row.leaveUnderMonth}
                      onChange={(e) => handleFieldChange(idx, 'leaveUnderMonth', e.target.checked)} />
                  </TableCell>
                  <TableCell sx={{ ...borderCell, textAlign: 'center' }}>
                    <Checkbox size="small" checked={row.freqNone}
                      onChange={(e) => handleFieldChange(idx, 'freqNone', e.target.checked)} />
                  </TableCell>
                  <TableCell sx={borderCell}>
                    <TextField
                      size="small" fullWidth
                      value={row.occurrenceCycle || ''}
                      disabled={row.freqNone}
                      onChange={(e) => handleFieldChange(idx, 'occurrenceCycle', e.target.value)}
                    />
                  </TableCell>
                  <TableCell sx={borderCell}>
                    <TextField
                      size="small" fullWidth multiline maxRows={4}
                      value={row.relatedProcess || ''}
                      onChange={(e) => handleFieldChange(idx, 'relatedProcess', e.target.value)}
                    />
                  </TableCell>
                  <TableCell sx={{ ...borderCell, textAlign: 'center' }}>
                    <IconButton size="small" color="error" onClick={() => handleDeleteRow(idx)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ─── 모바일(xs/sm) : 카드 ─── */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
        {rows.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', color: 'text.disabled', fontSize: '0.875rem' }}>
            {t('accidentReport.empty', '등록된 사례가 없습니다.')}
          </Paper>
        ) : rows.map((row, idx) => (
          <Paper key={row.id ?? `new-${idx}`} variant="outlined" sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            {/* 헤더: 번호 + 삭제 버튼 */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: 'primary.main' }}>#{idx + 1}</Typography>
              <IconButton size="small" color="error" onClick={() => handleDeleteRow(idx)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
            {/* 발생사례 */}
            <Box>
              <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mb: 0.5, fontWeight: 600 }}>{t('accidentReport.caseDescription', '발생사례')}</Typography>
              <TextField size="small" fullWidth multiline maxRows={4}
                value={row.caseDescription || ''}
                onChange={(e) => handleFieldChange(idx, 'caseDescription', e.target.value)} />
            </Box>
            {/* 재해형태 */}
            <Box>
              <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mb: 0.5, fontWeight: 600 }}>{t('accidentReport.disasterType', '재해형태')}</Typography>
              <FormControl size="small" fullWidth>
                <Select value={row.disasterType || ''} onChange={(e) => handleFieldChange(idx, 'disasterType', e.target.value)} displayEmpty>
                  <MenuItem value=""><em>{t('common.none', '선택')}</em></MenuItem>
                  {disasterCodes.map((c) => (
                    <MenuItem key={c.code} value={c.code}>{getLocalizedName(c)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            {/* 체크박스 2x2 그리드 */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5, bgcolor: 'action.hover', borderRadius: 1, p: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Checkbox size="small" checked={row.isNearMiss} onChange={(e) => handleFieldChange(idx, 'isNearMiss', e.target.checked)} sx={{ p: 0.5 }} />
                <Typography sx={{ fontSize: '0.8rem' }}>{t('accidentReport.nearMiss', '아차사고')}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Checkbox size="small" checked={row.isFatal} onChange={(e) => handleFieldChange(idx, 'isFatal', e.target.checked)} sx={{ p: 0.5 }} />
                <Typography sx={{ fontSize: '0.8rem' }}>{t('accidentReport.fatal', '사망자')}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Checkbox size="small" checked={row.leaveOverMonth} onChange={(e) => handleFieldChange(idx, 'leaveOverMonth', e.target.checked)} sx={{ p: 0.5 }} />
                <Typography sx={{ fontSize: '0.8rem' }}>{t('accidentReport.leaveOverMonth', '1개월 이상')}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Checkbox size="small" checked={row.leaveUnderMonth} onChange={(e) => handleFieldChange(idx, 'leaveUnderMonth', e.target.checked)} sx={{ p: 0.5 }} />
                <Typography sx={{ fontSize: '0.8rem' }}>{t('accidentReport.leaveUnderMonth', '1개월 미만')}</Typography>
              </Box>
            </Box>
            {/* 발생주기 */}
            <Box>
              <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mb: 0.5, fontWeight: 600 }}>{t('accidentReport.occurrenceCycle', '발생주기')}</Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0 }}>
                  <Checkbox size="small" checked={row.freqNone} onChange={(e) => handleFieldChange(idx, 'freqNone', e.target.checked)} sx={{ p: 0.5 }} />
                  <Typography sx={{ fontSize: '0.75rem' }}>{t('accidentReport.none', '없음')}</Typography>
                </Box>
                <TextField size="small" fullWidth value={row.occurrenceCycle || ''} disabled={row.freqNone}
                  onChange={(e) => handleFieldChange(idx, 'occurrenceCycle', e.target.value)} />
              </Box>
            </Box>
            {/* 공정/활동 */}
            <Box>
              <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mb: 0.5, fontWeight: 600 }}>{t('accidentReport.relatedProcess', '해당 공정/활동 및 작업')}</Typography>
              <TextField size="small" fullWidth multiline maxRows={4}
                value={row.relatedProcess || ''}
                onChange={(e) => handleFieldChange(idx, 'relatedProcess', e.target.value)} />
            </Box>
          </Paper>
        ))}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' }, mt: 2 }}>
        <Button variant="contained" onClick={handleSave} disabled={isSaving} sx={{ width: { xs: '100%', md: 'auto' } }}>
          {t('common.save', '저장')}
        </Button>
      </Box>
    </Box>
  )
}

export default AccidentReportTab
