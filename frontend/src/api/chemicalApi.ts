import axiosInstance from './axiosInstance'
import { ApiResponse, PageResponse } from '../types/common.types'
import {
  Chemical, ChemicalRequest, ErpMaterial, ChemicalVendor, ChemicalRegulation,
  RegulationCheck, Msds, ChemicalGhs, ChemicalReach, ChemicalClp, ChemicalTsca,
  ChemicalWarehouse, ChemicalIncoming, ChemicalUsage, ChemicalLotTracking,
  ChemicalUsageReport, ChemicalHazardReport
} from '../types/chemical.types'

// ===== Generic CRUD helper =====
function createCrud<T, R = Partial<T>>(basePath: string) {
  return {
    getAll: async (page = 0, size = 20) => {
      const res = await axiosInstance.get<ApiResponse<PageResponse<T>>>(basePath, { params: { page, size } })
      return res.data.data
    },
    search: async (params: Record<string, string | number | boolean | undefined>) => {
      const filtered: Record<string, string | number | boolean> = {}
      Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') filtered[k] = v })
      const hasFilters = Object.keys(filtered).some(k => k !== 'page' && k !== 'size')
      const url = hasFilters ? `${basePath}/search` : basePath
      const res = await axiosInstance.get<ApiResponse<PageResponse<T>>>(url, { params: filtered })
      return res.data.data
    },
    getById: async (id: number) => {
      const res = await axiosInstance.get<ApiResponse<T>>(`${basePath}/${id}`)
      return res.data.data
    },
    create: async (data: R) => {
      const res = await axiosInstance.post<ApiResponse<T>>(basePath, data)
      return res.data.data
    },
    update: async (id: number, data: R) => {
      const res = await axiosInstance.put<ApiResponse<T>>(`${basePath}/${id}`, data)
      return res.data.data
    },
    delete: async (id: number) => {
      await axiosInstance.delete(`${basePath}/${id}`)
    },
  }
}

// ===== Chemical (master) =====
export const chemicalApi = {
  ...createCrud<Chemical, ChemicalRequest>('/chemicals'),
  search: async (keyword: string, hazardClass: string, status: string, page = 0, size = 10) => {
    const params: Record<string, string | number> = { page, size }
    if (keyword) params.keyword = keyword
    if (hazardClass) params.hazardClass = hazardClass
    if (status) params.status = status
    const url = (keyword || hazardClass || status) ? '/chemicals/search' : '/chemicals'
    const res = await axiosInstance.get<ApiResponse<PageResponse<Chemical>>>(url, { params })
    return res.data.data
  },
}

// ===== ERP Material =====
export const erpMaterialApi = createCrud<ErpMaterial>('/erp-materials')

// ===== Vendor =====
export const chemicalVendorApi = createCrud<ChemicalVendor>('/chemical-vendors')

// ===== Regulation =====
export const chemicalRegulationApi = createCrud<ChemicalRegulation>('/chemical-regulations')

// ===== Regulation Check =====
export const regulationCheckApi = createCrud<RegulationCheck>('/regulation-checks')

// ===== MSDS =====
export const msdsApi = {
  ...createCrud<Msds>('/msds'),
  getByType: async (msdsType: string, isLatest: boolean, page = 0, size = 20) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<Msds>>>('/msds', {
      params: { msdsType, isLatest, page, size }
    })
    return res.data.data
  },
}

// ===== GHS =====
export const chemicalGhsApi = createCrud<ChemicalGhs>('/chemical-ghs')

// ===== REACH =====
export const chemicalReachApi = createCrud<ChemicalReach>('/chemical-reach')

// ===== CLP =====
export const chemicalClpApi = createCrud<ChemicalClp>('/chemical-clp')

// ===== TSCA =====
export const chemicalTscaApi = createCrud<ChemicalTsca>('/chemical-tsca')

// ===== Warehouse =====
export const chemicalWarehouseApi = createCrud<ChemicalWarehouse>('/chemical-warehouses')

// ===== Incoming =====
export const chemicalIncomingApi = createCrud<ChemicalIncoming>('/chemical-incoming')

// ===== Usage =====
export const chemicalUsageApi = createCrud<ChemicalUsage>('/chemical-usage')

// ===== Lot Tracking =====
export const chemicalLotTrackingApi = createCrud<ChemicalLotTracking>('/chemical-lot-tracking')

// ===== Usage Report =====
export const chemicalUsageReportApi = createCrud<ChemicalUsageReport>('/chemical-usage-reports')

// ===== Hazard Report =====
export const chemicalHazardReportApi = createCrud<ChemicalHazardReport>('/chemical-hazard-reports')
