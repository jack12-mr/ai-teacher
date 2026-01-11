"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Users, Copy, Gift, Crown, Zap } from "lucide-react"

interface InviteModalProps {
  isOpen: boolean
  onClose: () => void
  onInviteSuccess: () => void
}

export function InviteModal({ isOpen, onClose, onInviteSuccess }: InviteModalProps) {
  const [inviteCode] = useState("ALEX2024")
  const [copied, setCopied] = useState(false)
  const [email, setEmail] = useState("")

  const inviteLink = `https://devgrowth.dev?invite=${inviteCode}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleEmailInvite = () => {
    if (email) {
      // Simulate sending invite
      setTimeout(() => {
        onInviteSuccess()
        setEmail("")
        alert("邀请已发送！")
      }, 1000)
    }
  }

  const rewards = [
    { count: 1, reward: "解锁专属皮肤", icon: <Gift className="w-4 h-4" />, unlocked: true },
    { count: 3, reward: "暗黑模式技能树", icon: <Crown className="w-4 h-4" />, unlocked: true },
    { count: 5, reward: "双倍经验加成", icon: <Zap className="w-4 h-4" />, unlocked: false },
    { count: 10, reward: "AI学习路径规划", icon: <Gift className="w-4 h-4" />, unlocked: false },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-950 dark:text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-neutral-950 dark:text-white">
            <Users className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
            邀请好友
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invite Benefits */}
          <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
            <h3 className="font-semibold text-neutral-950 dark:text-white mb-3">邀请奖励</h3>
            <div className="space-y-2">
              {rewards.map((reward, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-2 rounded ${
                    reward.unlocked ? "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800" : "bg-neutral-100 dark:bg-neutral-900"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`p-1 rounded ${reward.unlocked ? "text-emerald-600 dark:text-emerald-400" : "text-neutral-500 dark:text-neutral-400"}`}>
                      {reward.icon}
                    </div>
                    <span className="text-sm text-neutral-950 dark:text-white">{reward.reward}</span>
                  </div>
                  <Badge
                    className={`text-xs ${
                      reward.unlocked
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700"
                    }`}
                  >
                    {reward.count}人
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Invite Code */}
          <div className="space-y-3">
            <h3 className="font-semibold text-neutral-950 dark:text-white">专属邀请码</h3>
            <div className="flex space-x-2">
              <Input value={inviteCode} readOnly className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-950 dark:text-white" />
              <Button
                onClick={handleCopy}
                variant="outline"
                className="border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 bg-transparent cursor-pointer"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            {copied && <p className="text-sm text-emerald-600 dark:text-emerald-400">邀请码已复制！</p>}
          </div>

          {/* Invite Link */}
          <div className="space-y-3">
            <h3 className="font-semibold text-neutral-950 dark:text-white">邀请链接</h3>
            <div className="bg-neutral-100 dark:bg-neutral-900 rounded-lg p-3">
              <p className="text-sm text-neutral-600 dark:text-neutral-300 break-all">{inviteLink}</p>
            </div>
            <Button
              onClick={handleCopy}
              variant="outline"
              className="w-full border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 bg-transparent cursor-pointer"
            >
              <Copy className="w-4 h-4 mr-2" />
              {copied ? "已复制链接！" : "复制邀请链接"}
            </Button>
          </div>

          {/* Email Invite */}
          <div className="space-y-3">
            <h3 className="font-semibold text-neutral-950 dark:text-white">邮箱邀请</h3>
            <div className="flex space-x-2">
              <Input
                type="email"
                placeholder="输入好友邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-950 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500"
              />
              <Button
                onClick={handleEmailInvite}
                disabled={!email}
                className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
              >
                发送
              </Button>
            </div>
          </div>

          {/* Growth Tip */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              <strong>增长秘诀：</strong>邀请的好友越活跃，你获得的奖励越丰厚！一起学习，共同成长。
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
