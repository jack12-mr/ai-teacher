"use client"

import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Crown, Check, Brain, Target, Calendar, Star } from "lucide-react"

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  onUpgradeSuccess: () => void
  currentRole: string
}

export function UpgradeModal({ isOpen, onClose, onUpgradeSuccess, currentRole }: UpgradeModalProps) {
  const router = useRouter()

  const handleUpgrade = () => {
    // Determine region and redirect to appropriate payment page
    const region = process.env.NEXT_PUBLIC_DEPLOYMENT_REGION || "INTL"

    if (region === "CN") {
      // Chinese region - redirect to Chinese payment page
      router.push("/payment")
    } else {
      // International region - redirect to international payment page (Stripe/PayPal)
      router.push("/payment/intl")
    }

    onClose()
  }

  const freeFeatures = ["多维度技能评估", "角色智能分类", "竞争力分析报告", "技能热力图", "基础学习建议"]

  const premiumFeatures = [
    "AI个性化学习路径生成",
    "每日学习计划制定",
    "实时进度追踪",
    "无限AI教练分析", // 新增
    "桌面学习行为监控", // 新增
    "专业学习效率报告", // 新增
    "专属学习资源推荐",
    "优先客服支持",
    "高级数据分析",
    "无限目标设定",
    "学习效果预测",
  ]

  const pricingPlans = [
    {
      name: "月度会员",
      price: "¥29",
      period: "/月",
      popular: false,
      savings: "",
    },
    {
      name: "季度会员",
      price: "¥69",
      period: "/季",
      popular: true,
      savings: "节省20%",
    },
    {
      name: "年度会员",
      price: "¥199",
      period: "/年",
      popular: false,
      savings: "节省43%",
    },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-950 dark:text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl text-neutral-950 dark:text-white">
            <Crown className="w-6 h-6 mr-2 text-amber-500" />
            升级到 SkillMap Premium
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Value Proposition */}
          <div className="text-center">
            <h3 className="text-xl font-semibold text-neutral-950 dark:text-white mb-2">解锁AI驱动的个性化学习体验</h3>
            <p className="text-neutral-500 dark:text-neutral-400">
              基于你的 <span className="text-indigo-600 dark:text-indigo-400 font-medium">{currentRole}</span> 评估结果，获得专属学习路径
            </p>
          </div>

          {/* Feature Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Free Plan */}
            <Card className="bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 p-6">
              <div className="text-center mb-4">
                <h4 className="text-lg font-semibold text-neutral-950 dark:text-white">免费版</h4>
                <div className="text-2xl font-bold text-neutral-600 dark:text-neutral-400 mt-2">¥0</div>
              </div>
              <div className="space-y-3">
                {freeFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center text-neutral-600 dark:text-neutral-300">
                    <Check className="w-4 h-4 mr-3 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Premium Plan */}
            <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-700 p-6 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 border-0">推荐</Badge>
              </div>
              <div className="text-center mb-4">
                <h4 className="text-lg font-semibold text-neutral-950 dark:text-white flex items-center justify-center">
                  <Crown className="w-4 h-4 mr-2 text-amber-500" />
                  Premium版
                </h4>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">起步价 ¥29</div>
              </div>
              <div className="space-y-3">
                {freeFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center text-neutral-600 dark:text-neutral-300">
                    <Check className="w-4 h-4 mr-3 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
                {premiumFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center text-neutral-950 dark:text-white">
                    <Star className="w-4 h-4 mr-3 text-amber-500" />
                    <span className="text-sm font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Premium Features Highlight */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 p-4">
              <div className="flex items-center mb-3">
                <Brain className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-neutral-950 dark:text-white font-semibold">AI路径生成</h4>
              </div>
              <p className="text-sm text-indigo-700 dark:text-indigo-300">基于你的技能评估和目标，AI生成个性化学习路径，精确到每日计划</p>
            </Card>

            <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 p-4">
              <div className="flex items-center mb-3">
                <Target className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-neutral-950 dark:text-white font-semibold">智能追踪</h4>
              </div>
              <p className="text-sm text-emerald-700 dark:text-emerald-300">实时监控学习进度，智能调整计划，确保高效达成学习目标</p>
            </Card>

            <Card className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 p-4">
              <div className="flex items-center mb-3">
                <Calendar className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                <h4 className="text-neutral-950 dark:text-white font-semibold">每日规划</h4>
              </div>
              <p className="text-sm text-purple-700 dark:text-purple-300">精确到30分钟的每日学习安排，最大化学习效率和时间利用</p>
            </Card>
            <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 p-4">
              <div className="flex items-center mb-3">
                <Brain className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-neutral-950 dark:text-white font-semibold">AI学习教练</h4>
              </div>
              <p className="text-sm text-emerald-700 dark:text-emerald-300">实时监控学习行为，AI分析学习效率，提供个性化改进建议</p>
            </Card>
          </div>

          {/* Pricing Options */}
          <div>
            <h4 className="text-lg font-semibold text-neutral-950 dark:text-white text-center mb-4">选择订阅计划</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pricingPlans.map((plan, index) => (
                <Card
                  key={index}
                  className={`p-4 cursor-pointer transition-all ${
                    plan.popular
                      ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-700 scale-105"
                      : "bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600"
                  }`}
                >
                  {plan.popular && (
                    <div className="text-center mb-2">
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">最受欢迎</Badge>
                    </div>
                  )}
                  <div className="text-center">
                    <h5 className="text-neutral-950 dark:text-white font-semibold">{plan.name}</h5>
                    <div className="flex items-baseline justify-center mt-2">
                      <span className="text-2xl font-bold text-neutral-950 dark:text-white">{plan.price}</span>
                      <span className="text-neutral-500 dark:text-neutral-400 ml-1">{plan.period}</span>
                    </div>
                    {plan.savings && <div className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">{plan.savings}</div>}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Social Proof */}
          <Card className="bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 p-4">
            <div className="text-center">
              <h4 className="text-neutral-950 dark:text-white font-semibold mb-2">已有 12,000+ 开发者选择Premium</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">94%</div>
                  <div className="text-neutral-500 dark:text-neutral-400">用户学习效率提升</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">3.2x</div>
                  <div className="text-neutral-500 dark:text-neutral-400">技能掌握速度</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">89%</div>
                  <div className="text-neutral-500 dark:text-neutral-400">成功达成学习目标</div>
                </div>
              </div>
            </div>
          </Card>

          {/* CTA */}
          <div className="text-center space-y-4">
            <Button
              onClick={handleUpgrade}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-8 py-3 text-lg cursor-pointer"
            >
              <Crown className="w-5 h-5 mr-2" />
              立即升级Premium
            </Button>
            <div className="text-sm text-neutral-500 dark:text-neutral-400">7天无理由退款保证 | 安全支付 | 专属客服支持</div>
          </div>

          {/* Limited Time Offer */}
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
            <h4 className="text-red-700 dark:text-red-300 font-semibold mb-2">限时优惠</h4>
            <p className="text-sm text-red-600 dark:text-red-300">
              新用户首月仅需 <span className="font-bold">¥19</span>，立省¥10！
              <br />
              优惠仅剩 <span className="font-bold text-amber-600 dark:text-amber-400">23小时47分钟</span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
