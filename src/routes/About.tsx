import { useTranslation } from 'react-i18next'

export default function About() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6 page-enter">
      <div className="rounded-xl border bg-white p-6">
        <div className="flex items-center gap-3 mb-4">
          <img src="/smilex.svg" alt="SmileX" className="w-10 h-10" />
          <div>
            <h2 className="text-lg font-semibold">SmileX Dict</h2>
            <p className="text-sm text-gray-500">v1.0.0</p>
          </div>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">
          {t('about.description')}
        </p>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <h3 className="font-semibold mb-3">{t('about.features')}</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="flex items-start gap-2">
            <span className="text-brand-500 mt-0.5">●</span>
            <div>
              <div className="text-sm font-medium">{t('about.wordPractice')}</div>
              <div className="text-xs text-gray-500">{t('about.wordPracticeDesc')}</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">●</span>
            <div>
              <div className="text-sm font-medium">{t('about.articlePractice')}</div>
              <div className="text-xs text-gray-500">{t('about.articlePracticeDesc')}</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-amber-500 mt-0.5">●</span>
            <div>
              <div className="text-sm font-medium">{t('about.dictManagement')}</div>
              <div className="text-xs text-gray-500">{t('about.dictManagementDesc')}</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-500 mt-0.5">●</span>
            <div>
              <div className="text-sm font-medium">{t('about.learningPanel')}</div>
              <div className="text-xs text-gray-500">{t('about.learningPanelDesc')}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <h3 className="font-semibold mb-3">Tech Stack</h3>
        <div className="flex flex-wrap gap-2">
          {['React 19', 'Redux Toolkit', 'Tailwind CSS', 'React Router', 'Vite', 'Electron', 'Capacitor', 'FastAPI'].map(tech => (
            <span key={tech} className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600 font-medium">{tech}</span>
          ))}
        </div>
      </div>

      <div className="text-center text-xs text-gray-400">
        Apache License 2.0
      </div>
    </div>
  )
}
