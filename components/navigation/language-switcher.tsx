"use client"

import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"
import { getCurrentLanguage, setLanguage } from "@/lib/i18n"

export function LanguageSwitcher() {
  const currentLang = getCurrentLanguage()

  const toggleLanguage = () => {
    setLanguage(currentLang === "zh-CN" ? "en-US" : "zh-CN")
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      title={currentLang === "zh-CN" ? "Switch to English" : "切换到中文"}
      className="cursor-pointer h-9 px-3 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
    >
      <Globe className="h-4 w-4 mr-1.5" />
      <span className="text-sm">
        {currentLang === "zh-CN" ? "EN" : "中"}
      </span>
    </Button>
  )
}
