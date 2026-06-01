import axiosInstance from './axiosInstance'
import {
  ChecklistTemplateMaster,
  ChecklistTemplateMasterRequest,
  ChecklistResultMaster,
  ChecklistResultMasterRequest,
  ChecklistItem,
  ExcelParseResult,
} from '../types/checklist.types'

// ===== Template APIs =====

export const fetchTemplates = async (params: { page: number; size: number; title?: string }) => {
  const { page, size, title } = params
  const url = title ? '/checklist-templates/search' : '/checklist-templates'
  const queryParams: Record<string, string | number> = { page, size }
  if (title) queryParams.title = title
  const res = await axiosInstance.get(url, { params: queryParams })
  return res.data.data
}

export const fetchTemplateById = async (id: number): Promise<ChecklistTemplateMaster> => {
  const res = await axiosInstance.get(`/checklist-templates/${id}`)
  return res.data.data
}

export const fetchTemplatesForDropdown = async (): Promise<ChecklistTemplateMaster[]> => {
  const res = await axiosInstance.get('/checklist-templates/dropdown')
  return res.data.data
}

export const createTemplate = async (data: ChecklistTemplateMasterRequest): Promise<ChecklistTemplateMaster> => {
  const res = await axiosInstance.post('/checklist-templates', data)
  return res.data.data
}

export const updateTemplate = async (params: { id: number; data: ChecklistTemplateMasterRequest }): Promise<ChecklistTemplateMaster> => {
  const res = await axiosInstance.put(`/checklist-templates/${params.id}`, params.data)
  return res.data.data
}

export const deleteTemplate = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/checklist-templates/${id}`)
}

export const copyTemplate = async (params: { id: number; username?: string }): Promise<ChecklistTemplateMaster> => {
  const res = await axiosInstance.post(`/checklist-templates/${params.id}/copy`, null, {
    params: params.username ? { username: params.username } : {},
  })
  return res.data.data
}

export const uploadTemplateExcel = async (file: File): Promise<ChecklistItem[]> => {
  const formData = new FormData()
  formData.append('file', file)
  const res = await axiosInstance.post('/checklist-templates/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data.data
}

export const downloadTemplateExcel = async (id: number, title: string) => {
  const res = await axiosInstance.get(`/checklist-templates/${id}/download`, {
    responseType: 'blob',
  })
  const url = window.URL.createObjectURL(new Blob([res.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `${title}.xlsx`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

// ===== Result APIs =====

export const fetchResults = async (params: { page: number; size: number; title?: string }) => {
  const { page, size, title } = params
  const url = title ? '/checklist-results/search' : '/checklist-results'
  const queryParams: Record<string, string | number> = { page, size }
  if (title) queryParams.title = title
  const res = await axiosInstance.get(url, { params: queryParams })
  return res.data.data
}

export const fetchResultById = async (id: number): Promise<ChecklistResultMaster> => {
  const res = await axiosInstance.get(`/checklist-results/${id}`)
  return res.data.data
}

export const createResult = async (data: ChecklistResultMasterRequest): Promise<ChecklistResultMaster> => {
  const res = await axiosInstance.post('/checklist-results', data)
  return res.data.data
}

export const updateResult = async (params: { id: number; data: ChecklistResultMasterRequest }): Promise<ChecklistResultMaster> => {
  const res = await axiosInstance.put(`/checklist-results/${params.id}`, params.data)
  return res.data.data
}

export const deleteResult = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/checklist-results/${id}`)
}

export const uploadResultExcel = async (file: File, templateId?: number): Promise<ExcelParseResult> => {
  const formData = new FormData()
  formData.append('file', file)
  const params: Record<string, number> = {}
  if (templateId) params.templateId = templateId
  const res = await axiosInstance.post('/checklist-results/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    params,
  })
  return res.data.data
}

export const downloadResultExcel = async (id: number, title: string) => {
  const res = await axiosInstance.get(`/checklist-results/${id}/download`, {
    responseType: 'blob',
  })
  const url = window.URL.createObjectURL(new Blob([res.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `${title}.xlsx`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
