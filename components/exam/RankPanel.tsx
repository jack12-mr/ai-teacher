"use client"

import { Progress } from "@/components/ui/progress"
import { Flame, TrendingUp, TrendingDown, CheckCircle, XCircle } from "lucide-react"
import { RANK_CONFIG, getRankProgress, getPointsToNextRank, type RankType, type UserRankState } from "@/lib/exam-mock-data"

interface RankPanelProps {
  rankState: UserRankState
}

export function RankPanel({ rankState }: RankPanelProps) {
  const config = RANK_CONFIG[rankState.rank]
  const progress = getRankProgress(rankState.points, rankState.rank)
  const pointsToNext = getPointsToNextRank(rankState.points, rankState.rank)

  return (
    <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 space-y-5">
      {/* 等级徽章 */}
      <div className="text-center">
        <div
          className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center shadow-lg`}
        >
          <span className="text-4xl">{config.icon}</span>
        </div>
        <h3 className="text-xl font-bold text-neutral-950 dark:text-white mt-3">{config.name}</h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Level {['bronze', 'silver', 'gold', 'platinum', 'diamond'].indexOf(rankState.rank) + 1}</p>
      </div>

      {/* 积分进度 */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-500 dark:text-neutral-400">当前积分</span>
          <span className="text-neutral-950 dark:text-white font-bold">{rankState.points}</span>
        </div>
        <Progress value={progress} className="h-2" />
        {pointsToNext > 0 && (
          <p className="text-xs text-neutral-500 text-right">
            还需 <span className="text-indigo-600 dark:text-indigo-400">{pointsToNext}</span> 分升级
          </p>
        )}
      </div>

      {/* 分隔线 */}
      <div className="border-t border-neutral-200 dark:border-neutral-800" />

      {/* 连击计数 */}
      <div className="text-center">
        {rankState.currentCombo > 0 ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-full">
            <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400 animate-pulse" />
            <span className="text-orange-600 dark:text-orange-400 font-bold">连击 x{rankState.currentCombo}</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-full">
            <Flame className="w-5 h-5 text-neutral-400 dark:text-neutral-500" />
            <span className="text-neutral-500 dark:text-neutral-400">暂无连击</span>
          </div>
        )}
        {rankState.maxCombo > 0 && (
          <p className="text-xs text-neutral-500 mt-2">
            最高连击: {rankState.maxCombo}
          </p>
        )}
      </div>

      {/* 分隔线 */}
      <div className="border-t border-neutral-200 dark:border-neutral-800" />

      {/* 今日统计 */}
      <div>
        <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-3">今日统计</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{rankState.todayCorrect}</span>
            </div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">正确</span>
          </div>
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-lg font-bold text-red-600 dark:text-red-400">{rankState.todayWrong}</span>
            </div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">错误</span>
          </div>
        </div>

        {/* 正确率 */}
        {(rankState.todayCorrect + rankState.todayWrong) > 0 && (
          <div className="mt-3 text-center">
            <span className="text-sm text-neutral-500 dark:text-neutral-400">正确率: </span>
            <span className={`font-bold ${
              rankState.todayCorrect / (rankState.todayCorrect + rankState.todayWrong) >= 0.7
                ? 'text-emerald-600 dark:text-emerald-400'
                : rankState.todayCorrect / (rankState.todayCorrect + rankState.todayWrong) >= 0.5
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {Math.round(rankState.todayCorrect / (rankState.todayCorrect + rankState.todayWrong) * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* 连续错误警告 */}
      {rankState.consecutiveWrong >= 3 && (
        <>
          <div className="border-t border-neutral-200 dark:border-neutral-800" />
          <div className={`p-3 rounded-xl text-center ${
            rankState.consecutiveWrong >= 6
              ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'
              : 'bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800'
          }`}>
            <div className="flex items-center justify-center gap-2">
              <TrendingDown className={`w-4 h-4 ${
                rankState.consecutiveWrong >= 6 ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'
              }`} />
              <span className={`text-sm font-medium ${
                rankState.consecutiveWrong >= 6 ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'
              }`}>
                连续错误 {rankState.consecutiveWrong} 次
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {rankState.consecutiveWrong >= 6
                ? '即将降级，请认真答题！'
                : '注意保持专注~'
              }
            </p>
          </div>
        </>
      )}
    </div>
  )
}
