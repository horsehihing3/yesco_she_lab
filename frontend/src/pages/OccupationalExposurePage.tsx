import { Tabs, Tab } from '@mui/material'
import { useTranslation } from 'react-i18next'
import PrePlacementExamTab from '../components/occupationalExposure/PrePlacementExamTab'
import PageHeader from '../components/common/PageHeader'

const OccupationalExposurePage: React.FC = () => {
  const { t } = useTranslation()

  return (
    <PageHeader
      title={t('nav.occupationalHealth')}
      flowKey="occExposure"
      tabs={
        <Tabs value={0} sx={{ '& .MuiTab-root': { minWidth: 'auto', px: 2, fontSize: '0.85rem' } }}>
          <Tab label={t('nav.prePlacementExam', '배치전 건강진단')} />
        </Tabs>
      }
    >
      <PrePlacementExamTab />
    </PageHeader>
  )
}

export default OccupationalExposurePage
