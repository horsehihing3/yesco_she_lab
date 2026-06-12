/**
 * 결재 워크플로우 배역 ↔ 실제 계정 매핑.
 * DB(T_IDM_USER, tb_button_rule) 조회로 확정한 DEV 계정. 공통 비밀번호는 LoginPage DEV 빠른 로그인과 동일.
 *
 *  | UID           | 성명   | UserRole     | 배역               | 근거                                   |
 *  |---------------|--------|--------------|--------------------|----------------------------------------|
 *  | yeseo.moon    | 문예서 | TEAM_ADMIN   | 작성자(writer)      | '신규 등록'은 TEAM_ADMIN/EHS_ADMIN 만 노출 |
 *  | jiwan.nam     | 남지완 | EHS_ADMIN    | 계획승인자          | 레코드 planApprover 본인 매칭으로 승인     |
 *  | horsehihing3  | 정경석 | TEAM_MEMBER  | 완료승인자          | 레코드 completionApprover 본인 매칭으로 승인 |
 *
 * 핵심: 전이 버튼(상신/승인/저장)은 "레코드별 역할"(작성자/승인자 본인)로 결정되므로
 *       승인자는 시스템 역할과 무관. 단 '신규 등록' 진입만 시스템 역할 권한이 필요해 작성자는 TEAM_ADMIN 사용.
 */
export const PASSWORD = 'com4in!!'

export const ACCOUNTS = {
  writer:             { username: 'yeseo.moon',   name: '문예서' },
  planApprover:       { username: 'jiwan.nam',    name: '남지완' },
  completionApprover: { username: 'horsehihing3', name: '정경석' },
} as const

export type RoleKey = keyof typeof ACCOUNTS
