"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MathText, MathBlock } from "@/components/ui/MathText"
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  Trash2,
  ChevronDown,
  ChevronUp,
  Tag,
  AlertTriangle
} from "lucide-react"
import type { WrongQuestion, Question } from "@/lib/exam-mock-data"
import { useT } from "@/lib/i18n"

interface WrongBookProps {
  wrongQuestions: WrongQuestion[]
  onPractice: (question: Question) => void
  onMarkMastered: (questionId: string) => void
  onRemove: (questionId: string) => void
}

export function WrongBook({
  wrongQuestions,
  onPractice,
  onMarkMastered,
  onRemove
}: WrongBookProps) {
  const t = useT()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unmastered' | 'mastered'>('all')

  // 过滤错题
  const filteredQuestions = wrongQuestions.filter(wq => {
    if (filter === 'unmastered') return !wq.mastered
    if (filter === 'mastered') return wq.mastered
    return true
  })

  // 按知识点分组
  const groupedByKnowledge = filteredQuestions.reduce((acc, wq) => {
    const key = wq.question.knowledgePoint
    if (!acc[key]) acc[key] = []
    acc[key].push(wq)
    return acc
  }, {} as Record<string, WrongQuestion[]>)

  // 统计
  const stats = {
    total: wrongQuestions.length,
    unmastered: wrongQuestions.filter(w => !w.mastered).length,
    mastered: wrongQuestions.filter(w => w.mastered).length
  }

  if (wrongQuestions.length === 0) {
    return (
      <Card className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 p-8 text-center">
        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-xl font-bold text-neutral-950 dark:text-white mb-2">{t.wrongBook.emptyTitle}</h3>
        <p className="text-neutral-500 dark:text-neutral-400">{t.wrongBook.emptyMessage}</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 p-4 text-center">
          <div className="text-2xl font-bold text-neutral-950 dark:text-white">{stats.total}</div>
          <div className="text-sm text-neutral-500 dark:text-neutral-400">{t.wrongBook.totalWrong}</div>
        </Card>
        <Card className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 p-4 text-center">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.unmastered}</div>
          <div className="text-sm text-neutral-500 dark:text-neutral-400">{t.wrongBook.unmastered}</div>
        </Card>
        <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.mastered}</div>
          <div className="text-sm text-neutral-500 dark:text-neutral-400">{t.wrongBook.mastered}</div>
        </Card>
      </div>

      {/* 过滤按钮 */}
      <div className="flex gap-2">
        {[
          { value: 'all', label: t.wrongBook.filterAll },
          { value: 'unmastered', label: t.wrongBook.unmastered },
          { value: 'mastered', label: t.wrongBook.mastered }
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value as typeof filter)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
              filter === f.value
                ? 'bg-indigo-600 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 按知识点分组显示 */}
      {Object.entries(groupedByKnowledge).map(([knowledge, questions]) => (
        <div key={knowledge} className="space-y-3">
          {/* 知识点标题 */}
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{knowledge}</span>
            <Badge className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
              {questions.length} {t.wrongBook.questionsCount}
            </Badge>
          </div>

          {/* 错题列表 */}
          {questions.map(wq => (
            <Card
              key={wq.questionId}
              className={`border transition-all ${
                wq.mastered
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                  : 'bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800'
              }`}
            >
              {/* 折叠头部 */}
              <button
                onClick={() => setExpandedId(expandedId === wq.questionId ? null : wq.questionId)}
                className="w-full px-4 py-3 flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {wq.mastered ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                  )}
                  <span className="text-neutral-950 dark:text-white truncate">
                    {wq.question.content.slice(0, 50)}...
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    className={`${
                      wq.wrongCount >= 3
                        ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    {t.wrongBook.wrongTimes.replace('{count}', String(wq.wrongCount))}
                  </Badge>
                  {expandedId === wq.questionId ? (
                    <ChevronUp className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                  )}
                </div>
              </button>

              {/* 展开内容 */}
              {expandedId === wq.questionId && (
                <div className="px-4 pb-4 border-t border-neutral-200 dark:border-neutral-800 pt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  {/* 题目内容 */}
                  <div>
                    <div className="text-neutral-600 dark:text-neutral-300">
                      <MathBlock>{wq.question.content}</MathBlock>
                    </div>
                  </div>

                  {/* 选项（仅选择题有） */}
                  {wq.question.options && wq.question.options.length > 0 && (
                    <div className="space-y-2">
                      {wq.question.options.map((opt, i) => {
                        const questionType = wq.question.type || 'single'
                        const isCorrectAnswer = questionType === 'multiple'
                          ? (wq.question.correctAnswer as number[]).includes(i)
                          : i === wq.question.correctAnswer
                        const isUserAnswer = questionType === 'multiple'
                          ? wq.userAnswers.some(ans => Array.isArray(ans) && (ans as number[]).includes(i))
                          : wq.userAnswers.some(ans => ans === i)

                        return (
                          <div
                            key={i}
                            className={`px-3 py-2 rounded-lg text-sm ${
                              isCorrectAnswer
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                : isUserAnswer
                                ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                            }`}
                          >
                            <MathText>{opt}</MathText>
                            {isCorrectAnswer && (
                              <span className="ml-2">{t.wrongBook.correctAnswer}</span>
                            )}
                            {isUserAnswer && !isCorrectAnswer && (
                              <span className="ml-2">{t.wrongBook.yourChoice}</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* 填空题答案展示 */}
                  {wq.question.type === 'fill' && (
                    <div className="space-y-2">
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">{t.wrongBook.correctAnswerLabel}</div>
                      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2">
                        {(wq.question.correctAnswer as string[]).map((ans, i) => (
                          <span key={i} className="text-emerald-600 dark:text-emerald-400">
                            {i > 0 && '、'}<MathText>{ans}</MathText>
                          </span>
                        ))}
                      </div>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">{t.wrongBook.yourAnswerLabel}</div>
                      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                        {wq.userAnswers.map((ans, i) => (
                          <div key={i} className="text-red-600 dark:text-red-400">
                            <MathText>{Array.isArray(ans) ? ans.join('、') : String(ans)}</MathText>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 解析 */}
                  <div className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-4">
                    <div className="text-sm text-indigo-600 dark:text-indigo-400 mb-2">{t.wrongBook.explanation}</div>
                    <div className="text-neutral-600 dark:text-neutral-300 text-sm">
                      <MathBlock>{wq.question.explanation}</MathBlock>
                    </div>
                  </div>

                  {/* 错误历史 */}
                  {wq.wrongCount >= 2 && (
                    <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{t.wrongBook.warningReview.replace('{count}', String(wq.wrongCount))}</span>
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => onPractice(wq.question)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      {t.wrongBook.retryPractice}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onMarkMastered(wq.questionId)}
                      className={
                        wq.mastered
                          ? 'border-neutral-300 dark:border-neutral-600 text-neutral-500 dark:text-neutral-400'
                          : 'border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                      }
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {wq.mastered ? t.wrongBook.unmarkMastered : t.wrongBook.markMastered}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRemove(wq.questionId)}
                      className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      ))}
    </div>
  )
}
