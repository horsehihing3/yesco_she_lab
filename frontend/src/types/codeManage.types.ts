export interface CodeGroup {
  id: number
  groupCode: string
  groupName: string
  description?: string
  isActive: boolean
  sortOrder: number
  createdAt: string
  modifiedAt: string
}

export interface CodeGroupRequest {
  groupCode: string
  groupName: string
  description?: string
  isActive?: boolean
  sortOrder?: number
}

export interface CodeDetail {
  id: number
  groupId: number
  code: string
  codeValue?: string
  codeNameKo?: string
  codeNameEn?: string
  codeNameZh?: string
  descriptionKo?: string
  descriptionEn?: string
  descriptionZh?: string
  isActive: boolean
  sortOrder: number
  createdAt: string
  modifiedAt: string
}

export interface CodeDetailRequest {
  groupId: number
  code: string
  codeValue?: string
  codeNameKo: string
  codeNameEn: string
  codeNameZh: string
  descriptionKo?: string
  descriptionEn?: string
  descriptionZh?: string
  isActive?: boolean
  sortOrder?: number
}
