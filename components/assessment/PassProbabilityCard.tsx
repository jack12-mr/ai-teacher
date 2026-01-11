"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Target,
  Award
} from "lucide-react"
import type { PassProbability } from "@/lib/types/assessment"
import { getPassLevelDescription } from "@/lib/types/assessment"

interface PassProbabilityCardProps {
  passProbability: PassProbability
  subjectName?: string
}

// 获取通过率对应的颜色
function getProbabilityColor(score: number): {
  gradient: string
  text: string
  glow: string
} {
  if (score >= 80) {
    return {
      gradient: 'from-emerald-500 to-emerald-600',
      text: 'text-emerald-600 dark:text-emerald-400',
      glow: 'shadow-emerald-500/30'
    }
  }
  if (score >= 60) {
    return {
      gradient: 'from-indigo-500 to-indigo-600',
      text: 'text-indigo-600 dark:text-indigo-400',
      glow: 'shadow-indigo-500/30'
    }
  }
  if (score >= 40) {
    return {
      gradient: 'from-amber-500 to-amber-600',
      text: 'text-amber-600 dark:text-amber-400',
      glow: 'shadow-amber-500/30'
    }
  }
  return {
    gradient: 'from-orange-500 to-red-500',
    text: 'text-orange-600 dark:text-orange-400',
    glow: 'shadow-orange-500/30'
  }
}

// 圆形进度条组件
function CircularProgress({ score }: { score: number }) {
  const colors = getProbabilityColor(score)
  const circumference = 2 * Math.PI * 45 // radius = 45
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className="relative w-40 h-40">
      {/* 背景圆 */}
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="80"
          cy="80"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-neutral-200 dark:text-neutral-700"
        />
        {/* 进度圆 */}
        <circle
          cx="80"
          cy="80"
          r="45"
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
        {/* 渐变定义 */}
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" className={`${colors.text.replace('text-', 'stop-')}`} stopColor="currentColor" />
            <stop offset="100%" className={`${colors.text.replace('text-', 'stop-')}`} stopColor="currentColor" />
          </linearGradient>
        </defs>
      </svg>

      {/* 中心内容 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-bold ${colors.text}`}>
          {score}%
        </span>
        <span className="text-sm text-neutral-500 dark:text-neutral-400">通过概率</span>
      </div>
    </div>
  )
}

export function PassProbabilityCard({ passProbability, subjectName }: PassProbabilityCardProps) {
  const { score, level, factors } = passProbability
  const colors = getProbabilityColor(score)
  const levelInfo = getPassLevelDescription(level)

  return (
    <Card className={`
      bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 p-6
      animate-in fade-in slide-in-from-bottom-4 duration-500
    `}>
      {/* 标题 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/30 flex items-center justify-center">
            <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-950 dark:text-white">考试通过预测</h3>
            {subjectName && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{subjectName}</p>
            )}
          </div>
        </div>
        <Badge className={`${levelInfo.bgColor} ${levelInfo.color} border-0`}>
          {levelInfo.text}
        </Badge>
      </div>

      {/* 主内容区 */}
      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* 圆形进度 */}
        <div className="flex-shrink-0">
          <CircularProgress score={score} />
        </div>

        {/* 影响因素 */}
        <div className="flex-1 w-full space-y-4">
          {/* 正面因素 */}
          {factors.positive.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">有利因素</span>
              </div>
              <div className="space-y-2">
                {factors.positive.map((factor, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-emerald-700 dark:text-emerald-300">{factor}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 负面因素 */}
          {factors.negative.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span className="text-sm font-medium text-orange-600 dark:text-orange-400">需要改进</span>
              </div>
              <div className="space-y-2">
                {factors.negative.map((factor, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-2 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800"
                  >
                    <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-orange-700 dark:text-orange-300">{factor}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 底部建议 */}
      <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-800">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
          <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1">AI 建议</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {score >= 80 ? (
                '你的准备状态很好！保持当前的学习节奏，重点复习错题，考试通过概率很高。'
              ) : score >= 60 ? (
                '基础还不错，建议加强薄弱环节的专项练习，提高正确率可以显著提升通过概率。'
              ) : score >= 40 ? (
                '还需要更多努力，建议系统性地复习基础知识，针对薄弱点多做练习。'
              ) : (
                '建议从基础开始扎实复习，可以制定每日学习计划，循序渐进提升能力。'
              )}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
