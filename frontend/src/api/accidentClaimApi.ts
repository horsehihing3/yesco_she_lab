import axiosInstance from './axiosInstance'
import { ApiResponse, PageResponse } from '../types/common.types'
import { AccidentClaim, AccidentClaimRequest, AccidentClaimDoc } from '../types/accidentClaim.types'

export const accidentClaimApi = {
  getAll: async (page = 0, size = 10) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<AccidentClaim>>>('/accident-claims', { params: { page, size } })
    return res.data.data
  },
  getById: async (id: number) => {
    const res = await axiosInstance.get<ApiResponse<AccidentClaim>>(`/accident-claims/${id}`)
    return res.data.data
  },
  getByStatus: async (status: string, page = 0, size = 10) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<AccidentClaim>>>(`/accident-claims/status/${status}`, { params: { page, size } })
    return res.data.data
  },
  getMy: async (page = 0, size = 10) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<AccidentClaim>>>('/accident-claims/my', { params: { page, size } })
    return res.data.data
  },
  create: async (data: AccidentClaimRequest) => {
    const res = await axiosInstance.post<ApiResponse<AccidentClaim>>('/accident-claims', data)
    return res.data.data
  },
  update: async (id: number, data: AccidentClaimRequest) => {
    const res = await axiosInstance.put<ApiResponse<AccidentClaim>>(`/accident-claims/${id}`, data)
    return res.data.data
  },
  updateStatus: async (id: number, status: string) => {
    const res = await axiosInstance.patch<ApiResponse<AccidentClaim>>(`/accident-claims/${id}/status`, null, { params: { status } })
    return res.data.data
  },
  delete: async (id: number) => {
    await axiosInstance.delete(`/accident-claims/${id}`)
  },
  getDocs: async (claimId: number) => {
    const res = await axiosInstance.get<ApiResponse<AccidentClaimDoc[]>>(`/accident-claims/${claimId}/docs`)
    return res.data.data
  },
  toggleDocSubmitted: async (docId: number) => {
    const res = await axiosInstance.patch<ApiResponse<void>>(`/accident-claims/docs/${docId}/submit`)
    return res.data.data
  },
}
