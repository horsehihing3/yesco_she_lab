import { useCallback, useState, useEffect, useRef } from 'react'
import {
  Box,
  CircularProgress,
  Typography,
} from '@mui/material'
import { Factory, MOCK_FACTORIES } from '../../types/map.types'
import FloorPlanOverlay from './FloorPlanOverlay'
import { useTranslation } from 'react-i18next'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

interface GoogleMaps3DTilesViewProps {
  onFactorySelect?: (factory: Factory) => void
  selectedFactoryId?: string | null
  zoomToFactoryId?: string | null
  onZoomComplete?: () => void
}

const defaultCenter = { lat: 37.5665, lng: 126.9780 }
const defaultAltitude = 500
const defaultRange = 2000
const defaultTilt = 60
const defaultHeading = 0

const GoogleMaps3DTilesView: React.FC<GoogleMaps3DTilesViewProps> = ({
  onFactorySelect,
  selectedFactoryId,
  zoomToFactoryId,
  onZoomComplete,
}) => {
  const { t } = useTranslation()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [zoomedFactory, setZoomedFactory] = useState<Factory | null>(null)
  const [markerPosition, setMarkerPosition] = useState<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const updateMarkerPosition = useCallback(() => {
    if (!containerRef.current) {
      console.warn('[GoogleMaps3DTilesView] containerRef is null')
      return
    }
    const rect = containerRef.current.getBoundingClientRect()
    const pos = {
      x: rect.width / 2,
      y: rect.height * 0.5
    }
    console.log('[GoogleMaps3DTilesView] Setting marker position:', pos)
    setMarkerPosition(pos)
  }, [])

  // Generate iframe HTML content
  const iframeContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    gmp-map-3d { width: 100%; height: 100%; display: block; }
  </style>
</head>
<body>
  <gmp-map-3d
    id="map3d"
    center="${defaultCenter.lat},${defaultCenter.lng},${defaultAltitude}"
    range="${defaultRange}"
    tilt="${defaultTilt}"
    heading="${defaultHeading}">
  </gmp-map-3d>
  <script>
    (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src="https://maps.googleapis.com/maps/api/js?"+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
      key: "${GOOGLE_MAPS_API_KEY}",
      v: "alpha"
    });

    let map3dElement = null;
    const factories = ${JSON.stringify(MOCK_FACTORIES.map(f => ({
      id: f.id,
      name: f.name,
      lat: f.latitude,
      lng: f.longitude,
      hasAlarm: f.buildings?.some(b => b.floors?.some(fl => fl.zones?.some(z => z.alarms && z.alarms.length > 0)))
    })))};

    async function init() {
      try {
        await google.maps.importLibrary("maps3d");
        map3dElement = document.getElementById('map3d');

        // Wait for shadow root
        let attempts = 0;
        const waitForShadowRoot = () => {
          if (map3dElement.shadowRoot) {
            window.parent.postMessage({ type: 'map3d-ready' }, '*');
            addMarkers();
          } else if (attempts < 50) {
            attempts++;
            setTimeout(waitForShadowRoot, 200);
          } else {
            window.parent.postMessage({ type: 'map3d-error', message: 'Shadow root not created after 10 seconds' }, '*');
          }
        };
        waitForShadowRoot();
      } catch (e) {
        window.parent.postMessage({ type: 'map3d-error', message: e.message }, '*');
      }
    }

    function addMarkers() {
      factories.forEach(factory => {
        const color = factory.hasAlarm ? '#F44336' : '#4CAF50';
        const marker = document.createElement('gmp-marker-3d');
        marker.setAttribute('position', factory.lat + ',' + factory.lng + ',100');
        marker.setAttribute('altitude-mode', 'relative-to-ground');
        marker.setAttribute('extruded', 'true');
        marker.setAttribute('label', factory.name);

        const template = document.createElement('template');
        const img = document.createElement('img');
        img.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 24 30"><path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 18 12 18s12-9 12-18c0-6.63-5.37-12-12-12z" fill="' + color + '"/><circle cx="12" cy="12" r="6" fill="white"/><circle cx="12" cy="12" r="3" fill="' + color + '"/></svg>');
        img.style.width = '40px';
        img.style.height = '50px';
        img.style.cursor = 'pointer';
        template.content.appendChild(img);
        marker.appendChild(template);

        marker.addEventListener('click', () => {
          window.parent.postMessage({ type: 'marker-click', factoryId: factory.id }, '*');
          flyToFactory(factory, true);
        });

        map3dElement.appendChild(marker);
      });
    }

    function flyToFactory(factory, closeView) {
      if (!map3dElement || !map3dElement.flyCameraTo) return;
      const targetRange = closeView ? 400 : 1500;
      map3dElement.flyCameraTo({
        endCamera: {
          center: { lat: factory.lat, lng: factory.lng, altitude: 50 },
          tilt: 65,
          heading: 30,
          range: targetRange,
        },
        durationMillis: 2000,
      });
      if (closeView) {
        setTimeout(() => {
          window.parent.postMessage({ type: 'show-floorplan', factoryId: factory.id }, '*');
        }, 2500);
      }
    }

    window.addEventListener('message', (e) => {
      if (e.data.type === 'fly-to-factory') {
        const factory = factories.find(f => f.id === e.data.factoryId);
        if (factory) flyToFactory(factory, false);
      }
    });

    init();
  <\/script>
</body>
</html>
`

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('[GoogleMaps3DTilesView] Received message:', event.data)
      if (event.data.type === 'map3d-ready') {
        console.log('[GoogleMaps3DTilesView] Map is ready')
        setIsLoaded(true)
      } else if (event.data.type === 'map3d-error') {
        console.error('[GoogleMaps3DTilesView] Map error:', event.data.message)
        setLoadError(event.data.message)
      } else if (event.data.type === 'marker-click') {
        console.log('[GoogleMaps3DTilesView] Marker clicked:', event.data.factoryId)
        const factory = MOCK_FACTORIES.find(f => f.id === event.data.factoryId)
        if (factory) {
          onFactorySelect?.(factory)
        }
      } else if (event.data.type === 'show-floorplan') {
        console.log('[GoogleMaps3DTilesView] Show floorplan for:', event.data.factoryId)
        const factory = MOCK_FACTORIES.find(f => f.id === event.data.factoryId)
        if (factory) {
          console.log('[GoogleMaps3DTilesView] Setting zoomed factory:', factory.name)
          setZoomedFactory(factory)
          updateMarkerPosition()
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onFactorySelect, updateMarkerPosition])

  useEffect(() => {
    if (selectedFactoryId && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'fly-to-factory', factoryId: selectedFactoryId },
        '*'
      )
    }
  }, [selectedFactoryId])

  // Handle zoom to factory with floorplan
  useEffect(() => {
    if (zoomToFactoryId && iframeRef.current?.contentWindow) {
      console.log('[GoogleMaps3DTilesView] Zooming to factory with floorplan:', zoomToFactoryId)
      iframeRef.current.contentWindow.postMessage(
        { type: 'zoom-and-show-floorplan', factoryId: zoomToFactoryId },
        '*'
      )
      onZoomComplete?.()
    }
  }, [zoomToFactoryId, onZoomComplete])

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
          bgcolor: '#1a1a2e',
        }}
      >
        <Typography variant="h6" color="error" mb={2}>
          {t('map.noToken')}
        </Typography>
        <Typography color="grey.400">
          Google Maps API Key required
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
          bgcolor: '#1a1a2e',
        }}
      >
        <Typography variant="h6" color="error" mb={2}>
          {t('map.loadError')}
        </Typography>
        <Typography color="grey.400">{loadError}</Typography>
      </Box>
    )
  }

  return (
    <Box ref={containerRef} sx={{ position: 'relative', width: '100%', height: '100%' }}>
      <iframe
        ref={iframeRef}
        src="/map3d.html"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
        }}
        title="Google Maps 3D"
      />

      {!isLoaded && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            bgcolor: 'rgba(0,0,0,0.8)',
            zIndex: 10,
          }}
        >
          <CircularProgress size={48} sx={{ mb: 2 }} />
          <Typography color="grey.400">{t('map.loading3D')}</Typography>
        </Box>
      )}

      {zoomedFactory && markerPosition && (
        <>
          {console.log('[GoogleMaps3DTilesView] Rendering FloorPlanOverlay for:', zoomedFactory.name)}
          <FloorPlanOverlay
            factoryName={zoomedFactory.name}
            onClose={() => {
              console.log('[GoogleMaps3DTilesView] Closing FloorPlanOverlay')
              setZoomedFactory(null)
              setMarkerPosition(null)
            }}
            markerPosition={markerPosition}
            initialExpanded={false}
          />
        </>
      )}
    </Box>
  )
}

export default GoogleMaps3DTilesView
