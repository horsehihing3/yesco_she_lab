import axiosInstance from './axiosInstance'
import { ApiResponse } from '../types/common.types'
import { AccidentReport, AccidentReportRequest } from '../types/accidentReport.types'

export const accidentReportApi = {
  getAll: async () => {
    const res = await axiosInstance.get<ApiResponse<AccidentReport[]>>('/accident-reports')
    return res.data.data
  },
  getById: async (id: number) => {
    const res = await axiosInstance.get<ApiResponse<AccidentReport>>(`/accident-reports/${id}`)
    return res.data.data
  },
  create: async (data: AccidentReportRequest) => {
    const res = await axiosInstance.post<ApiResponse<AccidentReport>>('/accident-reports', data)
    return res.data.data
  },
  update: async (id: number, data: AccidentReportRequest) => {
    const res = await axiosInstance.put<ApiResponse<AccidentReport>>(`/accident-reports/${id}`, data)
    return res.data.data
  },
  delete: async (id: number) => {
    await axiosInstance.delete(`/accident-reports/${id}`)
  },
}
