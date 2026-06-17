// VWorld 3D Map Service for Smart SHE Dashboard
// Reference: ehs_dashboard VWorld integration

interface LatLng {
  lat: number
  lng: number
}

interface MapOptions {
  center: LatLng
  zoom?: number
  minZoom?: number
  maxZoom?: number
}

type MarkerType = 'fire' | 'eds' | 'ehs' | 'factory' | 'cctv'

interface MarkerOptions {
  markerType: MarkerType
  status: 'normal' | 'alarm' | 'inactive'
  label: string
  data: any
  onMarkerClick?: () => void
}

const MARKER_COLORS = {
  normal: '#4CAF50',   // Green
  alarm: '#F44336',    // Red
  inactive: '#BDBDBD', // Gray
}

// Declare VWorld API types (version 2.0 WebGL)
declare global {
  interface Window {
    vw: {
      Map: any
      MapOptions: any
      CameraPosition: any
      CoordZ: any
      Direction: any
      BasemapType: any
      DensityType: any
    }
    viewer: any // VWorld global viewer instance (Cesium-based)
    Cesium?: any // Cesium library (used by VWorld internally)
    __vworldInitializing?: boolean // Flag to prevent race conditions during initialization
    __vworldInitialized?: boolean // Flag to track VWorld initialization (survives HMR)
    __vworldMapInstance?: any // Store map instance globally (survives HMR)
  }
}

// Global marker click handler for VWorld popup onclick
declare global {
  interface Window {
    __vworldMarkerClick?: (markerId: string) => void
  }
}

class MapService {
  private map: any = null
  private markers: Map<string, any> = new Map()
  private markerClickCallbacks: Map<string, () => void> = new Map()
  private isInitialized = false
  private scriptLoaded = false

  constructor() {
    // Register global marker click handler
    window.__vworldMarkerClick = (markerId: string) => {
      this.handleMarkerClick(markerId)
    }
  }

  /**
   * Load VWorld API script (loaded synchronously via index.html)
   */
  async loadVWorldScript(): Promise<boolean> {
    if (this.scriptLoaded || this.isVWorldLoaded()) {
      this.scriptLoaded = true
      return true
    }

    console.log('Waiting for VWorld API (loaded via index.html)...')

    // VWorld script is loaded synchronously in index.html
    // Wait for it to fully initialize
    const loaded = await this.waitForVWorld(100)
    this.scriptLoaded = loaded

    if (loaded) {
      console.log('VWorld API is ready!')
    } else {
      console.error('VWorld API not available. Check if script is properly loaded in index.html')
    }

    return loaded
  }

  /**
   * Check if VWorld API is loaded (version 2.0 WebGL)
   */
  isVWorldLoaded(): boolean {
    const hasVw = !!window.vw
    const hasMap = hasVw && !!window.vw.Map
    const hasMapOptions = hasVw && !!window.vw.MapOptions
    const hasCamera = hasVw && !!window.vw.CameraPosition
    const hasCoord = hasVw && !!window.vw.CoordZ
    const hasDir = hasVw && !!window.vw.Direction

    return hasVw && hasMap && hasMapOptions && hasCamera && hasCoord && hasDir
  }

  /**
   * Wait for VWorld API to load
   */
  async waitForVWorld(maxAttempts = 100): Promise<boolean> {
    let attempts = 0
    while (attempts < maxAttempts) {
      if (this.isVWorldLoaded()) {
        console.log('VWorld API is ready!')
        return true
      }

      // Log what's available every 10 attempts
      if (attempts % 10 === 0) {
        console.log(`VWorld check #${attempts}:`, {
          vw: !!window.vw,
          Map: window.vw?.Map ? 'yes' : 'no',
          MapOptions: window.vw?.MapOptions ? 'yes' : 'no',
          CameraPosition: window.vw?.CameraPosition ? 'yes' : 'no',
          CoordZ: window.vw?.CoordZ ? 'yes' : 'no',
          Direction: window.vw?.Direction ? 'yes' : 'no',
          BasemapType: window.vw?.BasemapType ? 'yes' : 'no',
          DensityType: window.vw?.DensityType ? 'yes' : 'no',
          allKeys: window.vw ? Object.keys(window.vw) : []
        })
      }

      await new Promise(resolve => setTimeout(resolve, 100))
      attempts++
    }

    console.error('VWorld API timeout. Final state:', {
      vw: !!window.vw,
      keys: window.vw ? Object.keys(window.vw) : []
    })
    return false
  }

  /**
   * Reset map state (call when navigating away and back)
   * Note: window.viewer cannot be reset - VWorld limitation
   */
  reset(): void {
    console.log('Resetting MapService state...')
    this.markers.clear()
    this.markerClickCallbacks.clear()
    this.map = null
    this.isInitialized = false
    window.__vworldInitialized = false
    window.__vworldInitializing = false
    window.__vworldMapInstance = undefined
    // Note: We cannot reset window.viewer - VWorld uses Object.defineProperties
    // which prevents redefinition. Page refresh is required for full reset.
  }

  /**
   * Initialize VWorld 3D Map
   */
  async initialize(container: HTMLElement, options: MapOptions): Promise<boolean> {
    // Check if container still has the canvas (DOM might be gone after navigation)
    const containerHasCanvas = container.querySelector('canvas')

    // CRITICAL: If window.viewer exists but container is empty, VWorld cannot be re-initialized
    // because window.viewer is defined with Object.defineProperties and cannot be redefined.
    // The only solution is to refresh the page.
    if (window.viewer && !containerHasCanvas) {
      console.log('VWorld viewer exists but container lost. Attempting page-level recovery...')
      // Try to find if the old canvas is still somewhere in the DOM
      const existingCanvas = document.querySelector('#vmap canvas, [id^="vmap"] canvas')
      if (!existingCanvas) {
        // Canvas is truly gone - need to refresh
        throw new Error('VWorld 맵을 다시 초기화할 수 없습니다. 페이지를 새로고침 해주세요.')
      }
    }

    // Check if VWorld viewer already exists globally with valid container
    if (window.viewer && window.__vworldInitialized && containerHasCanvas) {
      console.log('VWorld viewer already exists with valid container, reusing...')
      this.isInitialized = true
      if (window.__vworldMapInstance) {
        this.map = window.__vworldMapInstance
      }
      return true
    }

    // If map is supposedly initialized but container is empty, reset internal state
    if (!containerHasCanvas && (window.__vworldInitialized || this.isInitialized)) {
      console.log('Map container lost, resetting internal state...')
      this.markers.clear()
      this.markerClickCallbacks.clear()
      this.map = null
      this.isInitialized = false
      window.__vworldInitialized = false
      window.__vworldInitializing = false
      window.__vworldMapInstance = undefined
    }

    // Prevent re-initialization (React StrictMode can cause double mounting)
    if (this.isInitialized && this.map && containerHasCanvas) {
      console.log('VWorld map already initialized with valid container, skipping...')
      return true
    }

    // Prevent concurrent initialization
    if (window.__vworldInitializing) {
      console.log('VWorld initialization already in progress, waiting...')
      let attempts = 0
      while (window.__vworldInitializing && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100))
        attempts++
      }
      if (window.__vworldInitialized && window.__vworldMapInstance) {
        this.map = window.__vworldMapInstance
        this.isInitialized = true
        return true
      }
    }

    // If window.viewer already exists, we cannot create a new map
    if (window.viewer) {
      console.log('window.viewer already exists, cannot create new map. Page refresh required.')
      throw new Error('VWorld 맵을 다시 초기화할 수 없습니다. 페이지를 새로고침 해주세요.')
    }

    // Set initializing flag IMMEDIATELY (synchronously) to prevent race conditions
    window.__vworldInitializing = true

    // Load VWorld script first
    await this.loadVWorldScript()

    // Wait for VWorld API
    const isLoaded = await this.waitForVWorld()
    if (!isLoaded) {
      throw new Error('VWorld API가 로드되지 않았습니다. API 키와 도메인 설정을 확인하세요.')
    }

    // Set container ID
    if (!container.id) {
      container.id = 'vmap'
    }

    try {
      // FINAL CHECK: If window.viewer exists at this point (maybe set by another initialization
      // that completed during our async operations), we cannot proceed
      if (window.viewer) {
        console.log('window.viewer was set during async operations, reusing existing map...')
        window.__vworldInitializing = false
        if (window.__vworldMapInstance) {
          this.map = window.__vworldMapInstance
          this.isInitialized = true
          return true
        }
        // viewer exists but no map instance - this is a problem
        throw new Error('VWorld 맵을 다시 초기화할 수 없습니다. 페이지를 새로고침 해주세요.')
      }

      // VWorld 2.0 WebGL API - Korea full view
      const mapOptions = new window.vw.MapOptions(
        window.vw.BasemapType.GRAPHIC,
        '', // empty string for second param
        window.vw.DensityType.BASIC,
        window.vw.DensityType.BASIC,
        false,
        new window.vw.CameraPosition(
          new window.vw.CoordZ(options.center.lng, options.center.lat, 1500000),
          new window.vw.Direction(-90, 0, 0)
        ),
        new window.vw.CameraPosition(
          new window.vw.CoordZ(options.center.lng, options.center.lat, 500000),
          new window.vw.Direction(0, -90, 0)
        )
      )

      this.map = new window.vw.Map(container.id, mapOptions)
      this.isInitialized = true
      window.__vworldInitialized = true
      window.__vworldInitializing = false
      window.__vworldMapInstance = this.map

      // Register marker click event listener
      this.registerMarkerClickListener()

      console.log('VWorld 2.0 WebGL Map initialized successfully')
      return true
    } catch (error) {
      window.__vworldInitializing = false
      console.error('Failed to initialize VWorld map:', error)
      throw error
    }
  }

  /**
   * Add marker to map
   */
  addMarker(position: LatLng, options: MarkerOptions): any {
    if (!this.map) {
      console.warn('Map not initialized, cannot add marker')
      return null
    }

    const markerId = `marker_${options.data.id}_${options.markerType}`

    try {
      // Create SVG marker based on status
      let color = MARKER_COLORS.normal
      if (options.status === 'alarm') {
        color = MARKER_COLORS.alarm
      } else if (options.status === 'inactive') {
        color = MARKER_COLORS.inactive
      }

      const svgMarker = `
        <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="12" fill="${color}" stroke="white" stroke-width="3"/>
          <circle cx="16" cy="16" r="6" fill="white" opacity="0.8"/>
        </svg>
      `
      const imgPath = 'data:image/svg+xml;base64,' + btoa(svgMarker)

      // VWorld map.createMarker() - use popup with onclick for click detection
      // Popup HTML with onclick calls global handler
      const popupHtml = `<div onclick="window.__vworldMarkerClick && window.__vworldMarkerClick('${markerId}')" style="cursor:pointer;padding:8px;font-weight:bold;white-space:nowrap;">${options.label}</div>`

      this.map.createMarker(
        markerId,
        position.lng,
        position.lat,
        popupHtml, // Clickable popup
        imgPath,
        0,
        0,
        20
      )

      // Store marker info
      const marker = {
        id: markerId,
        position,
        options,
      }
      this.markers.set(markerId, marker)

      // Register click callback
      if (options.onMarkerClick) {
        this.markerClickCallbacks.set(markerId, options.onMarkerClick)
      }

      return marker
    } catch (error) {
      console.error('Failed to add marker:', error)
      return null
    }
  }


  /**
   * Remove marker from map
   */
  removeMarker(marker: any): void {
    if (marker?.id && this.map?.removeMarker) {
      try {
        this.map.removeMarker(marker.id)
      } catch (error) {
        console.error('Failed to remove marker:', error)
      }
      this.markers.delete(marker.id)
      this.markerClickCallbacks.delete(marker.id)
    }
  }

  /**
   * Register marker click event listener
   */
  private registerMarkerClickListener(): void {
    if (!this.map) return

    const mapMethods = Object.keys(this.map).filter(k => typeof this.map[k] === 'function')
    console.log('Available map methods:', mapMethods)

    // VWorld 2.0 marker click event - try multiple approaches
    try {
      // Method 1: map.on (common pattern)
      if (typeof this.map.on === 'function') {
        this.map.on('markerClick', (e: any) => {
          const markerId = e?.markerId || e?.id || e
          this.handleMarkerClick(markerId)
        })
        console.log('Marker click listener registered via map.on')
        return
      }

      // Method 2: setMarkerClickEvent (VWorld specific)
      if (typeof this.map.setMarkerClickEvent === 'function') {
        this.map.setMarkerClickEvent((markerId: string) => {
          this.handleMarkerClick(markerId)
        })
        console.log('Marker click listener registered via setMarkerClickEvent')
        return
      }

      // Method 3: Register map click event to detect clicks near markers
      this.registerMapClickForMarkers()

      console.warn('No native marker click event found. Using map click detection.')
    } catch (error) {
      console.error('Failed to register marker click listener:', error)
    }
  }

  /**
   * Register map click event to detect marker clicks by proximity
   */
  private registerMapClickForMarkers(): void {
    // Try to find map click event methods
    const clickMethods = ['on', 'addEventListener', 'setClickEvent', 'onClick']

    for (const method of clickMethods) {
      if (typeof this.map[method] === 'function') {
        try {
          if (method === 'on' || method === 'addEventListener') {
            this.map[method]('click', (e: any) => this.handleMapClick(e))
          } else {
            this.map[method]((e: any) => this.handleMapClick(e))
          }
          console.log(`Map click registered via map.${method}`)
          return
        } catch (err) {
          console.log(`Failed to register via ${method}:`, err)
        }
      }
    }
    console.warn('No map click method found')
  }

  /**
   * Handle map click - find nearest marker
   */
  private handleMapClick(e: any): void {
    // Try to extract coordinates from the event
    const lng = e?.longitude || e?.lng || e?.coord?.x || e?.position?.x
    const lat = e?.latitude || e?.lat || e?.coord?.y || e?.position?.y

    if (lng === undefined || lat === undefined) {
      console.log('Map click event:', e)
      return
    }

    console.log('Map clicked at:', { lng, lat })

    // Find nearest marker within threshold (approx 0.01 degrees ~ 1km)
    const threshold = 0.01
    let nearestMarker: any = null
    let minDistance = Infinity

    this.markers.forEach((marker) => {
      const dx = marker.position.lng - lng
      const dy = marker.position.lat - lat
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < threshold && distance < minDistance) {
        minDistance = distance
        nearestMarker = marker
      }
    })

    if (nearestMarker) {
      console.log('Nearest marker found:', nearestMarker.id)
      this.handleMarkerClick(nearestMarker.id)
    }
  }

  /**
   * Handle marker click internally
   */
  private handleMarkerClick(markerId: string): void {
    console.log('Marker clicked:', markerId)
    const callback = this.markerClickCallbacks.get(markerId)
    if (callback) {
      callback()
    }
  }

  /**
   * Clear all markers
   */
  clearMarkers(): void {
    this.markers.forEach(marker => {
      if (marker.id && this.map?.removeMarker) {
        try {
          this.map.removeMarker(marker.id)
        } catch (error) {
          console.error('Failed to remove marker:', error)
        }
      }
    })
    this.markers.clear()
    this.markerClickCallbacks.clear()
  }

  /**
   * Animate map to position with tilt for 3D building view
   */
  async animateToPosition(position: LatLng, altitude = 500, tilt = -45): Promise<void> {
    if (!this.map) {
      console.error('Map instance not available for animateToPosition')
      return
    }

    console.log('animateToPosition called:', { position, altitude, tilt })

    try {
      const movePo = new window.vw.CoordZ(position.lng, position.lat, altitude)
      // Direction: (heading, tilt, roll) - tilt -45 for 3D building view
      const mPosi = new window.vw.CameraPosition(movePo, new window.vw.Direction(0, tilt, 0))

      // Try different methods for camera movement
      if (typeof this.map.moveTo === 'function') {
        this.map.moveTo(mPosi)
      } else if (typeof this.map.flyTo === 'function') {
        this.map.flyTo(mPosi)
      } else if (typeof this.map.setCamera === 'function') {
        this.map.setCamera(mPosi)
      } else {
        console.error('No camera movement method found on map object')
      }

      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('Failed to move map:', error)
    }
  }

  /**
   * Reset map to initial position (Korea view)
   */
  async resetMapPosition(): Promise<void> {
    await this.animateToPosition({ lat: 36.5, lng: 127.5 }, 500000)
  }

  /**
   * Get all markers
   */
  getMarkers(): Map<string, any> {
    return this.markers
  }

  /**
   * Get map instance
   */
  getMap(): any {
    return this.map
  }

  /**
   * Check if map is initialized
   */
  isMapInitialized(): boolean {
    return this.isInitialized && !!this.map
  }

  /**
   * Destroy map
   */
  destroy(): void {
    this.clearMarkers()
    this.map = null
    this.isInitialized = false
  }
}

export const mapService = new MapService()
export type { LatLng, MapOptions, MarkerOptions, MarkerType }
