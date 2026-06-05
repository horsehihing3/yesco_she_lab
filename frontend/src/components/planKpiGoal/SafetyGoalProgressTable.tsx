import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'

type Props = {
  onClick?: () => void
}

const SafetyGoalProgressTable: React.FC<Props> = ({ onClick }) => {
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

  return (
    <TableContainer
      component={Paper}
      onClick={onClick}
      sx={{
        overflowX: 'auto',
        border: 1,
        borderColor: 'grey.300',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s',
        ...(onClick ? { '&:hover': { boxShadow: 3 } } : {}),
      }}
    >
      <Table size="small" sx={{ minWidth: 900, '& td, & th': { borderRight: '1px solid', borderBottom: '1px solid', borderColor: 'grey.300' } }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ ...hSx, minWidth: 160 }} rowSpan={2}>목 표</TableCell>
            <TableCell sx={{ ...hSx, minWidth: 180 }} rowSpan={2}>세부 목표</TableCell>
            <TableCell sx={{ ...hSx, width: 110 }} rowSpan={2}>실행<br />(2026년)</TableCell>
            <TableCell sx={{ ...hSx, minWidth: 160 }} rowSpan={2}>목표<br />(2026년)</TableCell>
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
          <TableRow>
            <TableCell sx={goalLabelSx}>Ⅰ. 재해율 0.5% 미만</TableCell>
            <TableCell sx={cSx}>외근 중 교통사고, 안전사고 발생 zero화</TableCell>
            <TableCell sx={{ ...cSx, textAlign: 'center' }}>95%</TableCell>
            <TableCell sx={{ ...cSx, textAlign: 'center' }}>실행</TableCell>
            <TableCell sx={{ ...cSx, textAlign: 'center' }}>97%</TableCell>
            <TableCell sx={cSx}></TableCell>
            <TableCell sx={cSx}></TableCell>
            <TableCell sx={cSx}></TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={goalLabelSx} rowSpan={2}>Ⅱ. 산업안전보건교육 이수율 100%</TableCell>
            <TableCell sx={cSx}>근로자 정기 안전보건 교육 100% 달성</TableCell>
            <TableCell sx={{ ...cSx, textAlign: 'center' }}>85%</TableCell>
            <TableCell sx={cSx}>1. 4회(분기교육)<br />2. 전원이수</TableCell>
            <TableCell sx={{ ...cSx, textAlign: 'center' }}>100%</TableCell>
            <TableCell sx={cSx}></TableCell>
            <TableCell sx={cSx}></TableCell>
            <TableCell sx={cSx}></TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={cSx}>MSDS 확인 및 교육 시행</TableCell>
            <TableCell sx={{ ...cSx, textAlign: 'center' }}>98%</TableCell>
            <TableCell sx={cSx}>1. MSDS 기본/특별 교육 실시</TableCell>
            <TableCell sx={{ ...cSx, textAlign: 'center' }}>98%</TableCell>
            <TableCell sx={cSx}></TableCell>
            <TableCell sx={cSx}></TableCell>
            <TableCell sx={cSx}></TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={goalLabelSx}>Ⅲ. 구성원 건강검진 수검률 99% 이상</TableCell>
            <TableCell sx={cSx}>구성원 건강검진 수검률 100% 달성</TableCell>
            <TableCell sx={{ ...cSx, textAlign: 'center' }}>95%</TableCell>
            <TableCell sx={{ ...cSx, textAlign: 'center' }}>100%</TableCell>
            <TableCell sx={{ ...cSx, textAlign: 'center' }}>100%</TableCell>
            <TableCell sx={cSx}></TableCell>
            <TableCell sx={cSx}></TableCell>
            <TableCell sx={cSx}></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default SafetyGoalProgressTable
