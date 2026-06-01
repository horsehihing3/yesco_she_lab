import axiosInstance from './axiosInstance'
import { ApiResponse } from '../types/common.types'
import { FileMetadata } from '../types/file.types'

// 체크리스트/평가표/위험성평가 등 항목(item) 단위 첨부파일.
// 백엔드 /files 엔드포인트는 entityType 문자열을 자유롭게 받으므로 별도 컨트롤러가 필요 없다.
export const SAFETY_CHECKLIST_ITEM_ENTITY_TYPE = 'SAFETY_CHECKLIST_ITEM'
export const RISK_ASSESSMENT_ITEM_ENTITY_TYPE = 'RISK_ASSESSMENT_FORM_ITEM'

export const itemAttachmentApi = {
  upload: async (entityType: string, itemId: number | string, file: File): Promise<FileMetadata> => {
    const form = new FormData()
    form.append('file', file)
    form.append('entityType', entityType)
    form.append('entityId', String(itemId))
    const res = await axiosInstance.post<ApiResponse<FileMetadata>>('/files/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.data
  },
  list: async (entityType: string, itemId: number | string): Promise<FileMetadata[]> => {
    const res = await axiosInstance.get<ApiResponse<FileMetadata[]>>(`/files/by-entity/${entityType}/${itemId}`)
    return res.data.data || []
  },
  remove: async (fileId: number): Promise<void> => {
    await axiosInstance.delete(`/files/${fileId}`)
  },
}
