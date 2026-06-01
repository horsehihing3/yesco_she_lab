import { useCallback, useState, useEffect, useRef } from 'react'
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api'
import {
  Box,
  CircularProgress,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import MapIcon from '@mui/icons-material/Map'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt'
import TerrainIcon from '@mui/icons-material/Terrain'
import CheckIcon from '@mui/icons-material/Check'
import { Factory, MOCK_FACTORIES, hasFactoryAlarm } from '../../types/map.types'
import FloorPlanOverlay from './FloorPlanOverlay'

// Google Maps API Key and Map ID
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
const GOOGLE_MAPS_MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || ''
const LIBRARIES: ('marker')[] = ['marker']

// Map style options
const MAP_STYLES = {
  roadmap: { id: 'roadmap', label: '기본', icon: LightModeIcon },
  terrain: { id: 'terrain', label: '지형', icon: TerrainIcon },
  satellite: { id: 'satellite', label: '위성', icon: SatelliteAltIcon },
  hybrid: { id: 'hybrid', label: '하이브리드', icon: DarkModeIcon },
} as const

type MapStyleKey = keyof typeof MAP_STYLES

interface GoogleMapViewProps {
  onFactorySelect?: (factory: Factory) => void
  selectedFactoryId?: string | null
}

const containerStyle = {
  width: '100%',
  height: '100%',
}

// Korea center
const defaultCenter = {
  lat: 36.5,
  lng: 127.5,
}

const defaultZoom = 8
const defaultTilt = 45
const defaultHeading = 0

const GoogleMapView: React.FC<GoogleMapViewProps> = ({ onFactorySelect, selectedFactoryId }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [mapStyle, setMapStyle] = useState<MapStyleKey>('hybrid')
  const [zoomedFactory, setZoomedFactory] = useState<Factory | null>(null)
  const [markerPosition, setMarkerPosition] = useState<{ x: number; y: number } | null>(null)
  const [styleMenuAnchor, setStyleMenuAnchor] = useState<null | HTMLElement>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([])

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    language: 'ko',
    libraries: LIBRARIES,
  })

  // Update marker position on screen - use container center since map pans to marker
  const updateMarkerPosition = useCallback(() => {
    if (mapContainerRef.current) {
      const rect = mapContainerRef.current.getBoundingClientRect()
      // Since map pans to center on the factory, marker is at container center
      // With 3D tilt (60 degrees), the center point appears lower on screen
      // Adjust y position to compensate for perspective effect
      setMarkerPosition({
        x: rect.width / 2,
        y: rect.height * 0.55 // Marker appears slightly below center due to 3D tilt
      })
    }
  }, [])

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance)

    // Wait for map to be fully ready then set 3D view
    google.maps.event.addListenerOnce(mapInstance, 'idle', () => {
      mapInstance.setTilt(defaultTilt)
      mapInstance.setHeading(defaultHeading)
    })
  }, [])

  const onUnmount = useCallback(() => {
    setMap(null)
  }, [])

  // Handle map style change
  const handleStyleChange = (_: React.MouseEvent<HTMLElement>, newStyle: MapStyleKey | null) => {
    if (newStyle && map) {
      setMapStyle(newStyle)
      map.setMapTypeId(newStyle)
    }
  }

  // Mobile menu handlers
  const handleStyleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setStyleMenuAnchor(event.currentTarget)
  }

  const handleStyleMenuClose = () => {
    setStyleMenuAnchor(null)
  }

  const handleMobileStyleChange = (newStyle: MapStyleKey) => {
    if (map) {
      setMapStyle(newStyle)
      map.setMapTypeId(newStyle)
    }
    handleStyleMenuClose()
  }

  // Update when selectedFactoryId changes
  useEffect(() => {
    if (selectedFactoryId && map) {
      const factory = MOCK_FACTORIES.find((f) => f.id === selectedFactoryId)
      if (factory) {
        map.panTo({ lat: factory.latitude, lng: factory.longitude })
        map.setZoom(14)
        map.setTilt(60)
      }
    }
  }, [selectedFactoryId, map])

  // Handle marker click
  const handleMarkerClick = (factory: Factory) => {
    onFactorySelect?.(factory)

    if (map) {
      if (isMobile) {
        // Mobile: single click zooms and shows floor plan
        map.panTo({ lat: factory.latitude, lng: factory.longitude })
        map.setZoom(18)
        map.setTilt(60)

        setTimeout(() => {
          setZoomedFactory(factory)
          updateMarkerPosition()
        }, 1000)
      } else {
        // PC: single click just zooms
        map.panTo({ lat: factory.latitude, lng: factory.longitude })
        map.setZoom(14)
        map.setTilt(60)
      }
    }
  }

  // Handle marker double click (PC only)
  const handleMarkerDblClick = (factory: Factory) => {
    onFactorySelect?.(factory)

    if (map) {
      map.panTo({ lat: factory.latitude, lng: factory.longitude })
      map.setZoom(18)
      map.setTilt(60)

      setTimeout(() => {
        setZoomedFactory(factory)
        updateMarkerPosition()
      }, 1000)
    }
  }

  // Track zoom changes to hide floor plan
  useEffect(() => {
    if (!map) return

    const listener = map.addListener('zoom_changed', () => {
      const zoom = map.getZoom()
      if (zoom && zoom < 17 && zoomedFactory) {
        setZoomedFactory(null)
        setMarkerPosition(null)
      }
    })

    const moveListener = map.addListener('center_changed', () => {
      if (zoomedFactory) {
        updateMarkerPosition()
      }
    })

    return () => {
      google.maps.event.removeListener(listener)
      google.maps.event.removeListener(moveListener)
    }
  }, [map, zoomedFactory, updateMarkerPosition])

  // Create markers using AdvancedMarkerElement
  useEffect(() => {
    if (!map) return

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      marker.map = null
    })
    markersRef.current = []

    // Create markers for each factory
    MOCK_FACTORIES.forEach((factory) => {
      const hasAlarm = hasFactoryAlarm(factory)
      const color = hasAlarm ? '#F44336' : '#4CAF50'

      // Create custom pin element
      const pinElement = document.createElement('div')
      pinElement.innerHTML = `
        <svg width="40" height="50" viewBox="0 0 24 30" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 18 12 18s12-9 12-18c0-6.63-5.37-12-12-12z" fill="${color}"/>
          <circle cx="12" cy="12" r="6" fill="white"/>
          <circle cx="12" cy="12" r="3" fill="${color}"/>
        </svg>
      `
      pinElement.style.cursor = 'pointer'

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: factory.latitude, lng: factory.longitude },
        content: pinElement,
        title: factory.name,
      })

      // Click handler
      marker.addListener('click', () => {
        handleMarkerClick(factory)
      })

      // Double click handler for PC
      pinElement.addEventListener('dblclick', (e) => {
        e.stopPropagation()
        handleMarkerDblClick(factory)
      })

      markersRef.current.push(marker)
    })

    return () => {
      markersRef.current.forEach((marker) => {
        marker.map = null
      })
      markersRef.current = []
    }
  }, [map])

  if (!GOOGLE_MAPS_API_KEY) {
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
          Google Maps API 키를 .env 파일에 설정해주세요
        </Typography>
        <Typography variant="caption" color="text.secondary" mt={1}>
          VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
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
          지도를 로드할 수 없습니다
        </Typography>
        <Typography color="text.secondary">Google Maps API 키를 확인해주세요</Typography>
      </Box>
    )
  }

  if (!isLoaded) {
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
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography color="text.secondary">지도 로딩 중...</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }} ref={mapContainerRef}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={defaultZoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          mapId: GOOGLE_MAPS_MAP_ID,
          mapTypeId: mapStyle,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          tilt: defaultTilt,
          heading: defaultHeading,
          gestureHandling: 'greedy',
        }}
      >
        {/* Markers are created via useEffect using native Google Maps API */}
      </GoogleMap>

      {/* Map Style Selector - PC */}
      {!isMobile && (
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

      {/* Map Style Selector - Mobile */}
      {isMobile && (
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
                sx: { mt: 0.5, minWidth: 120 },
              },
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
                {mapStyle === key && <CheckIcon fontSize="small" color="primary" sx={{ ml: 1 }} />}
              </MenuItem>
            ))}
          </Menu>
        </>
      )}

      {/* Floor Plan Overlay */}
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

export default GoogleMapView
