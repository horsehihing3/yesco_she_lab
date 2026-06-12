import axiosInstance from './axiosInstance'
import { ApiResponse } from '../types/common.types'
import { User } from '../types/user.types'

export const userApi = {
  getAll: async (): Promise<User[]> => {
    const res = await axiosInstance.get<ApiResponse<User[]>>('/users')
    return res.data.data
  },
}
