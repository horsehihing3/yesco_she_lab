// 질병예방 관리 — 7 프로그램 타입

export interface DpMsd {
  id: number
  workerName: string
  department?: string
  jobTitle?: string
  taskName?: string
  taskCategory?: string
  rebaScore?: number
  owasScore?: number
  riskLevel?: string         // 낮음/중간/높음
  affectedBodyParts?: string // CSV
  symptoms?: string          // CSV
  assessmentDate?: string
  assessor?: string
  status?: string            // 정상/요관찰/요개선
  actionTaken?: string
  notes?: string
}

export interface DpCvd {
  id: number
  workerName: string
  department?: string
  age?: number
  gender?: string
  bmi?: number
  bpSys?: number
  bpDia?: number
  fastingGlucose?: number
  ldl?: number
  hdl?: number
  smoking?: string
  drinking?: string
  exercise?: string
  nightShift?: string
  overtime?: string
  riskLevel: string          // 저위험/중위험/고위험
  assessmentDate: string
  assessor?: string
  managementPlan?: string
  nextCheckup?: string
  notes?: string
}

export interface DpStress {
  id: number
  workerName: string
  department?: string
  physicalEnv?: number
  jobDemand?: number
  autonomy?: number
  relationship?: number
  jobInsecurity?: number
  systemFairness?: number
  reward?: number
  workCulture?: number
  totalScore?: number
  riskLevel?: string         // 정상/잠재/고위험
  assessmentDate?: string
  hasCounseling?: boolean
  counselingNotes?: string
  notes?: string
}

export interface DpRespi {
  id: number
  workerName: string
  department?: string
  exposureType: string       // 분진/유기용제/금속분진/산알칼리/감작성물질
  exposureSubstance?: string
  exposureLevel?: string
  ppeType?: string
  fitTestDate?: string
  fitTestResult?: string     // 적합/부적합
  pftFvc?: number
  pftFev1?: number
  skinCondition?: string
  patchTestResult?: string
  status?: string            // 정상/요관찰/이상소견
  examDate?: string
  examiner?: string
  notes?: string
}

export interface DpHearing {
  id: number
  workerName: string
  department?: string
  noiseLevel?: number
  exposureHours?: number
  right4k?: number
  right6k?: number
  left4k?: number
  left6k?: number
  stsResult?: string
  ppeType?: string
  ppeNrr?: number
  examDate?: string
  examType?: string          // 기준선/정기/확인
  status?: string            // 정상/STS발생/D1/D2
  notes?: string
}

export interface DpThermal {
  id: number
  thermalType: string        // 온열/한랭/예방조치
  occurDate: string
  location?: string
  workerName?: string
  department?: string
  weatherCondition?: string
  perceivedTemp?: number
  symptoms?: string
  severity?: string          // 경증/중등도/중증
  treatment?: string
  outcome?: string
  preventionAction?: string
  notes?: string
}

export interface DpInfect {
  id: number
  workerName: string
  department?: string
  programType: string        // 예방접종/검진/감염병발생/노출사고
  diseaseType?: string
  implDate?: string
  result?: string
  status?: string            // 완료/예정/추적관리/회복
  nextDueDate?: string
  notes?: string
}

export interface DiseasePreventionMgmtStats {
  msdTotal: number; msdLow: number; msdMid: number; msdHigh: number;
  cvdTotal: number; cvdLow: number; cvdMid: number; cvdHigh: number;
  stressTotal: number; stressLow: number; stressMid: number; stressHigh: number;
  respiTotal: number; respiOk: number; respiWatch: number; respiAbnormal: number;
  hearingTotal: number; hearingOk: number; hearingSts: number; hearingD: number;
  thermalTotal: number; thermalCases: number; thermalSevere: number; thermalAction: number;
  infectTotal: number; infectVac: number; infectDue: number; infectEvent: number;
}
