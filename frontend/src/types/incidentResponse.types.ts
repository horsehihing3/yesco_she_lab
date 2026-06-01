export interface IncidentResponse {
  id: number
  responseId: string
  title: string
  incidentType: string         // FIRE / EXPLOSION / GAS_LEAK / CHEM_LEAK / NAT_DISASTER / HEAT_WAVE / COLD_WAVE / EARTHQUAKE / POWER_OUT / CASUALTY
  status: string               // ISSUED / RESPONDING / CLOSED
  severity?: string            // MINOR / MODERATE / SEVERE
  location: string
  reportedAt: string           // ISO datetime
  isDrill: boolean
  reporter?: string
  description?: string
  actionTaken?: string
  casualtyInfo?: string
  deleted?: boolean
  createdAt: string
  modifiedAt: string
}

export interface IncidentResponseStats {
  total: number
  issued: number
  responding: number
  closed: number
  drill: number
}
