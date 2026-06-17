import { useState, useEffect } from 'react'
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Avatar,
  Divider,
  Tooltip,
  CircularProgress,
} from '@mui/material'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import LogoutIcon from '@mui/icons-material/Logout'
import ExploreIcon from '@mui/icons-material/Explore'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { isSystemAdmin } from '../../utils/auth'
import { DEV_SESSION_KEY, devToolsEnabled } from '../../utils/devMode'
import LanguageSelector from './LanguageSelector'
import ThemeSelector from './ThemeSelector'

// 슈퍼관리자가 시작한 계정 전환(impersonation) 세션 표식.
// 비-관리자 계정으로 전환해도 이 플래그로 전환 메뉴를 유지(서버는 토큰 imp 클레임으로 인가).
const IMP_ACTIVE_KEY = 'imp_active'

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
  { id: 'jihyun.nam',    name: '남지현',   label: '교육훈련관리자' },
  { id: 'com4in',        name: 'com4in',  label: '관리자' },
]

const Header: React.FC = () => {
  const { t } = useTranslation()
  const { user, login, impersonate, logout } = useAuth()
  const queryClient = useQueryClient()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [switchingTo, setSwitchingTo] = useState<string | null>(null)
  const [loginError, setLoginError] = useState<string | null>(null)

  // com4in_dev 로 로그인하면 dev 세션 플래그를 남겨, 이후 다른 계정으로 전환해도 계정전환 메뉴를 유지.
  useEffect(() => {
    if (user?.username === 'com4in_dev') {
      sessionStorage.setItem(DEV_SESSION_KEY, '1')
    }
  }, [user?.username])

  // 계정 전환 메뉴 노출:
  //  - 운영: 슈퍼관리자(SYSTEM_ADMIN)이거나 슈퍼관리자가 시작한 전환 세션(imp_active)일 때만 (서버도 동일 검증).
  //  - localhost: 개발 편의상 모두 노출(비-관리자는 impersonate 거부 시 공통 비번 로그인으로 폴백).
  const showDevSwitch =
    devToolsEnabled() &&
    (window.location.hostname === 'localhost' ||
      isSystemAdmin(user) ||
      sessionStorage.getItem(IMP_ACTIVE_KEY) === '1')

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    handleMenuClose()
    sessionStorage.removeItem(DEV_SESSION_KEY)
    sessionStorage.removeItem(IMP_ACTIVE_KEY)
    logout()
  }

  const handleDevLogin = async (id: string) => {
    handleMenuClose()
    setSwitchingTo(id)
    setLoginError(null)
    try {
      // 비밀번호 없이 계정 전환 — 서버가 현재 사용자(SYSTEM_ADMIN) 권한을 검증해 대상 토큰 발급.
      await impersonate(id)
      sessionStorage.setItem(IMP_ACTIVE_KEY, '1')  // 전환 세션 유지 → 비-관리자로 전환해도 메뉴/복귀 가능
      queryClient.clear()  // 이전 사용자 캐시 전체 삭제
    } catch (err: unknown) {
      // localhost 개발 편의: 현재 계정이 슈퍼관리자가 아니면 impersonate 가 거부(403)되므로
      // 공통 비번 로그인으로 폴백(테스트 계정은 com4in!! 공유). 운영에서는 폴백 없이 에러 노출.
      if (window.location.hostname === 'localhost') {
        try {
          await login({ username: id, password: 'com4in!!' })
          queryClient.clear()
        } catch (err2: unknown) {
          setLoginError(`${id}: ${err2 instanceof Error ? err2.message : '전환 실패'}`)
        }
      } else {
        setLoginError(`${id}: ${err instanceof Error ? err.message : '전환 실패'}`)
      }
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
            color="inherit"
            onClick={() => {
              const host = window.location.hostname
              window.open(`https://${host}:7602`, '_blank')
            }}
            size="small"
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
          {showDevSwitch && (
          <>
          <Divider />
          <Box sx={{ px: 2, pt: 0.5, pb: 0.25 }}>
            <Typography variant="caption" color="text.disabled">DEV 계정 전환</Typography>
          </Box>
          <Divider />
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
          </>
          )}
        </Menu>
      </Box>

    </Box>
  )
}

export default Header
