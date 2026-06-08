import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import axiosInstance from '../../api/axiosInstance'
import { ApiResponse } from '../../types/common.types'
import { EhsPlan, EhsPlanGoal } from '../../types/planKpiGoal.types'
import { GOAL_TEMPLATE } from './GoalsTable'

// 호환용 — 이전 GeneralDashboard 호출이 onClick 을 넘겨도 안전하도록 받지만 사용 안 함
type Props = {
  onClick?: () => void  // 무시됨 (통계 표 — 클릭 이동 비활성)
}

const currentYear = new Date().getFullYear()

const fetchApprovedPlans = async (year: number): Promise<EhsPlan[]> => {
  const res = await axiosInstance.get<ApiResponse<EhsPlan[]>>(`/ehs-plans/approved?year=${year}`)
  return res.data.data || []
}

// 같은 세부 목표끼리 plan들의 goal 값을 병합 (가장 최신 plan 우선)
const mergeGoalsBySubGoal = (plans: EhsPlan[]): Record<string, EhsPlanGoal> => {
  const result: Record<string, EhsPlanGoal> = {}
  // 작성일 오름차순 → 같은 키면 뒤쪽이 덮어쓰므로 최신 값이 남음
  const sorted = [...plans].sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''))
  for (const p of sorted) {
    for (const g of (p.goals || [])) {
      const key = (g.subGoal || '').trim()
      if (!key) continue
      result[key] = g
    }
  }
  return result
}

const SafetyGoalProgressTable: React.FC<Props> = () => {
  const { data: approved = [] } = useQuery({
    queryKey: ['safetyGoalProgress-approved', currentYear],
    queryFn: () => fetchApprovedPlans(currentYear),
  })

  const goalsBySub = useMemo(() => mergeGoalsBySubGoal(approved), [approved])

  const hSx = {
    bgcolor: 'grey.100',
    fontWeight: 'bold',
    fontSize: '1rem',
    textAlign: 'center' as const,
    whiteSpace: 'nowrap' as const,
    py: 1.5,
    px: 2,
  }
  const cSx = {
    fontSize: '1rem',
    px: 2,
    py: 1.5,
    wordBreak: 'keep-all' as const,
  }
  const goalLabelSx = {
    ...cSx,
    fontWeight: 'bold',
    bgcolor: 'grey.50',
    textAlign: 'center' as const,
  }

  const renderQ = (g: EhsPlanGoal | undefined, q: 'q1' | 'q2' | 'q3' | 'q4') => {
    if (!g || !g[q]) return ''
    return '○'
  }

  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{
        overflowX: 'auto',
        border: 1,
        borderColor: 'divider',
      }}
    >
      <Table size="small" sx={{
        minWidth: 900,
        '& td, & th': { borderRight: '1px solid', borderBottom: '1px solid', borderColor: 'divider' },
      }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ ...hSx, minWidth: 160 }} rowSpan={2}>목 표</TableCell>
            <TableCell sx={{ ...hSx, minWidth: 180 }} rowSpan={2}>세부 목표</TableCell>
            <TableCell sx={{ ...hSx, width: 110 }} rowSpan={2}>실행<br />({currentYear}년)</TableCell>
            <TableCell sx={{ ...hSx, minWidth: 160 }} rowSpan={2}>목표<br />({currentYear}년)</TableCell>
            <TableCell sx={hSx} colSpan={4}>추진결과</TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ ...hSx, width: 90 }}>1분기</TableCell>
            <TableCell sx={{ ...hSx, width: 90 }}>2분기</TableCell>
            <TableCell sx={{ ...hSx, width: 90 }}>3분기</TableCell>
            <TableCell sx={{ ...hSx, width: 90 }}>4분기</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {GOAL_TEMPLATE.map((tpl, idx) => {
            const goal = goalsBySub[tpl.subGoal.trim()]
            return (
              <TableRow key={idx}>
                {tpl.goalRowSpan > 0 && (
                  <TableCell sx={goalLabelSx} rowSpan={tpl.goalRowSpan}>{tpl.goalText}</TableCell>
                )}
                <TableCell sx={cSx}>{tpl.subGoal}</TableCell>
                <TableCell sx={{ ...cSx, textAlign: 'center', whiteSpace: 'pre-line' }}>{goal?.prevResult || ''}</TableCell>
                <TableCell sx={{ ...cSx, textAlign: 'center', whiteSpace: 'pre-line' }}>{goal?.targetValue || ''}</TableCell>
                <TableCell sx={{ ...cSx, textAlign: 'center' }}>{renderQ(goal, 'q1')}</TableCell>
                <TableCell sx={{ ...cSx, textAlign: 'center' }}>{renderQ(goal, 'q2')}</TableCell>
                <TableCell sx={{ ...cSx, textAlign: 'center' }}>{renderQ(goal, 'q3')}</TableCell>
                <TableCell sx={{ ...cSx, textAlign: 'center' }}>{renderQ(goal, 'q4')}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default SafetyGoalProgressTable
