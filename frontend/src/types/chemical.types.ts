export interface Chemical {
  id: number
  chemicalId: string
  chemicalNameKo: string
  chemicalNameEn?: string
  casNumber?: string
  hazardClass: string
  status: string
  msdsFileId?: number
  storageLocation?: string
  storageQuantity?: number
  unit?: string
  maxStorageLimit?: number
  supplier?: string
  department?: string
  handlerName?: string
  emergencyProcedure?: string
  lastInspectionDate?: string
  nextInspectionDate?: string
  ghsPictogram?: string
  signalWord?: string
  hazardStatements?: string
  precautionaryStatements?: string
  molecularFormula?: string
  applicableRegulation?: string
  ghsClassification?: string
  exposureLimit?: string
  notes?: string
  createdAt: string
  modifiedAt: string
}

export interface ChemicalRequest {
  chemicalNameKo: string
  chemicalNameEn?: string
  casNumber?: string
  hazardClass: string
  status?: string
  msdsFileId?: number
  storageLocation?: string
  storageQuantity?: number
  unit?: string
  maxStorageLimit?: number
  supplier?: string
  department?: string
  handlerName?: string
  emergencyProcedure?: string
  lastInspectionDate?: string
  nextInspectionDate?: string
  ghsPictogram?: string
  signalWord?: string
  hazardStatements?: string
  precautionaryStatements?: string
  molecularFormula?: string
  applicableRegulation?: string
  ghsClassification?: string
  exposureLimit?: string
  notes?: string
}

// ===== ERP Material =====
export interface ErpMaterial {
  id: number
  materialCode: string
  materialName: string
  chemicalName?: string
  casNumber?: string
  supplier?: string
  stockQuantity?: number
  unit?: string
  unitPrice?: number
  lastIncomingDate?: string
  status: string
  createdAt: string
  modifiedAt: string
}

// ===== Vendor =====
export interface ChemicalVendor {
  id: number
  vendorCode: string
  vendorName: string
  representative?: string
  contactPerson?: string
  phone?: string
  supplyItemsCount?: number
  msdsStatus?: string
  lastTransactionDate?: string
  grade?: string
  createdAt: string
  modifiedAt: string
}

// ===== Regulation =====
export interface ChemicalRegulation {
  id: number
  regCode: string
  regName: string
  regType?: string
  authority?: string
  applicableCount?: number
  lastRevisionDate?: string
  nextReviewDate?: string
  status: string
  createdAt: string
  modifiedAt: string
}

// ===== Regulation Check =====
export interface RegulationCheck {
  id: number
  checkId: string
  checkName: string
  relatedRegulation?: string
  checkType?: string
  assignee?: string
  dueDate?: string
  progress?: number
  status: string
  createdAt: string
  modifiedAt: string
}

// ===== MSDS =====
export interface Msds {
  id: number
  msdsType: string
  itemName: string
  itemCode?: string
  casNumber?: string
  supplier?: string
  version?: string
  issueDate?: string
  retireDate?: string
  retireReason?: string
  language?: string
  fileSize?: string
  fileId?: number
  exportCountries?: string
  isLatest?: boolean
  changeType?: string
  changeSummary?: string
  registeredBy?: string
  status: string
  createdAt: string
  modifiedAt: string
}

// ===== GHS =====
export interface ChemicalGhs {
  id: number
  chemicalName: string
  casNumber?: string
  physicalHazard?: string
  healthHazard?: string
  environmentalHazard?: string
  signalWord?: string
  ghsVersion?: string
  status: string
  createdAt: string
  modifiedAt: string
}

// ===== REACH =====
export interface ChemicalReach {
  id: number
  chemicalName: string
  casNumber?: string
  registrationNo?: string
  svhc?: string
  authorizationRequired?: string
  restrictionNote?: string
  registrationDate?: string
  status: string
  createdAt: string
  modifiedAt: string
}

// ===== CLP =====
export interface ChemicalClp {
  id: number
  chemicalName: string
  casNumber?: string
  clpClassification?: string
  signalWord?: string
  hCodes?: string
  pCodes?: string
  lastUpdated?: string
  status: string
  createdAt: string
  modifiedAt: string
}

// ===== TSCA =====
export interface ChemicalTsca {
  id: number
  chemicalName: string
  casNumber?: string
  inventoryStatus?: string
  regulationSection?: string
  reportingDuty?: string
  exportToUs?: string
  pmnRequired?: string
  status: string
  createdAt: string
  modifiedAt: string
}

// ===== Warehouse =====
export interface ChemicalWarehouse {
  id: number
  warehouseCode: string
  warehouseName: string
  storageType?: string
  location?: string
  storedItemsCount?: number
  totalStock?: string
  temperature?: string
  humidity?: string
  status: string
  createdAt: string
  modifiedAt: string
}

// ===== Incoming =====
export interface ChemicalIncoming {
  id: number
  incomingDate: string
  incomingNo: string
  chemicalName: string
  supplier?: string
  quantity?: number
  unit?: string
  warehouseCode?: string
  handler?: string
  msdsConfirmed?: boolean
  createdAt: string
  modifiedAt: string
}

// ===== Usage =====
export interface ChemicalUsage {
  id: number
  usageDate: string
  chemicalName: string
  department?: string
  purpose?: string
  usageQuantity?: number
  unit?: string
  handler?: string
  remainingStock?: string
  createdAt: string
  modifiedAt: string
}

// ===== Lot Tracking =====
export interface ChemicalLotTracking {
  id: number
  lotNumber: string
  chemicalName: string
  incomingDate?: string
  incomingQuantity?: string
  currentLocation?: string
  usedQuantity?: string
  remainingQuantity?: string
  elapsedDays?: number
  status: string
  createdAt: string
  modifiedAt: string
}

// ===== Usage Report =====
export interface ChemicalUsageReport {
  id: number
  reportYear: number
  chemicalName: string
  casNumber?: string
  annualUsage?: number
  unit?: string
  usagePurpose?: string
  reportDeadline?: string
  submitDate?: string
  status: string
  createdAt: string
  modifiedAt: string
}

// ===== Hazard Report =====
export interface ChemicalHazardReport {
  id: number
  reportYear: number
  chemicalName: string
  casNumber?: string
  hazardClass?: string
  annualHandling?: string
  handlingFacility?: string
  reportDeadline?: string
  submitDate?: string
  status: string
  createdAt: string
  modifiedAt: string
}
