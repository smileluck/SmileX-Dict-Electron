import { useTranslation } from 'react-i18next'

export default function StudyGuide() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6 page-enter">
      <div className="rounded-xl border bg-white p-5">
        <h3 className="font-semibold text-lg mb-3">{t('studyGuide.sm2Title')}</h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: t('studyGuide.sm2Intro') }} />

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-sm mb-2">{t('studyGuide.corePrinciple')}</h4>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex gap-2">
              <span className="text-brand-500 font-bold">1.</span>
              <span dangerouslySetInnerHTML={{ __html: t('studyGuide.principle1') }} />
            </li>
            <li className="flex gap-2">
              <span className="text-brand-500 font-bold">2.</span>
              <span dangerouslySetInnerHTML={{ __html: t('studyGuide.principle2') }} />
            </li>
            <li className="flex gap-2">
              <span className="text-brand-500 font-bold">3.</span>
              <span dangerouslySetInnerHTML={{ __html: t('studyGuide.principle3') }} />
            </li>
          </ul>
        </div>

        <div className="bg-brand-50 rounded-lg p-4">
          <h4 className="font-medium text-sm mb-2">{t('studyGuide.intervalExample')}</h4>
          <div className="flex items-center gap-2 text-sm overflow-x-auto pb-2">
            {[
              { day: t('studyGuide.interval1'), label: t('studyGuide.after1day') },
              { day: t('studyGuide.interval2'), label: t('studyGuide.after6days') },
              { day: t('studyGuide.interval3'), label: t('studyGuide.after15days') },
              { day: t('studyGuide.interval4'), label: t('studyGuide.after37days') },
              { day: t('studyGuide.interval5'), label: t('studyGuide.mastered') },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 flex-shrink-0">
                <div className="bg-white rounded-lg px-3 py-2 border text-center">
                  <div className="font-medium text-brand-600">{item.day}</div>
                  <div className="text-xs text-gray-500">{item.label}</div>
                </div>
                {i < 4 && <span className="text-gray-300">→</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5">
        <h3 className="font-semibold text-lg mb-3">{t('studyGuide.ebbinghausTitle')}</h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          {t('studyGuide.ebbinghausIntro')}
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-sm mb-3">{t('studyGuide.forgettingCurve')}</h4>
          <div className="relative h-40">
            <div className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between text-xs text-gray-400">
              <span>100%</span>
              <span>50%</span>
              <span>0%</span>
            </div>
            <div className="ml-10 h-full relative">
              <div className="absolute inset-0 bottom-6">
                <div className="absolute top-0 w-full border-t border-dashed border-gray-200" />
                <div className="absolute top-1/2 w-full border-t border-dashed border-gray-200" />
                <div className="absolute bottom-0 w-full border-t border-gray-300" />
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
              <div className="absolute bottom-0 w-full flex justify-between text-xs text-gray-400">
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
          <div className="flex items-center gap-4 mt-2 text-xs">
            <span className="flex items-center gap-1"><span className="w-4 h-0 border-t-2 border-dashed border-red-400 inline-block" /> {t('studyGuide.noReview')}</span>
            <span className="flex items-center gap-1"><span className="w-4 h-0 border-t-2 border-green-500 inline-block" /> {t('studyGuide.timelyReview')}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-500 inline-block" /> {t('studyGuide.reviewPoint')}</span>
          </div>
        </div>

        <div className="bg-amber-50 rounded-lg p-4">
          <h4 className="font-medium text-sm mb-2">{t('studyGuide.ebbinghausCycle')}</h4>
          <p className="text-xs text-gray-600 mb-2" dangerouslySetInnerHTML={{ __html: t('studyGuide.ebbinghausCycleDesc') }} />
          <p className="text-xs text-gray-500">
            {t('studyGuide.sm2Upgrade')}
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5">
        <h3 className="font-semibold text-lg mb-3">{t('studyGuide.methodsTitle')}</h3>

        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🎯</span>
              <h4 className="font-medium">{t('studyGuide.activeRecall')}</h4>
            </div>
            <p className="text-sm text-gray-600">
              {t('studyGuide.activeRecallDesc')}
            </p>
            <div className="mt-2 text-xs text-brand-600">{t('studyGuide.activeRecallTip')}</div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📖</span>
              <h4 className="font-medium">{t('studyGuide.contextLearning')}</h4>
            </div>
            <p className="text-sm text-gray-600">
              {t('studyGuide.contextLearningDesc')}
            </p>
            <div className="mt-2 text-xs text-brand-600">{t('studyGuide.contextLearningTip')}</div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">✍️</span>
              <h4 className="font-medium">{t('studyGuide.spellingMethod')}</h4>
            </div>
            <p className="text-sm text-gray-600">
              {t('studyGuide.spellingMethodDesc')}
            </p>
            <div className="mt-2 text-xs text-brand-600">{t('studyGuide.spellingMethodTip')}</div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🔄</span>
              <h4 className="font-medium">{t('studyGuide.spacedRepetition')}</h4>
            </div>
            <p className="text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: t('studyGuide.spacedRepetitionDesc') }} />
            <div className="mt-2 text-xs text-brand-600">{t('studyGuide.spacedRepetitionTip')}</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5">
        <h3 className="font-semibold text-lg mb-3">{t('studyGuide.tipsTitle')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-sm text-green-700 mb-2">{t('studyGuide.doRecommend')}</h4>
            <ul className="text-sm text-gray-600 space-y-1.5">
              <li>• {t('studyGuide.do1')}</li>
              <li>• {t('studyGuide.do2')}</li>
              <li>• {t('studyGuide.do3')}</li>
              <li>• {t('studyGuide.do4')}</li>
              <li>• {t('studyGuide.do5')}</li>
              <li>• {t('studyGuide.do6')}</li>
            </ul>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <h4 className="font-medium text-sm text-red-700 mb-2">{t('studyGuide.dontRecommend')}</h4>
            <ul className="text-sm text-gray-600 space-y-1.5">
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
