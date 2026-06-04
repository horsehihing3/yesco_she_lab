import axiosInstance from './axiosInstance'
import { ApiResponse } from '../types/common.types'
import { FileMetadata } from '../types/file.types'

export const EVAL_SHEET_ENTITY_TYPE = 'EVAL_SHEET_ITEM'

export interface EvalSheetItem {
  id: number
  metaId?: number
  sortOrder: number
  category: string
  evalItem: string
  evalContent: string
  maxScore: number
  score: number | null
  createdAt: string
  modifiedAt: string
}

export interface EvalSheetItemRequest {
  sortOrder?: number
  category: string
  evalItem: string
  evalContent: string
  maxScore: number
}

export interface EvalSheetMeta {
  id: number
  title: string
  description: string
  createdAt?: string
  modifiedAt?: string
}

export const evalSheetApi = {
  // ===== 항목 =====
  getAll: async (metaId?: number): Promise<EvalSheetItem[]> => {
    const params = metaId != null ? { metaId } : undefined
    const res = await axiosInstance.get<ApiResponse<EvalSheetItem[]>>('/eval-sheet/items', { params })
    return res.data.data
  },
  create: async (data: EvalSheetItemRequest): Promise<EvalSheetItem> => {
    const res = await axiosInstance.post<ApiResponse<EvalSheetItem>>('/eval-sheet/items', data)
    return res.data.data
  },
  update: async (id: number, data: EvalSheetItemRequest): Promise<EvalSheetItem> => {
    const res = await axiosInstance.put<ApiResponse<EvalSheetItem>>(`/eval-sheet/items/${id}`, data)
    return res.data.data
  },
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/eval-sheet/items/${id}`)
  },
  updateScore: async (id: number, score: number | null): Promise<EvalSheetItem> => {
    const res = await axiosInstance.patch<ApiResponse<EvalSheetItem>>(`/eval-sheet/items/${id}/score`, { score })
    return res.data.data
  },

  // 단일 호출로 meta + items 일괄 저장 (생성/수정/삭제 한 번에)
  // meta.id 가 있으면 해당 평가표를 갱신, 없으면 신규 평가표 생성
  saveAll: async (payload: {
    meta: { id?: number; title: string; description: string }
    items: Array<{ id?: number; category: string; evalItem: string; evalContent: string; maxScore: number }>
    removedIds: number[]
  }): Promise<{ items: EvalSheetItem[]; meta: EvalSheetMeta }> => {
    const res = await axiosInstance.post<ApiResponse<{ items: EvalSheetItem[]; meta: EvalSheetMeta }>>(
      '/eval-sheet/save', payload,
    )
    return res.data.data
  },

  // ===== 평가표(meta) 목록 / 복사 / 삭제 — multi-instance =====
  listMetas: async (): Promise<EvalSheetMeta[]> => {
    const res = await axiosInstance.get<ApiResponse<EvalSheetMeta[]>>('/eval-sheet/metas')
    return res.data.data
  },
  getMetaById: async (id: number): Promise<EvalSheetMeta> => {
    const res = await axiosInstance.get<ApiResponse<EvalSheetMeta>>(`/eval-sheet/meta/${id}`)
    return res.data.data
  },
  copyMeta: async (id: number): Promise<EvalSheetMeta> => {
    const res = await axiosInstance.post<ApiResponse<EvalSheetMeta>>(`/eval-sheet/meta/${id}/copy`)
    return res.data.data
  },
  deleteMeta: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/eval-sheet/meta/${id}`)
  },

  // ===== 메타 (제목/설명) =====
  getMeta: async (): Promise<EvalSheetMeta> => {
    const res = await axiosInstance.get<ApiResponse<EvalSheetMeta>>('/eval-sheet/meta')
    return res.data.data
  },
  updateMeta: async (data: { title: string; description: string }): Promise<EvalSheetMeta> => {
    const res = await axiosInstance.put<ApiResponse<EvalSheetMeta>>('/eval-sheet/meta', data)
    return res.data.data
  },

  // ===== 첨부파일 =====
  uploadAttachment: async (itemId: number, file: File): Promise<FileMetadata> => {
    const form = new FormData()
    form.append('file', file)
    form.append('entityType', EVAL_SHEET_ENTITY_TYPE)
    form.append('entityId', String(itemId))
    const res = await axiosInstance.post<ApiResponse<FileMetadata>>('/files/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.data
  },
  listAttachments: async (itemId: number): Promise<FileMetadata[]> => {
    const res = await axiosInstance.get<ApiResponse<FileMetadata[]>>(`/files/by-entity/${EVAL_SHEET_ENTITY_TYPE}/${itemId}`)
    return res.data.data || []
  },
  deleteAttachment: async (fileId: number): Promise<void> => {
    await axiosInstance.delete(`/files/${fileId}`)
  },
}
