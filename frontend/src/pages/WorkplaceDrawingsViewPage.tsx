import WorkplaceDrawingsPage from './WorkplaceDrawingsPage'

// 사업장 도면 — 등록·수정·삭제 UI 가 제거된 조회 전용 뷰
const WorkplaceDrawingsViewPage: React.FC = () => {
  return <WorkplaceDrawingsPage readOnly />
}

export default WorkplaceDrawingsViewPage
