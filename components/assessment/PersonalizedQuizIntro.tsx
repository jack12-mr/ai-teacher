"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Sparkles,
  Bot,
  Target,
  Loader2,
  ArrowLeft,
  Lightbulb
} from "lucide-react"
import type { AssessmentDimension } from "@/lib/types/assessment"
import { useT } from "@/lib/i18n"

interface PersonalizedQuizIntroProps {
  subjectName: string
  weaknesses: AssessmentDimension[]
  questionCount?: number
  isLoading?: boolean
  onStart: () => void
  onBack: () => void
  onQuestionCountChange?: (count: number) => void
}

export function PersonalizedQuizIntro({
  subjectName,
  weaknesses,
  questionCount = 10,
  isLoading = false,
  onStart,
  onBack,
  onQuestionCountChange
}: PersonalizedQuizIntroProps) {
  const t = useT()
  const [customCount, setCustomCount] = useState<string>('')
  const [showCustomInput, setShowCustomInput] = useState(false)

  // 获取要展示的薄弱项（最多显示5个）
  const displayWeaknesses = weaknesses.slice(0, 5)
  const hasMoreWeaknesses = weaknesses.length > 5

  const questionOptions = [
    { value: 5, label: `5${t.targetedQuiz.questions}`, description: t.targetedQuiz.quickPractice },
    { value: 10, label: `10${t.targetedQuiz.questions}`, description: t.targetedQuiz.standardTraining },
    { value: 20, label: `20${t.targetedQuiz.questions}`, description: t.targetedQuiz.deepPractice },
    { value: 'custom', label: t.targetedQuiz.custom, description: t.targetedQuiz.maxQuestions }
  ]

  const handleQuestionCountChange = (value: number | 'custom') => {
    if (value === 'custom') {
      setShowCustomInput(true)
    } else {
      setShowCustomInput(false)
      setCustomCount('')
      onQuestionCountChange?.(value)
    }
  }

  const handleCustomCountChange = (value: string) => {
    const numValue = parseInt(value)
    if (value === '' || (!isNaN(numValue) && numValue >= 1 && numValue <= 40)) {
      setCustomCount(value)
      if (numValue >= 1 && numValue <= 40) {
        onQuestionCountChange?.(numValue)
      }
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* AI 介绍卡片 */}
      <Card className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 p-8 text-center">
        {/* AI 头像 */}
        <div className="relative inline-block mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-500/30">
            <Bot className="w-12 h-12 text-white" />
          </div>
          {/* 脉冲动画 */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 animate-ping opacity-20" />
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 border-4 border-white dark:border-neutral-950 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* 标题 */}
        <h2 className="text-2xl font-bold text-neutral-950 dark:text-white mb-3">
          {t.targetedQuiz.aiAssistant}
        </h2>
        <Badge className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 mb-6">
          {subjectName} · {t.targetedQuiz.targetedTraining}
        </Badge>

        {/* 话术 */}
        <div className="max-w-lg mx-auto">
          <p className="text-neutral-600 dark:text-neutral-300 text-lg leading-relaxed mb-4">
            {t.targetedQuiz.assessmentFound}
          </p>
        </div>
      </Card>

      {/* 薄弱项标签展示 */}
      {weaknesses.length > 0 && (
        <Card className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <h3 className="font-semibold text-neutral-950 dark:text-white">{t.targetedQuiz.weakPoints}</h3>
            <Badge className="ml-auto bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800">
              {weaknesses.length} {t.analysis.items}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-3">
            {displayWeaknesses.map((weakness) => (
              <div
                key={weakness.id}
                className="px-4 py-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800
                           flex items-center gap-2 transition-all hover:bg-orange-100 dark:hover:bg-orange-950/50 cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                  <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{weakness.score}</span>
                </div>
                <span className="text-orange-700 dark:text-orange-300 font-medium">{weakness.name}</span>
              </div>
            ))}
            {hasMoreWeaknesses && (
              <div className="px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700
                             text-neutral-500 dark:text-neutral-400 text-sm">
                {t.targetedQuiz.more.replace("{count}", String(weaknesses.length - 5))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 题目数量选择 */}
      <Card className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 p-6">
        <h3 className="font-semibold text-neutral-950 dark:text-white mb-4">{t.targetedQuiz.selectQuestionCount}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {questionOptions.map((option) => {
            const isSelected = option.value === 'custom'
              ? showCustomInput
              : option.value === questionCount && !showCustomInput

            return (
              <button
                key={option.value}
                onClick={() => handleQuestionCountChange(option.value)}
                disabled={isLoading}
                className={`p-4 rounded-xl border-2 transition-all duration-200 text-left
                  ${isSelected
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
              >
                <div className="font-bold text-lg text-neutral-950 dark:text-white mb-1">
                  {option.label}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  {option.description}
                </div>
              </button>
            )
          })}
        </div>

        {/* 自定义输入框 */}
        {showCustomInput && (
          <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {t.targetedQuiz.enterCount}
            </label>
            <input
              type="number"
              min="1"
              max="40"
              value={customCount}
              onChange={(e) => handleCustomCountChange(e.target.value)}
              disabled={isLoading}
              placeholder={t.targetedQuiz.enterPlaceholder}
              className="w-full px-4 py-2 rounded-lg border border-indigo-300 dark:border-indigo-700
                         bg-white dark:bg-neutral-900 text-neutral-950 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-indigo-600
                         disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {customCount && (parseInt(customCount) < 1 || parseInt(customCount) > 40) && (
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                {t.targetedQuiz.invalidRange}
              </p>
            )}
          </div>
        )}
      </Card>

      {/* AI 计划说明 */}
      <Card className="bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-neutral-950 dark:text-white mb-2">{t.targetedQuiz.myPlan}</h3>
            <p className="text-neutral-600 dark:text-neutral-300 text-sm leading-relaxed">
              {t.targetedQuiz.willGenerate} <span className="text-indigo-600 dark:text-indigo-400 font-bold">{questionCount}</span> {t.targetedQuiz.questionsWill}
              {t.targetedQuiz.focusOnWeak}
              {t.targetedQuiz.detailedReport}
            </p>
          </div>
        </div>

        {/* 题目分布预览 */}
        <div className="mt-4 pt-4 border-t border-indigo-200 dark:border-indigo-800">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-lg bg-white dark:bg-neutral-900">
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">60%</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{t.targetedQuiz.weakAreas}</p>
            </div>
            <div className="p-3 rounded-lg bg-white dark:bg-neutral-900">
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">30%</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{t.targetedQuiz.consolidate}</p>
            </div>
            <div className="p-3 rounded-lg bg-white dark:bg-neutral-900">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">10%</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{t.targetedQuiz.maintainStrength}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* 操作按钮 */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          disabled={isLoading}
          className="px-6 py-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700
                     text-neutral-700 dark:text-neutral-300 font-medium transition-all duration-200
                     flex items-center justify-center gap-2 cursor-pointer
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t.targetedQuiz.back}</span>
        </button>

        <button
          onClick={onStart}
          disabled={isLoading}
          className="flex-1 py-4 rounded-xl font-medium
                     bg-indigo-600 hover:bg-indigo-700
                     text-white shadow-lg shadow-indigo-600/20
                     transition-all duration-200 hover:shadow-indigo-600/30
                     flex items-center justify-center gap-2 cursor-pointer
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-lg">{t.targetedQuiz.aiGenerating}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span className="text-lg">{t.targetedQuiz.startQuiz}</span>
            </>
          )}
        </button>
      </div>

      {/* 提示文字 */}
      <p className="text-center text-sm text-neutral-500 dark:text-neutral-500">
        {t.targetedQuiz.estimatedTime.replace("{min}", String(Math.ceil(questionCount * 1.5))).replace("{max}", String(questionCount * 2))}
      </p>
    </div>
  )
}
