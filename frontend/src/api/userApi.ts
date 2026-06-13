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
}
