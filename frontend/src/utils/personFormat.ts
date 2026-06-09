/**
 * 사람 표시 공통 포맷: "팀명 / 성명 직위"
 *
 * 예시:
 *   fmtPerson('정경석', '글로벌경영관리팀', '과장') → '글로벌경영관리팀 / 정경석 과장'
 *   fmtPerson('정경석', '글로벌경영관리팀')         → '글로벌경영관리팀 / 정경석'
 *   fmtPerson('정경석', undefined, '과장')          → '정경석 과장'
 *   fmtPerson('정경석')                             → '정경석'
 *   fmtPerson('')                                   → ''
 */
export const fmtPerson = (
  name?: string | null,
  team?: string | null,
  position?: string | null,
): string => {
  const n = name?.trim() || ''
  if (!n) return ''
  const t = team?.trim() || ''
  const p = position?.trim() || ''
  const namePos = p ? `${n} ${p}` : n
  return t ? `${t} / ${namePos}` : namePos
}
