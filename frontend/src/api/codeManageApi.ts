import axiosInstance from './axiosInstance'
import { ApiResponse } from '../types/common.types'
import { CodeGroup, CodeGroupRequest, CodeDetail, CodeDetailRequest } from '../types/codeManage.types'

// ===== Code Group =====

export const fetchCodeGroups = async (keyword?: string): Promise<CodeGroup[]> => {
  const params: Record<string, string> = {}
  if (keyword) params.keyword = keyword
  const response = await axiosInstance.get<ApiResponse<CodeGroup[]>>('/code-manage/groups', { params })
  return response.data.data
}

export const createCodeGroup = async (data: CodeGroupRequest): Promise<CodeGroup> => {
  const response = await axiosInstance.post<ApiResponse<CodeGroup>>('/code-manage/groups', data)
  return response.data.data
}

export const updateCodeGroup = async (id: number, data: CodeGroupRequest): Promise<CodeGroup> => {
  const response = await axiosInstance.put<ApiResponse<CodeGroup>>(`/code-manage/groups/${id}`, data)
  return response.data.data
}

export const deleteCodeGroup = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/code-manage/groups/${id}`)
}

// ===== Code Detail =====

export const fetchCodeDetails = async (groupId: number, keyword?: string): Promise<CodeDetail[]> => {
  const params: Record<string, string | number> = { groupId }
  if (keyword) params.keyword = keyword
  const response = await axiosInstance.get<ApiResponse<CodeDetail[]>>('/code-manage/details', { params })
  return response.data.data
}

export const createCodeDetail = async (data: CodeDetailRequest): Promise<CodeDetail> => {
  const response = await axiosInstance.post<ApiResponse<CodeDetail>>('/code-manage/details', data)
  return response.data.data
}

export const updateCodeDetail = async (id: number, data: CodeDetailRequest): Promise<CodeDetail> => {
  const response = await axiosInstance.put<ApiResponse<CodeDetail>>(`/code-manage/details/${id}`, data)
  return response.data.data
}

export const deleteCodeDetail = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/code-manage/details/${id}`)
}

// ===== Code Lookup by Group Code =====

export const fetchCodesByGroupCode = async (groupCode: string): Promise<CodeDetail[]> => {
  const response = await axiosInstance.get<ApiResponse<CodeDetail[]>>(`/code-manage/details/by-group/${groupCode}`)
  return response.data.data
}
