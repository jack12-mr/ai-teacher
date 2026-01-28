'use client'

import { Requirement } from '@/lib/requirement-parser'
import { X, Sparkles } from 'lucide-react'
import { useT } from '@/lib/i18n'

interface RequirementTagsProps {
  requirements: Requirement[]
  onRemove: (category: Requirement['category']) => void
}

export function RequirementTags({ requirements, onRemove }: RequirementTagsProps) {
  const t = useT()

  if (requirements.length === 0) return null

  // Translate category names
  const translateCategory = (category: string): string => {
    // 【修复】检查category是否已经是英文格式
    // 如果已经是英文，直接返回，避免重复翻译
    const englishCategories = [
      'Subject', 'Difficulty', 'Question Type',
      'Key Point', 'Year', 'Count', 'Level', 'Activity'
    ]

    if (englishCategories.includes(category)) {
      return category
    }

    // 中文category映射（只映射中文key）
    const categoryMap: Record<string, string> = {
      '科目': t.exam.subject || 'Subject',
      '难度': t.exam.difficulty.label || 'Difficulty',
      '题型': t.exam.questionType || 'Question Type',
      '考点': t.exam.keyPoint || 'Key Point',
      '年份': t.exam.year || 'Year',
      '数量': t.exam.count || 'Count',
      '学段': t.exam.level || 'Level',
      '考点/活动': t.exam.activity || 'Activity'
    }

    return categoryMap[category] || category
  }

  // Translate difficulty values
  const translateValue = (category: string, value: string): string => {
    if (category === '难度') {
      const difficultyMap: Record<string, string> = {
        '简单': t.exam.difficulty.easy,
        '中等': t.exam.difficulty.medium,
        '困难': t.exam.difficulty.hard
      }
      return difficultyMap[value] || value
    }
    return value
  }

  return (
    <div className="w-full backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border border-gray-200 dark:border-white/10 rounded-2xl p-4 shadow-lg">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">AI 出题助手</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">已识别 {requirements.length} 个个性化需求</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {requirements.map((req) => (
          <div
            key={req.category}
            className="group flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 border border-blue-200/50 dark:border-blue-400/30 backdrop-blur-sm transition-all duration-200 hover:shadow-md hover:scale-105"
          >
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {translateCategory(req.category)}: <span className="text-blue-600 dark:text-blue-400">{translateValue(req.category, req.value)}</span>
            </span>
            <button
              onClick={() => onRemove(req.category)}
              className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-200/50 dark:bg-slate-700/50 hover:bg-red-500 dark:hover:bg-red-500 transition-colors duration-200 cursor-pointer group-hover:scale-110"
              aria-label={`删除 ${req.category}`}
            >
              <X className="w-3 h-3 text-slate-600 dark:text-slate-300 group-hover:text-white" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
