import { useQuery } from '@tanstack/react-query'
import { useMemo, useCallback } from 'react'
import { fetchButtonRules } from '../api/buttonRuleApi'
import { DEFAULT_MENU_DATA } from '../data/buttonManageData'

/**
 * 버튼 노출 규칙을 DB에서 읽어 canSee 함수를 제공한다.
 * DB 규칙이 없으면 buttonManageData의 기본값으로 폴백.
 *
 * @param menuPath   buttonManageData의 menuPath 와 동일한 문자열
 * @param statusCode buttonManageData의 status 와 동일한 문자열 (복합키 포함, e.g. 'DRAFT/REJECTED')
 * @param buttonName buttonManageData의 button 과 동일한 문자열
 * @param roles      현재 사용자가 해당 레코드에서 갖는 추상 역할 목록
 */
export function useButtonRules() {
  const { data: dbRules = [] } = useQuery({
    queryKey: ['buttonRules'],
    queryFn: fetchButtonRules,
    staleTime: 5 * 60 * 1000,
  })

  const dbMap = useMemo(
    () => new Map(dbRules.map(r => [`${r.menuPath}|${r.statusCode}|${r.buttonName}|${r.roleKey}`, r.visible])),
    [dbRules],
  )

  const canSee = useCallback(
    (menuPath: string, statusCode: string, buttonName: string, userRoles: string[]): boolean => {
      // 슈퍼관리자(SYSTEM_ADMIN)는 모든 버튼 권한 보유
      if (userRoles.includes('superAdmin')) return true
      return userRoles.some(roleKey => {
        const key = `${menuPath}|${statusCode}|${buttonName}|${roleKey}`
        if (dbMap.has(key)) return dbMap.get(key)!
        const menu = DEFAULT_MENU_DATA.find(m => m.menuPath === menuPath)
        const sg = menu?.statuses.find(s => s.status === statusCode)
        const btn = sg?.buttons.find(b => b.button === buttonName)
        return btn?.roles[roleKey as keyof typeof btn.roles] ?? false
      })
    },
    [dbMap],
  )

  return { canSee }
}
