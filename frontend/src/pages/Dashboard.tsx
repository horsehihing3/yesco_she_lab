import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Box, CircularProgress, useMediaQuery, useTheme, Collapse, Paper, Typography } from '@mui/material'
import WbSunnyIcon from '@mui/icons-material/WbSunny'
import { dashboardApi } from '../api/dashboardApi'
import { Factory, MOCK_FACTORIES } from '../types/map.types'
import VWorldMap from '../components/dashboard/VWorldMap'
import FactoryListOverlay from '../components/dashboard/FactoryListOverlay'
import EHSStatusPanel from '../components/dashboard/EHSStatusPanel'
import CCTVAnalysisPanel from '../components/dashboard/CCTVAnalysisPanel'
import MenuBar, { PanelType } from '../components/dashboard/MenuBar'
import WeatherWidget from '../components/dashboard/WeatherWidget'
import FloorPlanOverlay from '../components/dashboard/FloorPlanOverlay'

const Dashboard: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [selectedFactory, setSelectedFactory] = useState<Factory | null>(null)
  const [showFloorPlan, setShowFloorPlan] = useState(false)
  const [showWeatherWidget, setShowWeatherWidget] = useState(false)
  const [activePanels, setActivePanels] = useState<PanelType[]>(() => {
    // Mobile: panels disabled by default, PC: enabled by default
    if (typeof window !== 'undefined') {
      const isMobileDevice = window.matchMedia('(max-width: 899.95px)').matches
      return isMobileDevice ? [] : ['cctv', 'ehs']
    }
    return ['cctv', 'ehs']
  })
  const [factories] = useState<Factory[]>(MOCK_FACTORIES)

  // API Queries
  const { data: statistics, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', 'statistics'],
    queryFn: dashboardApi.getStatistics,
  })

  const { data: recentAlerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['dashboard', 'alerts'],
    queryFn: () => dashboardApi.getRecentAlerts(5),
  })

  const { data: recentMessages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['dashboard', 'messages'],
    queryFn: () => dashboardApi.getRecentMessages(5),
  })

  const isLoading = statsLoading || alertsLoading || messagesLoading

  // Handle factory selection (single click)
  const handleFactorySelect = (factory: Factory) => {
    setSelectedFactory(factory)
    setShowFloorPlan(false)
    // VWorldMap handles zoom via selectedFactoryId prop
  }

  // Handle factory double click - full zoom + floor plan
  const handleFactoryDoubleClick = (factory: Factory) => {
    setSelectedFactory(factory)
    setShowFloorPlan(true)
  }

  // Handle back to factory list
  const handleBackToList = () => {
    setSelectedFactory(null)
    setShowFloorPlan(false)
  }

  // Toggle panel visibility
  const handleTogglePanel = (panel: PanelType) => {
    setActivePanels((prev) =>
      prev.includes(panel) ? prev.filter((p) => p !== panel) : [...prev, panel]
    )
  }

  // Close specific panel
  const handleClosePanel = (panel: PanelType) => {
    setActivePanels((prev) => prev.filter((p) => p !== panel))
  }

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 'calc(100vh - 64px)',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: { xs: 'calc(100vh - 80px)', md: 'calc(100vh - 112px)' },
        overflow: 'hidden',
      }}
    >
      {/* VWorld Map - Full Screen */}
      <VWorldMap
        onFactorySelect={handleFactorySelect}
        onFactoryDoubleClick={handleFactoryDoubleClick}
        selectedFactoryId={selectedFactory?.id}
        fullZoom={showFloorPlan}
      />

      {/* Floor Plan Overlay - shown on double click */}
      {showFloorPlan && selectedFactory && (
        <FloorPlanOverlay
          factoryName={selectedFactory.name}
          onClose={() => setShowFloorPlan(false)}
        />
      )}

      {/* PC: Left Side Panels Container */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          position: 'absolute',
          left: 16,
          top: 16,
          bottom: 16,
          zIndex: 800,
          flexDirection: 'column',
          gap: 1.5,
          maxHeight: 'calc(100vh - 96px)',
          overflow: 'hidden',
        }}
      >
        {/* Menu Bar - Inside left panel area */}
        <MenuBar activePanels={activePanels} onTogglePanel={handleTogglePanel} />

        {/* CCTV Analysis Panel */}
        {activePanels.includes('cctv') && (
          <CCTVAnalysisPanel
            onClose={() => handleClosePanel('cctv')}
            factoryId={selectedFactory?.id}
          />
        )}

        {/* SHE Status Panel */}
        {activePanels.includes('ehs') && (
          <EHSStatusPanel
            factory={selectedFactory}
            statistics={statistics || null}
            messages={recentMessages}
            alerts={recentAlerts}
            onClose={() => handleClosePanel('ehs')}
          />
        )}
      </Box>

      {/* Mobile: Top Menu Bar */}
      <Box
        sx={{
          display: { xs: 'block', md: 'none' },
          position: 'absolute',
          left: 8,
          top: 8,
          zIndex: 800,
        }}
      >
        <MenuBar activePanels={activePanels} onTogglePanel={handleTogglePanel} isMobile />
      </Box>

      {/* Mobile: Bottom Panels Container */}
      <Box
        sx={{
          display: { xs: 'flex', md: 'none' },
          position: 'absolute',
          left: 8,
          right: 8,
          bottom: 8,
          zIndex: 800,
          flexDirection: 'column',
          gap: 1,
          maxHeight: 'calc(60vh)',
          overflow: 'hidden',
        }}
      >
        {/* CCTV Analysis Panel - Mobile */}
        {activePanels.includes('cctv') && (
          <CCTVAnalysisPanel
            onClose={() => handleClosePanel('cctv')}
            factoryId={selectedFactory?.id}
            isMobile
          />
        )}

        {/* SHE Status Panel - Mobile */}
        {activePanels.includes('ehs') && (
          <EHSStatusPanel
            factory={selectedFactory}
            statistics={statistics || null}
            messages={recentMessages}
            alerts={recentAlerts}
            onClose={() => handleClosePanel('ehs')}
            isMobile
          />
        )}
      </Box>

      {/* Factory List Overlay - Right Side (PC) / Top Right (Mobile) */}
      <FactoryListOverlay
        factories={factories}
        selectedFactory={selectedFactory}
        onFactorySelect={handleFactorySelect}
        onFactoryDoubleClick={handleFactoryDoubleClick}
        onBackToList={handleBackToList}
        isMobile={isMobile}
      />

      {/* Weather Widget - Bottom Right (PC: always visible, Mobile: toggle) */}
      <Box
        sx={{
          position: { xs: 'fixed', md: 'absolute' },
          right: { xs: 8, md: 16 },
          bottom: { xs: 8, md: 50 },
          zIndex: 800,
        }}
      >
        {/* PC: Full Weather Widget */}
        {!isMobile && <WeatherWidget isMobile={false} />}

        {/* Mobile: Quick Banner with Toggle */}
        {isMobile && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
            {/* Expanded Weather Widget */}
            <Collapse in={showWeatherWidget} timeout={200}>
              <WeatherWidget isMobile={true} onClose={() => setShowWeatherWidget(false)} />
            </Collapse>

            {/* Quick Banner Button */}
            {!showWeatherWidget && (
              <Paper
                onClick={() => setShowWeatherWidget(true)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 2,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 35, 0.92)' : 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(12px)',
                  cursor: 'pointer',
                  border: `1px solid ${theme.palette.divider}`,
                  boxShadow: theme.palette.mode === 'dark' ? '0 4px 12px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'scale(1.02)',
                  },
                }}
              >
                <WbSunnyIcon sx={{ fontSize: 20, color: '#FFD54F' }} />
                <Typography variant="body2" fontWeight="bold" sx={{ color: 'text.primary' }}>
                  --°
                </Typography>
              </Paper>
            )}
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default Dashboard
