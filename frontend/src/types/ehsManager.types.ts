export interface EhsManager {
  id: number
  roleCategory: string
  roleDetail?: string
  rolePlace?: string
  roleIdx?: string
  userName: string
  userMail?: string
  userDept?: string
  userCompany?: string
  roleCaHd?: string
  roleCaField?: string
  roleCaTeam?: string
  isAdmin?: boolean
  active?: boolean
  createdAt: string
}

export interface EhsManagerRequest {
  roleCategory: string
  roleDetail?: string
  rolePlace?: string
  roleIdx?: string
  userName: string
  userMail?: string
  userDept?: string
  userCompany?: string
  roleCaHd?: string
  roleCaField?: string
  roleCaTeam?: string
  isAdmin?: boolean
  active?: boolean
}
