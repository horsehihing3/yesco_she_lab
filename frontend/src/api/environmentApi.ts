import axiosInstance from './axiosInstance'
import { ApiResponse, PageResponse } from '../types/common.types'
import {
  WasteManage, WasteManageRequest,
  DisposalCompany, DisposalCompanyRequest,
  WasteCompliance, WasteComplianceRequest,
  WaterQuality, WaterQualityRequest,
  AirEmission, AirEmissionRequest,
  AirEmissionStandard, AirEmissionStandardRequest,
  WaterWorkplace, WaterWorkplaceRequest,
  WaterSamplingPoint, WaterSamplingPointRequest,
  WaterStandard, WaterStandardRequest,
} from '../types/environment.types'

// 폐기물 관리
export const wasteManageApi = {
  findAll: async (page: number, size: number): Promise<PageResponse<WasteManage>> => {
    const response = await axiosInstance.get<ApiResponse<PageResponse<WasteManage>>>(`/environment/waste?page=${page}&size=${size}`)
    return response.data.data
  },
  search: async (keyword: string, page: number, size: number): Promise<PageResponse<WasteManage>> => {
    const response = await axiosInstance.get<ApiResponse<PageResponse<WasteManage>>>(`/environment/waste/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`)
    return response.data.data
  },
  findByStatus: async (status: string, page: number, size: number): Promise<PageResponse<WasteManage>> => {
    const response = await axiosInstance.get<ApiResponse<PageResponse<WasteManage>>>(`/environment/waste/status/${status}?page=${page}&size=${size}`)
    return response.data.data
  },
  findAllList: async (): Promise<WasteManage[]> => {
    const response = await axiosInstance.get<ApiResponse<WasteManage[]>>('/environment/waste/all')
    return response.data.data
  },
  getDashboardStats: async (): Promise<Record<string, number>> => {
    const response = await axiosInstance.get<ApiResponse<Record<string, number>>>('/environment/waste/dashboard')
    return response.data.data
  },
  generateCode: async (): Promise<string> => {
    const response = await axiosInstance.get<ApiResponse<string>>('/environment/waste/generate-code')
    return response.data.data
  },
  findById: async (id: number): Promise<WasteManage> => {
    const response = await axiosInstance.get<ApiResponse<WasteManage>>(`/environment/waste/${id}`)
    return response.data.data
  },
  create: async (data: WasteManageRequest): Promise<WasteManage> => {
    const response = await axiosInstance.post<ApiResponse<WasteManage>>('/environment/waste', data)
    return response.data.data
  },
  update: async (id: number, data: WasteManageRequest): Promise<WasteManage> => {
    const response = await axiosInstance.put<ApiResponse<WasteManage>>(`/environment/waste/${id}`, data)
    return response.data.data
  },
  updateStatus: async (id: number, status: string): Promise<void> => {
    await axiosInstance.patch(`/environment/waste/${id}/status?status=${status}`)
  },
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/environment/waste/${id}`)
  },
}

// 처리업체 관리
export const disposalCompanyApi = {
  findAll: async (page: number, size: number): Promise<PageResponse<DisposalCompany>> => {
    const response = await axiosInstance.get<ApiResponse<PageResponse<DisposalCompany>>>(`/environment/disposal-company?page=${page}&size=${size}`)
    return response.data.data
  },
  search: async (keyword: string, page: number, size: number): Promise<PageResponse<DisposalCompany>> => {
    const response = await axiosInstance.get<ApiResponse<PageResponse<DisposalCompany>>>(`/environment/disposal-company/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`)
    return response.data.data
  },
  findAllActive: async (): Promise<DisposalCompany[]> => {
    const response = await axiosInstance.get<ApiResponse<DisposalCompany[]>>('/environment/disposal-company/active')
    return response.data.data
  },
  findById: async (id: number): Promise<DisposalCompany> => {
    const response = await axiosInstance.get<ApiResponse<DisposalCompany>>(`/environment/disposal-company/${id}`)
    return response.data.data
  },
  create: async (data: DisposalCompanyRequest): Promise<DisposalCompany> => {
    const response = await axiosInstance.post<ApiResponse<DisposalCompany>>('/environment/disposal-company', data)
    return response.data.data
  },
  update: async (id: number, data: DisposalCompanyRequest): Promise<DisposalCompany> => {
    const response = await axiosInstance.put<ApiResponse<DisposalCompany>>(`/environment/disposal-company/${id}`, data)
    return response.data.data
  },
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/environment/disposal-company/${id}`)
  },
}

// 법규 준수 관리
export const wasteComplianceApi = {
  findAll: async (page: number, size: number): Promise<PageResponse<WasteCompliance>> => {
    const response = await axiosInstance.get<ApiResponse<PageResponse<WasteCompliance>>>(`/environment/waste-compliance?page=${page}&size=${size}`)
    return response.data.data
  },
  search: async (keyword: string, page: number, size: number): Promise<PageResponse<WasteCompliance>> => {
    const response = await axiosInstance.get<ApiResponse<PageResponse<WasteCompliance>>>(`/environment/waste-compliance/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`)
    return response.data.data
  },
  findByStatus: async (status: string): Promise<WasteCompliance[]> => {
    const response = await axiosInstance.get<ApiResponse<WasteCompliance[]>>(`/environment/waste-compliance/status/${status}`)
    return response.data.data
  },
  getStats: async (): Promise<Record<string, number>> => {
    const response = await axiosInstance.get<ApiResponse<Record<string, number>>>('/environment/waste-compliance/stats')
    return response.data.data
  },
  findById: async (id: number): Promise<WasteCompliance> => {
    const response = await axiosInstance.get<ApiResponse<WasteCompliance>>(`/environment/waste-compliance/${id}`)
    return response.data.data
  },
  create: async (data: WasteComplianceRequest): Promise<WasteCompliance> => {
    const response = await axiosInstance.post<ApiResponse<WasteCompliance>>('/environment/waste-compliance', data)
    return response.data.data
  },
  update: async (id: number, data: WasteComplianceRequest): Promise<WasteCompliance> => {
    const response = await axiosInstance.put<ApiResponse<WasteCompliance>>(`/environment/waste-compliance/${id}`, data)
    return response.data.data
  },
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/environment/waste-compliance/${id}`)
  },
}

// 수질 관리
export const waterQualityApi = {
  findAll: async (page: number, size: number): Promise<PageResponse<WaterQuality>> => {
    const response = await axiosInstance.get<ApiResponse<PageResponse<WaterQuality>>>(`/environment/water-quality?page=${page}&size=${size}`)
    return response.data.data
  },
  search: async (keyword: string, page: number, size: number): Promise<PageResponse<WaterQuality>> => {
    const response = await axiosInstance.get<ApiResponse<PageResponse<WaterQuality>>>(`/environment/water-quality/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`)
    return response.data.data
  },
  findById: async (id: number): Promise<WaterQuality> => {
    const response = await axiosInstance.get<ApiResponse<WaterQuality>>(`/environment/water-quality/${id}`)
    return response.data.data
  },
  create: async (data: WaterQualityRequest): Promise<WaterQuality> => {
    const response = await axiosInstance.post<ApiResponse<WaterQuality>>('/environment/water-quality', data)
    return response.data.data
  },
  update: async (id: number, data: WaterQualityRequest): Promise<WaterQuality> => {
    const response = await axiosInstance.put<ApiResponse<WaterQuality>>(`/environment/water-quality/${id}`, data)
    return response.data.data
  },
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/environment/water-quality/${id}`)
  },
}

// 수질 사업장 관리
export const waterWorkplaceApi = {
  findAll: async (page: number, size: number): Promise<PageResponse<WaterWorkplace>> => {
    const response = await axiosInstance.get<ApiResponse<PageResponse<WaterWorkplace>>>(`/environment/water-workplace?page=${page}&size=${size}`)
    return response.data.data
  },
  search: async (keyword: string, page: number, size: number): Promise<PageResponse<WaterWorkplace>> => {
    const response = await axiosInstance.get<ApiResponse<PageResponse<WaterWorkplace>>>(`/environment/water-workplace/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`)
    return response.data.data
  },
  findById: async (id: number): Promise<WaterWorkplace> => {
    const response = await axiosInstance.get<ApiResponse<WaterWorkplace>>(`/environment/water-workplace/${id}`)
    return response.data.data
  },
  create: async (data: WaterWorkplaceRequest): Promise<WaterWorkplace> => {
    const response = await axiosInstance.post<ApiResponse<WaterWorkplace>>('/environment/water-workplace', data)
    return response.data.data
  },
  update: async (id: number, data: WaterWorkplaceRequest): Promise<WaterWorkplace> => {
    const response = await axiosInstance.put<ApiResponse<WaterWorkplace>>(`/environment/water-workplace/${id}`, data)
    return response.data.data
  },
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/environment/water-workplace/${id}`)
  },
}

// 수질 측정 지점 관리
export const waterSamplingPointApi = {
  findAll: async (page: number, size: number): Promise<PageResponse<WaterSamplingPoint>> => {
    const response = await axiosInstance.get<ApiResponse<PageResponse<WaterSamplingPoint>>>(`/environment/water-sampling-point?page=${page}&size=${size}`)
    return response.data.data
  },
  search: async (keyword: string, page: number, size: number): Promise<PageResponse<WaterSamplingPoint>> => {
    const response = await axiosInstance.get<ApiResponse<PageResponse<WaterSamplingPoint>>>(`/environment/water-sampling-point/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`)
    return response.data.data
  },
  findById: async (id: number): Promise<WaterSamplingPoint> => {
    const response = await axiosInstance.get<ApiResponse<WaterSamplingPoint>>(`/environment/water-sampling-point/${id}`)
    return response.data.data
  },
  findByWorkplace: async (workplaceId: number): Promise<WaterSamplingPoint[]> => {
    const response = await axiosInstance.get<ApiResponse<WaterSamplingPoint[]>>(`/environment/water-sampling-point/by-workplace/${workplaceId}`)
    return response.data.data
  },
  create: async (data: WaterSamplingPointRequest): Promise<WaterSamplingPoint> => {
    const response = await axiosInstance.post<ApiResponse<WaterSamplingPoint>>('/environment/water-sampling-point', data)
    return response.data.data
  },
  update: async (id: number, data: WaterSamplingPointRequest): Promise<WaterSamplingPoint> => {
    const response = await axiosInstance.put<ApiResponse<WaterSamplingPoint>>(`/environment/water-sampling-point/${id}`, data)
    return response.data.data
  },
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/environment/water-sampling-point/${id}`)
  },
}

// 수질 배출 기준치 관리
export const waterStandardApi = {
  findAll: async (page: number, size: number): Promise<PageResponse<WaterStandard>> => {
    const response = await axiosInstance.get<ApiResponse<PageResponse<WaterStandard>>>(`/environment/water-standard?page=${page}&size=${size}`)
    return response.data.data
  },
  findAllList: async (): Promise<WaterStandard[]> => {
    const response = await axiosInstance.get<ApiResponse<WaterStandard[]>>('/environment/water-standard/all')
    return response.data.data
  },
  findById: async (id: number): Promise<WaterStandard> => {
    const response = await axiosInstance.get<ApiResponse<WaterStandard>>(`/environment/water-standard/${id}`)
    return response.data.data
  },
  create: async (data: WaterStandardRequest): Promise<WaterStandard> => {
    const response = await axiosInstance.post<ApiResponse<WaterStandard>>('/environment/water-standard', data)
    return response.data.data
  },
  update: async (id: number, data: WaterStandardRequest): Promise<WaterStandard> => {
    const response = await axiosInstance.put<ApiResponse<WaterStandard>>(`/environment/water-standard/${id}`, data)
    return response.data.data
  },
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/environment/water-standard/${id}`)
  },
}

// 대기배출 관리
export const airEmissionApi = {
  findAll: async (page: number, size: number): Promise<PageResponse<AirEmission>> => {
    const response = await axiosInstance.get<ApiResponse<PageResponse<AirEmission>>>(`/environment/air-emission?page=${page}&size=${size}`)
    return response.data.data
  },
  search: async (keyword: string, page: number, size: number): Promise<PageResponse<AirEmission>> => {
    const response = await axiosInstance.get<ApiResponse<PageResponse<AirEmission>>>(`/environment/air-emission/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`)
    return response.data.data
  },
  findAllList: async (): Promise<AirEmission[]> => {
    const response = await axiosInstance.get<ApiResponse<AirEmission[]>>('/environment/air-emission/all')
    return response.data.data
  },
  findById: async (id: number): Promise<AirEmission> => {
    const response = await axiosInstance.get<ApiResponse<AirEmission>>(`/environment/air-emission/${id}`)
    return response.data.data
  },
  create: async (data: AirEmissionRequest): Promise<AirEmission> => {
    const response = await axiosInstance.post<ApiResponse<AirEmission>>('/environment/air-emission', data)
    return response.data.data
  },
  update: async (id: number, data: AirEmissionRequest): Promise<AirEmission> => {
    const response = await axiosInstance.put<ApiResponse<AirEmission>>(`/environment/air-emission/${id}`, data)
    return response.data.data
  },
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/environment/air-emission/${id}`)
  },
}

// 대기배출 기준치 관리
export const airEmissionStandardApi = {
  findAll: async (page: number, size: number): Promise<PageResponse<AirEmissionStandard>> => {
    const response = await axiosInstance.get<ApiResponse<PageResponse<AirEmissionStandard>>>(`/environment/air-emission-standard?page=${page}&size=${size}`)
    return response.data.data
  },
  findAllList: async (): Promise<AirEmissionStandard[]> => {
    const response = await axiosInstance.get<ApiResponse<AirEmissionStandard[]>>('/environment/air-emission-standard/all')
    return response.data.data
  },
  findById: async (id: number): Promise<AirEmissionStandard> => {
    const response = await axiosInstance.get<ApiResponse<AirEmissionStandard>>(`/environment/air-emission-standard/${id}`)
    return response.data.data
  },
  create: async (data: AirEmissionStandardRequest): Promise<AirEmissionStandard> => {
    const response = await axiosInstance.post<ApiResponse<AirEmissionStandard>>('/environment/air-emission-standard', data)
    return response.data.data
  },
  update: async (id: number, data: AirEmissionStandardRequest): Promise<AirEmissionStandard> => {
    const response = await axiosInstance.put<ApiResponse<AirEmissionStandard>>(`/environment/air-emission-standard/${id}`, data)
    return response.data.data
  },
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/environment/air-emission-standard/${id}`)
  },
}
