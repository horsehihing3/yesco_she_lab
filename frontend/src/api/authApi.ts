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

  // 슈퍼관리자 계정 전환(비밀번호 불필요) — 현재 토큰(axios 인터셉터가 부착)으로 서버가 권한 검증.
  impersonate: async (username: string): Promise<AuthResponse> => {
    const response = await axiosInstance.post<ApiResponse<AuthResponse>>('/auth/impersonate', { username })
    return response.data.data
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await axiosInstance.post<ApiResponse<AuthResponse>>('/auth/refresh', refreshToken, {
      headers: { 'Content-Type': 'text/plain' },
    })
    return response.data.data
  },
}
