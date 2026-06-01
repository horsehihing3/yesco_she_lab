import axiosInstance from './axiosInstance'
import { ApiResponse } from '../types/common.types'
import { KpiRecord } from '../types/kpi.types'

export const kpiApi = {
  getByYear: async (year: number) => {
    const res = await axiosInstance.get<ApiResponse<KpiRecord[]>>(`/kpi/year/${year}`)
    return res.data.data
  },
  getByTypeAndYear: async (kpiType: string, year: number) => {
    const res = await axiosInstance.get<ApiResponse<KpiRecord[]>>(`/kpi/type/${kpiType}/year/${year}`)
    return res.data.data
  },
}
