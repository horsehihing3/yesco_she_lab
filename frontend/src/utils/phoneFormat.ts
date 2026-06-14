/**
 * 전화번호 자동 포매팅 — 입력 시 숫자만 추출하고 한국 전화번호 규칙에 맞게 하이픈을 자동 삽입.
 *
 * 지원 패턴:
 *  - 02-XXX-XXXX        (서울, 9자리)
 *  - 02-XXXX-XXXX       (서울, 10자리)
 *  - 0XX-XXX-XXXX       (지역/유선, 10자리)
 *  - 0XX-XXXX-XXXX      (휴대전화/지역, 11자리)
 *
 * 사용 예:
 *   <TextField
 *     value={form.tel}
 *     onChange={e => setForm({ ...form, tel: fmtPhone(e.target.value) })}
 *     placeholder="010-0000-0000"
 *   />
 */
export const fmtPhone = (input: string | null | undefined): string => {
  if (!input) return ''
  // 숫자만 추출, 최대 11자리
  const digits = input.replace(/\D/g, '').slice(0, 11)
  if (digits.length === 0) return ''

  // 02 (서울): 2-3-4 또는 2-4-4
  if (digits.startsWith('02')) {
    if (digits.length <= 2) return digits
    if (digits.length <= 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`
    if (digits.length <= 9) return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`
    // 10자리 (02-XXXX-XXXX)
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`
  }

  // 0XX (지역번호 3자리 / 휴대전화): 3-3-4 또는 3-4-4
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  if (digits.length <= 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  // 11자리 (010/011/0XX-XXXX-XXXX)
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`
}

