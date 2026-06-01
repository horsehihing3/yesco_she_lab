export interface EhsBudgetPlan {
  id: number
  budgetYear: number
  category: string
  itemName: string
  planAmount: number
  note: string | null
  writer: string | null
  createdAt: string
  modifiedAt: string
}

export interface EhsBudgetPlanRequest {
  budgetYear?: number
  category: string
  itemName: string
  planAmount?: number
  note?: string
  writer?: string
}

export interface EhsBudgetExpense {
  id: number
  budgetYear: number
  category: string
  itemName: string
  amount: number
  expenseDate: string | null
  department: string | null
  note: string | null
  writer: string | null
  createdAt: string
  modifiedAt: string
}

export interface EhsBudgetExpenseRequest {
  budgetYear?: number
  category: string
  itemName: string
  amount: number
  expenseDate?: string
  department?: string
  note?: string
  writer?: string
}
