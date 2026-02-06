"use client"

import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"
import { useI18n } from "@/lib/i18n"

export function LanguageSwitcher() {
  const { lang, setLanguage } = useI18n()

  const toggleLanguage = () => {
    setLanguage(lang === "zh-CN" ? "en-US" : "zh-CN")
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      title={lang === "zh-CN" ? "Switch to English" : "切换到中文"}
      className="cursor-pointer h-8 px-2 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
    >
      <Globe className="h-3.5 w-3.5 mr-1" />
      <span className="text-xs">
        {lang === "zh-CN" ? "EN" : "中"}
      </span>
    </Button>
  )
}
