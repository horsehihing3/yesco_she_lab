import { Paper, Typography, Box } from '@mui/material'

interface StatCardProps {
  value: number | string
  label: string
  sub?: string
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
}

const colorMap = {
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#f59e0b',
  red: '#ef4444',
  purple: '#a855f7',
}

const StatCard: React.FC<StatCardProps> = ({ value, label, sub, color = 'blue' }) => {
  const c = colorMap[color]
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0, left: 0, right: 0, height: 2,
          background: c,
        },
      }}
    >
      <Typography
        sx={{
          fontSize: 28,
          fontWeight: 900,
          fontFamily: 'JetBrains Mono, monospace',
          color: c,
          lineHeight: 1,
        }}
      >
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75, fontWeight: 500 }}>
        {label}
      </Typography>
      {sub && (
        <Box sx={{ mt: 0.5, fontSize: 11, color: c }}>{sub}</Box>
      )}
    </Paper>
  )
}

export default StatCard
