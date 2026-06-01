import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Tabs, Tab, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import CodeManagePage from './CodeManagePage'
import RoleManageTab from '../components/system/RoleManageTab'
import AuthManageTab from '../components/system/AuthManageTab'
import WorkplaceDrawingsPage from './WorkplaceDrawingsPage'
import ChecklistPage from './ChecklistPage'

const SystemManagePage: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = parseInt(searchParams.get('tab') || '0', 10)
  const [activeTab, setActiveTab] = useState(tabParam)

  const isAdmin = user?.role === 'SYSTEM_ADMIN'

  const tabs = useMemo(() => {
    const allTabs = []
    if (isAdmin) {
      allTabs.push({ label: t('nav.codeManage'), component: <CodeManagePage /> })
      allTabs.push({ label: t('nav.roleManage'), component: <RoleManageTab /> })
    }
    allTabs.push({ label: t('nav.authManage'), component: <AuthManageTab /> })
    allTabs.push({ label: t('nav.floorDrawings'), component: <WorkplaceDrawingsPage /> })
    allTabs.push({ label: t('nav.checklist'), component: <ChecklistPage /> })
    return allTabs
  }, [isAdmin, t])

  useEffect(() => {
    const tab = parseInt(searchParams.get('tab') || '0', 10)
    if (tab < tabs.length) {
      setActiveTab(tab)
    } else {
      setActiveTab(0)
    }
  }, [searchParams, tabs.length])

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
    setSearchParams({ tab: String(newValue) })
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <Box sx={{ mb: 2, flexShrink: 0 }}>
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
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, flexShrink: 0 }}>
        {tabs[activeTab]?.label}
      </Typography>
      <Box sx={{ flex: 1, minHeight: 0 }}>
        {tabs[activeTab]?.component}
      </Box>
    </Box>
  )
}

export default SystemManagePage
