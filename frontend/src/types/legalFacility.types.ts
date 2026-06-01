// 법정시설관리 — 4개 탭(법정기구 관리/현황/검사/관심시설)

export interface FacilityEquipment {
  id: number
  mgmtNo: string
  name: string
  category?: string                 // 압력용기/보일러/크레인·호이스트/리프트/국소배기장치/화학설비/건조설비/전기설비/소방설비
  spec?: string
  location?: string
  installDate?: string
  baseLaw?: string
  inspectType?: string              // 안전검사/정기검사/완성검사/설치검사/자체검사/종합점검
  inspectPeriod?: string            // 1년/2년/3년/4년/6개월
  lastInspectDate?: string
  nextInspectDate?: string
  status: string                    // 정상/임박/만료/휴지/폐기
  ownerUserId?: number              // FK to tb_user
  ownerName?: string
  ownerDept?: string
  maker?: string
  makerNo?: string
  note?: string
  createdAt?: string
  modifiedAt?: string
}

export interface FacilityEquipmentStats {
  totalCount: number
  okCount: number
  expiredCount: number
  nearCount: number
  suspendedCount: number
  complianceRate: number
}

export interface FacilityInspection {
  id: number
  equipmentId?: number
  inspectNo?: string
  equipmentName?: string
  category?: string
  inspectType?: string
  inspectOrg?: string
  applyDate?: string
  inspectDate?: string
  result?: string                   // 합격/조건부합격/불합격/예정
  validUntil?: string
  cost?: number
  inspector?: string
  ownerName?: string
  note?: string
  fix?: string
  createdAt?: string
  modifiedAt?: string
}

export interface FacilityInspectionStats {
  totalCount: number
  passCount: number
  conditionalCount: number
  failCount: number
  passRate: number
}

export interface FacilityWatch {
  id: number
  name: string
  facilityType?: string             // 화학물질 저장·취급/고압·압력설비/환기·배기설비/전기설비/폐수·환경설비/기타
  riskGrade: string                 // A/B/C
  location?: string
  ownerUserId?: number
  ownerName?: string
  cycle?: string
  lastCheckDate?: string
  nextCheckDate?: string
  anomaly?: string
  action?: string
  riskPct?: number
  reason?: string
  createdAt?: string
  modifiedAt?: string
}

export interface FacilityWatchStats {
  totalCount: number
  riskACount: number
  riskBCount: number
  riskCCount: number
}

export interface FacilityWatchCheck {
  id: number
  watchId?: number
  facilityName?: string
  facilityType?: string
  riskGrade?: string
  checkDate: string
  content?: string
  checker?: string
  anomaly?: string
  action?: string
  nextCheckDate?: string
  riskChange?: string
  createdAt?: string
  modifiedAt?: string
}
