export interface WorkPlace {
  id: number
  title?: string
  place: string
  floor?: string
  used: boolean
  company?: string
  coordinate?: string
  imagePath?: string
  createdAt: string
  modifiedAt: string
}

export interface WorkPlaceRequest {
  title?: string
  place: string
  floor?: string
  used?: boolean
  company?: string
  coordinate?: string
  imagePath?: string
}
