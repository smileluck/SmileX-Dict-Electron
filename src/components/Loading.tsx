import { useTranslation } from 'react-i18next'

export default function Loading({ text }: { text?: string }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-500 text-sm">{text ?? t('common.loading')}</span>
      </div>
    </div>
  )
}
