import { useTranslation } from 'react-i18next'

export default function StudyGuide() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6 page-enter">
      <div className="glass-card p-5">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('studyGuide.sm2Title')}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: t('studyGuide.sm2Intro') }} />

        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-2">{t('studyGuide.corePrinciple')}</h4>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
            <li className="flex gap-2">
              <span className="w-8 h-8 rounded-full bg-gradient-brand text-white flex items-center justify-center text-sm font-bold shadow-sm flex-shrink-0">1</span>
              <span dangerouslySetInnerHTML={{ __html: t('studyGuide.principle1') }} />
            </li>
            <li className="flex gap-2">
              <span className="w-8 h-8 rounded-full bg-gradient-brand text-white flex items-center justify-center text-sm font-bold shadow-sm flex-shrink-0">2</span>
              <span dangerouslySetInnerHTML={{ __html: t('studyGuide.principle2') }} />
            </li>
            <li className="flex gap-2">
              <span className="w-8 h-8 rounded-full bg-gradient-brand text-white flex items-center justify-center text-sm font-bold shadow-sm flex-shrink-0">3</span>
              <span dangerouslySetInnerHTML={{ __html: t('studyGuide.principle3') }} />
            </li>
          </ul>
        </div>

        <div className="bg-brand-50 dark:bg-brand-900/20 rounded-lg p-4">
          <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-2">{t('studyGuide.intervalExample')}</h4>
          <div className="flex items-center gap-2 text-sm overflow-x-auto pb-2">
            {[
              { day: t('studyGuide.interval1'), label: t('studyGuide.after1day'), active: true },
              { day: t('studyGuide.interval2'), label: t('studyGuide.after6days'), active: true },
              { day: t('studyGuide.interval3'), label: t('studyGuide.after15days'), active: true },
              { day: t('studyGuide.interval4'), label: t('studyGuide.after37days'), active: true },
              { day: t('studyGuide.interval5'), label: t('studyGuide.mastered'), active: true },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 flex-shrink-0">
                <div className={`rounded-lg px-3 py-2 border text-center ${item.active ? 'bg-white dark:bg-gray-800 border-brand-200 dark:border-brand-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                  <div className="font-medium text-brand-600 dark:text-brand-400">{item.day}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{item.label}</div>
                </div>
                {i < 4 && <span className="text-gray-300 dark:text-gray-600">→</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card p-5">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('studyGuide.ebbinghausTitle')}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">
          {t('studyGuide.ebbinghausIntro')}
        </p>

        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-3">{t('studyGuide.forgettingCurve')}</h4>
          <div className="relative h-40">
            <div className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between text-xs text-gray-400 dark:text-gray-500">
              <span>100%</span>
              <span>50%</span>
              <span>0%</span>
            </div>
            <div className="ml-10 h-full relative">
              <div className="absolute inset-0 bottom-6">
                <div className="absolute top-0 w-full border-t border-dashed border-gray-200 dark:border-gray-700" />
                <div className="absolute top-1/2 w-full border-t border-dashed border-gray-200 dark:border-gray-700" />
                <div className="absolute bottom-0 w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <svg className="absolute inset-0 bottom-6 w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                <path
                  d="M 0 5 C 20 10, 40 50, 80 70 C 120 82, 200 90, 300 93"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeDasharray="4,4"
                />
                <path
                  d="M 0 5 L 30 8 L 30 5 C 50 8, 80 20, 120 25 C 160 28, 200 30, 240 31 L 300 32"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2"
                />
                <circle cx="30" cy="8" r="3" fill="#3b82f6" />
                <circle cx="120" cy="25" r="3" fill="#3b82f6" />
                <circle cx="240" cy="31" r="3" fill="#3b82f6" />
              </svg>
              <div className="absolute bottom-0 w-full flex justify-between text-xs text-gray-400 dark:text-gray-500">
                <span>{t('studyGuide.justLearned')}</span>
                <span>{t('studyGuide.min20')}</span>
                <span>{t('studyGuide.hour1')}</span>
                <span>{t('studyGuide.day1')}</span>
                <span>{t('studyGuide.day2')}</span>
                <span>{t('studyGuide.day7')}</span>
                <span>{t('studyGuide.day30')}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1"><span className="w-4 h-0 border-t-2 border-dashed border-red-400 inline-block" /> {t('studyGuide.noReview')}</span>
            <span className="flex items-center gap-1"><span className="w-4 h-0 border-t-2 border-green-500 inline-block" /> {t('studyGuide.timelyReview')}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-500 inline-block" /> {t('studyGuide.reviewPoint')}</span>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
          <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-2">{t('studyGuide.ebbinghausCycle')}</h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2" dangerouslySetInnerHTML={{ __html: t('studyGuide.ebbinghausCycleDesc') }} />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('studyGuide.sm2Upgrade')}
          </p>
        </div>
      </div>

      <div className="glass-card p-5">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('studyGuide.methodsTitle')}</h3>

        <div className="space-y-4">
          <div className="glass-card-hover p-4 border-t-2 border-brand-400">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🎯</span>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">{t('studyGuide.activeRecall')}</h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('studyGuide.activeRecallDesc')}
            </p>
            <div className="mt-2 text-xs text-brand-600 dark:text-brand-400">{t('studyGuide.activeRecallTip')}</div>
          </div>

          <div className="glass-card-hover p-4 border-t-2 border-blue-400">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📖</span>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">{t('studyGuide.contextLearning')}</h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('studyGuide.contextLearningDesc')}
            </p>
            <div className="mt-2 text-xs text-brand-600 dark:text-brand-400">{t('studyGuide.contextLearningTip')}</div>
          </div>

          <div className="glass-card-hover p-4 border-t-2 border-amber-400">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">✍️</span>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">{t('studyGuide.spellingMethod')}</h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('studyGuide.spellingMethodDesc')}
            </p>
            <div className="mt-2 text-xs text-brand-600 dark:text-brand-400">{t('studyGuide.spellingMethodTip')}</div>
          </div>

          <div className="glass-card-hover p-4 border-t-2 border-purple-400">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🔄</span>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">{t('studyGuide.spacedRepetition')}</h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400" dangerouslySetInnerHTML={{ __html: t('studyGuide.spacedRepetitionDesc') }} />
            <div className="mt-2 text-xs text-brand-600 dark:text-brand-400">{t('studyGuide.spacedRepetitionTip')}</div>
          </div>
        </div>
      </div>

      <div className="glass-card p-5">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('studyGuide.tipsTitle')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-card-hover p-4 border-t-2 border-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <h4 className="font-medium text-sm text-green-700 dark:text-green-400 mb-2">{t('studyGuide.doRecommend')}</h4>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1.5">
              <li>• {t('studyGuide.do1')}</li>
              <li>• {t('studyGuide.do2')}</li>
              <li>• {t('studyGuide.do3')}</li>
              <li>• {t('studyGuide.do4')}</li>
              <li>• {t('studyGuide.do5')}</li>
              <li>• {t('studyGuide.do6')}</li>
            </ul>
          </div>
          <div className="glass-card-hover p-4 border-t-2 border-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <h4 className="font-medium text-sm text-red-700 dark:text-red-400 mb-2">{t('studyGuide.dontRecommend')}</h4>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1.5">
              <li>• {t('studyGuide.dont1')}</li>
              <li>• {t('studyGuide.dont2')}</li>
              <li>• {t('studyGuide.dont3')}</li>
              <li>• {t('studyGuide.dont4')}</li>
              <li>• {t('studyGuide.dont5')}</li>
              <li>• {t('studyGuide.dont6')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
