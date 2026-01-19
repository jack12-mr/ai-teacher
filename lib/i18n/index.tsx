/**
 * 国际化系统入口
 * - 国内版(CN): 默认中文，支持切换到英文
 * - 国际版(INTL): 默认英文，支持切换到中文
 */

"use client"

import { useState, useEffect, useContext, createContext, useCallback, type ReactNode } from "react"
import { isChinaRegion, getRegion } from "@/lib/config/region"
type DeploymentRegion = "CN" | "INTL"
import { zhCN, type Translations } from "./translations/zh-CN"
import { enUS } from "./translations/en-US"

const LANGUAGE_KEY = "app_language"
const LANGUAGE_SET_BY_USER_KEY = "app_language_user_set" // 标记用户是否手动设置过语言

type Language = "zh-CN" | "en-US"

/**
 * 获取带区域标记的用户设置标志
 * 格式: "true|CN" 或 "true|INTL"
 */
function getUserSetFlag(): string {
  return `true|${getRegion()}`
}

/**
 * 解析用户设置标志并提取区域
 */
function parseUserSetFlag(value: string | null): { isValid: boolean; region: DeploymentRegion | null } {
  if (!value || !value.startsWith('true|')) return { isValid: false, region: null }
  const region = value.split('|')[1]
  return {
    isValid: region === 'CN' || region === 'INTL',
    region: region as DeploymentRegion
  }
}

/**
 * 验证缓存语言是否与当前区域匹配
 */
function shouldUseCachedLanguage(userSetFlag: string | null): boolean {
  if (!userSetFlag) return false

  const { isValid, region: cachedRegion } = parseUserSetFlag(userSetFlag)
  const currentRegion = getRegion()

  return isValid && cachedRegion === currentRegion
}

/**
 * 清除过期的语言缓存
 */
function clearStaleLanguageCache(): void {
  localStorage.removeItem(LANGUAGE_KEY)
  localStorage.removeItem(LANGUAGE_SET_BY_USER_KEY)
}

interface I18nContextType {
  lang: Language
  t: Translations
  setLanguage: (lang: Language) => void
}

const I18nContext = createContext<I18nContextType | null>(null)

/**
 * 获取默认语言（用于 SSR）
 */
function getDefaultLanguage(): Language {
  return isChinaRegion() ? "zh-CN" : "en-US"
}

/**
 * 获取当前语言
 * 只有用户明确手动设置过语言时才读取 localStorage，否则根据区域返回默认语言
 */
export function getCurrentLanguage(): Language {
  if (typeof window !== "undefined") {
    const userSetFlag = localStorage.getItem(LANGUAGE_SET_BY_USER_KEY)

    // 检查缓存语言是否对当前区域有效
    if (shouldUseCachedLanguage(userSetFlag)) {
      const saved = localStorage.getItem(LANGUAGE_KEY)
      if (saved === "zh-CN" || saved === "en-US") return saved
    } else if (userSetFlag) {
      // 检测到过期缓存（区域变化），清除它
      clearStaleLanguageCache()
    }
  }
  // 默认：国内版中文，国际版英文
  return getDefaultLanguage()
}

/**
 * 获取翻译对象
 */
export function getTranslations(lang?: Language): Translations {
  const language = lang ?? getDefaultLanguage()
  return language === "zh-CN" ? zhCN : enUS
}

/**
 * I18n Provider 组件
 * 提供语言状态和切换功能
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const defaultLang = getDefaultLanguage()
  const [lang, setLangState] = useState<Language>(defaultLang)

  useEffect(() => {
    const userSetFlag = localStorage.getItem(LANGUAGE_SET_BY_USER_KEY)

    // 检查缓存语言是否对当前区域有效
    if (shouldUseCachedLanguage(userSetFlag)) {
      const saved = localStorage.getItem(LANGUAGE_KEY)
      if (saved === "zh-CN" || saved === "en-US") {
        setLangState(saved)
      }
    } else if (userSetFlag) {
      // 检测到过期缓存（区域变化），清除它
      clearStaleLanguageCache()
    }
  }, [])

  const setLanguage = useCallback((newLang: Language) => {
    localStorage.setItem(LANGUAGE_KEY, newLang)
    localStorage.setItem(LANGUAGE_SET_BY_USER_KEY, getUserSetFlag()) // 标记当前区域
    setLangState(newLang)
  }, [])

  const t = lang === "zh-CN" ? zhCN : enUS

  return (
    <I18nContext.Provider value={{ lang, t, setLanguage }}>
      {children}
    </I18nContext.Provider>
  )
}

/**
 * Hook: 获取翻译对象
 * 优先使用 Context，如果没有 Provider 则回退到旧逻辑
 */
export function useT(): Translations {
  const context = useContext(I18nContext)

  // 如果有 Provider，直接返回 context 中的翻译
  if (context) {
    return context.t
  }

  // 回退逻辑：没有 Provider 时使用 useState
  const defaultLang = getDefaultLanguage()
  const [lang, setLang] = useState<Language>(defaultLang)

  useEffect(() => {
    const userSetFlag = localStorage.getItem(LANGUAGE_SET_BY_USER_KEY)

    // 检查缓存语言是否对当前区域有效
    if (shouldUseCachedLanguage(userSetFlag)) {
      const saved = localStorage.getItem(LANGUAGE_KEY)
      if (saved === "zh-CN" || saved === "en-US") {
        setLang(saved)
      }
    } else if (userSetFlag) {
      // 检测到过期缓存（区域变化），清除它
      clearStaleLanguageCache()
    }

  }, [])

  return lang === "zh-CN" ? zhCN : enUS
}

/**
 * Hook: 获取完整的 i18n 上下文（包含切换语言功能）
 */
export function useI18n() {
  const context = useContext(I18nContext)

  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider")
  }

  return context
}

/**
 * 设置语言（兼容旧代码，但不再刷新页面）
 * @deprecated 推荐使用 useI18n().setLanguage
 */
export function setLanguage(lang: Language) {
  if (typeof window !== "undefined") {
    localStorage.setItem(LANGUAGE_KEY, lang)
    localStorage.setItem(LANGUAGE_SET_BY_USER_KEY, getUserSetFlag()) // 标记当前区域
    // 触发自定义事件通知语言变化
    window.dispatchEvent(new CustomEvent("languageChange", { detail: lang }))
  }
}

/**
 * 获取 HTML lang 属性值
 */
export function getHtmlLang(): string {
  return getCurrentLanguage() === "zh-CN" ? "zh-CN" : "en"
}

export { zhCN, enUS }
export type { Translations }
