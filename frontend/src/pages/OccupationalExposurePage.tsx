import { Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import PrePlacementExamTab from '../components/occupationalExposure/PrePlacementExamTab'

const OccupationalExposurePage: React.FC = () => {
  const { t } = useTranslation()

  return (
    <>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
        {t('nav.occupationalHealth')}
      </Typography>
      <PrePlacementExamTab />
    </>
  )
}

export default OccupationalExposurePage
