"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  FileText,
  Globe,
  Loader2,
  CheckCircle,
  Sparkles,
  Target,
  BookOpen,
  AlertCircle,
  ExternalLink
} from "lucide-react"
import { getExamPresets } from "@/lib/exam-mock-data"
import { parseFile, validateFile, MAX_FILE_SIZE } from "@/lib/file-parser"
import { parseFileEnhanced, validateFileEnhanced } from "@/lib/file-parser-enhanced"
import { useT } from "@/lib/i18n"
import { isChinaRegion } from "@/lib/config/region"
import { AiRequirementAgent } from "@/components/exam/AiRequirementAgent"
import { DocumentAiAgent } from "@/components/exam/DocumentAiAgent"
import { Requirement } from "@/lib/requirement-parser"

type Step = 'goal' | 'source' | 'config' | 'processing' | 'ready' | 'document-chat'
type SourceType = 'upload' | 'search' | null
type Mode = 'traditional' | 'ai-guide'

// 联网搜索结果类型
interface SyllabusData {
  examInfo?: {
    name: string
    officialWebsite?: string
    examTime?: string
    totalScore?: string
    duration?: string
  }
  syllabus?: Array<{
    chapter: string
    weight: string
    keyPoints: string[]
    questionTypes?: string[]
  }>
  questionDistribution?: Record<string, string>
  preparationTips?: string[]
  recentChanges?: string
  searchSources?: string[]
  rawContent?: string
}

// 内部组件,处理搜索参数
function ExamSetupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useT()

  // 从 URL 参数获取初始 step
  const getInitialStep = (): Step => {
    const stepParam = searchParams.get('step')
    if (stepParam && ['goal', 'source', 'config', 'processing', 'ready'].includes(stepParam)) {
      return stepParam as Step
    }
    return 'goal'
  }

  // 从 URL 参数获取来源类型（用于判断从哪个入口进入）
  const getInitialSourceType = (): SourceType => {
    const sourceParam = searchParams.get('source')
    if (sourceParam === 'upload') return 'upload'
    if (sourceParam === 'search') return 'search'
    return null
  }

  // 判断是否应该只显示单一选项（从主页特定入口进入）
  const sourceFromMainPage = searchParams.get('source') // 'upload' 或 'search'

  const [step, setStep] = useState<Step>(getInitialStep())
  const [examName, setExamName] = useState('')
  const [sourceType, setSourceType] = useState<SourceType>(getInitialSourceType())
  const [processingProgress, setProcessingProgress] = useState(0)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [mode, setMode] = useState<Mode>('traditional')

  // 出题数量和文件错误状态
  const [questionCount, setQuestionCount] = useState(5)
  const [fileError, setFileError] = useState<string | null>(null)
  const [showCustomCount, setShowCustomCount] = useState(false)
  const [customQuestionCount, setCustomQuestionCount] = useState('')

  // 联网搜索状态
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [syllabusData, setSyllabusData] = useState<SyllabusData | null>(null)
  const [processingSteps, setProcessingSteps] = useState<string[]>([])

  // 拖拽上传状态
  const [isDragOver, setIsDragOver] = useState(false)

  // 文档内容状态（用于AI对话）
  const [parsedDocumentContent, setParsedDocumentContent] = useState<string>('')

  // 获取考试类型
  const getExamType = (name: string): string => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes('考研') || lowerName.includes('研究生')) return 'postgraduate'
    if (lowerName.includes('四级') || lowerName.includes('cet4') || lowerName.includes('cet-4')) return 'cet4'
    if (lowerName.includes('六级') || lowerName.includes('cet6') || lowerName.includes('cet-6')) return 'cet6'
    if (lowerName.includes('公务员') || lowerName.includes('国考') || lowerName.includes('省考')) return 'civilService'
    return 'default'
  }

  // 处理AI明确需求按钮
  const handleAiClarify = async () => {
    if (!uploadedFile) return

    try {
      setProcessingProgress(10)
      const parseResult = await parseFileEnhanced(uploadedFile)

      if (!parseResult.success || !parseResult.text) {
        setFileError(parseResult.error || '文件解析失败')
        return
      }

      // 保存解析的文档内容
      setParsedDocumentContent(parseResult.text)

      // 进入文档AI对话步骤
      setStep('document-chat')
    } catch (error) {
      console.error('文件解析失败:', error)
      setFileError('文件解析失败，请重试')
    }
  }

  // 处理下一步
  const handleNext = async () => {
    if (step === 'goal' && examName) {
      setStep('source')
    } else if (step === 'source' && sourceType) {
      if (sourceType === 'search') {
        // 真实联网搜索
        setStep('processing')
        performWebSearch()
      } else if (sourceType === 'upload' && uploadedFile) {
        // 文件上传：如果已选择题目数量，直接生成；否则进入AI对话
        try {
          setProcessingProgress(10)
          const parseResult = await parseFileEnhanced(uploadedFile)

          if (!parseResult.success || !parseResult.text) {
            setFileError(parseResult.error || '文件解析失败')
            return
          }

          // 保存解析的文档内容
          setParsedDocumentContent(parseResult.text)

          // 如果用户已选择题目数量，直接进入处理步骤
          if (questionCount > 0) {
            setStep('processing')
            processUploadedFile()
          } else {
            // 否则进入文档AI对话步骤
            setStep('document-chat')
          }
        } catch (error) {
          console.error('文件解析失败:', error)
          setFileError('文件解析失败，请重试')
        }
      }
    }
  }

  // 真实联网搜索
  const performWebSearch = async () => {
    setIsSearching(true)
    setSearchError(null)
    setProcessingProgress(0)
    setProcessingSteps([])

    // 清除之前上传文件生成的题目缓存，确保使用 AI 联网出题
    localStorage.removeItem('generatedQuestions')
    localStorage.removeItem('generatedExamName')

    const examType = getExamType(examName)

    // 模拟搜索过程的动态日志
    const simulateSearchLogs = async () => {
      const year = new Date().getFullYear()
      const searchLogs = [
        t.examSetup.searchingMaterials.replace('{examName}', examName),
        t.examSetup.connectedToKnowledge,
        t.examSetup.foundSyllabus.replace('{year}', year.toString()).replace('{examName}', examName),
        t.examSetup.foundPastPapers.replace('{examName}', examName),
        t.examSetup.readingDocuments.replace('{count}', '3'),
      ]

      for (let i = 0; i < searchLogs.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 600))
        setProcessingSteps(prev => [...prev, searchLogs[i]])
        setProcessingProgress(prev => Math.min(prev + 4, 25))
      }
    }

    try {
      // 步骤1: 开始搜索（同时显示模拟日志）
      setProcessingSteps([t.examSetup.searchingExamSyllabus.replace('{examName}', examName)])
      setProcessingProgress(5)

      // 并行执行：真实搜索 + 模拟日志动画
      const [searchResponse] = await Promise.all([
        fetch('/api/exam/search-syllabus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            examType,
            examName
          })
        }),
        simulateSearchLogs()
      ])

      // 步骤2: 解析搜索结果
      setProcessingSteps(prev => [...prev, t.examSetup.parsingSearchResults])
      setProcessingProgress(30)
      await new Promise(resolve => setTimeout(resolve, 300))

      let syllabusInfo = null
      if (searchResponse.ok) {
        const searchData = await searchResponse.json()
        syllabusInfo = searchData.data
        setSyllabusData(syllabusInfo)
        localStorage.setItem('examSyllabus', JSON.stringify(syllabusInfo))

        // 显示搜索到的章节信息
        if (syllabusInfo?.syllabus?.length > 0) {
          const chapterCount = syllabusInfo.syllabus.length
          setProcessingSteps(prev => [...prev, t.examSetup.obtainedChapters.replace('{count}', chapterCount.toString())])
          await new Promise(resolve => setTimeout(resolve, 400))
        }

        if (syllabusInfo?.examInfo?.name) {
          setProcessingSteps(prev => [...prev, t.examSetup.successfullyParsed.replace('{name}', syllabusInfo.examInfo.name)])
          await new Promise(resolve => setTimeout(resolve, 300))
        }
      }

      setProcessingProgress(40)

      // 步骤3: 调用 AI 生成题目（核心步骤）
      setProcessingSteps(prev => [...prev, t.examSetup.aiGeneratingQuestions.replace('{count}', questionCount.toString())])
      setProcessingProgress(45)

      // 模拟出题进度
      const questionProgressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 70) {
            clearInterval(questionProgressInterval)
            return prev
          }
          return prev + 2
        })
      }, 500)

      const generateResponse = await fetch('/api/exam/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examType,
          examName,
          syllabus: syllabusInfo?.syllabus || null,
          count: questionCount
        })
      })

      clearInterval(questionProgressInterval)
      setProcessingProgress(70)

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json()
        throw new Error(errorData.error || 'AI 生成题目失败')
      }

      const generateData = await generateResponse.json()

      if (!generateData.questions || generateData.questions.length === 0) {
        throw new Error('AI 返回的题目为空')
      }

      setProcessingSteps(prev => [...prev, t.examSetup.generatedQuestions.replace('{count}', generateData.questions.length.toString())])
      await new Promise(resolve => setTimeout(resolve, 300))

      // 步骤4: 格式化并保存题目
      setProcessingSteps(prev => [...prev, t.examSetup.optimizingQuestions])
      setProcessingProgress(85)

      // 转换题目格式
      const formattedQuestions = generateData.questions.map((q: {
        id: string
        type?: string
        question?: string
        content?: string
        options?: string[]
        correctAnswer: number | number[] | string[]
        explanation: string
        difficulty: number
        knowledgePoint: string
        category?: string
        blanksCount?: number
      }) => ({
        id: q.id,
        type: (q.type as 'single' | 'multiple' | 'fill') || 'single',
        content: q.content || q.question || '题目加载失败',
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: Math.min(5, Math.max(1, q.difficulty)) as 1 | 2 | 3 | 4 | 5,
        knowledgePoint: q.knowledgePoint,
        category: q.category,
        blanksCount: q.blanksCount
      }))

      // 保存生成的题目到 localStorage
      localStorage.setItem('generatedQuestions', JSON.stringify(formattedQuestions))
      localStorage.setItem('generatedExamName', examName)

      // 步骤5: 完成
      setProcessingSteps(prev => [...prev, t.examSetup.generationCompleteWithCount.replace('{count}', formattedQuestions.length.toString())])
      setProcessingProgress(100)

      await new Promise(resolve => setTimeout(resolve, 500))
      setStep('ready')

    } catch (error) {
      console.error('联网搜索出题失败:', error)
      setSearchError(error instanceof Error ? error.message : '联网搜索出题失败，请稍后重试')

      // 搜索失败，返回上一步让用户重试
      setProcessingSteps(prev => [...prev, t.examSetup.generationFailed])
      setProcessingProgress(100)

      await new Promise(resolve => setTimeout(resolve, 1500))
      setStep('source')

    } finally {
      setIsSearching(false)
    }
  }

  // 真实文件处理（替换 simulateProcessing）
  const processUploadedFile = async () => {
    if (!uploadedFile) return

    setProcessingProgress(0)
    setProcessingSteps([])
    setSearchError(null)

    // 清除之前的题目缓存，确保使用新上传文件生成的题目
    localStorage.removeItem('generatedQuestions')
    localStorage.removeItem('generatedExamName')
    localStorage.removeItem('examSyllabus')

    try {
      // 步骤1: 解析文件
      setProcessingSteps([t.examSetup.parsingDocument.replace('{fileName}', uploadedFile.name)])
      setProcessingProgress(10)
      await new Promise(resolve => setTimeout(resolve, 300))

      const parseResult = await parseFileEnhanced(uploadedFile)

      if (!parseResult.success) {
        throw new Error(parseResult.error || '文件解析失败')
      }

      setProcessingSteps(prev => [...prev, t.examSetup.documentParsedSuccess])
      setProcessingProgress(25)
      await new Promise(resolve => setTimeout(resolve, 300))

      // 步骤2: 提取知识点
      setProcessingSteps(prev => [...prev, t.examSetup.extractingKnowledge])
      setProcessingProgress(35)

      // 显示文档内容摘要
      const textLength = parseResult.text?.length || 0
      const wordCount = Math.floor(textLength / 2)
      setProcessingSteps(prev => [...prev, t.examSetup.extractedContent.replace('{wordCount}', wordCount > 1000 ? Math.floor(wordCount / 1000) + 'k+' : wordCount.toString())])
      await new Promise(resolve => setTimeout(resolve, 400))

      // 步骤3: 调用 AI 生成题目
      setProcessingSteps(prev => [...prev, t.examSetup.aiGeneratingFromDoc.replace('{count}', questionCount.toString())])
      setProcessingProgress(50)

      // 模拟出题进度
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 75) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 2
        })
      }, 400)

      const response = await fetch('/api/exam/generate-from-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentContent: parseResult.text,
          examName: examName,
          count: questionCount
        })
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API 错误响应:', errorData)

        // 检查是否是 API Key 问题
        if (response.status === 401 || response.status === 403) {
          throw new Error('API Key 未配置或无效，请检查 .env.local 文件')
        }

        throw new Error(errorData.error || 'AI 生成题目失败')
      }

      const data = await response.json()
      console.log('API 返回数据:', data)

      if (!data.success || !data.questions || data.questions.length === 0) {
        console.error('题目数据无效:', data)
        throw new Error(data.error || 'AI 返回的题目为空，请检查 API 配置')
      }

      setProcessingSteps(prev => [...prev, t.examSetup.generatedQuestions.replace('{count}', data.questions.length.toString())])
      setProcessingProgress(80)
      await new Promise(resolve => setTimeout(resolve, 300))

      // 步骤4: 保存题目
      setProcessingSteps(prev => [...prev, t.examSetup.optimizingQuestions])
      setProcessingProgress(90)

      // 保存生成的题目到 localStorage
      console.log('保存题目到 localStorage:', data.questions.length, '题')
      localStorage.setItem('generatedQuestions', JSON.stringify(data.questions))
      localStorage.setItem('generatedExamName', examName)

      await new Promise(resolve => setTimeout(resolve, 400))

      // 步骤5: 完成
      setProcessingSteps(prev => [...prev, t.examSetup.generationCompleteWithCount.replace('{count}', data.questions.length.toString())])
      setProcessingProgress(100)

      await new Promise(resolve => setTimeout(resolve, 500))
      setStep('ready')

    } catch (error) {
      console.error('文件处理失败:', error)
      const errorMessage = error instanceof Error ? error.message : '文件处理失败，请稍后重试'
      setSearchError(errorMessage)

      // 文件解析失败，返回上一步让用户重新上传
      setProcessingSteps(prev => [...prev, t.examSetup.processingFailed])
      setProcessingProgress(100)

      await new Promise(resolve => setTimeout(resolve, 1500))

      // 重置状态并返回 source 步骤
      setUploadedFile(null)
      setSourceType('upload')
      setFileError(errorMessage)
      setStep('source')
    }
  }

  // 模拟处理过程（文档上传）- 已废弃，保留以防万一
  const simulateProcessing = () => {
    setProcessingProgress(0)
    setProcessingSteps([])

    const steps = [
      '正在解析文档内容...',
      '正在提取核心知识点...',
      '正在生成分级题库...',
      '正在优化题目质量...',
      '题库生成完成！'
    ]

    let currentStep = 0
    const interval = setInterval(() => {
      setProcessingProgress(prev => {
        const newProgress = prev + Math.random() * 15
        if (newProgress >= 100) {
          clearInterval(interval)
          setStep('ready')
          return 100
        }

        // 更新步骤
        const stepIndex = Math.floor((newProgress / 100) * steps.length)
        if (stepIndex > currentStep && stepIndex < steps.length) {
          currentStep = stepIndex
          setProcessingSteps(steps.slice(0, stepIndex + 1))
        }

        return newProgress
      })
    }, 300)
  }

  // 处理文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
      // 清空 input
      e.target.value = ''
    }
  }

  // 处理文件验证和设置（抽取公共逻辑）
  const processFile = (file: File) => {
    // 验证文件
    const validation = validateFile(file)
    if (!validation.valid) {
      setFileError(validation.error || '文件验证失败')
      setUploadedFile(null)
      setSourceType(null)
      return
    }

    setFileError(null)
    setUploadedFile(file)
    setSourceType('upload')
  }

  // 拖拽事件处理
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // 只有当离开整个拖拽区域时才设置为 false
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setIsDragOver(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      processFile(file)
    }
  }

  // 开始刷题
  const handleStartPractice = () => {
    // 保存考试信息到 localStorage
    localStorage.setItem('currentExam', JSON.stringify({
      examName,
      sourceType,
      questionCount,
      hasSyllabus: !!syllabusData
    }))

    // 重置答题进度（新题库从第一题开始）
    localStorage.setItem('examCurrentIndex', '0')

    router.push('/exam/practice')
  }

  // 处理 AI 引导模式的开始出题
  const handleAiStartGeneration = async (requirements: Requirement[]) => {
    try {
      console.log('=== 开始出题 DEBUG ===')
      console.log('1. Requirements:', requirements)
      console.log('2. Requirements JSON:', JSON.stringify(requirements, null, 2))

      requirements.forEach((req, index) => {
        console.log(`3. Requirement[${index}]:`, 'category=', req.category, 'value=', req.value)
      })

      // 将需求转换为考试名称和参数
      let subjectReq = requirements.find(r => r.category === '科目')
      console.log('4. 找到的科目要求:', subjectReq)

      // Fallback: try to extract subject from requirement values
      if (!subjectReq) {
        console.log('5. 科目未找到，尝试fallback逻辑')
        const subjectKeywords = ['英语', '数学', '语文', '物理', '化学', '生物', '历史', '地理', '政治']
        const possibleSubject = requirements.find(r =>
          subjectKeywords.some(keyword => r.value.includes(keyword))
        )
        console.log('6. Fallback找到的科目:', possibleSubject)

        if (possibleSubject) {
          // Extract the subject keyword from the value
          const subject = subjectKeywords.find(keyword => possibleSubject.value.includes(keyword))
          subjectReq = { category: '科目', value: subject || possibleSubject.value }
          console.log('7. 提取的科目:', subjectReq)
        }
      }

      if (!subjectReq) {
        console.error('8. ❌ 缺少科目要求，当前requirements:', requirements)
        alert('请先选择科目（如：英语、数学等）')
        return
      }

      console.log('9. ✅ 科目验证通过，继续执行')
      const examNameFromReq = subjectReq.value
      const countReq = requirements.find(r => r.category === '数量')
      const count = countReq ? parseInt(countReq.value) : 5

      console.log('10. examName:', examNameFromReq, 'count:', count)

      setExamName(examNameFromReq)
      setQuestionCount(count)
      setSourceType('search')
      console.log('11. 切换到传统模式并设置 step=processing')
      setMode('traditional')
      setStep('processing')

      console.log('12. 调用 performWebSearchWithRequirements')
      // 调用搜索和生成题目
      await performWebSearchWithRequirements(examNameFromReq, count, requirements)
      console.log('13. ✅ 完成')
    } catch (error) {
      console.error('❌ handleAiStartGeneration 错误:', error)
      alert(`出题失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 带需求参数的联网搜索
  const performWebSearchWithRequirements = async (name: string, count: number, requirements: Requirement[]) => {
    setIsSearching(true)
    setSearchError(null)
    setProcessingProgress(0)
    setProcessingSteps([])

    localStorage.removeItem('generatedQuestions')
    localStorage.removeItem('generatedExamName')

    const examType = getExamType(name)

    try {
      setProcessingSteps([t.examSetup.searchingExamSyllabus.replace('{examName}', name)])
      setProcessingProgress(5)

      const searchResponse = await fetch('/api/exam/search-syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examType,
          examName: name,
          requirements: requirements.map(r => `${r.category}=${r.value}`).join(', ')
        })
      })

      setProcessingProgress(30)

      let syllabusInfo = null
      if (searchResponse.ok) {
        const searchData = await searchResponse.json()
        syllabusInfo = searchData.data
        setSyllabusData(syllabusInfo)
        localStorage.setItem('examSyllabus', JSON.stringify(syllabusInfo))
      }

      setProcessingProgress(40)
      setProcessingSteps(prev => [...prev, t.examSetup.aiGeneratingQuestions.replace('{count}', count.toString())])

      const generateResponse = await fetch('/api/exam/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examType,
          examName: name,
          syllabus: syllabusInfo?.syllabus || null,
          count,
          requirements: requirements.map(r => `${r.category}=${r.value}`).join(', ')
        })
      })

      setProcessingProgress(70)

      if (!generateResponse.ok) {
        throw new Error('AI 生成题目失败')
      }

      const generateData = await generateResponse.json()

      if (!generateData.questions || generateData.questions.length === 0) {
        throw new Error('AI 返回的题目为空')
      }

      const formattedQuestions = generateData.questions.map((q: any) => ({
        id: q.id,
        type: (q.type as 'single' | 'multiple' | 'fill') || 'single',
        content: q.content || q.question || '题目加载失败',
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: Math.min(5, Math.max(1, q.difficulty)) as 1 | 2 | 3 | 4 | 5,
        knowledgePoint: q.knowledgePoint,
        category: q.category,
        blanksCount: q.blanksCount
      }))

      localStorage.setItem('generatedQuestions', JSON.stringify(formattedQuestions))
      localStorage.setItem('generatedExamName', name)

      setProcessingSteps(prev => [...prev, `🎉 题库生成完成！共 ${formattedQuestions.length} 道精选题目`])
      setProcessingProgress(100)

      await new Promise(resolve => setTimeout(resolve, 500))
      setStep('ready')

    } catch (error) {
      console.error('联网搜索出题失败:', error)
      setSearchError(error instanceof Error ? error.message : '联网搜索出题失败，请稍后重试')
      setProcessingSteps(prev => [...prev, '⚠️ 出题失败，请重试'])
      setProcessingProgress(100)
      await new Promise(resolve => setTimeout(resolve, 1500))
      setMode('traditional')
      setStep('source')
    } finally {
      setIsSearching(false)
    }
  }

  // 处理文档AI对话后的生成
  const handleDocumentGeneration = async (requirements: Requirement[], count: number) => {
    setStep('processing')
    setProcessingProgress(0)
    setProcessingSteps([])
    setSearchError(null)

    // 清除之前的题目缓存
    localStorage.removeItem('generatedQuestions')
    localStorage.removeItem('generatedExamName')
    localStorage.removeItem('examSyllabus')

    try {
      setProcessingSteps([t.examSetup.aiGeneratingFromDoc.replace('{count}', count.toString())])
      setProcessingProgress(20)

      const response = await fetch('/api/exam/generate-from-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentContent: parsedDocumentContent,
          examName: examName,
          count: count,
          requirements: requirements
        })
      })

      setProcessingProgress(70)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'AI 生成题目失败')
      }

      const data = await response.json()

      if (!data.success || !data.questions || data.questions.length === 0) {
        throw new Error(data.error || 'AI 返回的题目为空')
      }

      setProcessingSteps(prev => [...prev, `📝 已生成 ${data.questions.length} 道题目`])
      setProcessingProgress(90)

      // 保存生成的题目到 localStorage
      localStorage.setItem('generatedQuestions', JSON.stringify(data.questions))
      localStorage.setItem('generatedExamName', examName)

      setProcessingSteps(prev => [...prev, `🎉 题库生成完成！共 ${data.questions.length} 道精选题目`])
      setProcessingProgress(100)

      await new Promise(resolve => setTimeout(resolve, 500))
      setStep('ready')

    } catch (error) {
      console.error('文档出题失败:', error)
      setSearchError(error instanceof Error ? error.message : '文档出题失败，请稍后重试')
      setProcessingSteps(prev => [...prev, '⚠️ 出题失败，请重试'])
      setProcessingProgress(100)
      await new Promise(resolve => setTimeout(resolve, 1500))
      setStep('document-chat')
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              {t.common.back}
            </button>
            <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
              {t.examSetup.smartSystem}
            </div>
            <div className="w-20" />
          </div>
        </div>
      </header>

      {/* AI 引导模式 */}
      {mode === 'ai-guide' ? (
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-4">
              <Button
                variant="outline"
                onClick={() => setMode('traditional')}
                className="border-neutral-200 dark:border-neutral-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回传统模式
              </Button>
            </div>
            <AiRequirementAgent onStartGeneration={handleAiStartGeneration} />
          </div>
        </div>
      ) : (
        <>
          {/* Step Content */}
          <div className="max-w-2xl mx-auto">
          {/* Step 1: 设置考试目标 */}
          {step === 'goal' && (
            <Card className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-2xl font-bold text-neutral-950 dark:text-white mb-2">{t.examSetup.setGoal}</h2>
                <p className="text-neutral-500 dark:text-neutral-400">{t.examSetup.setGoalDesc}</p>
              </div>

              <div className="space-y-6">
                {/* 考试名称 */}
                <div>
                  <Label className="text-neutral-600 dark:text-neutral-300 mb-2 block">{t.examSetup.examName}</Label>
                  <Input
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    placeholder={isChinaRegion() ? t.examSetup.examNamePlaceholder.cn : t.examSetup.examNamePlaceholder.intl}
                    className="bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-950 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                  />

                  {/* 快速选择 */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {getExamPresets().slice(0, 6).map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => setExamName(preset.name)}
                        className={`px-3 py-1 text-sm rounded-full transition ${
                          examName === preset.name
                            ? 'bg-indigo-600 text-white'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3 mt-8">
                <Button
                  onClick={() => setMode('ai-guide')}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {t.examSetup.aiGuidedGeneration}
                </Button>

                <Button
                  onClick={handleNext}
                  disabled={!examName}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {t.common.next}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <Button
                  onClick={() => {
                    setExamName('自定义题库')
                    setSourceType('upload')
                    setStep('source')
                  }}
                  variant="outline"
                  className="w-full border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {t.examSetup.skipUpload}
                </Button>
              </div>
            </Card>
          )}

          {/* Step 2: 选择资料来源 */}
          {step === 'source' && (
            <Card className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-2xl font-bold text-neutral-950 dark:text-white mb-2">{t.examSetup.haveMaterials}</h2>
                <p className="text-neutral-500 dark:text-neutral-400">{t.examSetup.selectSource}</p>
              </div>

              <div className={`grid gap-4 mb-6 ${sourceFromMainPage ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                {/* 上传资料 - 仅在未指定来源或来源为upload时显示 */}
                {(!sourceFromMainPage || sourceFromMainPage === 'upload') && (
                  <div
                    onClick={() => setSourceType('upload')}
                    className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      sourceType === 'upload'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 bg-neutral-50 dark:bg-neutral-900'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                        sourceType === 'upload' ? 'bg-indigo-600' : 'bg-neutral-200 dark:bg-neutral-700'
                      }`}>
                        <Upload className={`w-6 h-6 ${sourceType === 'upload' ? 'text-white' : 'text-neutral-600 dark:text-neutral-300'}`} />
                      </div>
                      <h3 className="text-lg font-semibold text-neutral-950 dark:text-white mb-1">{t.examSetup.uploadMaterials}</h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">{t.examSetup.uploadDesc}</p>
                    </div>
                    {sourceType === 'upload' && (
                      <CheckCircle className="absolute top-3 right-3 w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    )}
                  </div>
                )}

                {/* AI 联网搜索 - 仅在未指定来源或来源为search时显示 */}
                {(!sourceFromMainPage || sourceFromMainPage === 'search') && (
                  <div
                    onClick={() => setSourceType('search')}
                    className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      sourceType === 'search'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 bg-neutral-50 dark:bg-neutral-900'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                        sourceType === 'search' ? 'bg-indigo-600' : 'bg-neutral-200 dark:bg-neutral-700'
                      }`}>
                        <Globe className={`w-6 h-6 ${sourceType === 'search' ? 'text-white' : 'text-neutral-600 dark:text-neutral-300'}`} />
                      </div>
                      <h3 className="text-lg font-semibold text-neutral-950 dark:text-white mb-1">{t.examSetup.aiSearch}</h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">{t.examSetup.aiSearchDesc}</p>
                    </div>
                    {sourceType === 'search' && (
                      <CheckCircle className="absolute top-3 right-3 w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    )}
                  </div>
                )}
              </div>

              {/* 上传区域 */}
              {sourceType === 'upload' && (
                <div
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center mb-6 animate-in fade-in duration-300 transition-all ${
                    isDragOver
                      ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 scale-[1.02]'
                      : !uploadedFile
                        ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-950/20'
                        : 'border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer block">
                    {isDragOver ? (
                      <>
                        <Upload className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
                        <p className="text-emerald-700 dark:text-emerald-300 font-medium">{t.examSetup.dropToUpload}</p>
                        <p className="text-sm text-emerald-600 dark:text-emerald-400/70">{t.examSetup.supportFormats}</p>
                      </>
                    ) : uploadedFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <FileText className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                        <div className="text-left">
                          <p className="text-neutral-950 dark:text-white font-medium">{uploadedFile.name}</p>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-indigo-600 dark:text-indigo-400 mx-auto mb-3" />
                        <p className="text-indigo-700 dark:text-indigo-300 font-medium">{t.examSetup.clickOrDrag}</p>
                        <p className="text-sm text-indigo-600 dark:text-indigo-400/70">{t.examSetup.supportFormats}</p>
                        <p className="text-xs text-neutral-500 mt-2">{t.examSetup.dragFromApps}</p>
                      </>
                    )}
                  </label>
                </div>
              )}

              {/* AI 搜索提示 */}
              {sourceType === 'search' && (
                <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 mb-6 animate-in fade-in duration-300">
                  <div className="flex items-start gap-3">
                    <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                    <div>
                      <p className="text-indigo-700 dark:text-indigo-300 font-medium">{t.examSetup.aiWillSearch}</p>
                      <ul className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 space-y-1">
                        <li>• {examName} {t.examSetup.officialSyllabus}</li>
                        <li>• {t.examSetup.pastPapers}</li>
                        <li>• {t.examSetup.keyPoints}</li>
                        <li>• {t.examSetup.prepTips}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* 文件错误提示 */}
              {fileError && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">{fileError}</span>
                  </div>
                </div>
              )}

              {/* 出题数量选择器 */}
              {sourceType && (
                <div className="mb-6 animate-in fade-in duration-300">
                  <Label className="text-neutral-600 dark:text-neutral-300 mb-3 block">{t.examSetup.questionCountLabel}</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 15, 20].map(num => (
                      <button
                        key={num}
                        onClick={() => {
                          setQuestionCount(num)
                          setShowCustomCount(false)
                        }}
                        className={`py-3 rounded-lg font-medium transition-all ${
                          questionCount === num && !showCustomCount
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {num} {t.exam.questions}
                      </button>
                    ))}
                    <button
                      onClick={() => setShowCustomCount(true)}
                      className={`py-3 rounded-lg font-medium transition-all ${
                        showCustomCount
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                      }`}
                    >
                      {t.examSetup.custom}
                    </button>
                  </div>
                  {showCustomCount && (
                    <div className="mt-3">
                      <input
                        type="number"
                        min="1"
                        max="40"
                        value={customQuestionCount}
                        onChange={(e) => {
                          const val = parseInt(e.target.value)
                          setCustomQuestionCount(e.target.value)
                          if (val >= 1 && val <= 40) {
                            setQuestionCount(val)
                          }
                        }}
                        placeholder={t.examSetup.customPlaceholder}
                        className="w-full px-4 py-2 rounded-lg border border-indigo-300 dark:border-indigo-700
                                   bg-white dark:bg-neutral-900 text-neutral-950 dark:text-white
                                   focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>
                  )}
                  <p className="text-xs text-neutral-500 mt-2">{t.examSetup.maxQuestions}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={sourceType === 'search' ? () => setStep('goal') : handleAiClarify}
                  disabled={!sourceType || (sourceType === 'upload' && !uploadedFile)}
                  className="flex-1 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {sourceType === 'search' ? '上一步' : 'AI明确需求'}
                </Button>
                <div className="flex-1">
                  <Button
                    onClick={handleNext}
                    disabled={!sourceType || (sourceType === 'upload' && !uploadedFile)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t.examSetup.startGenerate}
                    <Sparkles className="w-4 h-4 ml-2" />
                  </Button>
                  {sourceType === 'upload' && !uploadedFile && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 text-center">
                      ⚠️ {t.examSetup.pleaseUpload}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Step 2.5: 文档AI对话 */}
          {step === 'document-chat' && (
            <Card className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Dashboard Header */}
              <div className="flex items-center justify-between mb-6 p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800">
                {/* Left: File Status */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 dark:bg-indigo-500 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-950 dark:text-white">{uploadedFile?.name || '文档'}</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {uploadedFile ? `${(uploadedFile.size / 1024 / 1024).toFixed(2)} MB` : '已加载'}
                    </p>
                  </div>
                </div>

                {/* Right: Hint */}
                <div className="text-right">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    💡 告诉AI你的需求，定制专属题库
                  </p>
                </div>
              </div>

              <DocumentAiAgent
                documentContent={parsedDocumentContent}
                onStartGeneration={handleDocumentGeneration}
              />

              <div className="mt-4 flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('source')}
                  className="flex-1 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  返回上传
                </Button>
              </div>
            </Card>
          )}

          {/* Step 3: 处理中 */}
          {step === 'processing' && (
            <Card className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center">
                <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  {sourceType === 'search' ? (
                    <Globe className="w-10 h-10 text-white animate-pulse" />
                  ) : (
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                  )}
                </div>
                <h2 className="text-2xl font-bold text-neutral-950 dark:text-white mb-2">
                  {sourceType === 'upload' ? t.examSetup.parsingDoc : `🌐 ${t.examSetup.searchingOnline}`}
                </h2>
                <p className="text-neutral-500 dark:text-neutral-400 mb-8">
                  {sourceType === 'search'
                    ? t.examSetup.aiGettingSyllabus
                    : t.examSetup.aiPreparing}
                </p>

                <div className="max-w-md mx-auto">
                  <Progress value={processingProgress} className="h-2 mb-2" />
                  <p className="text-sm text-neutral-500">{Math.min(100, Math.floor(processingProgress))}%</p>
                </div>

                {/* 显示实时处理步骤 */}
                <div className="mt-8 space-y-3 text-left max-w-sm mx-auto">
                  {processingSteps.length > 0 ? (
                    // 显示真实的处理步骤
                    processingSteps.map((stepText, i) => (
                      <div key={i} className="flex items-center gap-3">
                        {stepText.includes('⚠️') ? (
                          <AlertCircle className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                        ) : i === processingSteps.length - 1 && processingProgress < 100 ? (
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
                    // 默认步骤（兼容旧逻辑）
                    [
                      { text: t.examSetup.analyzingSyllabus, done: processingProgress > 20 },
                      { text: t.examSetup.extractingPoints, done: processingProgress > 40 },
                      { text: t.examSetup.generatingBank, done: processingProgress > 60 },
                      { text: t.examSetup.optimizingQuality, done: processingProgress > 80 },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        {item.done ? (
                          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        ) : processingProgress > i * 20 ? (
                          <Loader2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-neutral-300 dark:border-neutral-600" />
                        )}
                        <span className={item.done ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-500 dark:text-neutral-400'}>
                          {item.text}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* 搜索错误提示 */}
                {searchError && (
                  <div className="mt-6 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-medium">{t.examSetup.searchIssue}</span>
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">{searchError}</p>
                    <p className="text-sm text-neutral-500 mt-1">{t.examSetup.useDefaultBank}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Step 4: 准备完成 */}
          {step === 'ready' && (
            <Card className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center">
                <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-neutral-950 dark:text-white mb-2">{t.examSetup.bankComplete}</h2>
                <p className="text-neutral-500 dark:text-neutral-400 mb-6">{t.examSetup.preparedBank} {examName}</p>

                {/* 搜索结果摘要（如果有联网搜索数据） */}
                {syllabusData && syllabusData.examInfo && (
                  <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 mb-6 text-left">
                    <div className="flex items-center gap-2 mb-3">
                      <Globe className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-indigo-700 dark:text-indigo-400 font-medium">{t.examSetup.searchResults}</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      {syllabusData.examInfo.name && (
                        <p className="text-neutral-700 dark:text-neutral-300">
                          <span className="text-neutral-500">{t.examSetup.examNameLabel}</span>
                          {syllabusData.examInfo.name}
                        </p>
                      )}
                      {syllabusData.examInfo.examTime && (
                        <p className="text-neutral-700 dark:text-neutral-300">
                          <span className="text-neutral-500">{t.examSetup.examTimeLabel}</span>
                          {syllabusData.examInfo.examTime}
                        </p>
                      )}
                      {syllabusData.examInfo.totalScore && (
                        <p className="text-neutral-700 dark:text-neutral-300">
                          <span className="text-neutral-500">{t.examSetup.totalScoreLabel}</span>
                          {syllabusData.examInfo.totalScore}
                        </p>
                      )}
                      {syllabusData.examInfo.officialWebsite && (
                        <a
                          href={syllabusData.examInfo.officialWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                        >
                          {t.examSetup.officialWebsite} <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* 知识点摘要（如果有联网搜索数据） */}
                {syllabusData && syllabusData.syllabus && syllabusData.syllabus.length > 0 && (
                  <div className="bg-neutral-50 dark:bg-neutral-900 rounded-xl p-4 mb-6 text-left">
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-3">📚 {t.examSetup.syllabusChapters}</p>
                    <div className="flex flex-wrap gap-2">
                      {syllabusData.syllabus.slice(0, 5).map((item, i) => (
                        <span key={i} className="px-2 py-1 bg-neutral-200 dark:bg-neutral-800 rounded text-xs text-neutral-700 dark:text-neutral-300">
                          {item.chapter}
                        </span>
                      ))}
                      {syllabusData.syllabus.length > 5 && (
                        <span className="px-2 py-1 bg-neutral-200 dark:bg-neutral-800 rounded text-xs text-neutral-500 dark:text-neutral-400">
                          +{syllabusData.syllabus.length - 5} {t.examSetup.moreChapters}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 统计信息 */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-neutral-50 dark:bg-neutral-900 rounded-xl p-4">
                    <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                      {syllabusData?.syllabus ? syllabusData.syllabus.length * 4 : 20}+
                    </div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">{t.examSetup.selectedQuestions}</div>
                  </div>
                  <div className="bg-neutral-50 dark:bg-neutral-900 rounded-xl p-4">
                    <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                      {syllabusData?.syllabus?.length || 5}
                    </div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">{t.examSetup.knowledgeModules}</div>
                  </div>
                </div>

                {/* 等级提示 */}
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-2xl">🥉</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">{t.examSetup.bronze}</span>
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {t.examSetup.startFromBronze}<br />
                    {t.examSetup.comboBonus}
                  </p>
                </div>

                <Button
                  onClick={handleStartPractice}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-lg py-6"
                >
                  {t.examSetup.startPractice}
                  <Sparkles className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </Card>
          )}
        </div>
        </>
      )}

    </div>
  )
}

// 主导出组件，包装 Suspense
export default function ExamSetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto mb-4" />
          <p className="text-neutral-500 dark:text-neutral-400">Loading...</p>
        </div>
      </div>
    }>
      <ExamSetupContent />
    </Suspense>
  )
}
