import axiosInstance from './axiosInstance'
import { ApiResponse } from '../types/common.types'

export interface ButtonRuleItem {
  menuPath: string
  statusCode: string
  buttonName: string
  roleKey: string
  visible: boolean
}

export const fetchButtonRules = async (): Promise<ButtonRuleItem[]> => {
  const res = await axiosInstance.get<ApiResponse<ButtonRuleItem[]>>('/button-rules')
  return res.data.data ?? []
}

export const saveButtonRules = async (rules: ButtonRuleItem[]): Promise<void> => {
  await axiosInstance.put('/button-rules', rules)
}
