"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen,
  CheckCircle,
  XCircle,
  RotateCcw,
  Trash2,
  ChevronDown,
  ChevronUp,
  Tag,
  Calendar,
  AlertTriangle
} from "lucide-react"
import type { WrongQuestion, Question } from "@/lib/exam-mock-data"

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
        <h3 className="text-xl font-bold text-neutral-950 dark:text-white mb-2">太棒了！</h3>
        <p className="text-neutral-500 dark:text-neutral-400">你还没有错题，继续保持！</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 p-4 text-center">
          <div className="text-2xl font-bold text-neutral-950 dark:text-white">{stats.total}</div>
          <div className="text-sm text-neutral-500 dark:text-neutral-400">总错题</div>
        </Card>
        <Card className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 p-4 text-center">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.unmastered}</div>
          <div className="text-sm text-neutral-500 dark:text-neutral-400">未掌握</div>
        </Card>
        <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.mastered}</div>
          <div className="text-sm text-neutral-500 dark:text-neutral-400">已掌握</div>
        </Card>
      </div>

      {/* 过滤按钮 */}
      <div className="flex gap-2">
        {[
          { value: 'all', label: '全部' },
          { value: 'unmastered', label: '未掌握' },
          { value: 'mastered', label: '已掌握' }
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
              {questions.length} 题
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
                    错 {wq.wrongCount} 次
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
                    <p className="text-neutral-600 dark:text-neutral-300 whitespace-pre-wrap">
                      {wq.question.content}
                    </p>
                  </div>

                  {/* 选项 */}
                  <div className="space-y-2">
                    {wq.question.options.map((opt, i) => (
                      <div
                        key={i}
                        className={`px-3 py-2 rounded-lg text-sm ${
                          i === wq.question.correctAnswer
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : wq.userAnswers.includes(i)
                            ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                        }`}
                      >
                        {opt}
                        {i === wq.question.correctAnswer && (
                          <span className="ml-2">✓ 正确答案</span>
                        )}
                        {wq.userAnswers.includes(i) && i !== wq.question.correctAnswer && (
                          <span className="ml-2">✗ 你的选择</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* 解析 */}
                  <div className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-4">
                    <div className="text-sm text-indigo-600 dark:text-indigo-400 mb-2">📖 解析</div>
                    <p className="text-neutral-600 dark:text-neutral-300 text-sm whitespace-pre-wrap">
                      {wq.question.explanation}
                    </p>
                  </div>

                  {/* 错误历史 */}
                  {wq.wrongCount >= 2 && (
                    <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span>这道题你已经错了 {wq.wrongCount} 次，建议重点复习！</span>
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
                      重新练习
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
                      {wq.mastered ? '取消掌握' : '标记已掌握'}
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
