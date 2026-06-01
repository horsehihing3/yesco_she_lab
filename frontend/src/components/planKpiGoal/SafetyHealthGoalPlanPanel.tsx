import React from 'react'
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography,
  useTheme,
} from '@mui/material'

// 양식8 안전보건 목표 추진계획 (노경지원팀 2025년 기준) — 읽기 전용 참조 패널
interface Row {
  goal: string
  subGoal: string
  task: string
  kpi: string
  prevResult: string
  target: string
  q1: boolean; q2: boolean; q3: boolean; q4: boolean
  owner: string
  goalRowSpan?: number
}

const ROWS: Row[] = [
  {
    goal: 'Ⅰ. 재해율 0.5% 미만', goalRowSpan: 1,
    subGoal: '외근 중 교통사고,\n안전사고 발생 zero화',
    task: '1. 교통 안전교육 실시\n2. 작업 전 보호구 착용(안전모, 안전화)',
    kpi: '• 교통 안전교육 실시여부\n• 보호구 착용여부',
    prevResult: '실행', target: '실행',
    q1: true, q2: true, q3: true, q4: true,
    owner: '노경지원팀/팀원',
  },
  {
    goal: 'Ⅱ. 산업안전보건교육 이수율 100%', goalRowSpan: 2,
    subGoal: '근로자 정기 안전보건교육\n100% 달성',
    task: '1. 안전보건 교육 실시 요청\n2. 팀별 안전보건 교육 진행',
    kpi: '◆ 년4회이상 요청\n◆ 교육대상자 전원 이수',
    prevResult: '1. 4회(분기교육)\n2. 전원이수',
    target: '1. 4회(분기교육)\n2. 전원이수',
    q1: true, q2: true, q3: true, q4: true,
    owner: '노경지원팀/팀원',
  },
  {
    goal: '',
    subGoal: 'MSDS 확인 및 교육 시행',
    task: '1. MSDS 업데이트에 따른 교육',
    kpi: '◆ MSDS 기본교육 실행',
    prevResult: '1. MSDS 기본교육 재실시',
    target: '1. MSDS 기본/특별교육 실시',
    q1: true, q2: false, q3: false, q4: false,
    owner: '노경지원팀/자재담당자\n(김인정, 박정환)',
  },
  {
    goal: 'Ⅲ. 구성원 건강검진 수검률 99% 이상', goalRowSpan: 1,
    subGoal: '구성원 건강검진 수검률\n100% 달성',
    task: '1. 전 임직원 건강검진 매년 실시',
    kpi: '◆ 수검율 100% 달성',
    prevResult: '100%', target: '100%',
    q1: true, q2: true, q3: false, q4: false,
    owner: '노경지원팀/팀원',
  },
]

const HEADER_INFO = {
  title: '팀(노경지원팀) 안전보건 목표 추진계획',
  formNo: 'IMS-100-1',
  revisedDate: '2024.01.26',
  createdDate: '2025.05.12',
  authorTeam: '노경지원팀',
  authorRank: '매니저',
  authorName: '김윤진',
  approverTeam: '노경지원팀',
  approverRank: '팀장',
  approverName: '홍성기',
}

const SafetyHealthGoalPlanPanel: React.FC = () => {
  const theme = useTheme()
  const dark = theme.palette.mode === 'dark'

  // 테마 인지 스타일
  const headerBg = dark ? 'rgba(255,255,255,0.06)' : 'grey.100'
  const goalBg = dark ? 'rgba(76, 175, 80, 0.12)' : '#E8F1E6'
  const sectionBg = dark ? 'rgba(33, 150, 243, 0.08)' : '#F5F2FB'

  const cell = { borderRight: 1, borderBottom: 1, borderColor: 'divider', px: 1.25, py: 1, fontSize: '0.85rem', whiteSpace: 'pre-line' as const }
  const headCell = { ...cell, bgcolor: headerBg, fontWeight: 700, textAlign: 'center' as const, whiteSpace: 'nowrap' as const, color: 'text.primary' }

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
        안전보건 목표 추진계획
      </Typography>

      {/* 상단 헤더 박스 (작성일자 | 제목 | 서식번호/개정일자) */}
      <Box sx={{ overflowX: 'auto', mb: 2 }}>
      <Paper variant="outlined" sx={{ overflow: 'hidden', minWidth: 900, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'stretch', borderBottom: 1, borderColor: 'divider' }}>
          {/* 좌측: 작성일자 박스 */}
          <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 260, borderRight: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider', flex: 1 }}>
              <Box sx={{ width: 100, bgcolor: headerBg, fontWeight: 700, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', py: 1, borderRight: 1, borderColor: 'divider' }}>작성일자</Box>
              <Box sx={{ flex: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', py: 1 }}>{HEADER_INFO.createdDate}</Box>
            </Box>
            {/* 높이 맞춤용 빈 행 (우측 개정일자 행과 정렬) */}
            <Box sx={{ display: 'flex', flex: 1 }}>
              <Box sx={{ width: 100, bgcolor: headerBg, borderRight: 1, borderColor: 'divider' }} />
              <Box sx={{ flex: 1 }} />
            </Box>
          </Box>
          {/* 중앙: 제목 */}
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', px: 3, py: 2 }}>
            <Typography variant="h6" fontWeight="bold" textAlign="center">{HEADER_INFO.title}</Typography>
          </Box>
          {/* 우측: 서식번호 / 개정일자 */}
          <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 260, borderLeft: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider', flex: 1 }}>
              <Box sx={{ width: 100, bgcolor: headerBg, fontWeight: 700, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', py: 1, borderRight: 1, borderColor: 'divider' }}>서식번호</Box>
              <Box sx={{ flex: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', py: 1 }}>{HEADER_INFO.formNo}</Box>
            </Box>
            <Box sx={{ display: 'flex', flex: 1 }}>
              <Box sx={{ width: 100, bgcolor: headerBg, fontWeight: 700, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', py: 1, borderRight: 1, borderColor: 'divider' }}>개정일자</Box>
              <Box sx={{ flex: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', py: 1 }}>{HEADER_INFO.revisedDate}</Box>
            </Box>
          </Box>
        </Box>

        {/* 작성 · 승인 블록 — 한 Table 로 통합해 경계선 일관성 확보 */}
        <Table size="small" sx={{
          '& td': { borderRight: 1, borderColor: 'divider', py: 1, px: 1.5, textAlign: 'center' },
          '& td:last-child': { borderRight: 0 },
          '& tr': { borderBottom: 1, borderColor: 'divider' },
          '& tr:last-child': { borderBottom: 0 },
        }}>
          <TableBody>
            <TableRow>
              <TableCell rowSpan={2} sx={{ bgcolor: sectionBg, fontWeight: 700, width: 90, letterSpacing: '0.3em' }}>작 성</TableCell>
              <TableCell sx={{ bgcolor: headerBg, fontWeight: 700, width: 90 }}>팀 명</TableCell>
              <TableCell sx={{ bgcolor: headerBg, fontWeight: 700, width: 90 }}>직 급</TableCell>
              <TableCell sx={{ bgcolor: headerBg, fontWeight: 700, width: 90 }}>성 명</TableCell>
              <TableCell rowSpan={2} sx={{ bgcolor: sectionBg, fontWeight: 700, width: 90, letterSpacing: '0.3em' }}>승 인</TableCell>
              <TableCell sx={{ bgcolor: headerBg, fontWeight: 700, width: 90 }}>팀 명</TableCell>
              <TableCell sx={{ bgcolor: headerBg, fontWeight: 700, width: 90 }}>직 급</TableCell>
              <TableCell sx={{ bgcolor: headerBg, fontWeight: 700, width: 90 }}>성 명</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{HEADER_INFO.authorTeam}</TableCell>
              <TableCell>{HEADER_INFO.authorRank}</TableCell>
              <TableCell>{HEADER_INFO.authorName}</TableCell>
              <TableCell>{HEADER_INFO.approverTeam}</TableCell>
              <TableCell>{HEADER_INFO.approverRank}</TableCell>
              <TableCell>{HEADER_INFO.approverName}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Paper>
      </Box>

      {/* 추진계획 본 테이블 */}
      <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto', borderColor: 'divider' }}>
        <Table size="small" sx={{
          minWidth: 1300,
          '& th, & td': { borderRight: 1, borderBottom: 1, borderColor: 'divider', px: 1.25, py: 1 },
        }}>
          <TableHead>
            <TableRow>
              <TableCell rowSpan={2} sx={{ ...headCell, minWidth: 130 }}>목 표</TableCell>
              <TableCell rowSpan={2} sx={{ ...headCell, minWidth: 150 }}>세부 목표</TableCell>
              <TableCell rowSpan={2} sx={{ ...headCell, minWidth: 200 }}>실행 과제</TableCell>
              <TableCell rowSpan={2} sx={{ ...headCell, minWidth: 180 }}>성과지표<br />(KPI)</TableCell>
              <TableCell rowSpan={2} sx={{ ...headCell, minWidth: 120 }}>전년실적<br />(2024년)</TableCell>
              <TableCell rowSpan={2} sx={{ ...headCell, minWidth: 140 }}>목표<br />(2025년)</TableCell>
              <TableCell colSpan={4} sx={headCell}>추진일정</TableCell>
              <TableCell rowSpan={2} sx={{ ...headCell, minWidth: 140, borderLeft: '1px solid', borderLeftColor: 'divider' }}>담당자<br />(팀명/성명)</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ ...headCell, width: 56 }}>1분기</TableCell>
              <TableCell sx={{ ...headCell, width: 56 }}>2분기</TableCell>
              <TableCell sx={{ ...headCell, width: 56 }}>3분기</TableCell>
              <TableCell sx={{ ...headCell, width: 56 }}>4분기</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ROWS.map((r, idx) => {
              // 2번째, 3번째 행(Ⅱ 교육 / MSDS) 은 전년실적·목표 셀을 좌측 정렬
              const leftAlignResult = idx === 1 || idx === 2
              return (
              <TableRow key={idx}>
                {r.goalRowSpan && (
                  <TableCell rowSpan={r.goalRowSpan} sx={{ ...cell, bgcolor: goalBg, fontWeight: 700, textAlign: 'center', verticalAlign: 'middle' }}>
                    {r.goal}
                  </TableCell>
                )}
                <TableCell sx={{ ...cell, bgcolor: goalBg, textAlign: 'center' }}>{r.subGoal}</TableCell>
                <TableCell sx={cell}>{r.task}</TableCell>
                <TableCell sx={cell}>{r.kpi}</TableCell>
                <TableCell sx={{ ...cell, textAlign: leftAlignResult ? 'left' : 'center' }}>{r.prevResult}</TableCell>
                <TableCell sx={{ ...cell, textAlign: leftAlignResult ? 'left' : 'center' }}>{r.target}</TableCell>
                <TableCell sx={{ ...cell, textAlign: 'center' }}>{r.q1 && <Box component="span" sx={{ color: 'success.main', fontWeight: 700 }}>○</Box>}</TableCell>
                <TableCell sx={{ ...cell, textAlign: 'center' }}>{r.q2 && <Box component="span" sx={{ color: 'success.main', fontWeight: 700 }}>○</Box>}</TableCell>
                <TableCell sx={{ ...cell, textAlign: 'center' }}>{r.q3 && <Box component="span" sx={{ color: 'success.main', fontWeight: 700 }}>○</Box>}</TableCell>
                <TableCell sx={{ ...cell, textAlign: 'center' }}>{r.q4 && <Box component="span" sx={{ color: 'success.main', fontWeight: 700 }}>○</Box>}</TableCell>
                <TableCell sx={{ ...cell, textAlign: 'center', borderLeft: '1px solid', borderLeftColor: 'divider' }}>{r.owner}</TableCell>
              </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default SafetyHealthGoalPlanPanel
