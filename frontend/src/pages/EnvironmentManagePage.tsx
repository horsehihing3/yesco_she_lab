import { Box, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import WasteManageTab from '../components/environment/WasteManageTab'
import WaterQualityTab from '../components/environment/WaterQualityTab'
import AirEmissionTab from '../components/environment/AirEmissionTab'

interface EnvironmentManagePageProps {
  initialTab?: number
}

const EnvironmentManagePage: React.FC<EnvironmentManagePageProps> = ({ initialTab = 0 }) => {
  const { t } = useTranslation()

  const tabs = [
    { label: t('nav.envWaste'), component: <WasteManageTab /> },
    { label: t('nav.envWaterQuality'), component: <WaterQualityTab /> },
    { label: t('nav.envAirEmission'), component: <AirEmissionTab /> },
  ]

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
        {tabs[initialTab]?.label}
      </Typography>
      {tabs[initialTab]?.component}
    </Box>
  )
}

export default EnvironmentManagePage
