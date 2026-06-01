import { Paper, Box, Typography, SxProps, Theme } from '@mui/material'

// 프로젝트 표준 폼 테이블 (ContractorManagementPage / RiskAssessmentTab 등에서 사용)
// 라벨 컬럼: 회색 배경, 가운데 정렬, 폭 128
// 값 컬럼: 흰 배경, flex 1
// 한 행에 [Label|Value] 또는 [Label|Value|Label|Value] 두 쌍 가능

export const labelSx: SxProps<Theme> = {
  // 데스크탑: 좌측 라벨열, 모바일: 값 위 라벨 행
  width: { xs: '100%', md: 128 }, minWidth: { xs: 'auto', md: 128 },
  fontWeight: 'bold', bgcolor: 'grey.100',
  px: { xs: 1.5, md: 2 }, py: { xs: 0.75, md: 1.5 },
  borderRight: { xs: 'none', md: '1px solid #71717a' },
  display: 'flex', alignItems: 'center', fontSize: '0.8rem',
  justifyContent: { xs: 'flex-start', md: 'center' },
  wordBreak: 'keep-all' as const, textAlign: { xs: 'left', md: 'center' },
}

export const valSx: SxProps<Theme> = {
  flex: 1, width: { xs: '100%', md: 'auto' }, minWidth: 0,
  px: 2, py: { xs: 1.25, md: 1.5 }, bgcolor: 'background.paper', fontSize: '0.875rem',
}

export const valSxBorder: SxProps<Theme> = {
  ...valSx as object,
  borderRight: { xs: 'none', md: '1px solid #71717a' },
}

// ── Wrappers ───────────────────────────────────
export const FormTable: React.FC<{ children: React.ReactNode; sx?: SxProps<Theme> }> = ({ children, sx }) => (
  <Paper variant="outlined" sx={{ border: 1, borderColor: '#71717a', borderRadius: 1, overflow: 'hidden', ...(sx as object) }}>
    {children}
  </Paper>
)

export const FormRow: React.FC<{ children: React.ReactNode; last?: boolean }> = ({ children, last }) => (
  <Box sx={{
    display: 'flex',
    flexDirection: { xs: 'column', md: 'row' },   // 모바일: 라벨/값 세로 스택
    borderBottom: last ? 0 : 1, borderColor: '#71717a',
  }}>
    {children}
  </Box>
)

export const FormLabel: React.FC<{ children: React.ReactNode; required?: boolean }> = ({ children, required }) => (
  <Typography sx={labelSx}>
    {children}
    {required && <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>}
  </Typography>
)

export const FormCell: React.FC<{ children: React.ReactNode; borderRight?: boolean; sx?: SxProps<Theme> }> = ({ children, borderRight, sx }) => (
  <Box sx={{ ...(borderRight ? valSxBorder as object : valSx as object), ...(sx as object) }}>
    {children}
  </Box>
)
