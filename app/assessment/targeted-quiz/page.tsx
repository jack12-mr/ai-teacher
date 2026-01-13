"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Loader2, ArrowLeft, Home, CheckCircle, AlertCircle } from "lucide-react"

import { AssessmentAnalysis } from "@/components/assessment/AssessmentAnalysis"
import { PersonalizedQuizIntro } from "@/components/assessment/PersonalizedQuizIntro"
import { QuizResults } from "@/components/assessment/QuizResults"
import { QuestionCard } from "@/components/exam/QuestionCard"
import { AnswerFeedback } from "@/components/exam/AnswerFeedback"

import type {
  AssessmentResult,
  TargetedQuestion,
  QuizAnswer,
  PerformanceAnalysis,
  STORAGE_KEYS
} from "@/lib/types/assessment"

type Phase = 'analysis' | 'intro' | 'loading' | 'quiz' | 'feedback' | 'results'

interface QuizState {
  questions: TargetedQuestion[]
  currentIndex: number
  answers: QuizAnswer[]
  startTime: string | null
  currentAnswer: {
    isCorrect: boolean
    userAnswer: number | number[] | string[]
    timeSpent: number
  } | null
}

export default function TargetedQuizPage() {
  const router = useRouter()

  // 阶段状态
  const [phase, setPhase] = useState<Phase>('analysis')

  // 评估数据
  const [assessmentData, setAssessmentData] = useState<AssessmentResult | null>(null)

  // 答题状态
  const [quizState, setQuizState] = useState<QuizState>({
    questions: [],
    currentIndex: 0,
    answers: [],
    startTime: null,
    currentAnswer: null
  })

  // 分析结果
  const [analysisResult, setAnalysisResult] = useState<PerformanceAnalysis | null>(null)

  // 加载状态
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [processingSteps, setProcessingSteps] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // 从 localStorage 加载评估数据
  useEffect(() => {
    const stored = localStorage.getItem('targetedAssessmentData')
    if (stored) {
      try {
        const data = JSON.parse(stored) as AssessmentResult
        setAssessmentData(data)
      } catch (e) {
        console.error('解析评估数据失败:', e)
        setError('评估数据加载失败，请重新进行评估')
      }
    } else {
      // 没有评估数据，返回首页
      setError('请先完成技能评估')
    }
  }, [])

  // 生成针对性题目
  const generateQuestions = useCallback(async () => {
    if (!assessmentData) return

    setIsLoading(true)
    setLoadingProgress(0)
    setProcessingSteps([])
    setPhase('loading')

    try {
      // 步骤1: 分析能力模型
      setProcessingSteps(['🔍 正在分析您的能力模型...'])
      setLoadingProgress(10)
      await new Promise(resolve => setTimeout(resolve, 400))

      // 分类维度
      const weakDimensions = assessmentData.dimensions
        .filter(d => d.score <= 4)
        .map(d => ({
          id: d.id,
          name: d.name,
          score: d.score,
          description: d.description
        }))

      const mediumDimensions = assessmentData.dimensions
        .filter(d => d.score > 4 && d.score < 7)
        .map(d => ({
          id: d.id,
          name: d.name,
          score: d.score,
          description: d.description
        }))

      const strongDimensions = assessmentData.dimensions
        .filter(d => d.score >= 7)
        .map(d => ({
          id: d.id,
          name: d.name,
          score: d.score,
          description: d.description
        }))

      // 步骤2: 显示分析结果
      const weakCount = weakDimensions.length
      const mediumCount = mediumDimensions.length
      const strongCount = strongDimensions.length

      setProcessingSteps(prev => [...prev, `✅ 已识别 ${weakCount} 个薄弱维度、${mediumCount} 个中等维度、${strongCount} 个优势维度`])
      setLoadingProgress(25)
      await new Promise(resolve => setTimeout(resolve, 400))

      // 步骤3: 提取关键知识点
      if (weakDimensions.length > 0) {
        setProcessingSteps(prev => [...prev, `📚 正在提取薄弱知识点：${weakDimensions.map(d => d.name).join('、')}`])
      }
      setLoadingProgress(35)
      await new Promise(resolve => setTimeout(resolve, 400))

      // 步骤4: 生成针对性题目
      setProcessingSteps(prev => [...prev, `🤖 AI 正在生成 10 道针对性题目...`])
      setLoadingProgress(45)

      // 模拟题目生成进度
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 75) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 2
        })
      }, 300)

      const response = await fetch('/api/exam/generate-targeted-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName: assessmentData.subjectName,
          weakDimensions,
          mediumDimensions,
          strongDimensions,
          count: 10
        })
      })

      clearInterval(progressInterval)
      setLoadingProgress(75)

      if (!response.ok) {
        throw new Error('生成题目失败')
      }

      const data = await response.json()

      if (!data.success || !data.questions || data.questions.length === 0) {
        throw new Error(data.error || '未能生成题目')
      }

      setProcessingSteps(prev => [...prev, `📝 已生成 ${data.questions.length} 道题目`])
      setLoadingProgress(85)
      await new Promise(resolve => setTimeout(resolve, 300))

      // 步骤5: 优化题目质量
      setProcessingSteps(prev => [...prev, '⚡ 正在优化题目难度分布...'])
      setLoadingProgress(95)
      await new Promise(resolve => setTimeout(resolve, 400))

      // 转换题目格式以兼容 QuestionCard
      const formattedQuestions: TargetedQuestion[] = data.questions.map((q: TargetedQuestion) => ({
        ...q,
        // 确保与 Question 类型兼容
        content: q.content,
        type: q.type || 'single'
      }))

      setQuizState({
        questions: formattedQuestions,
        currentIndex: 0,
        answers: [],
        startTime: new Date().toISOString(),
        currentAnswer: null
      })

      // 步骤6: 完成
      setProcessingSteps(prev => [...prev, `🎉 题目生成完成！共 ${formattedQuestions.length} 道精选题目`])
      setLoadingProgress(100)

      await new Promise(resolve => setTimeout(resolve, 500))
      setPhase('quiz')
      setIsLoading(false)

    } catch (error) {
      console.error('生成题目失败:', error)
      setProcessingSteps(prev => [...prev, '⚠️ 生成失败，请重试'])
      setLoadingProgress(100)
      setError(error instanceof Error ? error.message : '生成题目失败，请重试')

      await new Promise(resolve => setTimeout(resolve, 1500))
      setIsLoading(false)
      setPhase('intro')
    }
  }, [assessmentData])

  // 处理答题
  const handleAnswer = useCallback((answer: number | number[] | string[], timeSpent: number) => {
    const currentQuestion = quizState.questions[quizState.currentIndex]
    if (!currentQuestion) return

    // 判断是否正确
    let isCorrect = false
    if (currentQuestion.type === 'single' || !currentQuestion.type) {
      isCorrect = answer === currentQuestion.correctAnswer
    } else if (currentQuestion.type === 'multiple') {
      const userAns = (answer as number[]).sort()
      const correctAns = (currentQuestion.correctAnswer as number[]).sort()
      isCorrect = JSON.stringify(userAns) === JSON.stringify(correctAns)
    } else if (currentQuestion.type === 'fill') {
      const userAns = answer as string[]
      const correctAns = currentQuestion.correctAnswer as string[]
      isCorrect = userAns.every((ans, i) =>
        ans.trim().toLowerCase() === correctAns[i]?.trim().toLowerCase()
      )
    }

    // 记录答案
    const quizAnswer: QuizAnswer = {
      questionId: currentQuestion.id,
      dimensionId: currentQuestion.dimensionId,
      isCorrect,
      timeSpent,
      userAnswer: answer
    }

    setQuizState(prev => ({
      ...prev,
      answers: [...prev.answers, quizAnswer],
      currentAnswer: {
        isCorrect,
        userAnswer: answer,
        timeSpent
      }
    }))

    // 显示答案反馈
    setPhase('feedback')
  }, [quizState.questions, quizState.currentIndex])

  // 继续下一题
  const handleNextQuestion = useCallback(() => {
    const nextIndex = quizState.currentIndex + 1

    if (nextIndex >= quizState.questions.length) {
      // 答题完成，进行分析
      analyzePerformance()
    } else {
      setQuizState(prev => ({
        ...prev,
        currentIndex: nextIndex,
        currentAnswer: null
      }))
      setPhase('quiz')
    }
  }, [quizState.currentIndex, quizState.questions.length])

  // 分析答题表现
  const analyzePerformance = useCallback(async () => {
    if (!assessmentData) return

    setIsLoading(true)
    setLoadingMessage('正在分析您的答题表现...')

    try {
      // 按维度统计答题结果
      const dimensionResults: Record<string, { correct: number; total: number; avgTime: number; name: string }> = {}

      quizState.answers.forEach(answer => {
        const question = quizState.questions.find(q => q.id === answer.questionId)
        if (!question) return

        const dimId = question.dimensionId
        if (!dimensionResults[dimId]) {
          dimensionResults[dimId] = {
            correct: 0,
            total: 0,
            avgTime: 0,
            name: question.dimensionName
          }
        }

        dimensionResults[dimId].total += 1
        if (answer.isCorrect) {
          dimensionResults[dimId].correct += 1
        }
        dimensionResults[dimId].avgTime += answer.timeSpent
      })

      // 计算平均时间
      Object.values(dimensionResults).forEach(result => {
        result.avgTime = result.total > 0 ? Math.round(result.avgTime / result.total) : 0
      })

      // 转换为API需要的格式
      const quizResults = Object.entries(dimensionResults).map(([dimId, result]) => ({
        dimensionId: dimId,
        dimensionName: result.name,
        correct: result.correct,
        total: result.total,
        avgTime: result.avgTime
      }))

      const assessmentScores = assessmentData.dimensions.map(d => ({
        dimensionId: d.id,
        name: d.name,
        score: d.score
      }))

      // 计算总用时
      const totalTime = quizState.answers.reduce((sum, a) => sum + a.timeSpent, 0)

      const response = await fetch('/api/assessment/analyze-performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName: assessmentData.subjectName,
          assessmentScores,
          quizResults,
          totalTime
        })
      })

      if (!response.ok) {
        throw new Error('分析失败')
      }

      const data = await response.json()

      if (!data.success || !data.analysis) {
        throw new Error(data.error || '分析失败')
      }

      setAnalysisResult(data.analysis)
      setPhase('results')
      setIsLoading(false)

    } catch (error) {
      console.error('分析失败:', error)
      // 即使API失败，也显示本地计算的基础结果
      const correctCount = quizState.answers.filter(a => a.isCorrect).length
      const totalQuestions = quizState.answers.length
      const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0

      setAnalysisResult({
        overallAccuracy: accuracy,
        totalQuestions,
        correctCount,
        wrongCount: totalQuestions - correctCount,
        avgTimePerQuestion: Math.round(quizState.answers.reduce((sum, a) => sum + a.timeSpent, 0) / totalQuestions),
        dimensionBreakdown: [],
        passProbability: {
          score: Math.min(95, Math.max(10, accuracy)),
          level: accuracy >= 70 ? 'high' : accuracy >= 50 ? 'medium' : 'low',
          factors: {
            positive: accuracy >= 60 ? ['完成了全部练习题'] : [],
            negative: accuracy < 60 ? ['正确率偏低，需要加强练习'] : []
          }
        },
        recommendations: ['建议继续练习以巩固知识点'],
        grade: accuracy >= 95 ? 'S' : accuracy >= 85 ? 'A' : accuracy >= 70 ? 'B' : accuracy >= 60 ? 'C' : 'D'
      })
      setPhase('results')
      setIsLoading(false)
    }
  }, [assessmentData, quizState.answers, quizState.questions])

  // 重新开始
  const handleRestart = useCallback(() => {
    setQuizState({
      questions: [],
      currentIndex: 0,
      answers: [],
      startTime: null,
      currentAnswer: null
    })
    setAnalysisResult(null)
    setPhase('intro')
  }, [])

  // 返回首页
  const handleGoHome = useCallback(() => {
    localStorage.removeItem('targetedAssessmentData')
    router.push('/')
  }, [router])

  // 当前题目
  const currentQuestion = quizState.questions[quizState.currentIndex]

  // 错误状态
  if (error && !assessmentData) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
        <Card className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 p-8 max-w-md text-center">
          <p className="text-amber-600 dark:text-amber-400 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
          >
            返回首页
          </button>
        </Card>
      </div>
    )
  }

  // 加载中
  if (!assessmentData) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* 顶部导航 */}
      {phase !== 'results' && (
        <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <button
              onClick={handleGoHome}
              className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>返回</span>
            </button>
            <h1 className="text-lg font-semibold text-neutral-950 dark:text-white">
              {phase === 'analysis' && '能力分析'}
              {phase === 'intro' && '针对性练习'}
              {phase === 'loading' && '生成题目中'}
              {phase === 'quiz' && `第 ${quizState.currentIndex + 1} / ${quizState.questions.length} 题`}
              {phase === 'feedback' && '答题反馈'}
            </h1>
            <button
              onClick={handleGoHome}
              className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors cursor-pointer"
            >
              <Home className="w-5 h-5" />
            </button>
          </div>
        </header>
      )}

      {/* 主内容区 */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* 分析阶段 */}
        {phase === 'analysis' && (
          <AssessmentAnalysis
            assessmentData={assessmentData}
            onContinue={() => setPhase('intro')}
          />
        )}

        {/* 介绍阶段 */}
        {phase === 'intro' && (
          <PersonalizedQuizIntro
            subjectName={assessmentData.subjectName}
            weaknesses={assessmentData.weaknesses}
            questionCount={10}
            isLoading={isLoading}
            onStart={generateQuestions}
            onBack={() => setPhase('analysis')}
          />
        )}

        {/* 加载阶段 */}
        {phase === 'loading' && (
          <Card className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
              <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-950 dark:text-white mb-2">正在生成针对性题目</h2>
              <p className="text-neutral-500 dark:text-neutral-400 mb-8">
                AI 正在根据您的弱点生成专属练习题
              </p>

              <div className="max-w-md mx-auto">
                <Progress value={loadingProgress} className="h-2 mb-2" />
                <p className="text-sm text-neutral-500">{Math.min(100, Math.floor(loadingProgress))}%</p>
              </div>

              {/* 显示实时处理步骤 */}
              <div className="mt-8 space-y-3 text-left max-w-sm mx-auto">
                {processingSteps.length > 0 ? (
                  processingSteps.map((stepText, i) => (
                    <div key={i} className="flex items-center gap-3">
                      {stepText.includes('⚠️') ? (
                        <AlertCircle className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                      ) : i === processingSteps.length - 1 && loadingProgress < 100 ? (
                        <Loader2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      )}
                      <span className={stepText.includes('⚠️') ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                        {stepText}
                      </span>
                    </div>
                  ))
                ) : (
                  // 默认显示（如果没有步骤）
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
                    <span className="text-neutral-500 dark:text-neutral-400">正在初始化...</span>
                  </div>
                )}
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="mt-6 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* 答题阶段 */}
        {phase === 'quiz' && currentQuestion && (
          <div className="space-y-6">
            {/* 进度条 */}
            <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${((quizState.currentIndex) / quizState.questions.length) * 100}%` }}
              />
            </div>

            {/* 题目卡片 */}
            <QuestionCard
              question={{
                id: currentQuestion.id,
                type: currentQuestion.type,
                content: currentQuestion.content,
                options: currentQuestion.options,
                correctAnswer: currentQuestion.correctAnswer,
                explanation: currentQuestion.explanation,
                difficulty: currentQuestion.difficulty as 1 | 2 | 3 | 4 | 5,
                knowledgePoint: currentQuestion.knowledgePoint,
                category: currentQuestion.dimensionName
              }}
              questionNumber={quizState.currentIndex + 1}
              totalQuestions={quizState.questions.length}
              onAnswer={handleAnswer}
            />
          </div>
        )}

        {/* 答案反馈阶段 */}
        {phase === 'feedback' && currentQuestion && quizState.currentAnswer && (
          <div className="space-y-6">
            {/* 进度条 */}
            <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${((quizState.currentIndex + 1) / quizState.questions.length) * 100}%` }}
              />
            </div>

            <AnswerFeedback
              question={{
                id: currentQuestion.id,
                type: currentQuestion.type,
                content: currentQuestion.content,
                options: currentQuestion.options,
                correctAnswer: currentQuestion.correctAnswer,
                explanation: currentQuestion.explanation,
                difficulty: currentQuestion.difficulty as 1 | 2 | 3 | 4 | 5,
                knowledgePoint: currentQuestion.knowledgePoint,
                category: currentQuestion.dimensionName
              }}
              userAnswer={quizState.currentAnswer.userAnswer}
              isCorrect={quizState.currentAnswer.isCorrect}
              onNext={handleNextQuestion}
            />
          </div>
        )}

        {/* 结果阶段 */}
        {phase === 'results' && analysisResult && (
          <QuizResults
            subjectName={assessmentData.subjectName}
            analysis={analysisResult}
            maxCombo={0}
            onRestart={handleRestart}
            onGoHome={handleGoHome}
          />
        )}
      </main>
    </div>
  )
}
