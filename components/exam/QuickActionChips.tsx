'use client'

import { useT } from '@/lib/i18n'

interface QuickActionChipsProps {
  onChipClick: (message: string) => void
}

export function QuickActionChips({ onChipClick }: QuickActionChipsProps) {
  const t = useT()

  // Define actions with translations
  const QUICK_ACTIONS = [
    '2026年真题卷',
    '针对函数考点',
    `${t.exam.difficulty.label || '难度'}：${t.exam.difficulty.medium}`,
    `${t.exam.difficulty.label || '难度'}：${t.exam.difficulty.hard}`,
    '5道题目',
    '阅读理解',
    '选择题',
    '高考真题'
  ]

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex gap-2 min-w-max px-1">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action}
            onClick={() => onChipClick(action)}
            className="px-4 py-2 rounded-full border border-blue-200 dark:border-blue-400/30 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 dark:hover:border-blue-400 transition-all duration-200 cursor-pointer whitespace-nowrap"
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  )
}
