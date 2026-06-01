import { useState } from 'react'
import { Box, Tabs, Tab, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import EhsBudgetPlanTab from './ehsBudget/EhsBudgetPlanTab'
import EhsBudgetExpenseTab from './ehsBudget/EhsBudgetExpenseTab'
import EhsBudgetCompareTab from './ehsBudget/EhsBudgetCompareTab'
import EhsBudgetReportTab from './ehsBudget/EhsBudgetReportTab'

const EhsBudgetTab: React.FC = () => {
  const { t } = useTranslation()
  const [subTab, setSubTab] = useState(0)

  const subTabs = [
    { label: t('budget.compareTab', '대시보드'), component: <EhsBudgetCompareTab key="compare" /> },
    { label: t('budget.planTab', '예산수립'), component: <EhsBudgetPlanTab key="plan" /> },
    { label: t('budget.expenseTab', '실예산 사용입력'), component: <EhsBudgetExpenseTab key="expense" /> },
    { label: t('common.report', '레포트'), component: <EhsBudgetReportTab key="report" /> },
  ]

  return (
    <Box>
      <Tabs
        value={subTab}
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
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
        {subTabs[subTab]?.label}
      </Typography>
      {subTabs[subTab]?.component}
    </Box>
  )
}

export default EhsBudgetTab
