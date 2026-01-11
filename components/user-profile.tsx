"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Zap, Users, Flame } from "lucide-react"

interface User {
  name: string
  level: number
  energy: number
  totalProgress: number
  masteredSkills: string[]
  achievements: string[]
  inviteCount: number
  dailyStreak: number
}

interface UserProfileProps {
  user: User
}

export function UserProfile({ user }: UserProfileProps) {
  const getTitleByLevel = (progress: number) => {
    if (progress >= 70) return { title: "👑 JavaScript宗师", color: "from-yellow-400 to-orange-400" }
    if (progress >= 30) return { title: "⚡ 前端新星", color: "from-blue-400 to-purple-400" }
    return { title: "🌱 萌新学徒", color: "from-green-400 to-emerald-400" }
  }

  const userTitle = getTitleByLevel(user.totalProgress)

  return (
    <Card className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 p-6">
      <div className="space-y-6">
        {/* Avatar and Title */}
        <div className="text-center">
          <Avatar className="w-20 h-20 mx-auto mb-4 ring-4 ring-purple-200 dark:ring-purple-800">
            <AvatarImage src="/placeholder.svg?height=80&width=80" />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xl">
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-bold text-neutral-950 dark:text-white">{user.name}</h2>
          <div className={`text-sm font-medium bg-gradient-to-r ${userTitle.color} bg-clip-text text-transparent`}>
            {userTitle.title}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Zap className="w-4 h-4 text-amber-500 mr-1" />
              <span className="text-lg font-bold text-neutral-950 dark:text-white">{user.energy}</span>
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">能量石</div>
          </div>
          <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Users className="w-4 h-4 text-indigo-500 mr-1" />
              <span className="text-lg font-bold text-neutral-950 dark:text-white">{user.inviteCount}</span>
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">邀请数</div>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600 dark:text-neutral-300">总体进度</span>
            <span className="text-sm font-medium text-neutral-950 dark:text-white">{user.totalProgress}%</span>
          </div>
          <Progress value={user.totalProgress} className="h-2" />
        </div>

        {/* Daily Streak */}
        <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Flame className="w-4 h-4 text-orange-500 mr-2" />
              <span className="text-sm text-neutral-950 dark:text-white">连续学习</span>
            </div>
            <span className="text-lg font-bold text-orange-600 dark:text-orange-400">{user.dailyStreak}天</span>
          </div>
        </div>

        {/* Top Skills */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-300">掌握技能</h3>
          <div className="flex flex-wrap gap-2">
            {user.masteredSkills.slice(0, 5).map((skill, index) => (
              <Badge key={index} variant="secondary" className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 border-purple-200 dark:border-purple-700">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
