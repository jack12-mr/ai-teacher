"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Trophy,
  Target,
  Flame,
  BookMarked,
  RotateCcw,
  Home,
  Share2,
  Star,
  TrendingUp,
  CheckCircle,
  XCircle,
  Sparkles,
  Award,
  Zap,
  ClipboardList
} from "lucide-react"
import { RANK_CONFIG, type UserRankState, type RankType } from "@/lib/exam-mock-data"
import confetti from 'canvas-confetti'

interface PracticeCompleteProps {
  examName: string
  rankState: UserRankState
  totalQuestions: number
  correctCount: number
  wrongCount: number
  wrongQuestionsCount: number
  onRestart: () => void
  onGoHome: () => void
  onGoReview: () => void
  onViewDetails: () => void
}

export function PracticeComplete({
  examName,
  rankState,
  totalQuestions,
  correctCount,
  wrongCount,
  wrongQuestionsCount,
  onRestart,
  onGoHome,
  onGoReview,
  onViewDetails
}: PracticeCompleteProps) {
  const router = useRouter()
  const [showContent, setShowContent] = useState(false)
  const [animatedScore, setAnimatedScore] = useState(0)

  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0
  const rankConfig = RANK_CONFIG[rankState.rank]

  // 根据正确率判断评级
  const getGrade = () => {
    if (accuracy >= 90) return { grade: 'S', color: 'from-yellow-400 to-orange-500', text: '完美发挥！' }
    if (accuracy >= 80) return { grade: 'A', color: 'from-green-400 to-emerald-500', text: '表现优秀！' }
    if (accuracy >= 70) return { grade: 'B', color: 'from-blue-400 to-cyan-500', text: '良好水平！' }
    if (accuracy >= 60) return { grade: 'C', color: 'from-purple-400 to-pink-500', text: '继续努力！' }
    return { grade: 'D', color: 'from-slate-400 to-slate-500', text: '需要加油！' }
  }

  const gradeInfo = getGrade()

  // 入场动画和撒花效果
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true)
      // 正确率高于70%才撒花
      if (accuracy >= 70) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [accuracy])

  // 分数动画
  useEffect(() => {
    if (!showContent) return

    const duration = 1500
    const steps = 60
    const increment = accuracy / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= accuracy) {
        setAnimatedScore(accuracy)
        clearInterval(timer)
      } else {
        setAnimatedScore(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [showContent, accuracy])

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4 py-8">
        <div className={`w-full max-w-2xl transition-all duration-700 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* 头部 - 评级展示 */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br ${gradeInfo.color} shadow-2xl mb-4 animate-pulse`}>
              <span className="text-6xl font-black text-white drop-shadow-lg">{gradeInfo.grade}</span>
            </div>
            <h1 className="text-3xl font-bold text-neutral-950 dark:text-white mb-2">{gradeInfo.text}</h1>
            <p className="text-neutral-500 dark:text-neutral-400">《{examName}》练习完成</p>
          </div>

          {/* 主卡片 */}
          <Card className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 p-6 mb-6">
            {/* 正确率环形图 */}
            <div className="flex items-center justify-center mb-8">
              <div className="relative">
                <svg className="w-40 h-40 transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-neutral-200 dark:text-neutral-700"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="url(#gradient)"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${animatedScore * 4.4} 440`}
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#4f46e5" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-neutral-950 dark:text-white">{animatedScore}%</span>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">正确率</span>
                </div>
              </div>
            </div>

            {/* 统计数据 */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="text-2xl font-bold text-neutral-950 dark:text-white">{totalQuestions}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">总题数</div>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{correctCount}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">答对</div>
              </div>
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{wrongCount}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">答错</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{rankState.maxCombo}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">最高连击</div>
              </div>
            </div>

            {/* 等级信息 */}
            <div className={`${rankConfig.bgColor} border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 mb-6`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${rankConfig.color} flex items-center justify-center text-2xl`}>
                    {rankConfig.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-neutral-950 dark:text-white">{rankConfig.name}</span>
                      <Award className="w-4 h-4 text-yellow-500" />
                    </div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">当前等级</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                    <Zap className="w-4 h-4" />
                    <span className="text-xl font-bold">{rankState.points}</span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">总积分</p>
                </div>
              </div>
            </div>

            {/* 今日成就 */}
            <div className="bg-neutral-50 dark:bg-neutral-900 rounded-xl p-4">
              <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                本次练习成就
              </h3>
              <div className="flex flex-wrap gap-2">
                {correctCount >= 5 && (
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-full text-emerald-600 dark:text-emerald-400 text-sm">
                    <Star className="w-3 h-3" />
                    答对5题+
                  </div>
                )}
                {rankState.maxCombo >= 3 && (
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-full text-orange-600 dark:text-orange-400 text-sm">
                    <Flame className="w-3 h-3" />
                    连击达人
                  </div>
                )}
                {accuracy >= 80 && (
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-full text-indigo-600 dark:text-indigo-400 text-sm">
                    <TrendingUp className="w-3 h-3" />
                    高正确率
                  </div>
                )}
                {totalQuestions >= 20 && (
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-full text-purple-600 dark:text-purple-400 text-sm">
                    <Sparkles className="w-3 h-3" />
                    全部完成
                  </div>
                )}
                {correctCount === 0 && wrongCount === 0 && (
                  <span className="text-neutral-500 text-sm">暂无成就</span>
                )}
              </div>
            </div>
          </Card>

          {/* 操作按钮 */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Button
              onClick={onRestart}
              className="bg-indigo-600 hover:bg-indigo-700 text-white py-6"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              再来一轮
            </Button>
            {wrongQuestionsCount > 0 && (
              <Button
                onClick={onGoReview}
                variant="outline"
                className="border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 py-6"
              >
                <BookMarked className="w-5 h-5 mr-2" />
                复习错题 ({wrongQuestionsCount})
              </Button>
            )}
            {wrongQuestionsCount === 0 && (
              <Button
                onClick={onGoHome}
                variant="outline"
                className="border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 py-6"
              >
                <Home className="w-5 h-5 mr-2" />
                返回首页
              </Button>
            )}
          </div>

          <Button
            onClick={onGoHome}
            variant="outline"
            className="w-full border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <Home className="w-4 h-4 mr-2" />
            返回主页
          </Button>
        </div>
      </div>
    </div>
  )
}
