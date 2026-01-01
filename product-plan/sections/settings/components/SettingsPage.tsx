import { ChevronRight } from 'lucide-react'
import type { SettingsPageProps } from '@/../product/sections/settings/types'

export function SettingsPage({ categories, onNavigate }: SettingsPageProps) {
  return (
    <div className="h-full overflow-auto">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-8">
          Settings
        </h1>

        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category.id}>
              <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                {category.title}
              </h2>
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-700">
                {category.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onNavigate?.(item.href)}
                    className="w-full px-4 py-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        {item.title}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {item.description}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}