"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Gift, Zap, Users, Share2 } from "lucide-react"

interface Task {
  id: string
  title: string
  description: string
  reward: number
  icon: React.ReactNode
  completed: boolean
}

interface DailyTasksProps {
  onTaskComplete: (reward: number) => void
}

export function DailyTasks({ onTaskComplete }: DailyTasksProps) {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "complete-node",
      title: "完成技能节点",
      description: "完成任意一个技能节点",
      reward: 5,
      icon: <CheckCircle className="w-4 h-4" />,
      completed: false,
    },
    {
      id: "share-achievement",
      title: "分享成就",
      description: "分享你的学习成果到社交媒体",
      reward: 8,
      icon: <Share2 className="w-4 h-4" />,
      completed: false,
    },
    {
      id: "invite-friend",
      title: "邀请好友",
      description: "邀请一位朋友加入学习",
      reward: 15,
      icon: <Users className="w-4 h-4" />,
      completed: true,
    },
  ])

  const handleTaskComplete = (taskId: string, reward: number) => {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, completed: true } : task)))
    onTaskComplete(reward)
  }

  const completedCount = tasks.filter((task) => task.completed).length
  const totalReward = tasks.reduce((sum, task) => sum + (task.completed ? task.reward : 0), 0)

  return (
    <Card className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-950 dark:text-white flex items-center">
            <Gift className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
            每日任务
          </h3>
          <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 border-purple-200 dark:border-purple-700">
            {completedCount}/{tasks.length}
          </Badge>
        </div>

        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                task.completed
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                  : "bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 hover:border-purple-300 dark:hover:border-purple-700"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`p-2 rounded-full ${
                    task.completed ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
                  }`}
                >
                  {task.completed ? <CheckCircle className="w-4 h-4" /> : task.icon}
                </div>
                <div>
                  <div className="text-sm font-medium text-neutral-950 dark:text-white">{task.title}</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">{task.description}</div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex items-center text-amber-600 dark:text-amber-400">
                  <Zap className="w-3 h-3 mr-1" />
                  <span className="text-sm font-medium">+{task.reward}</span>
                </div>
                {!task.completed && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTaskComplete(task.id, task.reward)}
                    className="border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 cursor-pointer"
                  >
                    完成
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Daily Summary */}
        <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-950 dark:text-white">今日获得能量</span>
            <div className="flex items-center text-amber-600 dark:text-amber-400 font-semibold">
              <Zap className="w-4 h-4 mr-1" />
              {totalReward}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
