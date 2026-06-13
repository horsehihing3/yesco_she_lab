import axiosInstance from './axiosInstance'
import { ApiResponse } from '../types/common.types'
import { FileMetadata } from '../types/common.types'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

export const fileApi = {
  upload: async (entityType: string, entityId: string, file: File, extra?: Record<string, string>): Promise<FileMetadata> => {
    const form = new FormData()
    form.append('file', file)
    form.append('entityType', entityType)
    form.append('entityId', entityId)
    if (extra) Object.entries(extra).forEach(([k, v]) => form.append(k, v))
    const res = await axiosInstance.post<ApiResponse<FileMetadata>>('/files/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.data
  },

  listByEntity: async (entityType: string, entityId: string): Promise<FileMetadata[]> => {
    const res = await axiosInstance.get<ApiResponse<FileMetadata[]>>(`/files/by-entity/${entityType}/${entityId}`)
    return res.data.data || []
  },

  remove: async (fileId: number): Promise<void> => {
    await axiosInstance.delete(`/files/${fileId}`)
  },

  downloadBlob: async (fileId: number): Promise<Blob> => {
    const res = await axiosInstance.get(`/files/${fileId}`, { responseType: 'blob' })
    return res.data
  },

  fileUrl: (fileId: number): string => `${BASE_URL}/files/${fileId}`,
}
