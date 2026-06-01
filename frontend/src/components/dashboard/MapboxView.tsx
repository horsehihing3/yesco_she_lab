import { useState, useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import { Box, CircularProgress, Typography, ToggleButtonGroup, ToggleButton, IconButton, Menu, MenuItem, ListItemIcon, ListItemText, useMediaQuery, useTheme } from '@mui/material'
import MapIcon from '@mui/icons-material/Map'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt'
import TerrainIcon from '@mui/icons-material/Terrain'
import CheckIcon from '@mui/icons-material/Check'
import { Factory, MOCK_FACTORIES, hasFactoryAlarm } from '../../types/map.types'
import FloorPlanOverlay from './FloorPlanOverlay'
import 'mapbox-gl/dist/mapbox-gl.css'

// Mapbox Access Token - should be in environment variable
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''

// Map style options
const MAP_STYLES = {
  dark: { id: 'mapbox://styles/mapbox/dark-v11', label: '다크', icon: DarkModeIcon },
  light: { id: 'mapbox://styles/mapbox/light-v11', label: '라이트', icon: LightModeIcon },
  satellite: { id: 'mapbox://styles/mapbox/satellite-streets-v12', label: '위성', icon: SatelliteAltIcon },
  outdoors: { id: 'mapbox://styles/mapbox/outdoors-v12', label: '야외', icon: TerrainIcon },
} as const

type MapStyleKey = keyof typeof MAP_STYLES

interface MapboxViewProps {
  onFactorySelect?: (factory: Factory) => void
  selectedFactoryId?: string | null
}

// Korea center
const defaultCenter: [number, number] = [127.5, 36.5] // [lng, lat]
const defaultZoom = 6

const MapboxView: React.FC<MapboxViewProps> = ({ onFactorySelect, selectedFactoryId }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map())
  const onFactorySelectRef = useRef(onFactorySelect)
  const markersAddedRef = useRef(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [mapStyle, setMapStyle] = useState<MapStyleKey>('dark')
  const [zoomedFactory, setZoomedFactory] = useState<Factory | null>(null)
  const [markerPosition, setMarkerPosition] = useState<{ x: number; y: number } | null>(null)
  const [currentZoom, setCurrentZoom] = useState<number>(defaultZoom)
  const [styleMenuAnchor, setStyleMenuAnchor] = useState<null | HTMLElement>(null)

  // Handle map style change (PC)
  const handleStyleChange = (_: React.MouseEvent<HTMLElement>, newStyle: MapStyleKey | null) => {
    if (newStyle && mapRef.current) {
      setMapStyle(newStyle)
      mapRef.current.setStyle(MAP_STYLES[newStyle].id)
    }
  }

  // Handle mobile menu
  const handleStyleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setStyleMenuAnchor(event.currentTarget)
  }

  const handleStyleMenuClose = () => {
    setStyleMenuAnchor(null)
  }

  const handleMobileStyleChange = (newStyle: MapStyleKey) => {
    if (mapRef.current) {
      setMapStyle(newStyle)
      mapRef.current.setStyle(MAP_STYLES[newStyle].id)
    }
    handleStyleMenuClose()
  }

  // Update marker position on screen
  const updateMarkerPosition = (factory: Factory) => {
    if (mapRef.current) {
      const point = mapRef.current.project([factory.longitude, factory.latitude])
      setMarkerPosition({ x: point.x, y: point.y })
    }
  }

  // Keep callback ref updated
  useEffect(() => {
    onFactorySelectRef.current = onFactorySelect
  }, [onFactorySelect])

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || !MAPBOX_ACCESS_TOKEN) return

    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: defaultCenter,
      zoom: defaultZoom,
      pitch: 45,
      bearing: 0,
    })

    mapRef.current = map

    map.on('load', () => {
      // Add 3D terrain
      map.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      })

      map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 })

      // Add sky layer for better 3D effect
      map.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 90.0],
          'sky-atmosphere-sun-intensity': 15,
        },
      })

      // Add navigation controls
      map.addControl(new mapboxgl.NavigationControl(), 'top-right')
      map.addControl(new mapboxgl.FullscreenControl(), 'top-right')

      // Add markers only once
      if (!markersAddedRef.current) {
        markersAddedRef.current = true

        MOCK_FACTORIES.forEach((factory) => {
          const hasAlarm = hasFactoryAlarm(factory)
          const color = hasAlarm ? '#F44336' : '#4CAF50'

          // Create custom marker element
          const el = document.createElement('div')
          el.className = 'factory-marker'
          el.innerHTML = `
            <svg width="32" height="40" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 18 12 18s12-9 12-18c0-6.63-5.37-12-12-12z" fill="${color}"/>
              <circle cx="12" cy="12" r="6" fill="white"/>
              <circle cx="12" cy="12" r="3" fill="${color}"/>
            </svg>
          `
          el.style.cursor = 'pointer'

          const marker = new mapboxgl.Marker({
            element: el,
            anchor: 'bottom', // Pin의 바닥 중앙을 앵커로 설정
          })
            .setLngLat([factory.longitude, factory.latitude])
            .addTo(map)

          // Check if mobile using window width
          const isMobileDevice = window.innerWidth < 900

          // Add click handler using ref to avoid stale closure
          el.addEventListener('click', () => {
            onFactorySelectRef.current?.(factory)

            if (isMobileDevice) {
              // On mobile, single click shows floor plan overlay
              map.flyTo({
                center: [factory.longitude, factory.latitude],
                zoom: 16,
                pitch: 60,
                duration: 1500,
              })
              // Show floor plan overlay after zoom animation
              setTimeout(() => {
                setZoomedFactory(factory)
                updateMarkerPosition(factory)
              }, 1500)
            } else {
              // On PC, single click just zooms
              map.flyTo({
                center: [factory.longitude, factory.latitude],
                zoom: 12,
                pitch: 60,
                duration: 1500,
              })
            }
          })

          // Add double-click handler for full zoom (PC only)
          el.addEventListener('dblclick', (e) => {
            e.stopPropagation()
            onFactorySelectRef.current?.(factory)
            map.flyTo({
              center: [factory.longitude, factory.latitude],
              zoom: 18,
              pitch: 60,
              duration: 2000,
            })
            // Show floor plan overlay after zoom animation
            setTimeout(() => {
              setZoomedFactory(factory)
              updateMarkerPosition(factory)
            }, 2000)
          })

          markersRef.current.set(factory.id, marker)
        })
      }

      setIsLoaded(true)
    })

    map.on('error', (e) => {
      console.error('Mapbox error:', e)
      setLoadError('지도를 로드할 수 없습니다. Mapbox 토큰을 확인해주세요.')
    })

    return () => {
      // Clean up markers
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current.clear()
      markersAddedRef.current = false
      // Clean up map
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Update when selectedFactoryId changes (from external source like factory list)
  useEffect(() => {
    if (selectedFactoryId && mapRef.current && isLoaded) {
      const factory = MOCK_FACTORIES.find(f => f.id === selectedFactoryId)
      if (factory) {
        mapRef.current.flyTo({
          center: [factory.longitude, factory.latitude],
          zoom: 12,
          pitch: 60,
          duration: 1500,
        })
      }
    }
  }, [selectedFactoryId, isLoaded])

  // Update marker position when map moves and track zoom level
  useEffect(() => {
    if (!mapRef.current) return

    const handleMove = () => {
      if (zoomedFactory) {
        updateMarkerPosition(zoomedFactory)
      }
    }

    const handleZoom = () => {
      if (mapRef.current) {
        const zoom = mapRef.current.getZoom()
        setCurrentZoom(zoom)
        // Hide floor plan overlay when zoom is less than 17
        if (zoom < 17 && zoomedFactory) {
          setZoomedFactory(null)
          setMarkerPosition(null)
        }
      }
    }

    mapRef.current.on('move', handleMove)
    mapRef.current.on('zoom', handleZoom)

    return () => {
      mapRef.current?.off('move', handleMove)
      mapRef.current?.off('zoom', handleZoom)
    }
  }, [zoomedFactory])

  if (!MAPBOX_ACCESS_TOKEN) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: '#f5f5f5',
        }}
      >
        <Typography variant="h6" color="error" mb={2}>
          지도를 로드할 수 없습니다
        </Typography>
        <Typography color="text.secondary">
          Mapbox Access Token을 .env 파일에 설정해주세요
        </Typography>
        <Typography variant="caption" color="text.secondary" mt={1}>
          VITE_MAPBOX_ACCESS_TOKEN=your_token_here
        </Typography>
      </Box>
    )
  }

  if (loadError) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: '#f5f5f5',
        }}
      >
        <Typography variant="h6" color="error" mb={2}>
          {loadError}
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      <Box
        ref={mapContainerRef}
        sx={{ width: '100%', height: '100%' }}
      />

      {/* Map Style Selector - PC: Top Center */}
      {isLoaded && !isMobile && (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 900,
          }}
        >
          <ToggleButtonGroup
            value={mapStyle}
            exclusive
            onChange={handleStyleChange}
            size="small"
            sx={{
              bgcolor: 'background.paper',
              boxShadow: 2,
              borderRadius: 1,
              '& .MuiToggleButton-root': {
                px: 2,
                py: 0.5,
                fontSize: '0.75rem',
                fontWeight: 600,
                border: 'none',
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                },
              },
            }}
          >
            {Object.entries(MAP_STYLES).map(([key, { label }]) => (
              <ToggleButton key={key} value={key}>
                {label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
      )}

      {/* Map Style Selector - Mobile: Quick Menu */}
      {isLoaded && isMobile && (
        <>
          <IconButton
            onClick={handleStyleMenuOpen}
            sx={{
              position: 'absolute',
              top: 8,
              left: 95,
              zIndex: 900,
              bgcolor: 'background.paper',
              boxShadow: 2,
              '&:hover': { bgcolor: 'grey.100' },
            }}
            size="small"
          >
            <MapIcon fontSize="small" />
          </IconButton>
          <Menu
            anchorEl={styleMenuAnchor}
            open={Boolean(styleMenuAnchor)}
            onClose={handleStyleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            transformOrigin={{ vertical: 'top', horizontal: 'center' }}
            slotProps={{
              paper: {
                sx: { mt: 0.5, minWidth: 120 }
              }
            }}
          >
            {Object.entries(MAP_STYLES).map(([key, { label, icon: Icon }]) => (
              <MenuItem
                key={key}
                onClick={() => handleMobileStyleChange(key as MapStyleKey)}
                selected={mapStyle === key}
                sx={{ py: 1 }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={label} primaryTypographyProps={{ fontSize: '0.875rem' }} />
                {mapStyle === key && (
                  <CheckIcon fontSize="small" color="primary" sx={{ ml: 1 }} />
                )}
              </MenuItem>
            ))}
          </Menu>
        </>
      )}

      {!isLoaded && (
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
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            zIndex: 10,
          }}
        >
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography color="text.secondary">지도 로딩 중...</Typography>
        </Box>
      )}

      {/* Floor Plan Overlay - shown when factory is fully zoomed */}
      {zoomedFactory && markerPosition && (
        <FloorPlanOverlay
          factoryName={zoomedFactory.name}
          onClose={() => {
            setZoomedFactory(null)
            setMarkerPosition(null)
          }}
          markerPosition={markerPosition}
        />
      )}
    </Box>
  )
}

export default MapboxView
