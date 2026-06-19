import { useState, useMemo } from 'react'
import { Box, Tabs, Tab, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useMenuRule } from '../hooks/useMenuRule'
import PpeDashboardTab from '../components/ppe/PpeDashboardTab'
import PpeItemTab from '../components/ppe/PpeItemTab'
import PpeStockTab from '../components/ppe/PpeStockTab'
import PpeIssueTab from '../components/ppe/PpeIssueTab'
import PpeInspectionTab from '../components/ppe/PpeInspectionTab'
import PpeWearTab from '../components/ppe/PpeWearTab'
import PpePerformanceTab from '../components/ppe/PpePerformanceTab'
import PpeBudgetTab from '../components/ppe/PpeBudgetTab'
import PpeInoutTab from '../components/ppe/PpeInoutTab'

const PpeEquipmentPage: React.FC = () => {
  const { t } = useTranslation()
  const { isMenuHidden } = useMenuRule()
  const [activeTab, setActiveTab] = useState(0)

  const tabs = useMemo(() => [
    { menuKey: 'ppe.tabs.dashboard',   label: t('ppe.tabs.dashboard',   '대시보드'),   component: <PpeDashboardTab /> },
    { menuKey: 'ppe.tabs.item',        label: t('ppe.tabs.item',        '품목 관리'),   component: <PpeItemTab /> },
    { menuKey: 'ppe.tabs.stock',       label: t('ppe.tabs.stock',       '재고 관리'),   component: <PpeStockTab /> },
    { menuKey: 'ppe.tabs.issue',       label: t('ppe.tabs.issue',       '지급·반납'),  component: <PpeIssueTab /> },
    { menuKey: 'ppe.tabs.inspection',  label: t('ppe.tabs.inspection',  '검사·점검'),  component: <PpeInspectionTab /> },
    { menuKey: 'ppe.tabs.wear',        label: t('ppe.tabs.wear',        '착용 이행'),   component: <PpeWearTab /> },
    { menuKey: 'ppe.tabs.performance', label: t('ppe.tabs.performance', '성능 관리'),   component: <PpePerformanceTab /> },
    { menuKey: 'ppe.tabs.budget',      label: t('ppe.tabs.budget',      '비용·예산'),  component: <PpeBudgetTab /> },
    { menuKey: 'ppe.tabs.inout',       label: t('ppe.tabs.inout',       '입출고 이력'), component: <PpeInoutTab /> },
  ].filter(tab => !isMenuHidden(tab.menuKey)), [t, isMenuHidden])

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ '& .MuiTab-root': { minWidth: 'auto', px: 2, fontSize: '0.85rem' } }}
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

export default PpeEquipmentPage
