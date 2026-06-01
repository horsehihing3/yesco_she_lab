// 폐기물 관리
export interface WasteManage {
  id: number
  wasteCode?: string
  wasteType?: string
  wasteName?: string
  wasteCategory?: string
  generationAmount?: number
  unit?: string
  generationDate?: string
  department?: string
  storageLocation?: string
  status?: string
  disposalMethod?: string
  disposalCompany?: string
  disposalDate?: string
  vehicleNumber?: string
  disposalNotes?: string
  disposalCost?: number
  manager?: string
  remark?: string
  regUser?: string
  createdAt: string
  modifiedAt: string
}

export interface WasteManageRequest {
  wasteCode?: string
  wasteType?: string
  wasteName?: string
  wasteCategory?: string
  generationAmount?: number
  unit?: string
  generationDate?: string
  department?: string
  storageLocation?: string
  status?: string
  disposalMethod?: string
  disposalCompany?: string
  disposalDate?: string
  vehicleNumber?: string
  disposalNotes?: string
  disposalCost?: number
  manager?: string
  remark?: string
}

// 처리업체 관리
export interface DisposalCompany {
  id: number
  companyName?: string
  companyCode?: string
  businessNumber?: string
  ceoName?: string
  phone?: string
  address?: string
  wasteTypes?: string
  licenseNumber?: string
  licenseExpiry?: string
  rating?: string
  status?: string
  regUser?: string
  createdAt: string
  modifiedAt: string
}

export interface DisposalCompanyRequest {
  companyName?: string
  companyCode?: string
  businessNumber?: string
  ceoName?: string
  phone?: string
  address?: string
  wasteTypes?: string
  licenseNumber?: string
  licenseExpiry?: string
  rating?: string
  status?: string
}

// 법규 준수 관리
export interface WasteCompliance {
  id: number
  checkDate?: string
  regulationName?: string
  checkItem?: string
  status?: string
  violationDetails?: string
  correctiveAction?: string
  actionDeadline?: string
  responsiblePerson?: string
  actionStatus?: string
  regUser?: string
  createdAt: string
  modifiedAt: string
}

export interface WasteComplianceRequest {
  checkDate?: string
  regulationName?: string
  checkItem?: string
  status?: string
  violationDetails?: string
  correctiveAction?: string
  actionDeadline?: string
  responsiblePerson?: string
  actionStatus?: string
}

// 수질 관리
export interface WaterQuality {
  id: number
  measurementDate?: string
  measurementPoint?: string
  ph?: number
  bod?: number
  cod?: number
  ss?: number
  tN?: number
  tP?: number
  manager?: string
  remark?: string
  regUser?: string
  createdAt: string
  modifiedAt: string
}

export interface WaterQualityRequest {
  measurementDate?: string
  measurementPoint?: string
  ph?: number
  bod?: number
  cod?: number
  ss?: number
  tN?: number
  tP?: number
  manager?: string
  remark?: string
}

// 대기배출 관리
export interface AirEmission {
  id: number
  measurementDate?: string
  facility?: string
  pollutant?: string
  emissionConcentration?: number
  unit?: string
  emissionStandard?: number
  compliance?: string
  manager?: string
  remark?: string
  regUser?: string
  createdAt: string
  modifiedAt: string
}

export interface AirEmissionRequest {
  measurementDate?: string
  facility?: string
  pollutant?: string
  emissionConcentration?: number
  unit?: string
  emissionStandard?: number
  compliance?: string
  manager?: string
  remark?: string
}

// Water Workplace
export interface WaterWorkplace {
  id: number
  workplaceName: string
  region: string
  manager: string
  remark: string
  regUser: string
  createdAt: string
  modifiedAt: string
}
export interface WaterWorkplaceRequest {
  workplaceName: string
  region: string
  manager: string
  remark: string
}

// Water Sampling Point
export interface WaterSamplingPoint {
  id: number
  workplaceId: number
  workplaceName: string
  pointName: string
  location: string
  remark: string
  regUser: string
  createdAt: string
  modifiedAt: string
}
export interface WaterSamplingPointRequest {
  workplaceId: number
  pointName: string
  location: string
  remark: string
}

// Water Standard
export interface WaterStandard {
  id: number
  itemName: string
  unit: string
  minValue: number
  maxValue: number
  remark: string
  regUser: string
  createdAt: string
  modifiedAt: string
}
export interface WaterStandardRequest {
  itemName: string
  unit: string
  minValue: number
  maxValue: number
  remark: string
}

// Air Emission Standard
export interface AirEmissionStandard {
  id: number
  itemName: string
  unit: string
  minValue: number
  maxValue: number
  remark: string
  regUser: string
  createdAt: string
  modifiedAt: string
}
export interface AirEmissionStandardRequest {
  itemName: string
  unit: string
  minValue: number
  maxValue: number
  remark: string
}
