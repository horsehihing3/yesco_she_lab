export interface EmergencyPlan {
  id: number
  planId: string
  planType: string
  planName: string
  description?: string
  responseSteps?: string
  responsibleDept?: string
  responsibleName?: string
  trainingStartDate?: string
  trainingEndDate?: string
  resourceIds?: string
  checklistTemplateId?: number
  notes?: string
  status?: string

  createdByUserId?: number | null
  createdByTeam?: string
  createdByPosition?: string
  createdByName?: string

  modifiedByUserId?: number | null
  modifiedByName?: string | null

  planApproverUserId?: number | null
  planApproverTeam?: string
  planApproverPosition?: string
  planApproverName?: string
  planApprovedAt?: string
  planApprovedBy?: string

  completionApproverUserId?: number | null
  completionApproverTeam?: string
  completionApproverPosition?: string
  completionApproverName?: string
  completionApprovedAt?: string
  completionApprovedBy?: string

  approved?: boolean
  rejectReason?: string | null
  createdAt: string
  modifiedAt: string
}

export interface EmergencyPlanRequest {
  planType: string
  planName: string
  description?: string
  responseSteps?: string
  responsibleDept?: string
  responsibleName?: string
  trainingStartDate?: string
  trainingEndDate?: string
  resourceIds?: string
  checklistTemplateId?: number
  notes?: string
  status?: string
  createdByUserId?: number | null
  createdByTeam?: string
  createdByPosition?: string
  createdByName?: string
  modifiedByUserId?: number | null
  modifiedByName?: string | null
  planApproverUserId?: number | null
  planApproverTeam?: string
  planApproverPosition?: string
  planApproverName?: string
  completionApproverUserId?: number | null
  completionApproverTeam?: string
  completionApproverPosition?: string
  completionApproverName?: string
}

export interface EmergencyDrill {
  id: number
  drillId: string
  planId?: number
  drillName: string
  drillType: string
  targetDept?: string
  scheduledDate?: string
  participantCount?: number
  evacuationTime?: string
  status: string
  score?: string
  location?: string
  targetTime?: string
  scenario?: string
  notes?: string
  totalChecklist: number
  completedChecklist: number
  findingCount: number
  modifiedBy?: string
  createdAt: string
  modifiedAt: string
}

export interface EmergencyDrillRequest {
  planId?: number
  drillName: string
  drillType: string
  targetDept?: string
  scheduledDate?: string
  participantCount?: number
  evacuationTime?: string
  status?: string
  score?: string
  location?: string
  targetTime?: string
  scenario?: string
  notes?: string
}

export interface EmergencyResource {
  id: number
  resourceId: string
  resourceName: string
  resourceType: string
  quantity: number
  availableQty: number
  location?: string
  disposalDate?: string
  status: string
  notes?: string
  createdAt: string
  modifiedAt: string
}

export interface EmergencyResourceRequest {
  resourceName: string
  resourceType: string
  quantity?: number
  availableQty?: number
  location?: string
  disposalDate?: string
  status?: string
  notes?: string
}

export interface EmergencyContact {
  id: number
  contactId: string
  organization: string
  contactName: string
  phoneNumber: string
  email?: string
  contactType: string
  isEmergency: boolean
  sortOrder: number
  notes?: string
  createdAt: string
  modifiedAt: string
}

export interface EmergencyContactRequest {
  organization: string
  contactName: string
  phoneNumber: string
  email?: string
  contactType?: string
  isEmergency?: boolean
  sortOrder?: number
  notes?: string
}
