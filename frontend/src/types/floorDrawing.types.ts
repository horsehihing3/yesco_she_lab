// Safety device types
export type SafetyDeviceType = 'extinguisher' | 'exit' | 'aed' | 'cctv' | 'hazard'

export interface SafetyDevice {
  id: number
  floorDrawingId: number
  imageFileId?: number
  deviceType: SafetyDeviceType
  name: string
  positionX: number
  positionY: number
  description?: string
  active: boolean
  createdAt?: string
  modifiedAt?: string
}

export interface FloorDrawing {
  id: number
  workPlaceId?: number
  name: string
  site: string
  floor?: string
  imagePath?: string
  description?: string
  active: boolean
  devices: SafetyDevice[]
  createdAt?: string
  modifiedAt?: string
}

export interface FloorDrawingRequest {
  workPlaceId?: number
  name: string
  site: string
  floor?: string
  imagePath?: string
  description?: string
  active?: boolean
  devices?: SafetyDeviceRequest[]
}

export interface SafetyDeviceRequest {
  id?: number
  floorDrawingId?: number
  imageFileId?: number
  deviceType: SafetyDeviceType
  name: string
  positionX: number
  positionY: number
  description?: string
  active?: boolean
}
