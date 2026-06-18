import { Box, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import PrePlacementExamTab from '../components/occupationalExposure/PrePlacementExamTab'
import FlowChartButton from '../components/common/FlowChartButton'

const OccupationalExposurePage: React.FC = () => {
  const { t } = useTranslation()

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">{t('nav.occupationalHealth')}</Typography>
        <FlowChartButton flowKey="occExposure" />
      </Box>
      <PrePlacementExamTab />
    </>
  )
}

export default OccupationalExposurePage
