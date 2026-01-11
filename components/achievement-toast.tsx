"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Share2 } from "lucide-react"

interface AchievementToastProps {
  message: string
  onClose: () => void
}

export function AchievementToast({ message, onClose }: AchievementToastProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300)
    }, 5000)

    return () => clearTimeout(timer)
  }, [onClose])

  const handleShare = () => {
    // Trigger share functionality
    const shareText = `${message} 在DevGrowth上学习真的很有成就感！`
    if (navigator.share) {
      navigator.share({
        title: "DevGrowth 成就解锁",
        text: shareText,
        url: "https://devgrowth.dev",
      })
    } else {
      navigator.clipboard.writeText(shareText)
      alert("成就内容已复制到剪贴板！")
    }
  }

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <Card className="bg-indigo-600 border-indigo-500 p-4 min-w-[320px] shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="text-white font-semibold mb-1">成就解锁！</div>
            <div className="text-indigo-100 text-sm">{message}</div>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose} className="text-white hover:bg-white/20 p-1 h-auto cursor-pointer">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex space-x-2 mt-3">
          <Button size="sm" onClick={handleShare} className="bg-white/20 hover:bg-white/30 text-white border-0 flex-1 cursor-pointer">
            <Share2 className="w-3 h-3 mr-1" />
            分享成就
          </Button>
        </div>
      </Card>
    </div>
  )
}
