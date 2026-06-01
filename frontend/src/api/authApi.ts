import axiosInstance from './axiosInstance'
import { ApiResponse } from '../types/common.types'
import { AuthResponse, LoginRequest, SignupRequest, User } from '../types/auth.types'

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await axiosInstance.post<ApiResponse<AuthResponse>>('/auth/login', data)
    return response.data.data
  },

  signup: async (data: SignupRequest): Promise<User> => {
    const response = await axiosInstance.post<ApiResponse<User>>('/auth/signup', data)
    return response.data.data
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await axiosInstance.get<ApiResponse<User>>('/auth/me')
    return response.data.data
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await axiosInstance.post<ApiResponse<AuthResponse>>('/auth/refresh', refreshToken, {
      headers: { 'Content-Type': 'text/plain' },
    })
    return response.data.data
  },
}
