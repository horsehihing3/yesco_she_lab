import { useEffect, useRef, useState, useCallback } from 'react'
import { Box, CircularProgress, Typography, Button, Paper, Tooltip } from '@mui/material'
import FactoryIcon from '@mui/icons-material/Factory'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import SettingsIcon from '@mui/icons-material/Settings'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import MapIcon from '@mui/icons-material/Map'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import { mapService } from '../../services/MapService'
import { Factory, MOCK_FACTORIES, hasFactoryAlarm } from '../../types/map.types'

interface MarkerPosition {
  factoryId: string
  x: number
  y: number
  visible: boolean
}

interface VWorldMapProps {
  onFactorySelect?: (factory: Factory) => void
  onFactoryDoubleClick?: (factory: Factory) => void
  selectedFactoryId?: string | null
  fullZoom?: boolean
}

const VWorldMap: React.FC<VWorldMapProps> = ({ onFactorySelect, onFactoryDoubleClick, selectedFactoryId, fullZoom = false }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(false)
  const lastClickRef = useRef<{ factoryId: string; time: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFallback, setShowFallback] = useState(false)
  const [factories] = useState<Factory[]>(MOCK_FACTORIES)
  const [markerPositions, setMarkerPositions] = useState<MarkerPosition[]>([])

  useEffect(() => {
    // Skip if already mounted or initializing (React StrictMode protection)
    // The global __vworldInitializing flag prevents race conditions
    if (mountedRef.current || window.__vworldInitializing) {
      // If map is already initialized, just render markers
      if (mapService.isMapInitialized()) {
        setIsLoading(false)
        renderFactoryMarkers()
      }
      return
    }
    mountedRef.current = true

    initMap()

    // Cleanup on unmount - only clear markers, don't reset mountedRef
    return () => {
      mapService.clearMarkers()
    }
  }, [])

  useEffect(() => {
    if (mapService.isMapInitialized()) {
      renderFactoryMarkers()
    }
  }, [factories])

  // Update HTML marker positions
  const updateMarkerPositions = useCallback(() => {
    if (!mapService.isMapInitialized()) return

    const positions: MarkerPosition[] = []
    const map = mapService.getMap()
    const viewer = window.viewer

    // Try to get canvas dimensions
    const container = mapContainerRef.current
    if (!container) return

    const containerRect = container.getBoundingClientRect()

    factories.forEach((factory) => {
      try {
        let screenPos: { x: number; y: number } | null = null

        // Method 1: VWorld map.getScreenPosition (if available)
        if (map?.getScreenPosition) {
          const pos = map.getScreenPosition(factory.longitude, factory.latitude)
          if (pos) screenPos = { x: pos.x, y: pos.y }
        }

        // Method 2: Cesium-based conversion
        if (!screenPos && viewer?.scene && window.Cesium) {
          const cartesian = window.Cesium.Cartesian3?.fromDegrees?.(
            factory.longitude,
            factory.latitude,
            0
          )
          if (cartesian && viewer.scene.cartesianToCanvasCoordinates) {
            const pos = viewer.scene.cartesianToCanvasCoordinates(cartesian)
            if (pos) screenPos = { x: pos.x, y: pos.y }
          }
        }

        // Method 3: viewer.getScreenPosition (if available)
        if (!screenPos && viewer?.getScreenPosition) {
          const pos = viewer.getScreenPosition(factory.longitude, factory.latitude)
          if (pos) screenPos = { x: pos.x, y: pos.y }
        }

        if (screenPos) {
          positions.push({
            factoryId: factory.id,
            x: screenPos.x,
            y: screenPos.y,
            visible: screenPos.x >= -50 && screenPos.x <= containerRect.width + 50 &&
                     screenPos.y >= -50 && screenPos.y <= containerRect.height + 50,
          })
        }
      } catch (e) {
        // Coordinate conversion not available
      }
    })

    setMarkerPositions(positions)
  }, [factories])

  // Update marker positions on camera move
  useEffect(() => {
    if (!mapService.isMapInitialized()) return

    // Log available methods for debugging (only once)
    const map = mapService.getMap()
    const coordMethods = map ? Object.keys(map).filter(k =>
      k.toLowerCase().includes('screen') || k.toLowerCase().includes('position') || k.toLowerCase().includes('coord')
    ) : []
    const clickMethods = map ? Object.keys(map).filter(k =>
      k.toLowerCase().includes('click') || k.toLowerCase().includes('event')
    ) : []

    console.log('VWorld API Analysis:')
    console.log('- Coordinate methods:', coordMethods.length > 0 ? coordMethods : 'none')
    console.log('- Click/Event methods:', clickMethods.length > 0 ? clickMethods : 'none')
    console.log('- Cesium available:', !!window.Cesium)
    console.log('- Viewer available:', !!window.viewer)

    if (coordMethods.length === 0) {
      console.log('⚠️ HTML 마커를 사용할 수 없습니다. 맵 클릭 또는 공장 리스트를 사용해주세요.')
    }

    // Initial update
    updateMarkerPositions()

    // Only run animation if we have coordinate conversion
    if (coordMethods.length > 0 || window.Cesium || window.viewer?.scene) {
      let animationId: number
      let lastUpdate = 0
      const animate = () => {
        const now = Date.now()
        if (now - lastUpdate > 50) {
          updateMarkerPositions()
          lastUpdate = now
        }
        animationId = requestAnimationFrame(animate)
      }

      const timeout = setTimeout(() => {
        animationId = requestAnimationFrame(animate)
      }, 2000)

      return () => {
        clearTimeout(timeout)
        if (animationId) cancelAnimationFrame(animationId)
      }
    }
  }, [isLoading, updateMarkerPositions])

  // Zoom to selected factory when selectedFactoryId changes
  useEffect(() => {
    if (selectedFactoryId && mapService.isMapInitialized()) {
      const factory = factories.find(f => f.id === selectedFactoryId)
      if (factory) {
        // fullZoom = true: 150m (full zoom for floor plan view)
        // fullZoom = false: 400m (medium zoom for factory selection)
        const altitude = fullZoom ? 150 : 400
        mapService.animateToPosition(
          { lat: factory.latitude, lng: factory.longitude },
          altitude
        )
      }
    }
  }, [selectedFactoryId, fullZoom, factories])

  const initMap = async () => {
    if (!mapContainerRef.current) return

    try {
      setIsLoading(true)
      setError(null)
      setShowFallback(false)

      // MapService now handles container validation and re-initialization internally
      await mapService.initialize(mapContainerRef.current, {
        center: { lat: 36.5, lng: 127.5 }, // Korea center
      })

      // Render markers after delay
      setTimeout(() => {
        renderFactoryMarkers()
      }, 1000)

      setIsLoading(false)
    } catch (err: any) {
      setError(err.message || 'VWorld API를 로드할 수 없습니다.')
      setIsLoading(false)
    }
  }

  const renderFactoryMarkers = () => {
    if (!mapService.isMapInitialized()) return

    mapService.clearMarkers()

    factories.forEach((factory) => {
      const status = hasFactoryAlarm(factory) ? 'alarm' : 'normal'

      mapService.addMarker(
        { lat: factory.latitude, lng: factory.longitude },
        {
          markerType: 'factory',
          status,
          label: factory.name,
          data: factory,
          onMarkerClick: () => handleFactoryClick(factory),
        }
      )
    })
  }

  const handleFactoryClick = async (factory: Factory) => {
    const now = Date.now()
    const lastClick = lastClickRef.current

    // Check for double-click (same factory within 300ms)
    if (lastClick && lastClick.factoryId === factory.id && now - lastClick.time < 300) {
      // Double click - full zoom + show floor plan
      lastClickRef.current = null
      onFactoryDoubleClick?.(factory)

      // Full zoom (150m altitude - same as fullZoom prop)
      await mapService.animateToPosition(
        { lat: factory.latitude, lng: factory.longitude },
        150
      )
    } else {
      // Single click - select factory
      lastClickRef.current = { factoryId: factory.id, time: now }
      onFactorySelect?.(factory)

      // Medium zoom (400m altitude - same as non-fullZoom)
      await mapService.animateToPosition(
        { lat: factory.latitude, lng: factory.longitude },
        400
      )
    }
  }

  const handleRetry = () => {
    initMap()
  }

  const handleSkipMap = () => {
    setError(null)
    setShowFallback(true)
  }

  // Fallback UI when map fails to load
  const renderFallbackUI = () => (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        overflow: 'auto',
        p: 4,
      }}
    >
      <Box display="flex" justifyContent="center" alignItems="center" gap={1} mb={4}>
        <FactoryIcon sx={{ fontSize: '1.75rem', color: 'white' }} />
        <Typography variant="h5" color="white" fontWeight="bold">
          공장 목록
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 3,
          maxWidth: 1200,
          mx: 'auto',
        }}
      >
        {factories.map((factory) => (
          <Paper
            key={factory.id}
            sx={{
              p: 3,
              cursor: 'pointer',
              transition: 'all 0.3s',
              border: hasFactoryAlarm(factory) ? '2px solid #f44336' : 'none',
              bgcolor: hasFactoryAlarm(factory) ? '#fff5f5' : 'white',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
              },
            }}
            onClick={() => onFactorySelect?.(factory)}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                {factory.name}
              </Typography>
              {hasFactoryAlarm(factory) && (
                <Box
                  sx={{
                    bgcolor: '#f44336',
                    color: 'white',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 2,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <NotificationsActiveIcon sx={{ fontSize: '0.9rem' }} />
                  알람
                </Box>
              )}
            </Box>
            <Box display="flex" alignItems="center" gap={0.5} mb={1.5}>
              <LocationOnIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {factory.latitude.toFixed(4)}, {factory.longitude.toFixed(4)}
              </Typography>
            </Box>
            <Box display="flex" gap={1} flexWrap="wrap">
              {factory.fireStatus === 'alarm' && (
                <Box sx={{ bgcolor: '#ffebee', color: '#c62828', px: 1.5, py: 0.5, borderRadius: 1, fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocalFireDepartmentIcon sx={{ fontSize: '0.9rem' }} />
                  화재
                </Box>
              )}
              {factory.edsStatus === 'alarm' && (
                <Box sx={{ bgcolor: '#e3f2fd', color: '#1565c0', px: 1.5, py: 0.5, borderRadius: 1, fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <SettingsIcon sx={{ fontSize: '0.9rem' }} />
                  EDS
                </Box>
              )}
              {factory.ehsStatus === 'alarm' && (
                <Box sx={{ bgcolor: '#fff3e0', color: '#e65100', px: 1.5, py: 0.5, borderRadius: 1, fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <WarningAmberIcon sx={{ fontSize: '0.9rem' }} />
                  EHS
                </Box>
              )}
              {!hasFactoryAlarm(factory) && (
                <Box sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', px: 1.5, py: 0.5, borderRadius: 1, fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CheckCircleIcon sx={{ fontSize: '0.9rem' }} />
                  정상
                </Box>
              )}
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  )

  // Check if error requires page refresh
  const needsPageRefresh = error?.includes('새로고침')

  const handlePageRefresh = () => {
    window.location.reload()
  }

  // Error UI
  const renderErrorUI = () => (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        bgcolor: 'rgba(255, 255, 255, 0.98)',
        zIndex: 1000,
      }}
    >
      <Box textAlign="center" maxWidth={600} p={4}>
        <MapIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" fontWeight="bold" mb={1.5}>
          {needsPageRefresh ? '지도 재초기화 필요' : '지도를 로드할 수 없습니다'}
        </Typography>
        <Typography color="text.secondary" mb={3}>
          {error}
        </Typography>
        <Box display="flex" gap={2} justifyContent="center" mb={4}>
          {needsPageRefresh ? (
            <>
              <Button variant="contained" color="primary" onClick={handlePageRefresh}>
                페이지 새로고침
              </Button>
              <Button variant="outlined" onClick={handleSkipMap}>
                지도 없이 계속
              </Button>
            </>
          ) : (
            <>
              <Button variant="contained" onClick={handleSkipMap}>
                지도 없이 계속
              </Button>
              <Button variant="outlined" onClick={handleRetry}>
                다시 시도
              </Button>
            </>
          )}
        </Box>
        {!needsPageRefresh && (
          <Paper sx={{ p: 2, bgcolor: 'grey.100', textAlign: 'left' }}>
            <Typography variant="subtitle2" fontWeight="bold" mb={1}>
              문제 해결 방법:
            </Typography>
            <Typography variant="body2" component="ul" sx={{ pl: 2, m: 0 }}>
              <li>VWorld API 키가 올바른지 확인하세요</li>
              <li>도메인이 VWorld에 등록되어 있는지 확인하세요</li>
              <li>HTTP 환경에서는 도메인 등록이 필요 없습니다</li>
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  )

  // Loading UI
  const renderLoadingUI = () => (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        bgcolor: 'rgba(255, 255, 255, 0.98)',
        zIndex: 1000,
      }}
    >
      <CircularProgress size={40} sx={{ mb: 2 }} />
      <Typography color="text.secondary">지도 로딩 중...</Typography>
    </Box>
  )

  if (showFallback) {
    return renderFallbackUI()
  }

  // Render clickable HTML marker
  const renderHtmlMarker = (factory: Factory, position: MarkerPosition) => {
    if (!position.visible) return null

    const hasAlarm = hasFactoryAlarm(factory)
    const isSelected = selectedFactoryId === factory.id

    return (
      <Tooltip key={factory.id} title={factory.name} arrow placement="top">
        <Box
          onClick={() => handleFactoryClick(factory)}
          sx={{
            position: 'absolute',
            left: position.x,
            top: position.y,
            transform: 'translate(-50%, -50%)',
            width: isSelected ? 40 : 32,
            height: isSelected ? 40 : 32,
            borderRadius: '50%',
            bgcolor: hasAlarm ? '#F44336' : '#4CAF50',
            border: isSelected ? '4px solid #2196F3' : '3px solid white',
            boxShadow: isSelected
              ? '0 0 0 3px rgba(33, 150, 243, 0.4), 0 4px 12px rgba(0,0,0,0.3)'
              : '0 2px 8px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            zIndex: isSelected ? 1001 : 1000,
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '&:hover': {
              transform: 'translate(-50%, -50%) scale(1.15)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            },
            '&::after': {
              content: '""',
              width: '40%',
              height: '40%',
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.8)',
            },
          }}
        />
      </Tooltip>
    )
  }

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%', bgcolor: '#f5f5f5' }}>
      <Box
        ref={mapContainerRef}
        id="vmap"
        sx={{ width: '100%', height: '100%' }}
      />

      {/* HTML Overlay Markers */}
      {!isLoading && markerPositions.length > 0 && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            '& > *': { pointerEvents: 'auto' },
          }}
        >
          {factories.map((factory) => {
            const pos = markerPositions.find((p) => p.factoryId === factory.id)
            if (!pos) return null
            return renderHtmlMarker(factory, pos)
          })}
        </Box>
      )}

      {isLoading && renderLoadingUI()}
      {error && renderErrorUI()}
    </Box>
  )
}

export default VWorldMap
