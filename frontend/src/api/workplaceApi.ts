import axiosInstance from './axiosInstance'
import { ApiResponse } from '../types/common.types'

export interface WorkPlace {
  id: number
  title: string
  place: string
  floor: string
  used: boolean
  company: string
  coordinate?: string
  imagePath?: string
  existId?: number
  isExist: boolean
  createdAt: string
  modifiedAt: string
}

export const workplaceApi = {
  // 전체 사이트 목록 조회 (중복 제거된 place 목록)
  getSites: async (): Promise<string[]> => {
    const response = await axiosInstance.get<ApiResponse<WorkPlace[]>>('/workplaces/all')
    const places = response.data.data.map((wp) => wp.place)
    // 중복 제거
    return [...new Set(places)]
  },

  // 전체 작업장 목록 조회
  getAll: async (): Promise<WorkPlace[]> => {
    const response = await axiosInstance.get<ApiResponse<WorkPlace[]>>('/workplaces/all')
    return response.data.data
  },

  // ID로 작업장 조회
  getById: async (id: number): Promise<WorkPlace> => {
    const response = await axiosInstance.get<ApiResponse<WorkPlace>>(`/workplaces/${id}`)
    return response.data.data
  },

  // 장소로 작업장 목록 조회
  getByPlace: async (place: string): Promise<WorkPlace[]> => {
    const response = await axiosInstance.get<ApiResponse<WorkPlace[]>>(
      `/workplaces/search?place=${encodeURIComponent(place)}`
    )
    return response.data.data
  },
}
