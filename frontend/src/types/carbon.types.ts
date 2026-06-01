export interface CarbonEmission {
  id: number
  recordDate: string
  sourceName: string
  scope: number
  energyUsage: number | null
  energyUnit: string | null
  co2Emission: number
  factorId: number | null
  manager: string | null
  remark: string | null
  regUser: string | null
  createdAt: string
  modifiedAt: string
}

export interface CarbonEmissionRequest {
  recordDate: string
  sourceName: string
  scope: number
  energyUsage: number | null
  energyUnit: string | null
  co2Emission: number
  factorId: number | null
  manager: string | null
  remark: string | null
}

export interface EmissionSource {
  id: number
  sourceCode: string | null
  sourceName: string
  sourceType: string | null
  scope: number
  location: string | null
  status: string | null
  annualEmission: number | null
  remark: string | null
  regUser: string | null
  createdAt: string
  modifiedAt: string
}

export interface EmissionSourceRequest {
  sourceCode: string | null
  sourceName: string
  sourceType: string | null
  scope: number
  location: string | null
  status: string | null
  annualEmission: number | null
  remark: string | null
}

export interface EmissionFactor {
  id: number
  energySource: string
  unit: string
  factorValue: number
  baseYear: number
  referenceOrg: string | null
  scope: number
  remark: string | null
  regUser: string | null
  createdAt: string
  modifiedAt: string
}

export interface EmissionFactorRequest {
  energySource: string
  unit: string
  factorValue: number
  baseYear: number
  referenceOrg: string | null
  scope: number
  remark: string | null
}
