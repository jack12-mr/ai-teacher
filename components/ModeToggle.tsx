"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { useT } from "@/lib/i18n"

export function ModeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const t = useT()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  // 避免 hydration 错误
  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="h-8 px-2 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        <Sun className="h-3.5 w-3.5" />
      </Button>
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      title={isDark ? t.theme.light : t.theme.dark}
      className="h-8 px-2 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
    >
      {isDark ? (
        <Sun className="h-3.5 w-3.5 text-yellow-500" />
      ) : (
        <Moon className="h-3.5 w-3.5 text-indigo-600" />
      )}
    </Button>
  )
}
