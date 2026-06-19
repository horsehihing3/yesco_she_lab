// 보호구·장비 (PPE) 8개 도메인 API 모듈
import axios from './axiosInstance'
import {
  PpeItem, PpeItemRequest, PpeItemKpi,
  PpeStock, PpeStockRequest, PpeStockKpi,
  PpeInout, PpeInoutRequest, PpeInoutKpi, PpeInoutType,
  PpeIssue, PpeIssueRequest, PpeIssueKpi,
  PpeInspection, PpeInspectionRequest, PpeInspectionKpi,
  PpeWear, PpeWearRequest, PpeWearKpi, PpeWearDeptRate,
  PpePerformance, PpePerformanceRequest, PpePerformanceKpi,
  PpeBudget, PpeBudgetRequest, PpeBudgetKpi,
  PpePageResponse,
} from '../types/ppe.types'

// 공통: ApiResponse<T> 의 data 추출
const unwrap = <T>(r: { data: { data: T } }): T => r.data.data

// ════════════════════════════════════════════════════════════════════
// 1. 품목 마스터
// ════════════════════════════════════════════════════════════════════
export const ppeItemApi = {
  getAll: (page = 0, size = 10) =>
    axios.get<{ data: PpePageResponse<PpeItem> }>(`/ppe-items?page=${page}&size=${size}`).then(unwrap),
  search: (keyword: string, page = 0, size = 10) =>
    axios.get<{ data: PpePageResponse<PpeItem> }>(`/ppe-items/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`).then(unwrap),
  getByCategory: (category: string, page = 0, size = 10) =>
    axios.get<{ data: PpePageResponse<PpeItem> }>(`/ppe-items/category/${encodeURIComponent(category)}?page=${page}&size=${size}`).then(unwrap),
  getById: (id: number) =>
    axios.get<{ data: PpeItem }>(`/ppe-items/${id}`).then(unwrap),
  getKpi: () =>
    axios.get<{ data: PpeItemKpi }>('/ppe-items/kpi').then(unwrap),
  create: (req: PpeItemRequest) =>
    axios.post<{ data: PpeItem }>('/ppe-items', req).then(unwrap),
  update: (id: number, req: PpeItemRequest) =>
    axios.put<{ data: PpeItem }>(`/ppe-items/${id}`, req).then(unwrap),
  delete: (id: number) =>
    axios.delete(`/ppe-items/${id}`),
}

// ════════════════════════════════════════════════════════════════════
// 2. 창고별 재고
// ════════════════════════════════════════════════════════════════════
export const ppeStockApi = {
  getAll: (page = 0, size = 10) =>
    axios.get<{ data: PpePageResponse<PpeStock> }>(`/ppe-stocks?page=${page}&size=${size}`).then(unwrap),
  search: (keyword: string, page = 0, size = 10) =>
    axios.get<{ data: PpePageResponse<PpeStock> }>(`/ppe-stocks/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`).then(unwrap),
  getByLocation: (location: string, page = 0, size = 10) =>
    axios.get<{ data: PpePageResponse<PpeStock> }>(`/ppe-stocks/location/${encodeURIComponent(location)}?page=${page}&size=${size}`).then(unwrap),
  getLowStock: () =>
    axios.get<{ data: PpeStock[] }>('/ppe-stocks/low').then(unwrap),
  getExpiring: (days = 30) =>
    axios.get<{ data: PpeStock[] }>(`/ppe-stocks/expiring?days=${days}`).then(unwrap),
  getById: (id: number) =>
    axios.get<{ data: PpeStock }>(`/ppe-stocks/${id}`).then(unwrap),
  getKpi: () =>
    axios.get<{ data: PpeStockKpi }>('/ppe-stocks/kpi').then(unwrap),
  create: (req: PpeStockRequest) =>
    axios.post<{ data: PpeStock }>('/ppe-stocks', req).then(unwrap),
  update: (id: number, req: PpeStockRequest) =>
    axios.put<{ data: PpeStock }>(`/ppe-stocks/${id}`, req).then(unwrap),
  delete: (id: number) =>
    axios.delete(`/ppe-stocks/${id}`),
}

// ════════════════════════════════════════════════════════════════════
// 3. 입출고 이력
// ════════════════════════════════════════════════════════════════════
export const ppeInoutApi = {
  getAll: (page = 0, size = 10) =>
    axios.get<{ data: PpePageResponse<PpeInout> }>(`/ppe-inouts?page=${page}&size=${size}`).then(unwrap),
  search: (keyword: string, page = 0, size = 10) =>
    axios.get<{ data: PpePageResponse<PpeInout> }>(`/ppe-inouts/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`).then(unwrap),
  getByType: (type: PpeInoutType, page = 0, size = 10) =>
    axios.get<{ data: PpePageResponse<PpeInout> }>(`/ppe-inouts/type/${type}?page=${page}&size=${size}`).then(unwrap),
  getRecent: (limit = 8) =>
    axios.get<{ data: PpeInout[] }>(`/ppe-inouts/recent?limit=${limit}`).then(unwrap),
  getById: (id: number) =>
    axios.get<{ data: PpeInout }>(`/ppe-inouts/${id}`).then(unwrap),
  getKpi: () =>
    axios.get<{ data: PpeInoutKpi }>('/ppe-inouts/kpi').then(unwrap),
  create: (req: PpeInoutRequest) =>
    axios.post<{ data: PpeInout }>('/ppe-inouts', req).then(unwrap),
  update: (id: number, req: PpeInoutRequest) =>
    axios.put<{ data: PpeInout }>(`/ppe-inouts/${id}`, req).then(unwrap),
  delete: (id: number) =>
    axios.delete(`/ppe-inouts/${id}`),
}

// ════════════════════════════════════════════════════════════════════
// 4. 지급·반납
// ════════════════════════════════════════════════════════════════════
export const ppeIssueApi = {
  getAll: (page = 0, size = 10) =>
    axios.get<{ data: PpePageResponse<PpeIssue> }>(`/ppe-issues?page=${page}&size=${size}`).then(unwrap),
  search: (keyword: string, page = 0, size = 10) =>
    axios.get<{ data: PpePageResponse<PpeIssue> }>(`/ppe-issues/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`).then(unwrap),
  getByDepartment: (dept: string, page = 0, size = 10) =>
    axios.get<{ data: PpePageResponse<PpeIssue> }>(`/ppe-issues/department/${encodeURIComponent(dept)}?page=${page}&size=${size}`).then(unwrap),
  getByStatus: (status: string, page = 0, size = 10) =>
    axios.get<{ data: PpePageResponse<PpeIssue> }>(`/ppe-issues/status/${encodeURIComponent(status)}?page=${page}&size=${size}`).then(unwrap),
  getById: (id: number) =>
    axios.get<{ data: PpeIssue }>(`/ppe-issues/${id}`).then(unwrap),
  getKpi: () =>
    axios.get<{ data: PpeIssueKpi }>('/ppe-issues/kpi').then(unwrap),
  create: (req: PpeIssueRequest) =>
    axios.post<{ data: PpeIssue }>('/ppe-issues', req).then(unwrap),
  update: (id: number, req: PpeIssueRequest) =>
    axios.put<{ data: PpeIssue }>(`/ppe-issues/${id}`, req).then(unwrap),
  returnItem: (id: number, who: Partial<PpeIssueRequest>) =>
    axios.post<{ data: PpeIssue }>(`/ppe-issues/${id}/return`, who).then(unwrap),
  replaceRequest: (id: number, who: Partial<PpeIssueRequest>) =>
    axios.post<{ data: PpeIssue }>(`/ppe-issues/${id}/replace-request`, who).then(unwrap),
  lossReport: (id: number, who: Partial<PpeIssueRequest>) =>
    axios.post<{ data: PpeIssue }>(`/ppe-issues/${id}/loss-report`, who).then(unwrap),
  delete: (id: number) =>
    axios.delete(`/ppe-issues/${id}`),
}

// ════════════════════════════════════════════════════════════════════
// 5. 검사·점검
// ════════════════════════════════════════════════════════════════════
export const ppeInspectionApi = {
  getAll: (page = 0, size = 10) =>
    axios.get<{ data: PpePageResponse<PpeInspection> }>(`/ppe-inspections?page=${page}&size=${size}`).then(unwrap),
  search: (keyword: string, page = 0, size = 10) =>
    axios.get<{ data: PpePageResponse<PpeInspection> }>(`/ppe-inspections/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`).then(unwrap),
  getByType: (type: string, page = 0, size = 10) =>
    axios.get<{ data: PpePageResponse<PpeInspection> }>(`/ppe-inspections/type/${encodeURIComponent(type)}?page=${page}&size=${size}`).then(unwrap),
  getByResult: (result: string, page = 0, size = 10) =>
    axios.get<{ data: PpePageResponse<PpeInspection> }>(`/ppe-inspections/result/${encodeURIComponent(result)}?page=${page}&size=${size}`).then(unwrap),
  getUpcoming: (days = 30) =>
    axios.get<{ data: PpeInspection[] }>(`/ppe-inspections/upcoming?days=${days}`).then(unwrap),
  getFails: () =>
    axios.get<{ data: PpeInspection[] }>('/ppe-inspections/fails').then(unwrap),
  getById: (id: number) =>
    axios.get<{ data: PpeInspection }>(`/ppe-inspections/${id}`).then(unwrap),
  getKpi: () =>
    axios.get<{ data: PpeInspectionKpi }>('/ppe-inspections/kpi').then(unwrap),
  create: (req: PpeInspectionRequest) =>
    axios.post<{ data: PpeInspection }>('/ppe-inspections', req).then(unwrap),
  update: (id: number, req: PpeInspectionRequest) =>
    axios.put<{ data: PpeInspection }>(`/ppe-inspections/${id}`, req).then(unwrap),
  delete: (id: number) =>
    axios.delete(`/ppe-inspections/${id}`),
}

// ════════════════════════════════════════════════════════════════════
// 6. 착용 이행
// ════════════════════════════════════════════════════════════════════
export const ppeWearApi = {
  getAll: (page = 0, size = 10) =>
    axios.get<{ data: PpePageResponse<PpeWear> }>(`/ppe-wears?page=${page}&size=${size}`).then(unwrap),
  search: (keyword: string, page = 0, size = 10) =>
    axios.get<{ data: PpePageResponse<PpeWear> }>(`/ppe-wears/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`).then(unwrap),
  getByDepartment: (dept: string, page = 0, size = 10) =>
    axios.get<{ data: PpePageResponse<PpeWear> }>(`/ppe-wears/department/${encodeURIComponent(dept)}?page=${page}&size=${size}`).then(unwrap),
  getByStatus: (status: string, page = 0, size = 10) =>
    axios.get<{ data: PpePageResponse<PpeWear> }>(`/ppe-wears/status/${encodeURIComponent(status)}?page=${page}&size=${size}`).then(unwrap),
  getById: (id: number) =>
    axios.get<{ data: PpeWear }>(`/ppe-wears/${id}`).then(unwrap),
  getKpi: () =>
    axios.get<{ data: PpeWearKpi }>('/ppe-wears/kpi').then(unwrap),
  getDepartmentRate: () =>
    axios.get<{ data: PpeWearDeptRate[] }>('/ppe-wears/department-rate').then(unwrap),
  create: (req: PpeWearRequest) =>
    axios.post<{ data: PpeWear }>('/ppe-wears', req).then(unwrap),
  update: (id: number, req: PpeWearRequest) =>
    axios.put<{ data: PpeWear }>(`/ppe-wears/${id}`, req).then(unwrap),
  delete: (id: number) =>
    axios.delete(`/ppe-wears/${id}`),
}

// ════════════════════════════════════════════════════════════════════
// 7. 성능 평가
// ════════════════════════════════════════════════════════════════════
export const ppePerformanceApi = {
  getAll: (page = 0, size = 10) =>
    axios.get<{ data: PpePageResponse<PpePerformance> }>(`/ppe-performances?page=${page}&size=${size}`).then(unwrap),
  search: (keyword: string, page = 0, size = 10) =>
    axios.get<{ data: PpePageResponse<PpePerformance> }>(`/ppe-performances/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`).then(unwrap),
  getByResult: (result: string, page = 0, size = 10) =>
    axios.get<{ data: PpePageResponse<PpePerformance> }>(`/ppe-performances/result/${encodeURIComponent(result)}?page=${page}&size=${size}`).then(unwrap),
  getById: (id: number) =>
    axios.get<{ data: PpePerformance }>(`/ppe-performances/${id}`).then(unwrap),
  getKpi: () =>
    axios.get<{ data: PpePerformanceKpi }>('/ppe-performances/kpi').then(unwrap),
  create: (req: PpePerformanceRequest) =>
    axios.post<{ data: PpePerformance }>('/ppe-performances', req).then(unwrap),
  update: (id: number, req: PpePerformanceRequest) =>
    axios.put<{ data: PpePerformance }>(`/ppe-performances/${id}`, req).then(unwrap),
  delete: (id: number) =>
    axios.delete(`/ppe-performances/${id}`),
}

// ════════════════════════════════════════════════════════════════════
// 8. 비용·예산
// ════════════════════════════════════════════════════════════════════
export const ppeBudgetApi = {
  getAll: (page = 0, size = 10) =>
    axios.get<{ data: PpePageResponse<PpeBudget> }>(`/ppe-budgets?page=${page}&size=${size}`).then(unwrap),
  getByYear: (year: number) =>
    axios.get<{ data: PpeBudget[] }>(`/ppe-budgets/year/${year}`).then(unwrap),
  getByDepartment: (dept: string) =>
    axios.get<{ data: PpeBudget[] }>(`/ppe-budgets/department/${encodeURIComponent(dept)}`).then(unwrap),
  getById: (id: number) =>
    axios.get<{ data: PpeBudget }>(`/ppe-budgets/${id}`).then(unwrap),
  getKpi: (year?: number) =>
    axios.get<{ data: PpeBudgetKpi }>(`/ppe-budgets/kpi${year ? `?year=${year}` : ''}`).then(unwrap),
  create: (req: PpeBudgetRequest) =>
    axios.post<{ data: PpeBudget }>('/ppe-budgets', req).then(unwrap),
  update: (id: number, req: PpeBudgetRequest) =>
    axios.put<{ data: PpeBudget }>(`/ppe-budgets/${id}`, req).then(unwrap),
  delete: (id: number) =>
    axios.delete(`/ppe-budgets/${id}`),
}
