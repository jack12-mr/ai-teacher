"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Target, Users, Crown, ArrowRight, Star } from "lucide-react"
import { useIsIOSApp } from "@/hooks/use-is-ios-app"

interface UserSkills {
  [category: string]: {
    [skill: string]: number
  }
}

interface RoleClassificationProps {
  userSkills: UserSkills
  role: string
  score: number
  onUpgrade: () => void
}

export function RoleClassification({ userSkills, role, score, onUpgrade }: RoleClassificationProps) {
  const isIOSApp = useIsIOSApp()

  const getSkillStrengths = () => {
    const strengths: Array<{ category: string; skill: string; score: number }> = []

    Object.entries(userSkills).forEach(([category, skills]) => {
      Object.entries(skills).forEach(([skill, score]) => {
        if (score >= 7) {
          strengths.push({ category, skill, score })
        }
      })
    })

    return strengths.sort((a, b) => b.score - a.score).slice(0, 5)
  }

  const getSkillGaps = () => {
    const gaps: Array<{ category: string; skill: string; score: number }> = []

    Object.entries(userSkills).forEach(([category, skills]) => {
      Object.entries(skills).forEach(([skill, score]) => {
        if (score < 6) {
          gaps.push({ category, skill, score })
        }
      })
    })

    return gaps.sort((a, b) => a.score - b.score).slice(0, 5)
  }

  const getRoleInsights = () => {
    const insights = {
      全栈工程师: {
        description: "你具备前后端开发的综合能力，是团队中的多面手",
        marketDemand: "极高",
        salaryRange: "25-50万",
        careerPath: ["技术专家", "架构师", "技术总监"],
        nextSteps: ["深化系统设计", "学习微服务架构", "提升团队协作"],
      },
      前端工程师: {
        description: "你在用户界面开发方面表现出色，注重用户体验",
        marketDemand: "很高",
        salaryRange: "20-40万",
        careerPath: ["高级前端", "前端架构师", "产品技术负责人"],
        nextSteps: ["掌握现代框架", "学习性能优化", "了解设计系统"],
      },
      后端工程师: {
        description: "你在服务端开发和系统架构方面有深厚功底",
        marketDemand: "很高",
        salaryRange: "22-45万",
        careerPath: ["高级后端", "系统架构师", "技术专家"],
        nextSteps: ["分布式系统", "高并发处理", "云原生技术"],
      },
      数据科学家: {
        description: "你具备数据分析和机器学习的专业技能",
        marketDemand: "极高",
        salaryRange: "30-60万",
        careerPath: ["资深数据科学家", "算法专家", "AI产品负责人"],
        nextSteps: ["深度学习进阶", "MLOps实践", "业务理解能力"],
      },
      DevOps工程师: {
        description: "你在系统运维和自动化部署方面经验丰富",
        marketDemand: "很高",
        salaryRange: "25-50万",
        careerPath: ["资深DevOps", "平台架构师", "基础设施专家"],
        nextSteps: ["云原生技术", "容器编排", "监控体系建设"],
      },
      安全工程师: {
        description: "你在网络安全和风险防控方面具备专业能力",
        marketDemand: "高",
        salaryRange: "28-55万",
        careerPath: ["安全专家", "安全架构师", "首席安全官"],
        nextSteps: ["威胁情报分析", "安全合规", "应急响应"],
      },
      通用开发者: {
        description: "你具备多方面的开发技能，有很大的成长潜力",
        marketDemand: "高",
        salaryRange: "18-35万",
        careerPath: ["专业化发展", "技术专家", "团队负责人"],
        nextSteps: ["选择专业方向", "深化核心技能", "积累项目经验"],
      },
    }

    return insights[role as keyof typeof insights] || insights["通用开发者"]
  }

  const strengths = getSkillStrengths()
  const gaps = getSkillGaps()
  const insights = getRoleInsights()

  return (
    <div className="space-y-6">
      {/* Role Header */}
      <Card className="bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-2xl font-bold text-white">
              {role.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-neutral-950 dark:text-white">{role}</h2>
              <p className="text-indigo-600 dark:text-indigo-300">{insights.description}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-neutral-950 dark:text-white">{score}</div>
            <div className="text-sm text-indigo-600 dark:text-indigo-300">竞争力指数</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-3 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center text-emerald-600 dark:text-emerald-400 mb-1">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span className="text-sm font-medium">市场需求</span>
            </div>
            <div className="text-neutral-950 dark:text-white font-semibold">{insights.marketDemand}</div>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-3 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center text-amber-600 dark:text-amber-400 mb-1">
              <Target className="w-4 h-4 mr-1" />
              <span className="text-sm font-medium">薪资范围</span>
            </div>
            <div className="text-neutral-950 dark:text-white font-semibold">{insights.salaryRange}</div>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-3 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center text-purple-600 dark:text-purple-400 mb-1">
              <Users className="w-4 h-4 mr-1" />
              <span className="text-sm font-medium">超越用户</span>
            </div>
            <div className="text-neutral-950 dark:text-white font-semibold">{score}%</div>
          </div>
        </div>
      </Card>

      {/* Skill Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <Card className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 p-6">
          <h3 className="text-lg font-semibold text-neutral-950 dark:text-white mb-4 flex items-center">
            <Star className="w-5 h-5 mr-2 text-amber-500" />
            技能优势
          </h3>
          <div className="space-y-3">
            {strengths.length > 0 ? (
              strengths.map((strength, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <div className="text-neutral-950 dark:text-white font-medium">{strength.skill}</div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">{strength.category}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress value={strength.score * 10} className="w-16 h-2" />
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{strength.score}/10</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-neutral-500 dark:text-neutral-400 text-center py-4">继续提升技能以发现你的优势领域</div>
            )}
          </div>
        </Card>

        {/* Skill Gaps */}
        <Card className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 p-6">
          <h3 className="text-lg font-semibold text-neutral-950 dark:text-white mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-orange-500" />
            提升空间
          </h3>
          <div className="space-y-3">
            {gaps.length > 0 ? (
              gaps.map((gap, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <div className="text-neutral-950 dark:text-white font-medium">{gap.skill}</div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">{gap.category}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress value={gap.score * 10} className="w-16 h-2" />
                    <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{gap.score}/10</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-neutral-500 dark:text-neutral-400 text-center py-4">你的技能水平很均衡！</div>
            )}
          </div>
        </Card>
      </div>

      {/* Career Path */}
      <Card className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 p-6">
        <h3 className="text-lg font-semibold text-neutral-950 dark:text-white mb-4">职业发展路径</h3>
        <div className="flex items-center space-x-4 mb-6 overflow-x-auto">
          {insights.careerPath.map((step, index) => (
            <div key={index} className="flex items-center flex-shrink-0">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap">
                {step}
              </div>
              {index < insights.careerPath.length - 1 && <ArrowRight className="w-4 h-4 text-neutral-400 dark:text-neutral-500 mx-2" />}
            </div>
          ))}
        </div>

        <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <h4 className="text-neutral-950 dark:text-white font-semibold mb-2">下一步建议</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {insights.nextSteps.map((step, index) => (
              <Badge key={index} className="bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 border-purple-200 dark:border-purple-700 justify-center py-2">
                {step}
              </Badge>
            ))}
          </div>
        </div>
      </Card>

      {/* Upgrade CTA */}
      {!isIOSApp && (
        <Card className="bg-gradient-to-r from-amber-500 to-orange-500 border-0 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-2 flex items-center">
                <Crown className="w-5 h-5 mr-2 text-white" />
                解锁个性化学习路径
              </h3>
              <p className="text-white/90 mb-4">基于你的技能评估结果，AI将为你生成专属的学习计划和职业发展建议</p>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-white/20 text-white border-white/30">AI路径规划</Badge>
                <Badge className="bg-white/20 text-white border-white/30">每日学习计划</Badge>
                <Badge className="bg-white/20 text-white border-white/30">进度追踪</Badge>
                <Badge className="bg-white/20 text-white border-white/30">目标导向</Badge>
              </div>
            </div>
            <Button
              onClick={onUpgrade}
              className="bg-white text-amber-700 hover:bg-white/90 font-semibold px-8 shadow-lg cursor-pointer"
            >
              立即升级
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
