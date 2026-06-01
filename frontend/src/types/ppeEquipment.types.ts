export type PpeEquipmentStatus = 'NORMAL' | 'EXPIRY_SOON' | 'EXPIRED' | 'LOW_STOCK'

export interface PpeEquipment {
  id: number
  equipmentId: string
  name: string
  nameEn?: string
  nameZh?: string
  category: string
  categoryEn?: string
  categoryZh?: string
  model?: string
  certification?: string
  stockQuantity: number
  minStock: number
  wearRate?: number
  expiryDate?: string
  inspectCycle?: string
  lastInspectDate?: string
  nextInspectDate?: string
  storageLocation?: string
  department?: string
  status: PpeEquipmentStatus
  notes?: string
  createdAt: string
  modifiedAt: string
}

export interface PpeEquipmentRequest {
  name: string
  nameEn?: string
  nameZh?: string
  category: string
  categoryEn?: string
  categoryZh?: string
  model?: string
  certification?: string
  stockQuantity: number
  minStock?: number
  wearRate?: number
  expiryDate?: string
  inspectCycle?: string
  lastInspectDate?: string
  nextInspectDate?: string
  storageLocation?: string
  department?: string
  status?: string
  notes?: string
}

export type PpeActionType = 'ISSUE' | 'RETURN' | 'DISPOSE'

export interface PpeHistory {
  id: number
  historyId: string
  actionType: PpeActionType
  itemName: string
  quantity: number
  recipientName?: string
  recipientDept?: string
  handlerName?: string
  actionDate: string
  notes?: string
  createdAt: string
}

export interface PpeHistoryRequest {
  actionType: string
  itemName: string
  quantity: number
  recipientName?: string
  recipientDept?: string
  handlerName?: string
  actionDate?: string
  notes?: string
}

export interface PpeRequestItem {
  id: number
  requestId: string
  status: string
  equipmentId?: number
  itemName: string
  itemCategory?: string
  itemModel?: string
  quantity: number
  reason?: string
  requesterName?: string
  requesterDept?: string
  requesterId?: string
  requestDate: string
  approverName?: string
  approverDept?: string
  approvedAt?: string
  issuedAt?: string
  returnedAt?: string
  rejectionReason?: string
  notes?: string
  createdAt: string
  modifiedAt: string
}

export interface PpeRequestCreate {
  equipmentId?: number
  itemName: string
  itemCategory?: string
  itemModel?: string
  quantity: number
  reason?: string
  requesterName?: string
  requesterDept?: string
  requesterId?: string
  notes?: string
}

export interface PpeKpiStats {
  totalItems: number
  expirySoonCount: number
  expiredCount: number
  lowStockCount: number
  avgWearRate: number
}
