"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Share2, Copy, Twitter, MessageCircle, Download } from "lucide-react"

interface UserProfile {
  id: string
  name: string
  role: string
  competitivenessScore: number
  isPremium: boolean
  assessmentProgress: number
  achievements: string[]
  weeklyRank: number
}

interface UserSkills {
  [category: string]: {
    [skill: string]: number
  }
}

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  userProfile: UserProfile
  userSkills: UserSkills
  onShareSuccess: () => void
}

export function ShareModal({ isOpen, onClose, userProfile, userSkills, onShareSuccess }: ShareModalProps) {
  const [copied, setCopied] = useState(false)

  const getTopSkills = () => {
    const allSkills: Array<{ skill: string; score: number; category: string }> = []

    Object.entries(userSkills).forEach(([category, skills]) => {
      Object.entries(skills).forEach(([skill, score]) => {
        allSkills.push({ skill, score, category })
      })
    })

    return allSkills.sort((a, b) => b.score - a.score).slice(0, 5)
  }

  const shareText = `🚀 我的开发者技能评估结果：

👨‍💻 角色定位：${userProfile.role}
📊 竞争力指数：${userProfile.competitivenessScore}/100
🏆 超越了${userProfile.competitivenessScore}%的同行
📈 本周排名：#${userProfile.weeklyRank}

💪 核心技能：
${getTopSkills()
  .map((skill) => `• ${skill.skill}: ${skill.score}/10`)
  .join("\n")}

想知道你的技能水平吗？来测试一下吧！`

  const inviteLink = `https://skillmap.dev?ref=${userProfile.id}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${inviteLink}`)
      setCopied(true)
      onShareSuccess()
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleTwitterShare = () => {
    const twitterText = `🚀 我在 @SkillMap 上的开发者评估：${userProfile.role}，竞争力指数 ${userProfile.competitivenessScore}/100！`
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodeURIComponent(inviteLink)}`
    window.open(twitterUrl, "_blank")
    onShareSuccess()
  }

  const handleWeChatShare = () => {
    handleCopy()
    alert("分享内容已复制到剪贴板，请粘贴到微信分享！")
  }

  const handleDownloadCard = () => {
    // In a real app, this would generate and download an image
    alert("竞争力报告卡片已生成！")
    onShareSuccess()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-950 dark:text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center text-neutral-950 dark:text-white">
            <Share2 className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
            分享你的技能评估结果
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Competitiveness Card Preview */}
          <Card className="bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 p-6">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto text-2xl font-bold text-white">
                {userProfile.name.charAt(0)}
              </div>

              <div>
                <h3 className="text-xl font-bold text-neutral-950 dark:text-white">{userProfile.name}</h3>
                <p className="text-indigo-600 dark:text-indigo-400">{userProfile.role}</p>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-neutral-950 dark:text-white">{userProfile.competitivenessScore}</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">竞争力指数</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-neutral-950 dark:text-white">#{userProfile.weeklyRank}</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">周排名</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-neutral-950 dark:text-white">{userProfile.competitivenessScore}%</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">超越用户</div>
                </div>
              </div>

              <div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">核心技能</div>
                <div className="flex flex-wrap gap-1 justify-center">
                  {getTopSkills()
                    .slice(0, 4)
                    .map((skill, index) => (
                      <Badge key={index} className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700 text-xs">
                        {skill.skill} {skill.score}/10
                      </Badge>
                    ))}
                </div>
              </div>

              <div className="text-xs text-neutral-500 dark:text-neutral-400 border-t border-neutral-200 dark:border-neutral-700 pt-3">
                SkillMap.dev - 发现你的技能优势
              </div>
            </div>
          </Card>

          {/* Share Text Preview */}
          <div className="bg-neutral-100 dark:bg-neutral-900 rounded-lg p-4">
            <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">分享内容预览:</div>
            <div className="text-sm text-neutral-600 dark:text-neutral-300 whitespace-pre-line max-h-32 overflow-y-auto">{shareText}</div>
          </div>

          {/* Share Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={handleTwitterShare} className="bg-blue-500 hover:bg-blue-600 text-white cursor-pointer">
              <Twitter className="w-4 h-4 mr-2" />
              Twitter
            </Button>
            <Button onClick={handleWeChatShare} className="bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer">
              <MessageCircle className="w-4 h-4 mr-2" />
              微信
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleCopy}
              variant="outline"
              className="border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 bg-transparent cursor-pointer"
            >
              <Copy className="w-4 h-4 mr-2" />
              {copied ? "已复制！" : "复制文本"}
            </Button>
            <Button
              onClick={handleDownloadCard}
              variant="outline"
              className="border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 bg-transparent cursor-pointer"
            >
              <Download className="w-4 h-4 mr-2" />
              下载卡片
            </Button>
          </div>

          {/* Viral Growth Incentive */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <h4 className="text-amber-700 dark:text-amber-300 font-semibold mb-2">分享奖励</h4>
            <div className="text-sm text-amber-600 dark:text-amber-300 space-y-1">
              <div>• 每次分享获得 +5 能量点</div>
              <div>• 好友通过你的链接注册，你获得Premium体验</div>
              <div>• 分享到3个平台解锁"影响力达人"徽章</div>
            </div>
          </div>

          {/* Growth Stats */}
          <div className="bg-neutral-100 dark:bg-neutral-900 rounded-lg p-4">
            <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">你的影响力数据:</div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-neutral-950 dark:text-white">12</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">总分享次数</div>
              </div>
              <div>
                <div className="text-lg font-bold text-neutral-950 dark:text-white">8</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">成功邀请</div>
              </div>
              <div>
                <div className="text-lg font-bold text-neutral-950 dark:text-white">156</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">影响力积分</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
