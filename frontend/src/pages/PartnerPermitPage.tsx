import { Tabs, Tab } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { PermitApplicationContent } from './PermitToWorkPage'
import PageHeader from '../components/common/PageHeader'

const PartnerPermitPage: React.FC = () => {
  const { t } = useTranslation()

  return (
    <PageHeader
      title={t('nav.partnerPermit')}
      flowKey="partnerPermit"
      tabs={
        <Tabs value={0} sx={{ '& .MuiTab-root': { minWidth: 'auto', px: 2, fontSize: '0.85rem' } }}>
          <Tab label={t('nav.partnerPermitTab')} />
        </Tabs>
      }
    >
      <PermitApplicationContent mode="external" />
    </PageHeader>
  )
}

export default PartnerPermitPage
