import { useState, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../contexts/AlertContext'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  Select,
  MenuItem,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import RefreshIcon from '@mui/icons-material/Refresh'
import ListSearchBar from '../common/ListSearchBar'
import NumberField from '../common/NumberField'
import SignaturePad from '../common/SignaturePad'
import SignatureImage from '../common/SignatureImage'
import DatePickerField from '../common/DatePickerField'
import useCodeMap from '../../hooks/useCodeMap'
import { contractorEvalApi } from '../../api/contractorApi'
import { ContractorEvalTemplate, ContractorEvalItem } from '../../types/contractor.types'

type ViewMode = 'list' | 'detail' | 'edit'

const getRiskColor = (risk: number | undefined): string => {
  if (!risk || risk <= 0) return 'inherit'
  if (risk <= 4) return 'success.main'
  if (risk <= 8) return 'warning.main'
  if (risk <= 12) return 'error.light'
  return 'error.main'
}

const getRiskGradeLabel = (risk: number | undefined): string => {
  if (!risk || risk <= 0) return ''
  if (risk <= 4) return '낮음'
  if (risk <= 8) return '보통'
  if (risk <= 12) return '높음'
  return '매우높음'
}

const getRiskGradeColor = (risk: number | undefined): 'success' | 'warning' | 'error' | 'default' => {
  if (!risk || risk <= 0) return 'default'
  if (risk <= 4) return 'success'
  if (risk <= 8) return 'warning'
  return 'error'
}

const createEmptyItem = (templateId: number, sortOrder: number): ContractorEvalItem => ({
  templateId,
  sortOrder,
  workContent: '',
  evalCategory: '',
  riskFactor: '',
  disasterType: '',
  isNa: false,
  currentMeasures: '',
  currentFrequency: undefined,
  currentSeverity: undefined,
  currentRisk: undefined,
  riskGrade: '',
  improvement: '',
  eduFrequency: '',
  postFrequency: undefined,
  postSeverity: undefined,
  postRisk: undefined,
})

const ContractorEvalTab = () => {
  const { t } = useTranslation()
  const { showAlert } = useAlert()
  const { codeList: evalCategoryCodes, getLabel: getEvalCategoryLabel } = useCodeMap('EVAL_CATEGORY')
  const { codeList: disasterTypeCodes, getLabel: getDisasterTypeLabel } = useCodeMap('DISASTER_TYPE')
  const queryClient = useQueryClient()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedTemplate, setSelectedTemplate] = useState<ContractorEvalTemplate | null>(null)
  const [items, setItems] = useState<ContractorEvalItem[]>([])
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const applySearch = () => setKeyword(keywordInput)
  const handleResetSearch = () => { setKeywordInput(''); setKeyword('') }
  const [templateName, setTemplateName] = useState('')
  const [templateDesc, setTemplateDesc] = useState('')
  const [evaluatorName, setEvaluatorName] = useState('')
  const [evaluatorSign, setEvaluatorSign] = useState('')
  const [approverName, setApproverName] = useState('')
  const [approverSign, setApproverSign] = useState('')
  const [signDate, setSignDate] = useState('')

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['contractorEvalTemplates'],
    queryFn: contractorEvalApi.getTemplates,
  })

  const { data: itemsData, isLoading: itemsLoading } = useQuery({
    queryKey: ['contractorEvalItems', selectedTemplate?.id],
    queryFn: () => contractorEvalApi.getItems(selectedTemplate!.id),
    enabled: !!selectedTemplate,
  })

  // itemsData가 변경되면 로컬 state에 반영
  useEffect(() => {
    if (itemsData && selectedTemplate) {
      setItems(itemsData.length > 0 ? itemsData : [createEmptyItem(selectedTemplate.id, 1)])
    }
  }, [itemsData, selectedTemplate])

  const saveMutation = useMutation({
    mutationFn: async (data: { templateId: number; items: ContractorEvalItem[] }) => {
      // 1) 항목 저장
      await contractorEvalApi.saveItems(data.templateId, data.items)
      // 2) 템플릿 메타(이름·설명·서명) 저장
      await contractorEvalApi.updateTemplateMeta(data.templateId, {
        templateName,
        description: templateDesc,
        evaluatorName,
        evaluatorSign,
        approverName,
        approverSign,
        signDate: signDate || undefined,
      })
    },
    onSuccess: () => {
      showAlert('저장되었습니다.', 'success')
      queryClient.invalidateQueries({ queryKey: ['contractorEvalItems', selectedTemplate?.id] })
      queryClient.invalidateQueries({ queryKey: ['contractorEvalTemplates'] })
      setViewMode('detail')
    },
    onError: () => {
      showAlert('저장에 실패했습니다.', 'error')
    },
  })

  const handleTemplateClick = (template: ContractorEvalTemplate) => {
    setSelectedTemplate(template)
    setTemplateName(template.templateName)
    setTemplateDesc(template.description || '')
    setEvaluatorName(template.evaluatorName || '')
    setEvaluatorSign(template.evaluatorSign || '')
    setApproverName(template.approverName || '')
    setApproverSign(template.approverSign || '')
    setSignDate(template.signDate || '')
    setViewMode('detail')
  }

  const handleBack = () => {
    setViewMode('list')
    setSelectedTemplate(null)
    setItems([])
    setKeywordInput(''); setKeyword('')
    setEvaluatorName(''); setEvaluatorSign(''); setApproverName(''); setApproverSign(''); setSignDate('')
  }

  const handleItemChange = useCallback(
    (index: number, field: keyof ContractorEvalItem, value: unknown) => {
      setItems((prev) => {
        const updated = [...prev]
        const item = { ...updated[index], [field]: value }

        // Auto-calculate current risk
        if (field === 'currentFrequency' || field === 'currentSeverity') {
          const freq = field === 'currentFrequency' ? (value as number) : item.currentFrequency
          const sev = field === 'currentSeverity' ? (value as number) : item.currentSeverity
          if (freq && sev) {
            item.currentRisk = freq * sev
            item.riskGrade = getRiskGradeLabel(item.currentRisk)
          } else {
            item.currentRisk = undefined
            item.riskGrade = ''
          }
        }

        // Auto-calculate post risk
        if (field === 'postFrequency' || field === 'postSeverity') {
          const freq = field === 'postFrequency' ? (value as number) : item.postFrequency
          const sev = field === 'postSeverity' ? (value as number) : item.postSeverity
          if (freq && sev) {
            item.postRisk = freq * sev
          } else {
            item.postRisk = undefined
          }
        }

        updated[index] = item
        return updated
      })
    },
    []
  )

  const handleAddRow = () => {
    if (!selectedTemplate) return
    setItems((prev) => [...prev, createEmptyItem(selectedTemplate.id, prev.length + 1)])
  }

  const handleDeleteRow = (index: number) => {
    setItems((prev) => {
      const updated = prev.filter((_, i) => i !== index)
      return updated.map((item, i) => ({ ...item, sortOrder: i + 1 }))
    })
  }

  const handleSave = () => {
    if (!selectedTemplate) return
    saveMutation.mutate({ templateId: selectedTemplate.id, items })
  }

  // ===================== LIST VIEW =====================
  if (viewMode === 'list') {
    const listHeaderSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }
    const filtered = templates.filter(tmpl => {
      if (!keyword.trim()) return true
      const s = keyword.toLowerCase()
      return tmpl.templateName?.toLowerCase().includes(s)
    })
    return (
      <Box>
        {/* Search - PC */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <ListSearchBar placeholder={t('checklist.searchPlaceholder', '제목으로 검색')} value={keywordInput} onChange={setKeywordInput} onSearch={applySearch}
              sx={{ minWidth: 250 }} />
            <IconButton onClick={handleResetSearch} size="small"><RefreshIcon /></IconButton>
          </Box>
        </Box>
        {/* Search - Mobile */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
          <ListSearchBar fullWidth placeholder={t('checklist.searchPlaceholder', '제목으로 검색')} value={keywordInput} onChange={setKeywordInput} onSearch={applySearch} />
        </Box>

        {templatesLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : filtered.length === 0 ? (
          <Alert severity="info">{t('common.noData')}</Alert>
        ) : (
          <>
            {/* PC Table */}
            <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', overflowX: 'auto' }}>
              <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ ...listHeaderSx, width: 40 }} align="center">{t('common.no')}</TableCell>
                    <TableCell sx={listHeaderSx}>{t('common.title', '제목')}</TableCell>
                    <TableCell sx={{ ...listHeaderSx, width: 40 }} align="center">{t('checklist.itemCount', '항목 수')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((tmpl, idx) => (
                    <TableRow key={tmpl.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleTemplateClick(tmpl)}>
                      <TableCell align="center" sx={{ fontWeight: 'bold', width: 40 }}>{idx + 1}</TableCell>
                      <TableCell><Typography variant="body2" fontWeight={600} color="primary">{tmpl.templateName}</Typography></TableCell>
                      <TableCell align="center">{tmpl.itemCount || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {/* Mobile Cards */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
              {filtered.map((tmpl) => (
                <Paper key={tmpl.id} sx={{ p: 2, cursor: 'pointer', border: 1, borderColor: 'divider' }} onClick={() => handleTemplateClick(tmpl)}>
                  <Typography fontWeight="bold" color="primary" sx={{ mb: 0.5 }}>{tmpl.templateName}</Typography>
                  <Typography variant="caption" color="text.secondary">{t('checklist.itemCount', '항목 수')}: {tmpl.itemCount || 0}</Typography>
                </Paper>
              ))}
            </Box>
          </>
        )}
      </Box>
    )
  }

  // ===================== DETAIL VIEW =====================
  const headerCellSx = {
    bgcolor: 'grey.100',
    fontWeight: 'bold',
    fontSize: '0.8rem',
    whiteSpace: 'nowrap',
    borderRight: '1px solid',
    borderColor: 'divider',
    py: 1,
    px: 1,
    textAlign: 'center' as const,
  }

  const bodyCellSx = {
    px: 0.5,
    py: 0.5,
    borderRight: '1px solid',
    borderColor: 'divider',
  }

  const infoLabelSx = { width: 130, minWidth: 130, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center' }

  return (
    <Box>
      {/* 체크리스트 정보 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>{t('checklist.checklistInfo', '체크리스트 정보')}</Typography>
        <Paper sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={infoLabelSx}>{t('common.title', '제목')}</Box>
            <Box sx={{ flex: 1, px: 2, py: 1.5, display: 'flex', alignItems: 'center' }}>
              {viewMode === 'edit' ? (
                <TextField size="small" fullWidth value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
              ) : (
                <Typography variant="body2">{templateName || ''}</Typography>
              )}
            </Box>
          </Box>
          <Box sx={{ display: 'flex' }}>
            <Box sx={infoLabelSx}>{t('common.description', '설명')}</Box>
            <Box sx={{ flex: 1, px: 2, py: 1.5, display: 'flex', alignItems: 'center' }}>
              {viewMode === 'edit' ? (
                <TextField size="small" fullWidth value={templateDesc} onChange={(e) => setTemplateDesc(e.target.value)} />
              ) : (
                <Typography variant="body2">{templateDesc || ''}</Typography>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
        <Box sx={{ flex: 1 }} />
        {viewMode === 'edit' && (
          <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={handleAddRow}>
            행 추가
          </Button>
        )}
      </Box>

      {itemsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 2400, '& td, & th': { borderRight: '1px solid', borderColor: 'divider' } }}>
              <TableHead>
                {/* Row 1 */}
                <TableRow>
                  <TableCell sx={{ ...headerCellSx, width: 40 }} rowSpan={2}>
                    No
                  </TableCell>
                  <TableCell sx={{ ...headerCellSx, minWidth: 120 }} rowSpan={2}>
                    작업내용
                  </TableCell>
                  <TableCell sx={{ ...headerCellSx, minWidth: 120 }} rowSpan={2}>
                    평가구분
                  </TableCell>
                  <TableCell sx={{ ...headerCellSx, minWidth: 400 }} rowSpan={2}>
                    위험요인
                  </TableCell>
                  <TableCell sx={{ ...headerCellSx, minWidth: 120 }} rowSpan={2}>
                    재해형태
                  </TableCell>
                  <TableCell sx={{ ...headerCellSx, width: 50 }} rowSpan={2}>
                    N/A
                  </TableCell>
                  <TableCell sx={{ ...headerCellSx, minWidth: 400 }} rowSpan={2}>
                    현재안전조치
                  </TableCell>
                  <TableCell sx={headerCellSx} colSpan={3}>
                    현재 위험도
                  </TableCell>
                  <TableCell sx={headerCellSx} rowSpan={2}>
                    위험등급
                  </TableCell>
                  <TableCell sx={{ ...headerCellSx, minWidth: 250 }} rowSpan={2}>
                    개선대책
                  </TableCell>
                  <TableCell sx={headerCellSx} rowSpan={2}>
                    코드번호
                  </TableCell>
                  <TableCell sx={headerCellSx} colSpan={3}>
                    개선후 위험도
                  </TableCell>
                  {viewMode === 'edit' && (
                    <TableCell sx={{ ...headerCellSx, width: 40, borderLeft: '1px solid', borderLeftColor: 'grey.300' }} rowSpan={2}>
                      삭제
                    </TableCell>
                  )}
                </TableRow>
                {/* Row 2 */}
                <TableRow>
                  <TableCell sx={headerCellSx}>빈도</TableCell>
                  <TableCell sx={headerCellSx}>강도</TableCell>
                  <TableCell sx={headerCellSx}>위험도</TableCell>
                  <TableCell sx={headerCellSx}>빈도</TableCell>
                  <TableCell sx={headerCellSx}>강도</TableCell>
                  <TableCell sx={headerCellSx}>위험도</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index} hover>
                    {/* No */}
                    <TableCell sx={{ ...bodyCellSx, textAlign: 'center', fontWeight: 'bold' }}>{index + 1}</TableCell>

                    {/* 작업내용 */}
                    <TableCell sx={bodyCellSx}>
                      {viewMode === 'edit' ? (
                        <TextField size="small" fullWidth value={item.workContent || ''} onChange={(e) => handleItemChange(index, 'workContent', e.target.value)} />
                      ) : (
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{item.workContent || ''}</Typography>
                      )}
                    </TableCell>

                    {/* 평가구분 */}
                    <TableCell sx={{ ...bodyCellSx, textAlign: 'center' }}>
                      {viewMode === 'edit' ? (
                        <Select size="small" fullWidth value={item.evalCategory || ''} onChange={(e) => handleItemChange(index, 'evalCategory', e.target.value)} displayEmpty>
                          <MenuItem value="">선택하세요</MenuItem>
                          {evalCategoryCodes.map(c => <MenuItem key={c.code} value={c.code}>{getEvalCategoryLabel(c.code)}</MenuItem>)}
                        </Select>
                      ) : (
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{getEvalCategoryLabel(item.evalCategory || '') || item.evalCategory || ''}</Typography>
                      )}
                    </TableCell>

                    {/* 위험요인 */}
                    <TableCell sx={bodyCellSx}>
                      {viewMode === 'edit' ? (
                        <TextField size="small" fullWidth value={item.riskFactor || ''} onChange={(e) => handleItemChange(index, 'riskFactor', e.target.value)} />
                      ) : (
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{item.riskFactor || ''}</Typography>
                      )}
                    </TableCell>

                    {/* 재해형태 */}
                    <TableCell sx={{ ...bodyCellSx, textAlign: 'center' }}>
                      {viewMode === 'edit' ? (
                        <Select size="small" fullWidth value={item.disasterType || ''} onChange={(e) => handleItemChange(index, 'disasterType', e.target.value)} displayEmpty>
                          <MenuItem value="">선택하세요</MenuItem>
                          {disasterTypeCodes.map(c => <MenuItem key={c.code} value={c.code}>{getDisasterTypeLabel(c.code)}</MenuItem>)}
                        </Select>
                      ) : (
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{getDisasterTypeLabel(item.disasterType || '') || item.disasterType || ''}</Typography>
                      )}
                    </TableCell>

                    {/* N/A */}
                    <TableCell sx={{ ...bodyCellSx, textAlign: 'center', fontSize: '0.85rem' }}>
                      {item.isNa ? 'A' : 'N'}
                    </TableCell>

                    {/* 현재안전조치 */}
                    <TableCell sx={bodyCellSx}>
                      {viewMode === 'edit' ? (
                        <TextField size="small" fullWidth value={item.currentMeasures || ''} onChange={(e) => handleItemChange(index, 'currentMeasures', e.target.value)} />
                      ) : (
                        <Typography variant="body2" sx={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{item.currentMeasures || ''}</Typography>
                      )}
                    </TableCell>

                    {/* 현재 빈도 */}
                    <TableCell sx={{ ...bodyCellSx, width: 60, textAlign: 'center', fontSize: '0.85rem' }}>
                      {item.currentFrequency ?? ''}
                    </TableCell>

                    {/* 현재 강도 */}
                    <TableCell sx={{ ...bodyCellSx, width: 60, textAlign: 'center', fontSize: '0.85rem' }}>
                      {item.currentSeverity ?? ''}
                    </TableCell>

                    {/* 현재 위험도 (auto) */}
                    <TableCell
                      sx={{
                        ...bodyCellSx,
                        width: 60,
                        textAlign: 'center',
                        fontWeight: 700,
                        color: getRiskColor(item.currentRisk),
                      }}
                    >
                      {item.currentRisk ?? ''}
                    </TableCell>

                    {/* 위험등급 */}
                    <TableCell sx={{ ...bodyCellSx, textAlign: 'center' }}>
                      {item.riskGrade ? (
                        <Chip
                          label={item.riskGrade}
                          size="small"
                          color={getRiskGradeColor(item.currentRisk)}
                          variant="filled"
                          sx={{ fontSize: '0.75rem', height: 24 }}
                        />
                      ) : null}
                    </TableCell>

                    {/* 개선대책 */}
                    <TableCell sx={bodyCellSx}>
                      <Typography variant="body2" sx={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{item.improvement || ''}</Typography>
                    </TableCell>

                    {/* 교육빈도 */}
                    <TableCell sx={{ ...bodyCellSx, width: 80, textAlign: 'center', fontSize: '0.85rem' }}>
                      {item.eduFrequency || ''}
                    </TableCell>

                    {/* 개선후 빈도 */}
                    <TableCell sx={{ ...bodyCellSx, width: 60, textAlign: 'center', fontSize: '0.85rem' }}>
                      {item.postFrequency ?? ''}
                    </TableCell>

                    {/* 개선후 강도 */}
                    <TableCell sx={{ ...bodyCellSx, width: 60, textAlign: 'center', fontSize: '0.85rem' }}>
                      {item.postSeverity ?? ''}
                    </TableCell>

                    {/* 개선후 위험도 (auto) */}
                    <TableCell
                      sx={{
                        ...bodyCellSx,
                        width: 60,
                        textAlign: 'center',
                        fontWeight: 700,
                        color: getRiskColor(item.postRisk),
                      }}
                    >
                      {item.postRisk ?? ''}
                    </TableCell>

                    {/* 삭제 */}
                    {viewMode === 'edit' && (
                      <TableCell sx={{ ...bodyCellSx, textAlign: 'center' }}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteRow(index)}
                          disabled={items.length <= 1}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* 시그니처 섹션 - 슬라이드 3 */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
              {t('contractorEval.signatures', '평가자 / 승인자 서명')}
            </Typography>
            <Paper sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
              <Table size="small" sx={{ '& td, & th': { borderRight: '1px solid', borderColor: 'divider' } }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell align="center" sx={{ fontWeight: 'bold', width: 120 }}>{t('common.role', '구분')}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', width: 200 }}>{t('common.name', '성명')}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>{t('common.signature', '서명')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell align="center" sx={{ bgcolor: 'grey.50', fontWeight: 'bold' }}>{t('contractorEval.evaluator', '평가자')}</TableCell>
                    <TableCell>
                      {viewMode === 'edit' ? (
                        <TextField size="small" fullWidth value={evaluatorName}
                          onChange={(e) => setEvaluatorName(e.target.value)} />
                      ) : (
                        <Typography variant="body2">{evaluatorName || ''}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {viewMode === 'edit'
                        ? <SignaturePad value={evaluatorSign} onChange={setEvaluatorSign} />
                        : (evaluatorSign
                            ? <SignatureImage src={evaluatorSign} alt="evaluator signature" maxHeight={60} />
                            : null)
                      }
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell align="center" sx={{ bgcolor: 'grey.50', fontWeight: 'bold' }}>{t('contractorEval.approver', '승인자')}</TableCell>
                    <TableCell>
                      {viewMode === 'edit' ? (
                        <TextField size="small" fullWidth value={approverName}
                          onChange={(e) => setApproverName(e.target.value)} />
                      ) : (
                        <Typography variant="body2">{approverName || ''}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {viewMode === 'edit'
                        ? <SignaturePad value={approverSign} onChange={setApproverSign} />
                        : (approverSign
                            ? <SignatureImage src={approverSign} alt="approver signature" maxHeight={60} />
                            : null)
                      }
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell align="center" sx={{ bgcolor: 'grey.50', fontWeight: 'bold' }}>{t('common.date', '일자')}</TableCell>
                    <TableCell colSpan={2}>
                      {viewMode === 'edit' ? (
                        <DatePickerField value={signDate} onChange={setSignDate} />
                      ) : (
                        <Typography variant="body2">{signDate || ''}</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Paper>
          </Box>

          <Box sx={{ mt: 3, display: 'flex', gap: 1, justifyContent: { xs: 'stretch', md: 'flex-end' }, flexWrap: 'wrap' }}>
            <Button variant="outlined" onClick={handleBack} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.list', '목록')}</Button>
            {viewMode === 'detail' && (
              <Button variant="contained" onClick={() => setViewMode('edit')} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.edit', '수정')}</Button>
            )}
            {viewMode === 'edit' && (
              <>
                <Button variant="outlined" onClick={() => setViewMode('detail')} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.cancel', '취소')}</Button>
                <Button variant="contained" onClick={handleSave} disabled={saveMutation.isPending} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
                  {saveMutation.isPending ? <CircularProgress size={20} /> : t('common.save', '저장')}
                </Button>
              </>
            )}
          </Box>
        </>
      )}
    </Box>
  )
}

export default ContractorEvalTab
