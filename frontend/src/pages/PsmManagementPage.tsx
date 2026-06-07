import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Tabs, Tab } from '@mui/material'
import { useTranslation } from 'react-i18next'
import PsmDashboardTab from '../components/psm/PsmDashboardTab'
import PsmDataTab from '../components/psm/PsmDataTab'
import PsmMocTab from '../components/psm/PsmMocTab'
import PsmHazopTab from '../components/psm/PsmHazopTab'
import PsmWorkOrderTab from '../components/psm/PsmWorkOrderTab'
import PsmPtwTab from '../components/psm/PsmPtwTab'
import PsmMatrixTab from '../components/psm/PsmMatrixTab'
import PsmPidTab from '../components/psm/PsmPidTab'
import PsmIncidentTab from '../components/psm/PsmIncidentTab'

const TABS_COUNT = 9

const PsmManagementPage: React.FC = () => {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const rawTab = parseInt(searchParams.get('tab') || '0', 10)
  const initialTab = Number.isNaN(rawTab) || rawTab < 0 || rawTab >= TABS_COUNT ? 0 : rawTab
  const [activeTab, setActiveTab] = useState(initialTab)

  const handleTabChange = (_: React.SyntheticEvent, v: number) => {
    setActiveTab(v)
    setSearchParams({ tab: String(v) })
  }

  const tabs = [
    { label: t('psm.tabs.dashboard', '대시보드'), component: <PsmDashboardTab /> },
    { label: t('psm.tabs.data',      '공정안전자료'), component: <PsmDataTab /> },
    { label: t('psm.tabs.moc',       '변경관리 MOC'), component: <PsmMocTab /> },
    { label: t('psm.tabs.hazop',     'HAZOP'), component: <PsmHazopTab /> },
    { label: t('psm.tabs.wo',        'Work Order'), component: <PsmWorkOrderTab /> },
    { label: t('psm.tabs.ptw',       'PTW 작업허가'), component: <PsmPtwTab /> },
    { label: t('psm.tabs.matrix',    '위험성 매트릭스'), component: <PsmMatrixTab /> },
    { label: t('psm.tabs.pid',       'P&ID 뷰어'), component: <PsmPidTab /> },
    { label: t('psm.tabs.incident',  '사고보고'), component: <PsmIncidentTab /> },
  ]
  const safeTab = activeTab >= 0 && activeTab < tabs.length ? activeTab : 0

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Tabs value={safeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto"
          sx={{ '& .MuiTab-root': { minWidth: 'auto', px: 2, fontSize: '0.85rem' } }}>
          {tabs.map((tab, idx) => <Tab key={idx} label={tab.label} />)}
        </Tabs>
      </Box>
      {tabs[safeTab]?.component}
    </Box>
  )
}

export default PsmManagementPage
