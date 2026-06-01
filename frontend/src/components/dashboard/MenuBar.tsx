import { Box, Button, ButtonGroup, useTheme } from '@mui/material'
import AnalyticsIcon from '@mui/icons-material/Analytics'
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety'
import { useTranslation } from 'react-i18next'

export type PanelType = 'cctv' | 'ehs'

interface MenuBarProps {
  activePanels: PanelType[]
  onTogglePanel: (panel: PanelType) => void
  isMobile?: boolean
}

const MenuBar: React.FC<MenuBarProps> = ({ activePanels, onTogglePanel, isMobile = false }) => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const { t } = useTranslation()

  const menus: { id: PanelType; label: string; icon: React.ReactNode }[] = [
    { id: 'cctv', label: t('cctv.eventAnalysis'), icon: <AnalyticsIcon fontSize="small" /> },
    { id: 'ehs', label: t('dashboard.ehsStatus'), icon: <HealthAndSafetyIcon fontSize="small" /> },
  ]

  return (
    <Box sx={{ mb: isMobile ? 0 : 1.5 }}>
      <ButtonGroup
        size="small"
        variant="contained"
        sx={{
          boxShadow: isDark ? 'none' : 2,
          border: isDark ? `1px solid ${theme.palette.divider}` : 'none',
          borderRadius: 1,
          overflow: 'hidden',
          '& .MuiButton-root': {
            bgcolor: isDark ? 'background.paper' : 'white',
            color: 'text.primary',
            borderColor: theme.palette.divider,
            fontSize: isMobile ? '0.7rem' : '0.8rem',
            py: isMobile ? 0.5 : 0.75,
            px: isMobile ? 1 : 1.5,
            minWidth: isMobile ? 'auto' : undefined,
            '&:hover': {
              bgcolor: isDark ? 'action.hover' : 'grey.100',
            },
            '&.active': {
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            },
          },
        }}
      >
        {menus.map((menu) => (
          <Button
            key={menu.id}
            startIcon={!isMobile ? menu.icon : undefined}
            onClick={() => onTogglePanel(menu.id)}
            className={activePanels.includes(menu.id) ? 'active' : ''}
          >
            {isMobile ? menu.icon : menu.label}
          </Button>
        ))}
      </ButtonGroup>
    </Box>
  )
}

export default MenuBar
