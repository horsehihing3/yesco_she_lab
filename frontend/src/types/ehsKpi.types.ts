export interface EhsKpiPlan {
  id: number
  planYear: number
  indicatorType: string
  indicatorName: string
  description?: string
  department?: string
  responsiblePerson?: string
  measurementPeriod?: string
  unit?: string
  targetValue?: number
  currentValue?: number
  achievementRate?: number
  status: string
  startDate?: string
  endDate?: string
  notes?: string
  createdAt: string
  modifiedAt: string
}

export interface EhsKpiPlanRequest {
  indicatorName: string
  indicatorType: string
  planYear?: number
  description?: string
  department?: string
  responsiblePerson?: string
  measurementPeriod?: string
  unit?: string
  targetValue?: number
  currentValue?: number
  achievementRate?: number
  status?: string
  startDate?: string
  endDate?: string
  notes?: string
}
