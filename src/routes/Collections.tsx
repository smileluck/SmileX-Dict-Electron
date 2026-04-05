import { useTranslation } from 'react-i18next'
import WordList from '../components/WordList'

export default function Collections() {
  const { t } = useTranslation()
  return (
    <WordList
      status="collected"
      title={t('collections.title')}
      emptyText={t('collections.empty')}
      icon="star"
      iconClass="text-brand-500"
    />
  )
}
