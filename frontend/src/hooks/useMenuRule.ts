import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { fetchMenuRules } from '../api/menuRuleApi'

export function useMenuRule() {
  const { user } = useAuth()
  const { data: rules = [] } = useQuery({
    queryKey: ['menuRules'],
    queryFn: fetchMenuRules,
    staleTime: 5 * 60 * 1000,
  })

  const hiddenSet = useMemo(() => {
    if (!user) return new Set<string>()
    const sysAdminHidden = rules.filter(r => r.roleKey === 'SYSTEM_ADMIN').map(r => r.menuKey)
    const roleHidden = rules.filter(r => r.roleKey === user.role).map(r => r.menuKey)
    return new Set([...sysAdminHidden, ...roleHidden])
  }, [rules, user])

  return {
    isMenuHidden: (key: string) => hiddenSet.has(key),
  }
}
