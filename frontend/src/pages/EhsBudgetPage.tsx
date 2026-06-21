import { useTranslation } from 'react-i18next'
import EhsBudgetTab from '../components/ehs/EhsBudgetTab'
import PageHeader from '../components/common/PageHeader'

const EhsBudgetPage: React.FC = () => {
  const { t } = useTranslation()
  return (
    <PageHeader title={t('nav.ehsBudget')} flowKey="ehsBudget">
      <EhsBudgetTab />
    </PageHeader>
  )
}

export default EhsBudgetPage
