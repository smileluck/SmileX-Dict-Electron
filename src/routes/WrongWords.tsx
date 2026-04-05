import { useTranslation } from 'react-i18next'
import WordList from '../components/WordList'

export default function WrongWords() {
  const { t } = useTranslation()
  return (
    <WordList
      status="wrong"
      title={t('wrongWords.title')}
      emptyText={t('wrongWords.empty')}
      icon="wrong"
      iconClass="text-red-500"
    />
  )
}
