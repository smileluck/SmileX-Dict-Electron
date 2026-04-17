import { useTranslation } from 'react-i18next'

export default function About() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6 page-enter">
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-glow">
            <img src="/smilex.svg" alt="SmileX" className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">SmileX Dict</h2>
            <span className="badge bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400">v1.0.0</span>
          </div>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {t('about.description')}
        </p>
      </div>

      <div className="glass-card p-6">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('about.features')}</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="glass-card-hover p-4">
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 rounded-md bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center text-xs mt-0.5">●</span>
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('about.wordPractice')}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{t('about.wordPracticeDesc')}</div>
              </div>
            </div>
          </div>
          <div className="glass-card-hover p-4">
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 rounded-md bg-gradient-to-br from-green-400 to-green-600 text-white flex items-center justify-center text-xs mt-0.5">●</span>
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('about.articlePractice')}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{t('about.articlePracticeDesc')}</div>
              </div>
            </div>
          </div>
          <div className="glass-card-hover p-4">
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center text-xs mt-0.5">●</span>
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('about.dictManagement')}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{t('about.dictManagementDesc')}</div>
              </div>
            </div>
          </div>
          <div className="glass-card-hover p-4">
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-400 to-purple-600 text-white flex items-center justify-center text-xs mt-0.5">●</span>
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('about.learningPanel')}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{t('about.learningPanelDesc')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Tech Stack</h3>
        <div className="flex flex-wrap gap-2">
          {['React 19', 'Redux Toolkit', 'Tailwind CSS', 'React Router', 'Vite', 'Electron', 'Capacitor', 'FastAPI'].map(tech => (
            <span key={tech} className="badge bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">{tech}</span>
          ))}
        </div>
      </div>

      <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
        Apache License 2.0
      </div>
    </div>
  )
}
