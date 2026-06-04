import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Select,
  MenuItem,
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  fetchSafetyTemplateDetail,
  fetchInspectionByRiskAssessment,
} from '../../api/safetyChecklistApi'
import {
  SafetyChecklistTemplate,
  SafetyChecklistInspectionResult,
} from '../../types/safetyChecklist.types'
import DatePickerField from '../common/DatePickerField'

interface SafetyInspectionTabProps {
  templateId: number
  riskAssessmentId: number
  readOnly: boolean
  onResultsChange?: (results: SafetyChecklistInspectionResult[]) => void
  inspectionResults?: SafetyChecklistInspectionResult[]
}

const SafetyInspectionTab: React.FC<SafetyInspectionTabProps> = ({
  templateId,
  riskAssessmentId,
  readOnly,
  onResultsChange,
  inspectionResults: externalResults,
}) => {
  const { t } = useTranslation()
  const [localResults, setLocalResults] = useState<SafetyChecklistInspectionResult[]>([])
  const [initialized, setInitialized] = useState(false)

  // Fetch template structure
  const { data: template } = useQuery<SafetyChecklistTemplate>({
    queryKey: ['safetyTemplate', templateId],
    queryFn: () => fetchSafetyTemplateDetail(templateId),
    enabled: !!templateId,
  })

  // Fetch existing inspection for this risk assessment + template
  const { data: existingInspection } = useQuery({
    queryKey: ['safetyInspection', riskAssessmentId, templateId],
    queryFn: () => fetchInspectionByRiskAssessment(riskAssessmentId, templateId),
    enabled: !!riskAssessmentId && !!templateId,
  })

  // Get all items flat from template
  const allItems = useMemo(() => {
    if (!template?.categories) return []
    return template.categories.flatMap(cat =>
      (cat.items || []).map(item => ({
        ...item,
        categoryName: cat.categoryName,
      }))
    )
  }, [template])

  // Initialize results from existing inspection or create empty ones
  const initResults = useCallback(() => {
    if (!allItems.length) return

    if (externalResults && externalResults.length > 0) {
      setLocalResults(externalResults)
    } else if (existingInspection?.results && existingInspection.results.length > 0) {
      setLocalResults(existingInspection.results)
    } else {
      // Create empty result for each item
      setLocalResults(allItems.map(item => ({
        itemId: item.id,
        result: '',
        actionDeadline: '',
        personInCharge: '',
      })))
    }
  }, [allItems, existingInspection, externalResults])

  useEffect(() => {
    setInitialized(false)
  }, [templateId, riskAssessmentId])

  useEffect(() => {
    if (allItems.length > 0 && !initialized) {
      initResults()
      setInitialized(true)
    }
  }, [allItems, initialized, initResults])

  // Notify parent of changes
  useEffect(() => {
    if (initialized && onResultsChange) {
      onResultsChange(localResults)
    }
  }, [localResults, initialized, onResultsChange])

  const handleResultChange = (itemId: number, field: keyof SafetyChecklistInspectionResult, value: string) => {
    setLocalResults(prev =>
      prev.map(r => r.itemId === itemId ? { ...r, [field]: value } : r)
    )
  }

  const getResultForItem = (itemId: number): SafetyChecklistInspectionResult => {
    return localResults.find(r => r.itemId === itemId) || {
      itemId,
      result: '',
      actionDeadline: '',
      personInCharge: '',
    }
  }

  // Determine if this is 중대재해처벌법 template
  const isMajorDisaster = template?.templateName?.includes('중대재해')

  // Compute summary
  const summary = useMemo(() => {
    const total = allItems.length
    const good = localResults.filter(r => r.result === '○').length
    const bad = localResults.filter(r => r.result === '✕').length
    const partial = localResults.filter(r => r.result === '△').length
    const na = localResults.filter(r => r.result === 'N/A').length
    return { total, good, bad, partial, na }
  }, [allItems, localResults])

  if (!template) return null

  let globalItemNo = 0

  return (
    <Box>
      <TableContainer component={Paper} sx={{ border: '1px solid', borderColor: 'divider', overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 900, '& td, & th': { borderRight: '1px solid', borderColor: 'divider', px: 1, py: 0.75 } }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', width: 45, textAlign: 'center' }}>{t('common.no')}</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', width: 130, textAlign: 'center' }}>
                {isMajorDisaster
                  ? t('safetyChecklist.dutyType', '의무 유형')
                  : t('safetyChecklist.category', '분류')}
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
                {isMajorDisaster
                  ? t('safetyChecklist.detailCheckItem', '세부 점검 항목')
                  : t('safetyChecklist.checkItem', '점검 항목')}
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', width: 120, textAlign: 'center' }}>
                {t('safetyChecklist.legalBasis', '법적 근거')}
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', width: 110, textAlign: 'center' }}>
                {t('safetyChecklist.result', '점검결과')}
                <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.8)' }}>
                  {isMajorDisaster ? '(○/✕/△/N/A)' : '(○/✕/N/A)'}
                </Typography>
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', width: 200, textAlign: 'center' }}>
                {t('safetyChecklist.actionDeadline', '조치기한')}
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', width: 130, textAlign: 'center' }}>
                {t('safetyChecklist.personInCharge', '담당자/비고')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(template.categories || []).map((category) => {
              const items = category.items || []
              const rowSpanCount = Math.max(items.length, 1)

              return (
                <React.Fragment key={category.id}>
                  {items.length === 0 && (
                    <TableRow>
                      <TableCell sx={{ textAlign: 'center' }}></TableCell>
                      <TableCell
                        rowSpan={rowSpanCount}
                        sx={{ fontWeight: 'bold', verticalAlign: 'middle', textAlign: 'center', backgroundColor: 'grey.50', whiteSpace: 'pre-line' }}
                      >
                        {category.categoryName}
                      </TableCell>
                      <TableCell colSpan={5} sx={{ textAlign: 'center', color: 'text.secondary', fontStyle: 'italic' }}>
                        항목이 없습니다.
                      </TableCell>
                    </TableRow>
                  )}
                  {items.map((item, itemIdx) => {
                    globalItemNo++
                    const result = getResultForItem(item.id)
                    return (
                      <TableRow
                        key={item.id}
                        sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                      >
                        <TableCell sx={{ textAlign: 'center', fontWeight: 500 }}>{globalItemNo}</TableCell>
                        {itemIdx === 0 && (
                          <TableCell
                            rowSpan={rowSpanCount}
                            sx={{ fontWeight: 'bold', verticalAlign: 'middle', textAlign: 'center', backgroundColor: 'grey.50', whiteSpace: 'pre-line' }}
                          >
                            {category.categoryName}
                          </TableCell>
                        )}
                        <TableCell sx={{ fontSize: '0.85rem' }}>
                          {item.checkItem || ''}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary', textAlign: 'center' }}>
                          {item.legalBasis || ''}
                        </TableCell>
                        {/* 점검결과 */}
                        <TableCell sx={{ textAlign: 'center' }}>
                          {readOnly ? (
                            <Typography variant="body2">{result.result || ''}</Typography>
                          ) : (
                            <Select
                              size="small"
                              value={result.result || 'N/A'}
                              onChange={e => handleResultChange(item.id, 'result', e.target.value)}
                              sx={{ width: '100%', textAlign: 'center' }}
                             displayEmpty>
                              <MenuItem value="" disabled>선택</MenuItem>
                              <MenuItem value="○">○</MenuItem>
                              <MenuItem value="✕">✕</MenuItem>
                              {isMajorDisaster && <MenuItem value="△">△</MenuItem>}
                              <MenuItem value="N/A">N/A</MenuItem>
                            </Select>
                          )}
                        </TableCell>
                        {/* 조치기한 */}
                        <TableCell>
                          {readOnly ? (
                            <Typography variant="body2" sx={{ textAlign: 'center' }}>{result.actionDeadline || ''}</Typography>
                          ) : (
                            <DatePickerField
                              value={result.actionDeadline || ''}
                              onChange={(val) => handleResultChange(item.id, 'actionDeadline', val)}
                              size="small"
                              placeholder="날짜선택"
                              sx={{ minWidth: 180 }}
                            />
                          )}
                        </TableCell>
                        {/* 담당자/비고 */}
                        <TableCell>
                          {readOnly ? (
                            <Typography variant="body2" sx={{ textAlign: 'center' }}>{result.personInCharge || ''}</Typography>
                          ) : (
                            <TextField
                              size="small"
                              value={result.personInCharge || ''}
                              onChange={e => handleResultChange(item.id, 'personInCharge', e.target.value)}
                              placeholder={t('safetyChecklist.personInCharge', '담당자/비고')}
                              fullWidth
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </React.Fragment>
              )
            })}
            {/* 합계 행 */}
            <TableRow sx={{ backgroundColor: 'grey.100' }}>
              <TableCell colSpan={2} sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                {t('common.total', '합  계')}
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>
                {t('safetyChecklist.totalItems', '총 점검항목')}: {summary.total}개
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                {isMajorDisaster
                  ? `${t('safetyChecklist.compliant', '이행')}(○):`
                  : `${t('safetyChecklist.good', '양호')}(○):`}
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                {summary.good}
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                {summary.bad}
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem', color: 'error.main' }}>
                {isMajorDisaster
                  ? t('safetyChecklist.majorDisasterWarning', '미이행 시 형사처벌 위험')
                  : t('safetyChecklist.actionPlanRequired', '미흡항목 조치계획 수립 필')}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default SafetyInspectionTab
