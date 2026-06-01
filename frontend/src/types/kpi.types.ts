export interface KpiRecord {
  id: number
  kpiType: string
  recordYear: number
  recordMonth: number
  targetValue?: number
  actualValue?: number
  unit?: string
  department?: string
  notes?: string
}
