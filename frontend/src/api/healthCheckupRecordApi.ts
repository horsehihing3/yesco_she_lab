import axiosInstance from './axiosInstance'
import { ApiResponse } from '../types/common.types'

export interface HealthCheckupRecord {
  id: number
  examDate: string | null
  examPeriod: string | null
  hospitalName: string | null
  department: string | null
  name: string | null
  age: number | null
  bpSystolic: number | null
  bpDiastolic: number | null
  bpMed: string | null
  bpGrade: string | null
  bst: number | null
  dmMed: string | null
  dmGrade: string | null
  tc: number | null
  tg: number | null
  ldl: number | null
  hdl: number | null
  lipidMed: string | null
  lipidGrade: string | null
  followUp: string | null
  workFitness: string | null
  remark: string | null
  pdfFileId: number | null
  createdBy: string | null
  createdAt: string
  modifiedAt: string
}

export const healthCheckupRecordApi = {
  getAll: async (): Promise<HealthCheckupRecord[]> => {
    const res = await axiosInstance.get<ApiResponse<HealthCheckupRecord[]>>('/health-checkup-records')
    return res.data.data
  },
  getByName: async (name: string): Promise<HealthCheckupRecord[]> => {
    const res = await axiosInstance.get<ApiResponse<HealthCheckupRecord[]>>(`/health-checkup-records/by-name/${encodeURIComponent(name)}`)
    return res.data.data
  },
  getById: async (id: number): Promise<HealthCheckupRecord> => {
    const res = await axiosInstance.get<ApiResponse<HealthCheckupRecord>>(`/health-checkup-records/${id}`)
    return res.data.data
  },
  create: async (data: Partial<HealthCheckupRecord>): Promise<HealthCheckupRecord> => {
    const res = await axiosInstance.post<ApiResponse<HealthCheckupRecord>>('/health-checkup-records', data)
    return res.data.data
  },
  update: async (id: number, data: Partial<HealthCheckupRecord>): Promise<HealthCheckupRecord> => {
    const res = await axiosInstance.put<ApiResponse<HealthCheckupRecord>>(`/health-checkup-records/${id}`, data)
    return res.data.data
  },
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/health-checkup-records/${id}`)
  },
  uploadPdf: async (file: File): Promise<HealthCheckupRecord> => {
    const form = new FormData()
    form.append('file', file)
    const res = await axiosInstance.post<ApiResponse<HealthCheckupRecord>>('/health-checkup-records/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.data
  },
}
