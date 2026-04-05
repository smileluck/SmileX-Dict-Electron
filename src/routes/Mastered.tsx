import { useTranslation } from 'react-i18next'
import WordList from '../components/WordList'

export default function Mastered() {
  const { t } = useTranslation()
  return (
    <WordList
      status="mastered"
      title={t('mastered.title')}
      emptyText={t('mastered.empty')}
      icon="check"
      iconClass="text-green-500"
    />
  )
}
