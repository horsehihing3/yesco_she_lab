import axiosInstance from './axiosInstance'
import { ApiResponse, FileMetadata } from '../types/common.types'
import {
  FloorDrawing,
  FloorDrawingRequest,
  SafetyDevice,
  SafetyDeviceRequest,
} from '../types/floorDrawing.types'

export const floorDrawingApi = {
  // Upload floor drawing image
  uploadImage: async (file: File, floorDrawingId: number): Promise<FileMetadata> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('entityType', 'FLOOR_DRAWING')
    formData.append('entityId', floorDrawingId.toString())
    const response = await axiosInstance.post<ApiResponse<FileMetadata>>('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.data
  },

  // Get floor drawing images
  getImages: async (floorDrawingId: number): Promise<FileMetadata[]> => {
    const response = await axiosInstance.get<ApiResponse<FileMetadata[]>>(
      `/files/by-entity/FLOOR_DRAWING/${floorDrawingId}`
    )
    return response.data.data
  },

  // Delete floor drawing image
  deleteImage: async (fileId: number): Promise<void> => {
    await axiosInstance.delete(`/files/${fileId}`)
  },

  // Get all floor drawings (optionally filtered by site)
  getAll: async (site?: string): Promise<FloorDrawing[]> => {
    const params = site ? `?site=${encodeURIComponent(site)}` : ''
    const response = await axiosInstance.get<ApiResponse<FloorDrawing[]>>(`/floor-drawings${params}`)
    return response.data.data
  },

  // Get distinct sites
  getSites: async (): Promise<string[]> => {
    const response = await axiosInstance.get<ApiResponse<string[]>>('/floor-drawings/sites')
    return response.data.data
  },

  // Get floor drawing by ID
  getById: async (id: number): Promise<FloorDrawing> => {
    const response = await axiosInstance.get<ApiResponse<FloorDrawing>>(`/floor-drawings/${id}`)
    return response.data.data
  },

  // Create new floor drawing
  create: async (request: FloorDrawingRequest): Promise<FloorDrawing> => {
    const response = await axiosInstance.post<ApiResponse<FloorDrawing>>('/floor-drawings', request)
    return response.data.data
  },

  // Update floor drawing
  update: async (id: number, request: FloorDrawingRequest): Promise<FloorDrawing> => {
    const response = await axiosInstance.put<ApiResponse<FloorDrawing>>(`/floor-drawings/${id}`, request)
    return response.data.data
  },

  // Delete floor drawing
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/floor-drawings/${id}`)
  },

  // Add device to floor drawing
  addDevice: async (floorDrawingId: number, request: SafetyDeviceRequest): Promise<SafetyDevice> => {
    const response = await axiosInstance.post<ApiResponse<SafetyDevice>>(
      `/floor-drawings/${floorDrawingId}/devices`,
      request
    )
    return response.data.data
  },

  // Update device
  updateDevice: async (deviceId: number, request: SafetyDeviceRequest): Promise<SafetyDevice> => {
    const response = await axiosInstance.put<ApiResponse<SafetyDevice>>(
      `/floor-drawings/devices/${deviceId}`,
      request
    )
    return response.data.data
  },

  // Delete device
  deleteDevice: async (deviceId: number): Promise<void> => {
    await axiosInstance.delete(`/floor-drawings/devices/${deviceId}`)
  },
}
