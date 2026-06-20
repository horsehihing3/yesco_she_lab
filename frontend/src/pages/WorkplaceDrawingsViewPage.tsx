import { useTranslation } from 'react-i18next'
import WorkplaceDrawingsPage from './WorkplaceDrawingsPage'
import PageHeader from '../components/common/PageHeader'

// 사업장 도면 — 등록·수정·삭제 UI 가 제거된 조회 전용 뷰
const WorkplaceDrawingsViewPage: React.FC = () => {
  const { t } = useTranslation()
  return (
    <PageHeader title={t('nav.workplaceDrawingsView')}>
      <WorkplaceDrawingsPage readOnly />
    </PageHeader>
  )
}

export default WorkplaceDrawingsViewPage
