/**
 * 팀명 + 성명 + 직위를 "글로벌경영관리팀 / 홍길동 사원" 형식으로 반환한다.
 * null/undefined/빈 문자열 항목은 자동으로 제외된다.
 */
export function formatUserName(
  team?: string | null,
  name?: string | null,
  position?: string | null
): string {
  const namePos = [name, position].filter(Boolean).join(' ')
  if (team && namePos) return `${team} / ${namePos}`
  return team || namePos || ''
}
