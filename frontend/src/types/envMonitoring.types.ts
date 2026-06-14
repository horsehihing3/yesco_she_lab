export interface EnvMonitoring {
  id: number
  monitorId: string
  monitorType: string
  status: string
  location?: string
  measurementDate: string
  parameterName: string
  measuredValue: number
  unit: string
  standardValue?: number
  standardName?: string
  exceedYn: boolean
  exceedRate?: number
  measurerName?: string
  measurerDept?: string
  equipmentName?: string
  equipmentModel?: string
  correctiveAction?: string
  notes?: string
  createdAt: string
  modifiedAt: string
}

export interface EnvMonitoringRequest {
  monitorType: string
  status?: string
  location?: string
  measurementDate: string
  parameterName: string
  measuredValue: number
  unit: string
  standardValue?: number
  standardName?: string
  exceedYn?: boolean
  exceedRate?: number
  measurerName?: string
  measurerDept?: string
  equipmentName?: string
  equipmentModel?: string
  correctiveAction?: string
  notes?: string
}

export interface EnvMonitoringKpi {
  NORMAL: number
  CAUTION: number
  WARNING: number
  DANGER: number
}
