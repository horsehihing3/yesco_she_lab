import { useState } from 'react'
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Avatar,
  Divider,
  Tooltip,
  Button,
  CircularProgress,
} from '@mui/material'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import LogoutIcon from '@mui/icons-material/Logout'
import ExploreIcon from '@mui/icons-material/Explore'
import TableViewIcon from '@mui/icons-material/TableView'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import LanguageSelector from './LanguageSelector'
import ThemeSelector from './ThemeSelector'

// DEV ONLY — 납품 전 삭제
const DEV_ACCOUNTS = [
  { id: 'jiwan.nam',     name: '남지완',   label: '글로벌경영관리팀 팀장' },
  { id: 'yeseo.moon',    name: '문예서',   label: '글로벌경영관리팀 팀원' },
  { id: 'jungho.yoo',    name: '유정호',   label: '글로벌경영관리팀 팀원' },
  { id: 'horsehihing3',  name: '정경석',   label: '글로벌경영관리팀 팀원' },
  { id: 'yujeong.jung',  name: '정유정',   label: '글로벌경영관리팀 팀원' },
  { id: 'gs5655',        name: '홍길동',   label: '글로벌경영관리팀 팀원' },
  { id: 'junseok.kwak',  name: '곽준석',   label: 'T/S팀 팀장' },
  { id: 'yuhyun.ha',     name: '하유현',   label: 'T/S팀 팀원' },
  { id: 'com4in',        name: 'com4in',  label: '관리자' },
]

const Header: React.FC = () => {
  const { t } = useTranslation()
  const { user, login, logout } = useAuth()
  const queryClient = useQueryClient()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [switchingTo, setSwitchingTo] = useState<string | null>(null)
  const [loginError, setLoginError] = useState<string | null>(null)

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    handleMenuClose()
    logout()
  }

  const handleDevLogin = async (id: string) => {
    handleMenuClose()
    setSwitchingTo(id)
    setLoginError(null)
    try {
      await login({ username: id, password: 'com4in!!' })
      queryClient.clear()  // 이전 사용자 캐시 전체 삭제
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '로그인 실패'
      setLoginError(`${id}: ${msg}`)
    } finally {
      setSwitchingTo(null)
    }
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>

        {/* Emergency Exit Compass */}
        <Tooltip title={t('dashboard.emergencyExit')}>
          <IconButton
            onClick={() => {
              const host = window.location.hostname
              window.open(`https://${host}:7502`, '_blank')
            }}
            size="small"
            sx={{
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)',
              },
            }}
          >
            <ExploreIcon />
          </IconButton>
        </Tooltip>

        {/* Language Selector */}
        <LanguageSelector />

        {/* Theme Selector — 언어 선택과 동일한 드롭다운 패턴 */}
        <ThemeSelector />

        <Tooltip title={loginError ?? ''} open={!!loginError} arrow>
          <IconButton onClick={(e) => { setLoginError(null); handleMenuOpen(e) }} size="small">
            <Avatar sx={{ width: 32, height: 32, bgcolor: loginError ? 'error.main' : 'primary.main' }}>
              {switchingTo
                ? <CircularProgress size={16} sx={{ color: 'white' }} />
                : user?.name?.charAt(0) || user?.username?.charAt(0) || 'U'
              }
            </Avatar>
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              {user?.name || user?.username}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.email}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={handleMenuClose}>
            <AccountCircleIcon sx={{ mr: 1 }} fontSize="small" />
            {t('auth.profile')}
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <LogoutIcon sx={{ mr: 1 }} fontSize="small" />
            {t('auth.logout')}
          </MenuItem>

          {/* DEV ONLY — 빠른 계정 전환 (납품 전 삭제) */}
          <Divider />
          <Box sx={{ px: 2, pt: 0.5, pb: 0.25 }}>
            <Typography variant="caption" color="text.disabled">DEV 계정 전환</Typography>
          </Box>
          <Divider />
          <Box sx={{ px: 2, pt: 0.5, pb: 0.25 }}>
            <Typography variant="caption" color="text.disabled">DEV 계정 전환</Typography>
          </Box>
          {DEV_ACCOUNTS.map(({ id, name, label }) => (
            <MenuItem
              key={id}
              onClick={() => handleDevLogin(id)}
              disabled={switchingTo !== null}
              selected={user?.username === id}
              sx={{ py: 0.5, minHeight: 0 }}
            >
              {switchingTo === id
                ? <CircularProgress size={14} sx={{ mr: 1 }} />
                : <Avatar sx={{ width: 18, height: 18, fontSize: '0.6rem', mr: 1, bgcolor: user?.username === id ? 'primary.main' : 'grey.400' }}>
                    {name.charAt(0)}
                  </Avatar>
              }
              <Typography variant="body2">{name}</Typography>
              <Typography variant="caption" color="text.disabled" sx={{ ml: 0.75 }}>
                {label}
              </Typography>
            </MenuItem>
          ))}
        </Menu>
      </Box>

    </Box>
  )
}

export default Header
