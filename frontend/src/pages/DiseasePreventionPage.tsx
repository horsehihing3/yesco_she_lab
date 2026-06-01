import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Tabs, Tab, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import HazardFactorTab from '../components/diseasePrevention/HazardFactorTab'

const DiseasePreventionPage: React.FC = () => {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = parseInt(searchParams.get('tab') || '0', 10)
  const [activeTab, setActiveTab] = useState(tabParam)

  useEffect(() => {
    const tab = parseInt(searchParams.get('tab') || '0', 10)
    setActiveTab(tab)
  }, [searchParams])

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
    setSearchParams({ tab: String(newValue) })
  }

  const tabs = [
    { label: t('dp.chemical'), component: <HazardFactorTab key="CHEMICAL" hazardType="CHEMICAL" /> },
    { label: t('dp.physical'), component: <HazardFactorTab key="PHYSICAL" hazardType="PHYSICAL" /> },
    { label: t('dp.biological'), component: <HazardFactorTab key="BIOLOGICAL" hazardType="BIOLOGICAL" /> },
    { label: t('dp.ergonomic'), component: <HazardFactorTab key="ERGONOMIC" hazardType="ERGONOMIC" /> },
    { label: t('dp.psychosocial'), component: <HazardFactorTab key="PSYCHOSOCIAL" hazardType="PSYCHOSOCIAL" /> },
  ]

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              minWidth: 'auto',
              px: 2,
              fontSize: '0.85rem',
            },
          }}
        >
          {tabs.map((tab, idx) => (
            <Tab key={idx} label={tab.label} />
          ))}
        </Tabs>
      </Box>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
        {tabs[activeTab]?.label}
      </Typography>
      {tabs[activeTab]?.component}
    </Box>
  )
}

export default DiseasePreventionPage
