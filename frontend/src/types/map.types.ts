// Map related types for Smart EHS Dashboard

export interface Factory {
  id: string
  name: string
  latitude: number
  longitude: number
  fireStatus: 'normal' | 'alarm'
  edsStatus: 'normal' | 'alarm'
  ehsStatus: 'normal' | 'alarm'
}

export interface Zone {
  id: string
  name: string
  factoryId: string
  cameras: string[]
}

export interface CCTVCamera {
  id: string
  name: string
  factoryId: string
  zoneId: string
  factoryName?: string
  zoneName?: string
  latitude: number
  longitude: number
  streamUrl?: string
  status: 'active' | 'inactive'
  fireDetected?: boolean
}

export type EventType = 'fire' | 'helmet' | 'fall' | 'forklift' | 'collapse' | 'gas_leak' | 'normal'

export interface AnalysisResult {
  id: string
  cameraId: string
  eventType: EventType
  confidence: number
  timestamp: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  metadata?: {
    description?: string
    snapshotUrl?: string
    cameraName?: string
    factoryName?: string
    zoneName?: string
  }
}

export const EVENT_TYPE_INFO: Record<EventType, { labelKey: string; iconName: string; color: string }> = {
  fire: { labelKey: 'status.fire', iconName: 'fire', color: '#f44336' },
  helmet: { labelKey: 'status.noHelmet', iconName: 'helmet', color: '#ff9800' },
  fall: { labelKey: 'status.fall', iconName: 'fall', color: '#f44336' },
  forklift: { labelKey: 'status.forkliftCollision', iconName: 'forklift', color: '#f44336' },
  collapse: { labelKey: 'status.workerCollapse', iconName: 'collapse', color: '#f44336' },
  gas_leak: { labelKey: 'status.gasLeak', iconName: 'gas_leak', color: '#9c27b0' },
  normal: { labelKey: 'status.normal', iconName: 'normal', color: '#4caf50' },
}

// Mock data for factories (Kumho Tire locations)
export const MOCK_FACTORIES: Factory[] = [
  {
    id: 'factory-1',
    name: '곡성 공장',
    latitude: 35.2820,
    longitude: 127.2880,
    fireStatus: 'normal',
    edsStatus: 'normal',
    ehsStatus: 'alarm',
  },
  {
    id: 'factory-2',
    name: '광주 공장',
    latitude: 35.1595,
    longitude: 126.8526,
    fireStatus: 'normal',
    edsStatus: 'normal',
    ehsStatus: 'normal',
  },
  {
    id: 'factory-3',
    name: '중앙연구소',
    latitude: 37.2754,
    longitude: 127.0796,
    fireStatus: 'alarm',
    edsStatus: 'normal',
    ehsStatus: 'normal',
  },
  {
    id: 'factory-4',
    name: '평택 공장',
    latitude: 36.9830,
    longitude: 126.8320,
    fireStatus: 'normal',
    edsStatus: 'normal',
    ehsStatus: 'normal',
  },
]

export const MOCK_ZONES: Record<string, Zone[]> = {
  // 곡성 공장
  'factory-1': [
    { id: 'zone-1-1', name: 'A동', factoryId: 'factory-1', cameras: ['cam-1-1-1', 'cam-1-1-2'] },
    { id: 'zone-1-2', name: 'B동', factoryId: 'factory-1', cameras: ['cam-1-2-1'] },
  ],
  // 광주 공장
  'factory-2': [
    { id: 'zone-2-1', name: 'A동', factoryId: 'factory-2', cameras: ['cam-2-1-1', 'cam-2-1-2'] },
  ],
  // 중앙연구소
  'factory-3': [
    { id: 'zone-3-1', name: 'A동', factoryId: 'factory-3', cameras: ['cam-3-1-1', 'cam-3-1-2'] },
  ],
  // 평택 공장
  'factory-4': [
    { id: 'zone-4-1', name: 'A동', factoryId: 'factory-4', cameras: ['cam-4-1-1'] },
    { id: 'zone-4-2', name: 'B동', factoryId: 'factory-4', cameras: [] },
  ],
}

// Helper function to check if factory has alarm
export const hasFactoryAlarm = (factory: Factory): boolean => {
  return factory.fireStatus === 'alarm' || factory.edsStatus === 'alarm' || factory.ehsStatus === 'alarm'
}

// Mock CCTV Cameras
export const MOCK_CAMERAS: CCTVCamera[] = [
  // 곡성 공장
  { id: 'cam-1-1-1', name: 'CAM-A01', factoryId: 'factory-1', zoneId: 'zone-1-1', factoryName: '곡성 공장', zoneName: 'A동', latitude: 35.2820, longitude: 127.2880, status: 'active', fireDetected: false },
  { id: 'cam-1-1-2', name: 'CAM-A02', factoryId: 'factory-1', zoneId: 'zone-1-1', factoryName: '곡성 공장', zoneName: 'A동', latitude: 35.2823, longitude: 127.2883, status: 'active', fireDetected: false },
  { id: 'cam-1-2-1', name: 'CAM-B01', factoryId: 'factory-1', zoneId: 'zone-1-2', factoryName: '곡성 공장', zoneName: 'B동', latitude: 35.2817, longitude: 127.2877, status: 'active', fireDetected: true },
  // 광주 공장
  { id: 'cam-2-1-1', name: 'CAM-A01', factoryId: 'factory-2', zoneId: 'zone-2-1', factoryName: '광주 공장', zoneName: 'A동', latitude: 35.1595, longitude: 126.8526, status: 'active', fireDetected: false },
  { id: 'cam-2-1-2', name: 'CAM-A02', factoryId: 'factory-2', zoneId: 'zone-2-1', factoryName: '광주 공장', zoneName: 'A동', latitude: 35.1598, longitude: 126.8530, status: 'inactive', fireDetected: false },
  // 중앙연구소
  { id: 'cam-3-1-1', name: 'CAM-A01', factoryId: 'factory-3', zoneId: 'zone-3-1', factoryName: '중앙연구소', zoneName: 'A동', latitude: 37.2754, longitude: 127.0796, status: 'active', fireDetected: true },
  { id: 'cam-3-1-2', name: 'CAM-A02', factoryId: 'factory-3', zoneId: 'zone-3-1', factoryName: '중앙연구소', zoneName: 'A동', latitude: 37.2758, longitude: 127.0800, status: 'active', fireDetected: false },
  // 평택 공장
  { id: 'cam-4-1-1', name: 'CAM-A01', factoryId: 'factory-4', zoneId: 'zone-4-1', factoryName: '평택 공장', zoneName: 'A동', latitude: 36.9830, longitude: 126.8320, status: 'active', fireDetected: false },
]

// Mock Analysis Results (Recent events)
export const MOCK_ANALYSIS_RESULTS: AnalysisResult[] = [
  {
    id: 'result-1',
    cameraId: 'cam-1-2-1',
    eventType: 'fire',
    confidence: 0.95,
    severity: 'critical',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5분 전
    metadata: {
      description: 'B동 1층에서 화재 감지됨',
      cameraName: 'CAM-B01',
      factoryName: '곡성 공장',
      zoneName: 'B동',
      snapshotUrl: '/images/fire-snapshot.jpg',
    },
  },
  {
    id: 'result-2',
    cameraId: 'cam-3-1-1',
    eventType: 'fire',
    confidence: 0.88,
    severity: 'critical',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(), // 12분 전
    metadata: {
      description: '중앙연구소 A동 화재 의심',
      cameraName: 'CAM-A01',
      factoryName: '중앙연구소',
      zoneName: 'A동',
    },
  },
  {
    id: 'result-3',
    cameraId: 'cam-1-1-1',
    eventType: 'helmet',
    confidence: 0.82,
    severity: 'medium',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25분 전
    metadata: {
      description: '안전모 미착용 작업자 감지',
      cameraName: 'CAM-A01',
      factoryName: '곡성 공장',
      zoneName: 'A동',
    },
  },
  {
    id: 'result-4',
    cameraId: 'cam-2-1-1',
    eventType: 'forklift',
    confidence: 0.78,
    severity: 'high',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45분 전
    metadata: {
      description: '지게차 안전구역 침범',
      cameraName: 'CAM-A01',
      factoryName: '광주 공장',
      zoneName: 'A동',
    },
  },
  {
    id: 'result-5',
    cameraId: 'cam-1-1-2',
    eventType: 'collapse',
    confidence: 0.91,
    severity: 'critical',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1시간 전
    metadata: {
      description: '작업자 쓰러짐 감지',
      cameraName: 'CAM-A02',
      factoryName: '곡성 공장',
      zoneName: 'A동',
    },
  },
  {
    id: 'result-6',
    cameraId: 'cam-4-1-1',
    eventType: 'fall',
    confidence: 0.75,
    severity: 'high',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 1.5시간 전
    metadata: {
      description: '고소 작업 위험 감지',
      cameraName: 'CAM-A01',
      factoryName: '평택 공장',
      zoneName: 'A동',
    },
  },
  {
    id: 'result-7',
    cameraId: 'cam-2-1-1',
    eventType: 'gas_leak',
    confidence: 0.89,
    severity: 'critical',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15분 전
    metadata: {
      description: '가스 누출 감지 - 즉시 대피 필요',
      cameraName: 'CAM-A01',
      factoryName: '광주 공장',
      zoneName: 'A동',
    },
  },
  {
    id: 'result-8',
    cameraId: 'cam-3-1-2',
    eventType: 'gas_leak',
    confidence: 0.72,
    severity: 'high',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2시간 전
    metadata: {
      description: '가스 농도 이상 감지',
      cameraName: 'CAM-A02',
      factoryName: '중앙연구소',
      zoneName: 'A동',
    },
  },
]
