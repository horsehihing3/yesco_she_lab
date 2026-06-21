import { useState, useMemo } from 'react'
import { Box, Tabs, Tab } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useMenuRule } from '../../hooks/useMenuRule'
import EhsBudgetPlanTab from './ehsBudget/EhsBudgetPlanTab'
import EhsBudgetExpenseTab from './ehsBudget/EhsBudgetExpenseTab'
import EhsBudgetCompareTab from './ehsBudget/EhsBudgetCompareTab'
import EhsBudgetReportTab from './ehsBudget/EhsBudgetReportTab'

const EhsBudgetTab: React.FC = () => {
  const { t } = useTranslation()
  const { isMenuHidden } = useMenuRule()
  const [subTab, setSubTab] = useState(0)

  const subTabs = useMemo(() => [
    { menuKey: 'budget.tab.dashboard', label: t('budget.compareTab', '대시보드'), component: <EhsBudgetCompareTab key="compare" /> },
    { menuKey: 'budget.tab.plan',      label: t('budget.planTab', '예산수립'),        component: <EhsBudgetPlanTab key="plan" /> },
    { menuKey: 'budget.tab.expense',   label: t('budget.expenseTab', '실예산 사용입력'), component: <EhsBudgetExpenseTab key="expense" /> },
    { menuKey: 'budget.tab.report',    label: t('common.report', '레포트'),           component: <EhsBudgetReportTab key="report" /> },
  ].filter(tab => !isMenuHidden(tab.menuKey)), [t, isMenuHidden])

  const safeTab = Math.min(subTab, Math.max(0, subTabs.length - 1))

  return (
    <Box>
      <Tabs
        value={safeTab}
        onChange={(_, v) => setSubTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 2,
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': {
            minWidth: 'auto',
            px: 2,
            fontSize: '0.85rem',
          },
        }}
      >
        {subTabs.map((tab, idx) => (
          <Tab key={idx} label={tab.label} />
        ))}
      </Tabs>
      {subTabs[safeTab]?.component}
    </Box>
  )
}

export default EhsBudgetTab
