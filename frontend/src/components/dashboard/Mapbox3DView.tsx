import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import {
  Box,
  CircularProgress,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import LayersIcon from '@mui/icons-material/Layers'
import CheckIcon from '@mui/icons-material/Check'
import MapIcon from '@mui/icons-material/Map'
import RouteIcon from '@mui/icons-material/Route'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt'
import TerrainIcon from '@mui/icons-material/Terrain'
import { Factory, MOCK_FACTORIES, hasFactoryAlarm } from '../../types/map.types'
import FloorPlanOverlay from './FloorPlanOverlay'
import { useTranslation } from 'react-i18next'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''

// Map styles with 3D building support
const MAP_STYLES = {
  standard: {
    id: 'mapbox://styles/mapbox/standard',
    labelKey: 'map.standard',
    icon: MapIcon,
    has3DBuildings: true, // Built-in
  },
  streets: {
    id: 'mapbox://styles/mapbox/streets-v12',
    labelKey: 'map.road',
    icon: RouteIcon,
    has3DBuildings: false,
  },
  light: {
    id: 'mapbox://styles/mapbox/light-v11',
    labelKey: 'map.light',
    icon: LightModeIcon,
    has3DBuildings: false,
  },
  dark: {
    id: 'mapbox://styles/mapbox/dark-v11',
    labelKey: 'map.dark',
    icon: DarkModeIcon,
    has3DBuildings: false,
  },
  satelliteStreets: {
    id: 'mapbox://styles/mapbox/satellite-streets-v12',
    labelKey: 'map.satellite',
    icon: SatelliteAltIcon,
    has3DBuildings: false,
  },
  outdoors: {
    id: 'mapbox://styles/mapbox/outdoors-v12',
    labelKey: 'map.outdoors',
    icon: TerrainIcon,
    has3DBuildings: false,
  },
} as const

type MapStyleKey = keyof typeof MAP_STYLES

interface Mapbox3DViewProps {
  onFactorySelect?: (factory: Factory) => void
  selectedFactoryId?: string | null
}

const Mapbox3DView: React.FC<Mapbox3DViewProps> = ({
  onFactorySelect,
  selectedFactoryId,
}) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map())
  const [isLoaded, setIsLoaded] = useState(false)
  const [zoomedFactory, setZoomedFactory] = useState<Factory | null>(null)
  const [markerPosition, setMarkerPosition] = useState<{ x: number; y: number } | null>(null)
  const [mapStyle, setMapStyle] = useState<MapStyleKey>('satelliteStreets')
  const [styleMenuAnchor, setStyleMenuAnchor] = useState<null | HTMLElement>(null)
  const onFactorySelectRef = useRef(onFactorySelect)
  const zoomedFactoryRef = useRef<Factory | null>(null)

  useEffect(() => {
    onFactorySelectRef.current = onFactorySelect
  }, [onFactorySelect])

  // Update ref when zoomedFactory changes
  useEffect(() => {
    zoomedFactoryRef.current = zoomedFactory
  }, [zoomedFactory])

  // Calculate marker screen position from map coordinates
  const updateMarkerPosition = useCallback(() => {
    if (!mapRef.current || !zoomedFactoryRef.current) return

    const point = mapRef.current.project([
      zoomedFactoryRef.current.longitude,
      zoomedFactoryRef.current.latitude
    ])

    setMarkerPosition({ x: point.x, y: point.y })
  }, [])

  const flyToFactory = useCallback((factory: Factory, closeView = true) => {
    if (!mapRef.current) return
    mapRef.current.flyTo({
      center: [factory.longitude, factory.latitude],
      zoom: closeView ? 17 : 14,
      pitch: 60,
      bearing: 30,
      duration: 2000,
    })
  }, [])

  // Add 3D buildings layer
  const add3DBuildings = useCallback((map: mapboxgl.Map) => {
    if (map.getLayer('3d-buildings')) return

    const layers = map.getStyle().layers
    const labelLayerId = layers?.find(
      (layer) => layer.type === 'symbol' && layer.layout?.['text-field']
    )?.id

    map.addLayer(
      {
        id: '3d-buildings',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        minzoom: 15,
        paint: {
          'fill-extrusion-color': '#aaa',
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': ['get', 'min_height'],
          'fill-extrusion-opacity': 0.6,
        },
      },
      labelLayerId
    )
  }, [])

  // Change map style
  const handleStyleChange = useCallback((styleKey: MapStyleKey) => {
    if (!mapRef.current) return

    const style = MAP_STYLES[styleKey]
    mapRef.current.setStyle(style.id)

    mapRef.current.once('style.load', () => {
      const map = mapRef.current!

      // Re-add terrain
      if (!map.getSource('mapbox-dem')) {
        map.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14,
        })
      }
      map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 })

      // Add 3D buildings if style doesn't have them built-in
      if (!style.has3DBuildings) {
        add3DBuildings(map)
      }

      // Re-add sky
      if (!map.getLayer('sky')) {
        map.addLayer({
          id: 'sky',
          type: 'sky',
          paint: {
            'sky-type': 'atmosphere',
            'sky-atmosphere-sun': [0.0, 90.0],
            'sky-atmosphere-sun-intensity': 15,
          },
        })
      }
    })

    setMapStyle(styleKey)
    setStyleMenuAnchor(null)
  }, [add3DBuildings])

  // Resize map when container size changes (e.g., sidebar collapse)
  useEffect(() => {
    if (!mapContainerRef.current || !mapRef.current) return

    let resizeTimeout: ReturnType<typeof setTimeout>
    let lastWidth = mapContainerRef.current.offsetWidth

    const resizeObserver = new ResizeObserver((entries) => {
      const newWidth = entries[0]?.contentRect.width
      if (newWidth === lastWidth) return
      lastWidth = newWidth

      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.resize()
        }
      }, 350)
    })

    resizeObserver.observe(mapContainerRef.current)

    return () => {
      clearTimeout(resizeTimeout)
      resizeObserver.disconnect()
    }
  }, [isLoaded])

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || !MAPBOX_TOKEN) return

    mapboxgl.accessToken = MAPBOX_TOKEN

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLES[mapStyle].id,
      center: [127.5, 36.5],
      zoom: 7,
      pitch: 50,
      bearing: 0,
      antialias: true,
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

      // Add 3D buildings if style doesn't have them built-in
      if (!MAP_STYLES[mapStyle].has3DBuildings) {
        add3DBuildings(map)
      }

      // Add sky
      map.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 90.0],
          'sky-atmosphere-sun-intensity': 15,
        },
      })

      // Add markers
      MOCK_FACTORIES.forEach((factory) => {
        const hasAlarm = hasFactoryAlarm(factory)
        const color = hasAlarm ? '#F44336' : '#4CAF50'

        const el = document.createElement('div')
        el.innerHTML = `
          <svg width="40" height="50" viewBox="0 0 24 30" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 18 12 18s12-9 12-18c0-6.63-5.37-12-12-12z" fill="${color}"/>
            <circle cx="12" cy="12" r="6" fill="white"/>
            <circle cx="12" cy="12" r="3" fill="${color}"/>
          </svg>
        `
        el.style.cursor = 'pointer'

        const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([factory.longitude, factory.latitude])
          .addTo(map)

        // Single click - zoom to factory and show floor plan (collapsed)
        el.addEventListener('click', () => {
          onFactorySelectRef.current?.(factory)
          flyToFactory(factory, true)
          setTimeout(() => {
            setZoomedFactory(factory)
            updateMarkerPosition()
          }, 2000)
        })

        markersRef.current.set(factory.id, marker)
      })

      // Navigation controls
      map.addControl(new mapboxgl.NavigationControl(), 'top-right')
      map.addControl(new mapboxgl.FullscreenControl(), 'top-right')

      setIsLoaded(true)
    })

    // Track zoom to hide overlay
    map.on('zoom', () => {
      const zoom = map.getZoom()
      if (zoom < 16 && zoomedFactoryRef.current) {
        setZoomedFactory(null)
        setMarkerPosition(null)
      }
    })

    // Update marker position on every render frame (follows marker during pan/zoom)
    map.on('render', () => {
      if (zoomedFactoryRef.current) {
        updateMarkerPosition()
      }
    })

    return () => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current.clear()
      map.remove()
    }
  }, [])

  // Handle external factory selection
  useEffect(() => {
    if (selectedFactoryId && mapRef.current && isLoaded) {
      const factory = MOCK_FACTORIES.find((f) => f.id === selectedFactoryId)
      if (factory) flyToFactory(factory, false)
    }
  }, [selectedFactoryId, isLoaded, flyToFactory])

  if (!MAPBOX_TOKEN) {
    return (
      <Box sx={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#1a1a2e' }}>
        <Typography color="error">{t('map.noToken')}</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      <Box ref={mapContainerRef} sx={{ width: '100%', height: '100%' }} />

      {!isLoaded && (
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', bgcolor: 'rgba(0,0,0,0.8)', zIndex: 10 }}>
          <CircularProgress size={48} sx={{ mb: 2 }} />
          <Typography color="grey.400">{t('map.loading3D')}</Typography>
        </Box>
      )}

      {/* Map Style Selector */}
      {isLoaded && (
        <Box
          sx={{
            position: 'absolute',
            top: isMobile ? 8 : 10,
            left: isMobile ? 100 : '50%',
            transform: isMobile ? 'none' : 'translateX(-50%)',
            zIndex: 900,
          }}
        >
          <IconButton
            onClick={(e) => setStyleMenuAnchor(e.currentTarget)}
            sx={{
              bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'white',
              color: theme.palette.mode === 'dark' ? 'grey.100' : 'grey.700',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 2px 6px rgba(0,0,0,0.5)'
                : '0 2px 6px rgba(0,0,0,0.3)',
              border: theme.palette.mode === 'dark'
                ? `1px solid ${theme.palette.divider}`
                : 'none',
              '&:hover': {
                bgcolor: theme.palette.mode === 'dark' ? 'grey.700' : 'grey.100',
              },
            }}
          >
            <LayersIcon />
          </IconButton>
          <Menu
            anchorEl={styleMenuAnchor}
            open={Boolean(styleMenuAnchor)}
            onClose={() => setStyleMenuAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: isMobile ? 'left' : 'center' }}
            transformOrigin={{ vertical: 'top', horizontal: isMobile ? 'left' : 'center' }}
            PaperProps={{
              sx: {
                bgcolor: 'background.paper',
                color: 'text.primary',
              },
            }}
          >
            {Object.entries(MAP_STYLES).map(([key, style]) => {
              const IconComponent = style.icon
              const isSelected = mapStyle === key
              return (
                <MenuItem
                  key={key}
                  onClick={() => handleStyleChange(key as MapStyleKey)}
                  selected={isSelected}
                  sx={{
                    color: 'text.primary',
                    '&.Mui-selected': {
                      bgcolor: 'action.selected',
                    },
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: 'text.secondary' }}>
                    <IconComponent fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primaryTypographyProps={{ color: 'text.primary' }}>
                    {t(style.labelKey)}
                  </ListItemText>
                  {isSelected && (
                    <CheckIcon fontSize="small" sx={{ ml: 1, color: 'primary.main' }} />
                  )}
                </MenuItem>
              )
            })}
          </Menu>
        </Box>
      )}

      {zoomedFactory && markerPosition && (
        <FloorPlanOverlay
          factoryName={zoomedFactory.name}
          onClose={() => {
            setZoomedFactory(null)
            setMarkerPosition(null)
          }}
          markerPosition={markerPosition}
          initialExpanded={false}
        />
      )}
    </Box>
  )
}

export default Mapbox3DView
