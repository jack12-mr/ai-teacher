"use client"

import type React from "react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Zap, Palette, Sparkles, Crown, Gift } from "lucide-react"

interface StoreItem {
  id: string
  name: string
  description: string
  cost: number
  type: "skin" | "boost" | "cosmetic" | "special"
  icon: React.ReactNode
  rarity: "common" | "rare" | "epic" | "legendary"
}

interface EnergyStoreProps {
  userEnergy: number
  onPurchase: (cost: number) => void
}

export function EnergyStore({ userEnergy, onPurchase }: EnergyStoreProps) {
  const storeItems: StoreItem[] = [
    {
      id: "dark-theme",
      name: "暗黑模式皮肤",
      description: "为技能树解锁酷炫的暗黑主题",
      cost: 30,
      type: "skin",
      icon: <Palette className="w-5 h-5" />,
      rarity: "rare",
    },
    {
      id: "progress-boost",
      name: "学习加速卡",
      description: "下次完成技能节点获得双倍经验",
      cost: 25,
      type: "boost",
      icon: <Sparkles className="w-5 h-5" />,
      rarity: "common",
    },
    {
      id: "premium-avatar",
      name: "专属头像框",
      description: "彰显你的学习成就",
      cost: 50,
      type: "cosmetic",
      icon: <Crown className="w-5 h-5" />,
      rarity: "epic",
    },
    {
      id: "ai-mentor",
      name: "AI学习导师",
      description: "获得个性化学习建议和路径规划",
      cost: 100,
      type: "special",
      icon: <Gift className="w-5 h-5" />,
      rarity: "legendary",
    },
  ]

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "from-gray-500 to-gray-600"
      case "rare":
        return "from-blue-500 to-blue-600"
      case "epic":
        return "from-purple-500 to-purple-600"
      case "legendary":
        return "from-yellow-500 to-orange-500"
      default:
        return "from-gray-500 to-gray-600"
    }
  }

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "border-gray-500/50"
      case "rare":
        return "border-blue-500/50"
      case "epic":
        return "border-purple-500/50"
      case "legendary":
        return "border-yellow-500/50"
      default:
        return "border-gray-500/50"
    }
  }

  const canAfford = (cost: number) => userEnergy >= cost

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-950 dark:text-white">能量商店</h2>
        <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2">
          <Zap className="w-4 h-4 text-amber-500 mr-2" />
          <span className="text-neutral-950 dark:text-white font-semibold">{userEnergy}</span>
          <span className="text-neutral-500 dark:text-neutral-400 ml-1">能量石</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {storeItems.map((item) => (
          <Card
            key={item.id}
            className={`bg-white dark:bg-neutral-950 ${getRarityBorder(item.rarity)} p-4 hover:scale-105 transition-all duration-300 cursor-pointer`}
          >
            <div className="space-y-4">
              {/* Item Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${getRarityColor(item.rarity)} text-white`}>
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-950 dark:text-white">{item.name}</h3>
                    <Badge className={`text-xs bg-gradient-to-r ${getRarityColor(item.rarity)} text-white border-0`}>
                      {item.rarity === "common" && "普通"}
                      {item.rarity === "rare" && "稀有"}
                      {item.rarity === "epic" && "史诗"}
                      {item.rarity === "legendary" && "传说"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-neutral-600 dark:text-neutral-300">{item.description}</p>

              {/* Purchase Section */}
              <div className="flex items-center justify-between">
                <div className="flex items-center text-amber-600 dark:text-amber-400">
                  <Zap className="w-4 h-4 mr-1" />
                  <span className="font-semibold">{item.cost}</span>
                </div>
                <Button
                  size="sm"
                  disabled={!canAfford(item.cost)}
                  onClick={() => onPurchase(item.cost)}
                  className={`${
                    canAfford(item.cost)
                      ? "bg-indigo-600 hover:bg-indigo-700"
                      : "bg-neutral-300 dark:bg-neutral-700 cursor-not-allowed"
                  } text-white border-0 cursor-pointer`}
                >
                  {canAfford(item.cost) ? "购买" : "能量不足"}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Energy Earning Tips */}
      <Card className="bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 p-4">
        <h3 className="text-lg font-semibold text-neutral-950 dark:text-white mb-3">获取能量石的方法</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center text-neutral-600 dark:text-neutral-300">
            <Sparkles className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400" />
            完成技能节点 +5
          </div>
          <div className="flex items-center text-neutral-600 dark:text-neutral-300">
            <Gift className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400" />
            完成每日任务 +5-15
          </div>
          <div className="flex items-center text-neutral-600 dark:text-neutral-300">
            <Crown className="w-4 h-4 mr-2 text-amber-600 dark:text-amber-400" />
            邀请好友 +10
          </div>
        </div>
      </Card>
    </div>
  )
}
