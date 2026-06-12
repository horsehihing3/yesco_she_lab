import { Paper, Typography, Box } from '@mui/material'

interface StatCardProps {
  value: number | string
  label: string
  sub?: string
  // color prop은 호환성을 위해 유지 (좌측 액센트는 모드별 nav-on 색상 사용)
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
}

const NAV_ON_DEFAULT = '#2563eb'   // 라이트/다크 사이드바 active 색상
const NAV_ON_YESCO = '#E60012'     // 예스코 사이드바 active 색상 (LS Red)

const StatCard: React.FC<StatCardProps> = ({ value, label, sub }) => (
  <Paper
    variant="outlined"
    sx={(theme: any) => ({
      p: 2.5,
      pl: 3,
      position: 'relative',
      overflow: 'hidden',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      ...(theme.isYesco && {
        border: 1,
        borderColor: '#0F2147',
      }),
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        width: 4,
        backgroundColor: theme.isYesco ? NAV_ON_YESCO : NAV_ON_DEFAULT,
        borderTopLeftRadius: 'inherit',
        borderBottomLeftRadius: 'inherit',
      },
    })}
  >
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="h4" fontWeight="bold" sx={{ mt: 0.5 }}>{value}</Typography>
    {sub && (
      <Box sx={{ mt: 0.5, fontSize: 11, color: 'text.secondary' }}>{sub}</Box>
    )}
  </Paper>
)

export default StatCard
