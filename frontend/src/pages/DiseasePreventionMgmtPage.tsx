import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { Tabs, Tab } from '@mui/material'
import { useMenuRule } from '../hooks/useMenuRule'
import PageHeader from '../components/common/PageHeader'
import DpDashboardTab from '../components/diseasePreventionMgmt/DpDashboardTab'
import DpMsdTab from '../components/diseasePreventionMgmt/DpMsdTab'
import DpCvdTab from '../components/diseasePreventionMgmt/DpCvdTab'
import DpStressTab from '../components/diseasePreventionMgmt/DpStressTab'
import DpRespiTab from '../components/diseasePreventionMgmt/DpRespiTab'
import DpHearingTab from '../components/diseasePreventionMgmt/DpHearingTab'
import DpThermalTab from '../components/diseasePreventionMgmt/DpThermalTab'
import DpInfectTab from '../components/diseasePreventionMgmt/DpInfectTab'

const DiseasePreventionMgmtPage: React.FC = () => {
  const { t } = useTranslation()
  const { isMenuHidden } = useMenuRule()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(0)

  const handleTabChange = (_: React.SyntheticEvent, v: number) => {
    setActiveTab(v); setSearchParams({ tab: String(v) })
  }

  const tabs = useMemo(() => [
    { menuKey: 'disease-prev.tab.dashboard', label: t('disease-prev.tab.dashboard', '대시보드'),     component: <DpDashboardTab onGoTab={(t) => { setActiveTab(t); setSearchParams({ tab: String(t) }) }} /> },
    { menuKey: 'disease-prev.tab.msd', label: t('disease-prev.tab.msd', '근골격계'),     component: <DpMsdTab /> },
    { menuKey: 'disease-prev.tab.cvd', label: t('disease-prev.tab.cvd', '뇌심혈관'),     component: <DpCvdTab /> },
    { menuKey: 'disease-prev.tab.stress', label: t('disease-prev.tab.stress', '직무스트레스'), component: <DpStressTab /> },
    { menuKey: 'disease-prev.tab.resp', label: t('disease-prev.tab.resp', '호흡기·피부'), component: <DpRespiTab /> },
    { menuKey: 'disease-prev.tab.hearing', label: t('disease-prev.tab.hearing', '청력보존'),     component: <DpHearingTab /> },
    { menuKey: 'disease-prev.tab.thermal', label: t('disease-prev.tab.thermal', '온열·한랭'),   component: <DpThermalTab /> },
    { menuKey: 'disease-prev.tab.infect', label: t('disease-prev.tab.infect', '감염병'),       component: <DpInfectTab /> },
  ].filter(tab => !isMenuHidden(tab.menuKey)), [isMenuHidden, setSearchParams])

  useEffect(() => {
    setActiveTab(Math.min(parseInt(searchParams.get('tab') || '0', 10), Math.max(0, tabs.length - 1)))
  }, [searchParams, tabs.length])

  useEffect(() => {
    if (activeTab >= tabs.length && tabs.length > 0) setActiveTab(0)
  }, [tabs.length, activeTab])

  return (
    <PageHeader
      title={t('nav.diseasePreventionMgmt')}
      flowKey={activeTab === 0 ? 'diseasePrevent' : undefined}
      tabs={
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto"
          sx={{ '& .MuiTab-root': { minWidth: 'auto', px: 2, fontSize: '0.85rem' } }}>
          {tabs.map((tab, idx) => <Tab key={idx} label={tab.label} />)}
        </Tabs>
      }
    >
      {tabs[activeTab]?.component}
    </PageHeader>
  )
}

export default DiseasePreventionMgmtPage
