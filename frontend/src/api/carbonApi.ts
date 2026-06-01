import axiosInstance from './axiosInstance'
import { ApiResponse, PageResponse } from '../types/common.types'
import { CarbonEmission, CarbonEmissionRequest, EmissionSource, EmissionSourceRequest, EmissionFactor, EmissionFactorRequest } from '../types/carbon.types'

export const carbonEmissionApi = {
  findAll: async (page: number, size: number): Promise<PageResponse<CarbonEmission>> => {
    const response = await axiosInstance.get<ApiResponse<PageResponse<CarbonEmission>>>(`/carbon/emission?page=${page}&size=${size}`)
    return response.data.data
  },
  search: async (keyword: string, page: number, size: number): Promise<PageResponse<CarbonEmission>> => {
    const response = await axiosInstance.get<ApiResponse<PageResponse<CarbonEmission>>>(`/carbon/emission/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`)
    return response.data.data
  },
  findByScope: async (scope: number, page: number, size: number): Promise<PageResponse<CarbonEmission>> => {
    const response = await axiosInstance.get<ApiResponse<PageResponse<CarbonEmission>>>(`/carbon/emission/scope/${scope}?page=${page}&size=${size}`)
    return response.data.data
  },
  findAllList: async (): Promise<CarbonEmission[]> => {
    const response = await axiosInstance.get<ApiResponse<CarbonEmission[]>>('/carbon/emission/all')
    return response.data.data
  },
  getDashboardStats: async (): Promise<Record<string, number>> => {
    const response = await axiosInstance.get<ApiResponse<Record<string, number>>>('/carbon/emission/dashboard')
    return response.data.data
  },
  findById: async (id: number): Promise<CarbonEmission> => {
    const response = await axiosInstance.get<ApiResponse<CarbonEmission>>(`/carbon/emission/${id}`)
    return response.data.data
  },
  create: async (data: CarbonEmissionRequest): Promise<CarbonEmission> => {
    const response = await axiosInstance.post<ApiResponse<CarbonEmission>>('/carbon/emission', data)
    return response.data.data
  },
  update: async (id: number, data: CarbonEmissionRequest): Promise<CarbonEmission> => {
    const response = await axiosInstance.put<ApiResponse<CarbonEmission>>(`/carbon/emission/${id}`, data)
    return response.data.data
  },
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/carbon/emission/${id}`)
  },
}

export const emissionSourceApi = {
  findAll: async (page: number, size: number): Promise<PageResponse<EmissionSource>> => {
    const response = await axiosInstance.get<ApiResponse<PageResponse<EmissionSource>>>(`/carbon/source?page=${page}&size=${size}`)
    return response.data.data
  },
  search: async (keyword: string, page: number, size: number): Promise<PageResponse<EmissionSource>> => {
    const response = await axiosInstance.get<ApiResponse<PageResponse<EmissionSource>>>(`/carbon/source/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`)
    return response.data.data
  },
  findAllActive: async (): Promise<EmissionSource[]> => {
    const response = await axiosInstance.get<ApiResponse<EmissionSource[]>>('/carbon/source/active')
    return response.data.data
  },
  findById: async (id: number): Promise<EmissionSource> => {
    const response = await axiosInstance.get<ApiResponse<EmissionSource>>(`/carbon/source/${id}`)
    return response.data.data
  },
  create: async (data: EmissionSourceRequest): Promise<EmissionSource> => {
    const response = await axiosInstance.post<ApiResponse<EmissionSource>>('/carbon/source', data)
    return response.data.data
  },
  update: async (id: number, data: EmissionSourceRequest): Promise<EmissionSource> => {
    const response = await axiosInstance.put<ApiResponse<EmissionSource>>(`/carbon/source/${id}`, data)
    return response.data.data
  },
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/carbon/source/${id}`)
  },
}

export const emissionFactorApi = {
  findAll: async (page: number, size: number): Promise<PageResponse<EmissionFactor>> => {
    const response = await axiosInstance.get<ApiResponse<PageResponse<EmissionFactor>>>(`/carbon/factor?page=${page}&size=${size}`)
    return response.data.data
  },
  search: async (keyword: string, page: number, size: number): Promise<PageResponse<EmissionFactor>> => {
    const response = await axiosInstance.get<ApiResponse<PageResponse<EmissionFactor>>>(`/carbon/factor/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`)
    return response.data.data
  },
  findAllList: async (): Promise<EmissionFactor[]> => {
    const response = await axiosInstance.get<ApiResponse<EmissionFactor[]>>('/carbon/factor/all')
    return response.data.data
  },
  findById: async (id: number): Promise<EmissionFactor> => {
    const response = await axiosInstance.get<ApiResponse<EmissionFactor>>(`/carbon/factor/${id}`)
    return response.data.data
  },
  create: async (data: EmissionFactorRequest): Promise<EmissionFactor> => {
    const response = await axiosInstance.post<ApiResponse<EmissionFactor>>('/carbon/factor', data)
    return response.data.data
  },
  update: async (id: number, data: EmissionFactorRequest): Promise<EmissionFactor> => {
    const response = await axiosInstance.put<ApiResponse<EmissionFactor>>(`/carbon/factor/${id}`, data)
    return response.data.data
  },
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/carbon/factor/${id}`)
  },
}
