"use client"

import { useEffect, useState } from "react"
import { PracticeArena } from "@/components/exam/PracticeArena"
import { useT } from "@/lib/i18n"
import { isChinaRegion } from "@/lib/config/region"

export default function PracticePage() {
  const t = useT()
  const [examName, setExamName] = useState(
    isChinaRegion() ? t.wrongBook.defaultExam.cn : t.wrongBook.defaultExam.intl
  )

  useEffect(() => {
    // 从 localStorage 获取考试信息
    const savedExam = localStorage.getItem('currentExam')
    if (savedExam) {
      try {
        const exam = JSON.parse(savedExam)
        setExamName(exam.examName || (isChinaRegion() ? t.wrongBook.defaultExam.cn : t.wrongBook.defaultExam.intl))
      } catch (e) {
        console.error('Failed to parse exam info')
      }
    }
  }, [])

  return <PracticeArena examName={examName} />
}
