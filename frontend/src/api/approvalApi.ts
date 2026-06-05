import axiosInstance from './axiosInstance'
import { ApiResponse, PageResponse } from '../types/common.types'
import { Approval, ApprovalLineItem } from '../types/approval.types'

// ===== Approval (승인 관리) =====

export const fetchApprovals = async (
  page: number,
  size: number,
  status?: string,
  keyword?: string
): Promise<PageResponse<Approval>> => {
  const params: Record<string, string | number> = { page, size }
  if (status) params.status = status
  if (keyword) params.keyword = keyword
  const response = await axiosInstance.get<ApiResponse<PageResponse<Approval>>>('/approvals', { params })
  return response.data.data
}

export const fetchApprovalById = async (id: number): Promise<Approval> => {
  const response = await axiosInstance.get<ApiResponse<Approval>>(`/approvals/${id}`)
  return response.data.data
}

export const createApproval = async (data: Partial<Approval>): Promise<Approval> => {
  const response = await axiosInstance.post<ApiResponse<Approval>>('/approvals', data)
  return response.data.data
}

export const updateApproval = async (id: number, data: Partial<Approval>): Promise<Approval> => {
  const response = await axiosInstance.put<ApiResponse<Approval>>(`/approvals/${id}`, data)
  return response.data.data
}

export const deleteApproval = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/approvals/${id}`)
}

export const fetchMyPending = async (email: string, page: number, size: number): Promise<PageResponse<Approval>> => {
  const res = await axiosInstance.get<ApiResponse<PageResponse<Approval>>>(`/approvals/my-pending?approverEmail=${encodeURIComponent(email)}&page=${page}&size=${size}`)
  return res.data.data
}

export const fetchMyDrafted = async (email: string, page: number, size: number): Promise<PageResponse<Approval>> => {
  const res = await axiosInstance.get<ApiResponse<PageResponse<Approval>>>(`/approvals/my-drafted?applicantEmail=${encodeURIComponent(email)}&page=${page}&size=${size}`)
  return res.data.data
}

export const fetchMyHistory = async (email: string, page: number, size: number): Promise<PageResponse<Approval>> => {
  const res = await axiosInstance.get<ApiResponse<PageResponse<Approval>>>(`/approvals/my-history?email=${encodeURIComponent(email)}&page=${page}&size=${size}`)
  return res.data.data
}

// ===== Approval Line (승인 라인) =====

export const fetchApprovalLines = async (approvalItemCode: string, deptCode: string): Promise<ApprovalLineItem[]> => {
  const response = await axiosInstance.get<ApiResponse<ApprovalLineItem[]>>(
    `/approval-lines/${approvalItemCode}`,
    { params: { deptCode } }
  )
  return response.data.data
}

export interface TeamLeaderInfo {
  name: string
  position: string
  team: string
}

export const fetchTeamLeader = async (deptCode: string | undefined): Promise<TeamLeaderInfo | null> => {
  if (!deptCode) return null
  try {
    const lines = await fetchApprovalLines('TEAM_LEADER', `group-0100004-${deptCode}`)
    if (lines.length > 0) {
      return { name: lines[0].approverName, position: lines[0].approverPosition, team: lines[0].approverDept }
    }
  } catch { /* 팀장 미등록 시 null 반환 */ }
  return null
}

export const createApprovalLine = async (data: Partial<ApprovalLineItem>): Promise<ApprovalLineItem> => {
  const response = await axiosInstance.post<ApiResponse<ApprovalLineItem>>('/approval-lines', data)
  return response.data.data
}

export const updateApprovalLine = async (id: number, data: Partial<ApprovalLineItem>): Promise<ApprovalLineItem> => {
  const response = await axiosInstance.put<ApiResponse<ApprovalLineItem>>(`/approval-lines/${id}`, data)
  return response.data.data
}

export const deleteApprovalLine = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/approval-lines/${id}`)
}

export const saveAllApprovalLines = async (
  approvalItemCode: string,
  deptCode: string,
  lines: Partial<ApprovalLineItem>[]
): Promise<ApprovalLineItem[]> => {
  const response = await axiosInstance.put<ApiResponse<ApprovalLineItem[]>>(
    `/approval-lines/batch/${approvalItemCode}`,
    lines,
    { params: { deptCode } }
  )
  return response.data.data
}

