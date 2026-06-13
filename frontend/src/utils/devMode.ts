// DEV ONLY — 납품 전 삭제
// 개발용 도구(헤더 빠른 계정전환, 신규 등록 폼 테스트 데이터 채우기)의 노출 여부를 한 곳에서 판정한다.
// 조건: 호스트가 localhost 이거나, com4in_dev 로 시작한 세션(Header 에서 로그인 시 플래그를 남김).
//   → 비-localhost(운영/사내IP)에서 com4in_dev 로 들어오면 다른 계정으로 전환해도 dev 도구가 유지된다.
export const DEV_SESSION_KEY = 'com4in_dev_session'

// 납품/운영 단일 마스터 스위치 — 빌드 시 VITE_DEV_TOOLS=off 로 모든 DEV/디버그 UI 를 한 번에 끈다.
// (테스트데이터 버튼, 헤더 계정전환, 로그인 빠른로그인 모두 이 게이트를 통과해야 노출)
// 미설정이면 활성(개발 기본). 끄려면 frontend 빌드 환경에 VITE_DEV_TOOLS=off.
export const devToolsEnabled = (): boolean => import.meta.env.VITE_DEV_TOOLS !== 'off'

export const isDevToolsVisible = (): boolean =>
  typeof window !== 'undefined' &&
  devToolsEnabled() &&
  (window.location.hostname === 'localhost' ||
    sessionStorage.getItem(DEV_SESSION_KEY) === '1')
