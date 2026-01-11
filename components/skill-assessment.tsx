"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ChevronRight, Code, Database, Palette, BarChart3, Cloud, Shield, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { getCurrentUserId } from "@/lib/auth-mock"

interface SkillCategory {
  id: string
  name: string
  icon: React.ReactNode
  skills: string[]
  description: string
}

interface UserSkills {
  [category: string]: {
    [skill: string]: number
  }
}

interface SkillAssessmentProps {
  onComplete: (skills: UserSkills, role: string, score: number) => void
}

export function SkillAssessment({ onComplete }: SkillAssessmentProps) {
  const [currentCategory, setCurrentCategory] = useState(0)
  const [userSkills, setUserSkills] = useState<UserSkills>({})
  const [isSaving, setIsSaving] = useState(false)

  const skillCategories: SkillCategory[] = [
    {
      id: "frontend",
      name: "前端开发",
      icon: <Palette className="w-5 h-5" />,
      description: "用户界面和交互体验开发",
      skills: ["HTML/CSS", "JavaScript", "React/Vue", "TypeScript", "响应式设计", "性能优化"],
    },
    {
      id: "backend",
      name: "后端开发",
      icon: <Code className="w-5 h-5" />,
      description: "服务器端逻辑和API开发",
      skills: ["Python/Java", "Node.js", "API设计", "微服务", "缓存策略", "消息队列"],
    },
    {
      id: "database",
      name: "数据库",
      icon: <Database className="w-5 h-5" />,
      description: "数据存储和管理",
      skills: ["SQL", "NoSQL", "数据建模", "查询优化", "数据迁移", "备份恢复"],
    },
    {
      id: "devops",
      name: "运维部署",
      icon: <Cloud className="w-5 h-5" />,
      description: "系统部署和运维管理",
      skills: ["Docker", "Kubernetes", "CI/CD", "监控告警", "云服务", "自动化脚本"],
    },
    {
      id: "data",
      name: "数据科学",
      icon: <BarChart3 className="w-5 h-5" />,
      description: "数据分析和机器学习",
      skills: ["数据分析", "机器学习", "深度学习", "数据可视化", "统计学", "模型部署"],
    },
    {
      id: "security",
      name: "网络安全",
      icon: <Shield className="w-5 h-5" />,
      description: "系统安全和风险防控",
      skills: ["渗透测试", "安全审计", "加密技术", "身份认证", "风险评估", "合规管理"],
    },
  ]

  const handleSkillRating = (categoryId: string, skill: string, rating: number) => {
    setUserSkills((prev) => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        [skill]: rating,
      },
    }))
  }

  const getCurrentCategoryProgress = () => {
    const category = skillCategories[currentCategory]
    const categorySkills = userSkills[category.id] || {}
    const ratedSkills = Object.keys(categorySkills).length
    return (ratedSkills / category.skills.length) * 100
  }

  const getTotalProgress = () => {
    const totalSkills = skillCategories.reduce((sum, cat) => sum + cat.skills.length, 0)
    const ratedSkills = Object.values(userSkills).reduce(
      (sum, categorySkills) => sum + Object.keys(categorySkills).length,
      0,
    )
    return (ratedSkills / totalSkills) * 100
  }

  const canProceed = () => {
    const category = skillCategories[currentCategory]
    const categorySkills = userSkills[category.id] || {}
    return Object.keys(categorySkills).length === category.skills.length
  }

  const handleNext = async () => {
    if (currentCategory < skillCategories.length - 1) {
      setCurrentCategory(currentCategory + 1)
    } else {
      // Complete assessment and classify user
      const { role, score } = classifyUser(userSkills)
      const userId = getCurrentUserId()

      setIsSaving(true)

      // 保存评估结果到数据库
      try {
        const response = await fetch('/api/assessment/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            skills: userSkills,
            role,
            score,
          }),
        })

        const data = await response.json()

        if (response.ok) {
          toast.success('评估结果已保存')
          console.log('评估结果保存成功:', data)
        } else {
          toast.error(data.error || '保存失败')
          console.error('保存评估结果失败:', data.error)
        }
      } catch (error) {
        toast.error('网络错误，保存失败')
        console.error('保存评估结果时发生错误:', error)
      } finally {
        setIsSaving(false)
      }

      onComplete(userSkills, role, score)
    }
  }

  const classifyUser = (skills: UserSkills) => {
    // Role classification algorithm
    const categoryAverages: { [key: string]: number } = {}

    Object.entries(skills).forEach(([category, categorySkills]) => {
      const scores = Object.values(categorySkills)
      categoryAverages[category] = scores.reduce((sum, score) => sum + score, 0) / scores.length
    })

    const frontend = categoryAverages.frontend || 0
    const backend = categoryAverages.backend || 0
    const database = categoryAverages.database || 0
    const devops = categoryAverages.devops || 0
    const data = categoryAverages.data || 0
    const security = categoryAverages.security || 0

    let role = "通用开发者"
    let score = 50

    // Classification logic
    if (frontend >= 7 && backend >= 7) {
      role = "全栈工程师"
      score = Math.round(((frontend + backend) / 2) * 10)
    } else if (frontend >= 8) {
      role = "前端工程师"
      score = Math.round(frontend * 10)
    } else if (backend >= 8) {
      role = "后端工程师"
      score = Math.round(backend * 10)
    } else if (data >= 7) {
      role = "数据科学家"
      score = Math.round(data * 10)
    } else if (devops >= 7) {
      role = "DevOps工程师"
      score = Math.round(devops * 10)
    } else if (security >= 7) {
      role = "安全工程师"
      score = Math.round(security * 10)
    } else {
      // Calculate overall competitiveness
      const allScores = Object.values(categoryAverages)
      const avgScore = allScores.reduce((sum, score) => sum + score, 0) / allScores.length
      score = Math.round(avgScore * 10)
    }

    return { role, score: Math.min(score, 95) } // Cap at 95 to maintain credibility
  }

  const currentCat = skillCategories[currentCategory]

  return (
    <div className="space-y-6">
      {/* Category Progress */}
      <Card className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">{currentCat.icon}</div>
            <div>
              <h2 className="text-xl font-bold text-neutral-950 dark:text-white">{currentCat.name}</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{currentCat.description}</p>
            </div>
          </div>
          <Badge className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700">
            {currentCategory + 1}/{skillCategories.length}
          </Badge>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-neutral-500 dark:text-neutral-400">当前分类进度</span>
            <span className="text-neutral-950 dark:text-white">{Math.round(getCurrentCategoryProgress())}%</span>
          </div>
          <Progress value={getCurrentCategoryProgress()} className="h-2" />
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-neutral-500 dark:text-neutral-400">总体评估进度</span>
            <span className="text-neutral-950 dark:text-white">{Math.round(getTotalProgress())}%</span>
          </div>
          <Progress value={getTotalProgress()} className="h-2" />
        </div>
      </Card>

      {/* Skill Rating */}
      <Card className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 p-6">
        <h3 className="text-lg font-semibold text-neutral-950 dark:text-white mb-6">请评估你在以下技能的熟练程度 (1-10分)</h3>

        <div className="space-y-6">
          {currentCat.skills.map((skill) => {
            const currentRating = userSkills[currentCat.id]?.[skill] || 5

            return (
              <div key={skill} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-950 dark:text-white font-medium">{skill}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">评分:</span>
                    <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 min-w-[2rem] text-center">{currentRating}</span>
                  </div>
                </div>

                {/* Simple button-based rating */}
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => handleSkillRating(currentCat.id, skill, rating)}
                      className={`w-8 h-8 rounded-full text-sm font-medium transition-all cursor-pointer ${
                        currentRating === rating
                          ? "bg-indigo-600 text-white"
                          : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>

                {/* Skill Level Description */}
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  {currentRating <= 3 && "初学阶段 - 基础概念了解"}
                  {currentRating > 3 && currentRating <= 6 && "进阶阶段 - 能够独立完成基本任务"}
                  {currentRating > 6 && currentRating <= 8 && "熟练阶段 - 能够解决复杂问题"}
                  {currentRating > 8 && "专家阶段 - 能够指导他人并优化系统"}
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentCategory(Math.max(0, currentCategory - 1))}
            disabled={currentCategory === 0 || isSaving}
            className="border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
          >
            上一步
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed() || isSaving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                {currentCategory === skillCategories.length - 1 ? "完成评估" : "下一步"}
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Category Navigation */}
      <Card className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {skillCategories.map((category, index) => {
            const isCompleted =
              userSkills[category.id] && Object.keys(userSkills[category.id]).length === category.skills.length
            const isCurrent = index === currentCategory

            return (
              <button
                key={category.id}
                onClick={() => setCurrentCategory(index)}
                className={`p-3 rounded-lg border transition-all text-left cursor-pointer ${
                  isCurrent
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                    : isCompleted
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                      : "border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600"
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <div
                    className={`p-1 rounded ${
                      isCurrent ? "text-indigo-600 dark:text-indigo-400" : isCompleted ? "text-emerald-600 dark:text-emerald-400" : "text-neutral-500 dark:text-neutral-400"
                    }`}
                  >
                    {category.icon}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isCurrent ? "text-indigo-600 dark:text-indigo-300" : isCompleted ? "text-emerald-600 dark:text-emerald-300" : "text-neutral-600 dark:text-neutral-300"
                    }`}
                  >
                    {category.name}
                  </span>
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  {userSkills[category.id] ? Object.keys(userSkills[category.id]).length : 0}/{category.skills.length}
                </div>
              </button>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
