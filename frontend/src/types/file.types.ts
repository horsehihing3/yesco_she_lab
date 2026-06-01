export interface FileMetadata {
  id: number
  originalFilename: string
  storedFilename: string
  filePath: string
  fileSize: number
  contentType: string
  entityType: string
  entityId: string
  uploadedBy?: string
  createdAt: string
  language?: string | null
  parentFileId?: number | null
  translationStatus?: string | null
}

export interface FileUploadRequest {
  file: File
  entityType: string
  entityId: string
}
