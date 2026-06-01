import axiosInstance from './axiosInstance'
import {
  SafetyChecklistTemplate,
  SafetyChecklistInspection,
  SafetyChecklistInspectionRequest,
  SafetyChecklistCategoryRequest,
  SafetyChecklistCategory,
  SafetyChecklistItemRequest,
  SafetyChecklistItem,
} from '../types/safetyChecklist.types'

const BASE = '/checklist'

// Templates
export const fetchSafetyTemplates = async (): Promise<SafetyChecklistTemplate[]> => {
  const res = await axiosInstance.get(`${BASE}/templates`)
  return res.data.data
}

export const fetchSafetyTemplateDetail = async (id: number): Promise<SafetyChecklistTemplate> => {
  const res = await axiosInstance.get(`${BASE}/templates/${id}`)
  return res.data.data
}

export const createSafetyTemplate = async (data: { templateName: string; categoryType?: string; description?: string }): Promise<SafetyChecklistTemplate> => {
  const res = await axiosInstance.post(`${BASE}/templates`, data)
  return res.data.data
}

export const deleteSafetyTemplate = async (id: number) => {
  await axiosInstance.delete(`${BASE}/templates/${id}`)
}

export const copySafetyTemplate = async (id: number): Promise<SafetyChecklistTemplate> => {
  const res = await axiosInstance.post(`${BASE}/templates/${id}/copy`)
  return res.data.data
}

// Categories
export const createSafetyCategory = async (data: SafetyChecklistCategoryRequest): Promise<SafetyChecklistCategory> => {
  const res = await axiosInstance.post(`${BASE}/categories`, data)
  return res.data.data
}

export const updateSafetyCategory = async (id: number, data: SafetyChecklistCategoryRequest): Promise<SafetyChecklistCategory> => {
  const res = await axiosInstance.put(`${BASE}/categories/${id}`, data)
  return res.data.data
}

export const deleteSafetyCategory = async (id: number): Promise<void> => {
  await axiosInstance.delete(`${BASE}/categories/${id}`)
}

// Items
export const createSafetyItem = async (data: SafetyChecklistItemRequest): Promise<SafetyChecklistItem> => {
  const res = await axiosInstance.post(`${BASE}/items`, data)
  return res.data.data
}

export const updateSafetyItem = async (id: number, data: SafetyChecklistItemRequest): Promise<SafetyChecklistItem> => {
  const res = await axiosInstance.put(`${BASE}/items/${id}`, data)
  return res.data.data
}

export const deleteSafetyItem = async (id: number): Promise<void> => {
  await axiosInstance.delete(`${BASE}/items/${id}`)
}

// Inspections
export const fetchSafetyInspections = async (templateId: number): Promise<SafetyChecklistInspection[]> => {
  const res = await axiosInstance.get(`${BASE}/inspections`, { params: { templateId } })
  return res.data.data
}

export const fetchSafetyInspectionDetail = async (id: number): Promise<SafetyChecklistInspection> => {
  const res = await axiosInstance.get(`${BASE}/inspections/${id}`)
  return res.data.data
}

export const createSafetyInspection = async (data: SafetyChecklistInspectionRequest): Promise<SafetyChecklistInspection> => {
  const res = await axiosInstance.post(`${BASE}/inspections`, data)
  return res.data.data
}

export const updateSafetyInspection = async (id: number, data: SafetyChecklistInspectionRequest): Promise<SafetyChecklistInspection> => {
  const res = await axiosInstance.put(`${BASE}/inspections/${id}`, data)
  return res.data.data
}

export const deleteSafetyInspection = async (id: number): Promise<void> => {
  await axiosInstance.delete(`${BASE}/inspections/${id}`)
}

// Batch Save Template
export const batchSaveTemplate = async (templateId: number, payload: {
  categories: {
    id?: number
    categoryName: string
    sortOrder: number
    items: {
      id?: number; classification?: string; checkItem: string; legalBasis: string;
      checkResult?: string; finding?: string; actionDeadline?: string; actionComplete?: boolean;
      sortOrder: number
    }[]
  }[]
  templateName?: string
  description?: string
  inspectorName?: string; inspectorSign?: string; inspectorSignDate?: string
  reviewerName?: string; reviewerSign?: string; reviewerSignDate?: string
  approverName?: string; approverSign?: string; approverSignDate?: string
}): Promise<SafetyChecklistTemplate> => {
  const res = await axiosInstance.put(`${BASE}/templates/${templateId}/batch`, payload)
  return res.data.data
}

// Inspection by Risk Assessment
export const fetchInspectionByRiskAssessment = async (riskAssessmentId: number, templateId: number): Promise<SafetyChecklistInspection | null> => {
  const res = await axiosInstance.get(`${BASE}/inspection-by-risk-assessment`, {
    params: { riskAssessmentId, templateId },
  })
  return res.data.data ?? null
}
