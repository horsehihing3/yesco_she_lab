import React from 'react'
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Tooltip } from '@mui/material'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import BusinessIcon from '@mui/icons-material/Business'
import PaletteIcon from '@mui/icons-material/Palette'
import CheckIcon from '@mui/icons-material/Check'
import { useTranslation } from 'react-i18next'
import { useThemeMode, type ThemeMode } from '../../context/ThemeContext'

const ThemeSelector: React.FC = () => {
  const { t } = useTranslation()
  const { mode, setMode } = useThemeMode()
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)
  const handleSelect = (m: ThemeMode) => {
    setMode(m)
    handleClose()
  }

  const themes: { code: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { code: 'yesco', label: t('theme.yescoMode', '예스코 모드'),  icon: <BusinessIcon  fontSize="small" /> },
    { code: 'dark',  label: t('theme.darkMode',  '다크 모드'),    icon: <DarkModeIcon  fontSize="small" /> },
    { code: 'light', label: t('theme.lightMode', '라이트 모드'), icon: <LightModeIcon fontSize="small" /> },
  ]

  return (
    <>
      <Tooltip title={t('theme.select', '테마 선택')}>
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{
            color: 'white',
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
          }}
        >
          <PaletteIcon />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {themes.map((th) => (
          <MenuItem
            key={th.code}
            onClick={() => handleSelect(th.code)}
            selected={mode === th.code}
          >
            <ListItemIcon>{th.icon}</ListItemIcon>
            <ListItemText>{th.label}</ListItemText>
            {mode === th.code && (
              <CheckIcon fontSize="small" sx={{ ml: 1, color: 'primary.main' }} />
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

export default ThemeSelector
