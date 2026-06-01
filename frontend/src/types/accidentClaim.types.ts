export interface AccidentClaim {
  id: number
  claimId: string
  status: string
  workerName?: string
  workerSsn?: string
  workerPhone?: string
  workerAddress?: string
  workerJobType?: string
  workerJoinDate?: string
  workerDept?: string
  companyName?: string
  companyRepName?: string
  companyBizNo?: string
  companyAddress?: string
  companyPhone?: string
  companyIndustry?: string
  companyWorkersCount?: number
  diseaseName?: string
  diseaseCode?: string
  onsetDate?: string
  diagnosisDate?: string
  exposurePeriod?: string
  exposureFactor?: string
  workHistory?: string
  hospitalName?: string
  hospitalDept?: string
  treatmentStartDate?: string
  treatmentEndDate?: string
  treatmentType?: string
  applicantName?: string
  applicantRelation?: string
  applyDate?: string
  notes?: string
  createdBy?: string
  createdAt: string
  modifiedAt: string
}

export interface AccidentClaimRequest {
  workerName?: string
  workerSsn?: string
  workerPhone?: string
  workerAddress?: string
  workerJobType?: string
  workerJoinDate?: string
  workerDept?: string
  companyName?: string
  companyRepName?: string
  companyBizNo?: string
  companyAddress?: string
  companyPhone?: string
  companyIndustry?: string
  companyWorkersCount?: number
  diseaseName?: string
  diseaseCode?: string
  onsetDate?: string
  diagnosisDate?: string
  exposurePeriod?: string
  exposureFactor?: string
  workHistory?: string
  hospitalName?: string
  hospitalDept?: string
  treatmentStartDate?: string
  treatmentEndDate?: string
  treatmentType?: string
  applicantName?: string
  applicantRelation?: string
  applyDate?: string
  notes?: string
  status?: string
}

export interface AccidentClaimDoc {
  id: number
  claimId: number
  docType: string
  docName: string
  isRequired: boolean
  isSubmitted: boolean
  fileId?: number
  notes?: string
  createdAt: string
}
