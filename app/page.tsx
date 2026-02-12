"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FileText, Brain, TrendingUp, PlayCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { useUserIntl } from "@/components/user-context-intl"
import { isChinaRegion } from "@/lib/config/region"
import { LanguageSwitcher } from "@/components/navigation/language-switcher"
import { ModeToggle } from "@/components/ModeToggle"
import { useT } from "@/lib/i18n"
import { RunbookVideoModal } from "@/components/runbook-video-modal"

export default function LandingPage() {
  const router = useRouter()
  const isChina = isChinaRegion()
  const t = useT()
  const [showRunbookVideoModal, setShowRunbookVideoModal] = useState(false)

  // Use the appropriate auth hook based on region
  const authChina = isChina ? useAuth() : { isAuthenticated: false, isLoading: false }
  const authIntl = !isChina ? useUserIntl() : { isAuthenticated: false, isLoading: false }

  const isAuthenticated = isChina ? authChina.isAuthenticated : authIntl.isAuthenticated
  const isLoading = isChina ? authChina.isLoading : authIntl.isLoading

  // Handle login button click
  const handleLogin = () => {
    // Always navigate to web login page, regardless of environment
    router.push("/login")
  }

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isLoading, isAuthenticated, router])

  // Show loading state while checking auth
  if (isLoading) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50 dark:from-black dark:to-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-black/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          <div className="text-xl md:text-2xl font-bold text-neutral-950 dark:text-white">
            {t.common.appName}
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <LanguageSwitcher />
            <ModeToggle />
            <Button
              variant="outline"
              onClick={() => setShowRunbookVideoModal(true)}
              className="border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-sm md:text-base px-3 py-2 md:px-4 md:py-3 min-h-[44px]"
            >
              <PlayCircle className="w-4 h-4 mr-1 md:mr-2" />
              {t.home.viewDemo}
            </Button>
            <Button
              onClick={handleLogin}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm md:text-base px-4 py-2 md:px-6 md:py-3 min-h-[44px]"
            >
              {t.common.login}/{t.common.register}
            </Button>
          </div>
        </div>
      </header>

      {/* Banner */}
      <section className="container mx-auto px-4 py-12 md:py-20 text-center">
        <h1 className="text-3xl md:text-5xl font-bold text-neutral-950 dark:text-white mb-4 md:mb-6">
          {t.common.appName}
        </h1>
        <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 mb-4 md:mb-8">
          {t.landing.subtitle}
        </p>
        <p className="text-base md:text-lg text-neutral-500 dark:text-neutral-500 mb-8 md:mb-12">
          {t.landing.description}
        </p>
        <Button
          onClick={handleLogin}
          size="lg"
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-base md:text-lg px-6 py-5 md:px-8 md:py-6 min-h-[48px]"
        >
          {t.landing.getStarted}
        </Button>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <Card className="p-6 border-neutral-200 dark:border-neutral-800">
            <FileText className="w-12 h-12 text-indigo-600 mb-4" />
            <h3 className="text-lg md:text-xl font-semibold text-neutral-950 dark:text-white mb-2">
              {t.landing.features.documentAnalysis.title}
            </h3>
            <p className="text-sm md:text-base text-neutral-600 dark:text-neutral-400">
              {t.landing.features.documentAnalysis.description}
            </p>
          </Card>

          <Card className="p-6 border-neutral-200 dark:border-neutral-800">
            <Brain className="w-12 h-12 text-indigo-600 mb-4" />
            <h3 className="text-lg md:text-xl font-semibold text-neutral-950 dark:text-white mb-2">
              {t.landing.features.aiQuestions.title}
            </h3>
            <p className="text-sm md:text-base text-neutral-600 dark:text-neutral-400">
              {t.landing.features.aiQuestions.description}
            </p>
          </Card>

          <Card className="p-6 border-neutral-200 dark:border-neutral-800">
            <TrendingUp className="w-12 h-12 text-indigo-600 mb-4" />
            <h3 className="text-lg md:text-xl font-semibold text-neutral-950 dark:text-white mb-2">
              {t.landing.features.personalizedLearning.title}
            </h3>
            <p className="text-sm md:text-base text-neutral-600 dark:text-neutral-400">
              {t.landing.features.personalizedLearning.description}
            </p>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-neutral-500 dark:text-neutral-500">
          <p dangerouslySetInnerHTML={{ __html: t.landing.footer.replace('|', '| <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" class="hover:underline">') + '</a>' }} />
        </div>
      </footer>

      {/* Runbook Video Modal */}
      <RunbookVideoModal
        isOpen={showRunbookVideoModal}
        onClose={() => setShowRunbookVideoModal(false)}
      />
    </div>
  )
}
