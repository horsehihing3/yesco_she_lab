import axiosInstance from './axiosInstance'
import { ApiResponse, PageResponse } from '../types/common.types'
import { TrainingCourse, TrainingCourseRequest } from '../types/trainingCourse.types'
import { TrainingApplication, TrainingApplicationRequest } from '../types/trainingApplication.types'

export const trainingCourseApi = {
  list: async (params: { category?: string; isActive?: boolean | string; keyword?: string; page?: number; size?: number } = {}) => {
    const q = new URLSearchParams()
    q.set('page', String(params.page ?? 0))
    q.set('size', String(params.size ?? 100))
    if (params.category) q.set('category', params.category)
    if (params.isActive !== undefined && params.isActive !== '') q.set('isActive', String(params.isActive))
    if (params.keyword) q.set('keyword', params.keyword)
    const res = await axiosInstance.get<ApiResponse<PageResponse<TrainingCourse>>>(`/training-course?${q.toString()}`)
    return res.data.data
  },
  get: async (id: number) => {
    const res = await axiosInstance.get<ApiResponse<TrainingCourse>>(`/training-course/${id}`)
    return res.data.data
  },
  create: async (data: TrainingCourseRequest) => {
    const res = await axiosInstance.post<ApiResponse<TrainingCourse>>('/training-course', data)
    return res.data.data
  },
  update: async (id: number, data: TrainingCourseRequest) => {
    const res = await axiosInstance.put<ApiResponse<TrainingCourse>>(`/training-course/${id}`, data)
    return res.data.data
  },
  remove: async (id: number) => {
    await axiosInstance.delete(`/training-course/${id}`)
  },
}

export const trainingApplicationApi = {
  list: async (params: { status?: string; dept?: string; courseId?: number; username?: string; keyword?: string; name?: string; courseName?: string; page?: number; size?: number } = {}) => {
    const q = new URLSearchParams()
    q.set('page', String(params.page ?? 0))
    q.set('size', String(params.size ?? 100))
    if (params.status) q.set('status', params.status)
    if (params.dept) q.set('dept', params.dept)
    if (params.courseId) q.set('courseId', String(params.courseId))
    if (params.username) q.set('username', params.username)
    if (params.keyword) q.set('keyword', params.keyword)
    if (params.name) q.set('name', params.name)
    if (params.courseName) q.set('courseName', params.courseName)
    const res = await axiosInstance.get<ApiResponse<PageResponse<TrainingApplication>>>(`/training-application?${q.toString()}`)
    return res.data.data
  },
  get: async (id: number) => {
    const res = await axiosInstance.get<ApiResponse<TrainingApplication>>(`/training-application/${id}`)
    return res.data.data
  },
  create: async (data: TrainingApplicationRequest) => {
    const res = await axiosInstance.post<ApiResponse<TrainingApplication>>('/training-application', data)
    return res.data.data
  },
  update: async (id: number, data: TrainingApplicationRequest) => {
    const res = await axiosInstance.put<ApiResponse<TrainingApplication>>(`/training-application/${id}`, data)
    return res.data.data
  },
  changeStatus: async (id: number, status: string, opts: { rejectReason?: string; completionDate?: string } = {}) => {
    const q = new URLSearchParams()
    q.set('status', status)
    if (opts.rejectReason) q.set('rejectReason', opts.rejectReason)
    if (opts.completionDate) q.set('completionDate', opts.completionDate)
    const res = await axiosInstance.patch<ApiResponse<TrainingApplication>>(`/training-application/${id}/status?${q.toString()}`)
    return res.data.data
  },
  remove: async (id: number) => {
    await axiosInstance.delete(`/training-application/${id}`)
  },
}
