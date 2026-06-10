import { User } from '../types/auth.types'

export const isSystemAdmin = (user: User | null | undefined): boolean =>
  user?.role === 'SYSTEM_ADMIN'

export const isEhsManager = (user: User | null | undefined): boolean =>
  user?.role === 'SYSTEM_ADMIN' || user?.role === 'EHS_ADMIN'
