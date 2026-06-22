import axiosInstance from './axiosInstance'
import { ApiResponse, PageResponse } from '../types/common.types'
import { CompanyTreeNode } from '../components/common/UserSelectModal'
import { User } from '../types/user.types'

export const userApi = {
  getCompanyTree: async (): Promise<CompanyTreeNode[]> => {
    const res = await axiosInstance.get<ApiResponse<CompanyTreeNode[]>>('/users/company-tree')
    return res.data.data
  },

  listPaged: async (page: number, size: number): Promise<PageResponse<User>> => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<User>>>('/users/paged', {
      params: { page, size, sort: 'name,asc' },
    })
    return res.data.data
  },

  // DEV 계정전환 목록 실값표시용 — 역할·직급(position)·부서명(department) 포함 단건 조회.
  getByUsername: async (
    username: string,
  ): Promise<{ name?: string; role?: string; position?: string; department?: string }> => {
    const res = await axiosInstance.get<
      ApiResponse<{ name?: string; role?: string; position?: string; department?: string }>
    >(`/users/username/${username}`)
    return res.data.data
  },
}
