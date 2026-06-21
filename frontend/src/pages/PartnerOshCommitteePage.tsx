import { Tabs, Tab } from '@mui/material'
import { useTranslation } from 'react-i18next'
import OshCommitteeTab from '../components/ehs/OshCommitteeTab'
import PageHeader from '../components/common/PageHeader'

const PartnerOshCommitteePage: React.FC = () => {
  const { t } = useTranslation()

  return (
    <PageHeader
      title={t('nav.partnerOshCommittee')}
      flowKey="partnerOsh"
      tabs={
        <Tabs value={0} sx={{ '& .MuiTab-root': { minWidth: 'auto', px: 2, fontSize: '0.85rem' } }}>
          <Tab label={t('nav.partnerOshCommitteeTab')} />
        </Tabs>
      }
    >
      <OshCommitteeTab menuPath="협력 업체 관리 › SHE 협의체" />
    </PageHeader>
  )
}

export default PartnerOshCommitteePage
