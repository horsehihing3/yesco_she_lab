import axiosInstance from './axiosInstance'
import { ApiResponse } from '../types/common.types'

export interface MenuRuleItem {
  roleKey: string
  menuKey: string
}

export const fetchMenuRules = async (): Promise<MenuRuleItem[]> => {
  const res = await axiosInstance.get<ApiResponse<MenuRuleItem[]>>('/menu-rules')
  return res.data.data ?? []
}

export const saveMenuRules = async (rules: MenuRuleItem[]): Promise<void> => {
  await axiosInstance.put('/menu-rules', rules)
}
