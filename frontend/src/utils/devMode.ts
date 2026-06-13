// DEV ONLY — 납품 전 삭제
// 개발용 도구(헤더 빠른 계정전환, 신규 등록 폼 테스트 데이터 채우기)의 노출 여부를 한 곳에서 판정한다.
// 조건: 호스트가 localhost 이거나, com4in_dev 로 시작한 세션(Header 에서 로그인 시 플래그를 남김).
//   → 비-localhost(운영/사내IP)에서 com4in_dev 로 들어오면 다른 계정으로 전환해도 dev 도구가 유지된다.
export const DEV_SESSION_KEY = 'com4in_dev_session'

export const isDevToolsVisible = (): boolean =>
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    sessionStorage.getItem(DEV_SESSION_KEY) === '1')
