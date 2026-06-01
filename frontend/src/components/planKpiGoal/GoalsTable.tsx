import React from 'react'
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Typography, IconButton, Checkbox, Select, MenuItem, useTheme,
} from '@mui/material'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import { useTranslation } from 'react-i18next'
import { EhsPlanGoal } from '../../types/planKpiGoal.types'

// 고정 템플릿: 목표 / 세부목표는 사용자가 편집할 수 없는 고정 값
export interface GoalTemplate {
  goalText: string | null
  subGoal: string
  goalRowSpan: number
}
export const GOAL_TEMPLATE: GoalTemplate[] = [
  { goalText: 'Ⅰ. 재해율 0.5% 미만',                     goalRowSpan: 1, subGoal: '외근 중 교통사고,\n안전사고 발생 zero화' },
  { goalText: 'Ⅱ. 산업안전보건교육 이수율 100%',         goalRowSpan: 2, subGoal: '근로자 정기 안전보건교육\n100% 달성' },
  { goalText: null,                                        goalRowSpan: 0, subGoal: 'MSDS 확인 및 교육 시행' },
  { goalText: 'Ⅲ. 구성원 건강검진 수검률 99% 이상',     goalRowSpan: 1, subGoal: '구성원 건강검진 수검률\n100% 달성' },
]

export const buildTemplateGoals = (): EhsPlanGoal[] => GOAL_TEMPLATE.map((tpl, idx) => ({
  goalText: tpl.goalText || '',
  subGoal: tpl.subGoal,
  task: '',
  kpi: '',
  prevResult: '',
  targetValue: '',
  ownerTeam: '',
  ownerName: '',
  q1: false, q2: false, q3: false, q4: false,
  sortOrder: (idx + 1) * 10,
}))

// KPI 분기별 달성 상태
export const KPI_QUARTER_STATUSES = ['ACHIEVED', 'IN_PROGRESS', 'REVIEW', 'NOT_ACHIEVED'] as const
export const KPI_STATUS_LABEL: Record<string, string> = {
  ACHIEVED:     '달성',
  IN_PROGRESS:  '진행',
  REVIEW:       '검토',
  NOT_ACHIEVED: '미달',
}
export const KPI_STATUS_COLOR: Record<string, string> = {
  ACHIEVED:     '#22c55e',
  IN_PROGRESS:  '#3b82f6',
  REVIEW:       '#f59e0b',
  NOT_ACHIEVED: '#ef4444',
}

interface GoalsTableProps {
  goals: EhsPlanGoal[]
  /**
   * 'plan'        = 연간 계획 등록/수정(체크박스 + 본문 편집)
   * 'kpi'         = KPI 현황(분기 상태값만 편집)
   * 'kpiReadOnly' = KPI 현황 - 작업 완료된 plan(분기 상태 표시만, 수정 불가)
   * 'readOnly'    = 연간 계획 상세 등 표시 전용(동그라미만)
   */
  mode: 'plan' | 'kpi' | 'kpiReadOnly' | 'readOnly'
  onChange?: (idx: number, patch: Partial<EhsPlanGoal>) => void
  onPickOwner?: (idx: number) => void
}

const GoalsTable: React.FC<GoalsTableProps> = ({ goals, mode, onChange, onPickOwner }) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const dark = theme.palette.mode === 'dark'
  const headerBg = dark ? 'rgba(255,255,255,0.06)' : 'grey.100'
  const goalBg = dark ? 'rgba(76, 175, 80, 0.16)' : '#E8F1E6'
  const baseBorder = { border: '1px solid', borderColor: 'divider' }
  const cellSx = { ...baseBorder, px: 1, py: 0.75, fontSize: '0.85rem', verticalAlign: 'middle' as const, color: 'text.primary' }
  const headSx = { ...cellSx, fontWeight: 700, textAlign: 'center' as const, bgcolor: headerBg, whiteSpace: 'nowrap' as const }
  const goalCellSx = { ...cellSx, bgcolor: goalBg, textAlign: 'center' as const, fontWeight: 700, whiteSpace: 'pre-line' as const }

  const planEditable = mode === 'plan'
  const kpiEditable = mode === 'kpi'
  const kpiReadOnly = mode === 'kpiReadOnly'

  const renderEditableTextCell = (value: string | null | undefined, onCh?: (v: string) => void) =>
    planEditable
      ? <TextField size="small" fullWidth multiline minRows={2}
          value={value || ''} onChange={(e) => onCh?.(e.target.value)} />
      : (value
          ? <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{value}</Typography>
          : null)

  const renderQuarterCell = (idx: number, g: EhsPlanGoal, qk: 'q1' | 'q2' | 'q3' | 'q4', sk: 'q1Status' | 'q2Status' | 'q3Status' | 'q4Status') => {
    const checked = !!g[qk]
    const status = (g[sk] as string | null | undefined) || ''

    if (planEditable) {
      return (
        <Checkbox size="small" checked={checked}
          onChange={(e) => onChange?.(idx, { [qk]: e.target.checked } as Partial<EhsPlanGoal>)} />
      )
    }
    if (kpiEditable) {
      if (!checked) return null
      return (
        <Select size="small" displayEmpty value={status}
          onChange={(e) => onChange?.(idx, { [sk]: e.target.value || null } as Partial<EhsPlanGoal>)}
          renderValue={(v) => v
            ? (
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: KPI_STATUS_COLOR[v as string] }} />
                <Box component="span">{KPI_STATUS_LABEL[v as string]}</Box>
              </Box>
            )
            : <Box component="span" sx={{ color: 'text.disabled' }}>○</Box>
          }
          sx={{ minWidth: 90, '& .MuiSelect-select': { py: 0.5, pr: '24px !important' } }}
        >
          <MenuItem value="">선택</MenuItem>
          {KPI_QUARTER_STATUSES.map(s => (
            <MenuItem key={s} value={s}>
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                <Box component="span" sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: KPI_STATUS_COLOR[s] }} />
                {KPI_STATUS_LABEL[s]}
              </Box>
            </MenuItem>
          ))}
        </Select>
      )
    }
    // kpiReadOnly: 작업완료된 KPI — 분기 상태 표시는 유지, 편집은 불가
    if (kpiReadOnly) {
      if (!checked) return null
      if (status) {
        return (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: '0.8rem' }}>
            <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: KPI_STATUS_COLOR[status] }} />
            <Box component="span">{KPI_STATUS_LABEL[status]}</Box>
          </Box>
        )
      }
      return <Box component="span" sx={{ color: 'success.main', fontWeight: 700 }}>○</Box>
    }
    // readOnly (연간 계획 상세 등): 동그라미만 표기, 상태값은 노출하지 않음
    if (!checked) return null
    return <Box component="span" sx={{ color: 'success.main', fontWeight: 700 }}>○</Box>
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
        {t('pkg.goalPlanTitle', '목표 추진계획')}
      </Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto', borderColor: 'divider' }}>
        <Table size="small" sx={{ minWidth: 1300, borderCollapse: 'collapse' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...headSx, minWidth: 130 }} rowSpan={2}>{t('pkg.goal', '목표')}</TableCell>
              <TableCell sx={{ ...headSx, minWidth: 150 }} rowSpan={2}>{t('pkg.subGoal', '세부목표')}</TableCell>
              <TableCell sx={{ ...headSx, minWidth: 200 }} rowSpan={2}>{t('pkg.task', '실행과제')}</TableCell>
              <TableCell sx={{ ...headSx, minWidth: 180 }} rowSpan={2}>{t('pkg.kpi', '성과지표')}</TableCell>
              <TableCell sx={{ ...headSx, minWidth: 120 }} rowSpan={2}>{t('pkg.prevResult', '전년실적')}</TableCell>
              <TableCell sx={{ ...headSx, minWidth: 140 }} rowSpan={2}>{t('pkg.targetValue', '목표')}</TableCell>
              <TableCell sx={headSx} colSpan={4}>{t('pkg.schedule', '추진일정')}</TableCell>
              <TableCell sx={{ ...headSx, minWidth: 160 }} rowSpan={2}>{t('pkg.owner', '담당자')}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ ...headSx, minWidth: kpiEditable ? 110 : 56 }}>1Q</TableCell>
              <TableCell sx={{ ...headSx, minWidth: kpiEditable ? 110 : 56 }}>2Q</TableCell>
              <TableCell sx={{ ...headSx, minWidth: kpiEditable ? 110 : 56 }}>3Q</TableCell>
              <TableCell sx={{ ...headSx, minWidth: kpiEditable ? 110 : 56 }}>4Q</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {GOAL_TEMPLATE.map((tpl, idx) => {
              const g = goals[idx] || ({} as EhsPlanGoal)
              return (
                <TableRow key={idx}>
                  {tpl.goalRowSpan > 0 && (
                    <TableCell sx={goalCellSx} rowSpan={tpl.goalRowSpan}>
                      {tpl.goalText}
                    </TableCell>
                  )}
                  <TableCell sx={{ ...cellSx, bgcolor: goalBg, textAlign: 'center', whiteSpace: 'pre-line' }}>
                    {tpl.subGoal}
                  </TableCell>
                  <TableCell sx={cellSx}>{renderEditableTextCell(g.task, (v) => onChange?.(idx, { task: v }))}</TableCell>
                  <TableCell sx={cellSx}>{renderEditableTextCell(g.kpi, (v) => onChange?.(idx, { kpi: v }))}</TableCell>
                  <TableCell sx={cellSx}>{renderEditableTextCell(g.prevResult, (v) => onChange?.(idx, { prevResult: v }))}</TableCell>
                  <TableCell sx={cellSx}>{renderEditableTextCell(g.targetValue, (v) => onChange?.(idx, { targetValue: v }))}</TableCell>
                  <TableCell sx={{ ...cellSx, textAlign: 'center' }}>{renderQuarterCell(idx, g, 'q1', 'q1Status')}</TableCell>
                  <TableCell sx={{ ...cellSx, textAlign: 'center' }}>{renderQuarterCell(idx, g, 'q2', 'q2Status')}</TableCell>
                  <TableCell sx={{ ...cellSx, textAlign: 'center' }}>{renderQuarterCell(idx, g, 'q3', 'q3Status')}</TableCell>
                  <TableCell sx={{ ...cellSx, textAlign: 'center' }}>{renderQuarterCell(idx, g, 'q4', 'q4Status')}</TableCell>
                  <TableCell sx={cellSx}>
                    {planEditable
                      ? <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                          <TextField size="small" fullWidth value={[g.ownerTeam, g.ownerName].filter(Boolean).join(' / ')} InputProps={{ readOnly: true }} />
                          <IconButton size="small" onClick={() => onPickOwner?.(idx)}>
                            <PersonSearchIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      : <Typography variant="body2" sx={{ textAlign: 'center' }}>
                          {[g.ownerTeam, g.ownerName].filter(Boolean).join(' / ') || ''}
                        </Typography>}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default GoalsTable
