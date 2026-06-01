import { Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import WorkplaceMeasurementTab from '../components/occupationalExposure/WorkplaceMeasurementTab'

const WorkplaceMeasurementPage: React.FC = () => {
  const { t } = useTranslation()
  return (
    <>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
        {t('nav.workEnvMeasure')}
      </Typography>
      <WorkplaceMeasurementTab />
    </>
  )
}

export default WorkplaceMeasurementPage
