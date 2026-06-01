import { Outlet, useLocation } from 'react-router-dom'
import { KeepAlive } from 'react-activation'

/**
 * <Outlet/> 을 react-activation 의 <KeepAlive> 로 감싸 라우트별 화면을 캐시한다.
 *   - id: 현재 pathname — 탭 키와 동일. search 파라미터는 페이지 내부 탭이므로
 *     의도적으로 무시 (sub-tab 전환 시 KeepAlive 가 remount 되면 안 됨).
 *   - 닫힌 탭은 TabsContext 에서 useAliveController().drop(id) 로 즉시 제거.
 */
const KeepAliveOutlet: React.FC = () => {
  const location = useLocation()
  const cacheId = location.pathname || '/'
  return (
    <KeepAlive id={cacheId} name={cacheId}>
      <Outlet />
    </KeepAlive>
  )
}

export default KeepAliveOutlet
