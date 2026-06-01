import { useState } from 'react'
import { useNavigate, Outlet } from 'react-router-dom'
import { Box, Drawer, AppBar, Toolbar, IconButton, useTheme, Collapse } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import CloseIcon from '@mui/icons-material/Close'
import Sidebar from './Sidebar'
import Header from './Header'
import GlobalLoadingOverlay from './GlobalLoadingOverlay'
import { useThemeMode } from '../../context/ThemeContext'

const DRAWER_WIDTH = 256 // w-64 in tailwind
const DRAWER_COLLAPSED_WIDTH = 64

const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false)
  const { isDarkMode } = useThemeMode()
  const theme = useTheme()
  const navigate = useNavigate()

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const currentDrawerWidth = sidebarCollapsed ? DRAWER_COLLAPSED_WIDTH : DRAWER_WIDTH

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Global Loading Overlay for Language Change */}
      <GlobalLoadingOverlay />

      {/* AppBar - 100vw */}
      <AppBar
        position="fixed"
        className="no-print"
        sx={{
          width: '100vw',
          left: 0,
          backgroundColor: isDarkMode ? '#09090b' : '#0f172a',
          boxShadow: 'none',
          borderRadius: 0,
          borderTop: 'none',
          borderLeft: 'none',
          borderRight: 'none',
          borderBottom: isDarkMode ? '1px solid #27272a' : 'none',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' }, color: 'white' }}
          >
            <MenuIcon />
          </IconButton>
          {/* Logo */}
          <Box onClick={() => navigate('/')} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}>
            <Box component="img" src="/assets/logo-com4in-w.png" alt="COM4IN" sx={{ height: 46 }} />
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          {/* Desktop: show header buttons inline */}
          <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
            <Header />
          </Box>
          {/* Mobile: toggle button for second row */}
          <IconButton
            onClick={() => setMobileToolsOpen(!mobileToolsOpen)}
            size="small"
            sx={{
              display: { xs: 'flex', md: 'none' },
              color: 'white',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
            }}
          >
            {mobileToolsOpen ? <CloseIcon /> : <MoreVertIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>
      {/* Mobile: dropdown tools row below AppBar */}
      <Collapse
        in={mobileToolsOpen}
        sx={{
          display: { xs: 'block', md: 'none' },
          position: 'fixed',
          top: '56px', // mobile Toolbar height
          left: 0,
          right: 0,
          zIndex: (theme) => theme.zIndex.drawer + 2,
          backgroundColor: isDarkMode ? '#09090b' : '#0f172a',
          borderBottom: isDarkMode ? '1px solid #27272a' : '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            px: 2,
            py: 0.5,
          }}
        >
          <Header />
        </Box>
      </Collapse>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { md: currentDrawerWidth }, flexShrink: { md: 0 }, transition: 'width 0.3s' }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              border: 'none',
              borderRadius: 0,
              backgroundColor: isDarkMode ? '#18181b' : '#1e293b',
            },
          }}
        >
          <Toolbar />
          <Sidebar onMenuClick={handleDrawerToggle} />
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: currentDrawerWidth,
              border: 'none',
              borderRadius: 0,
              marginTop: '64px',
              backgroundColor: isDarkMode ? '#18181b' : '#1e293b',
              borderRight: isDarkMode ? '1px solid #27272a' : 'none',
              transition: 'width 0.3s',
              overflowX: 'hidden',
            },
          }}
          open
        >
          {/* Collapse Toggle Button - Top */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-end',
              p: 1,
              borderBottom: isDarkMode ? '1px solid #27272a' : '1px solid #334155',
            }}
          >
            <IconButton
              onClick={handleSidebarCollapse}
              sx={{
                backgroundColor: isDarkMode ? '#27272a' : '#334155',
                color: '#9ca3af',
                '&:hover': {
                  backgroundColor: isDarkMode ? '#3f3f46' : '#475569',
                },
              }}
              size="small"
            >
              {sidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          </Box>
          <Sidebar collapsed={sidebarCollapsed} />
        </Drawer>
      </Box>

      {/* Main Content — padding 은 본문 영역에만, TabBar 는 헤더 바로 아래 full width */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,
          width: { md: `calc(100% - ${currentDrawerWidth}px)` },
          maxWidth: { xs: '100vw', md: `calc(100vw - ${currentDrawerWidth}px)` },
          backgroundColor: theme.palette.background.default,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'width 0.3s, max-width 0.3s',
        }}
      >
        <Toolbar /> {/* Spacer for AppBar */}
        <Box sx={{
          width: '100%', flex: 1, overflow: 'auto', minHeight: 0,
          p: { xs: 1.5, sm: 2, md: 3 },
        }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}

export default Layout
