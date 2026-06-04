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
    if (!user || user.role === 'SYSTEM_ADMIN') return new Set<string>()
    return new Set(
      rules.filter(r => r.roleKey === user.role).map(r => r.menuKey)
    )
  }, [rules, user])

  return {
    isMenuHidden: (key: string) => hiddenSet.has(key),
  }
}
