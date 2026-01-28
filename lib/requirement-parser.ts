export interface Requirement {
  category: '科目' | '难度' | '题型' | '考点' | '年份' | '数量' | '学段' | '考点/活动'
  value: string
}

export function parseRequirements(text: string): Requirement[] {
  const regex = /<<<JSON>>>(.*?)<<<JSON>>>/gs
  const matches = [...text.matchAll(regex)]

  return matches.flatMap(match => {
    try {
      const data = JSON.parse(match[1])
      return data.update || []
    } catch {
      return []
    }
  })
}

export function extractRequirementsFromUserMessage(text: string, previousAiMessage?: string): Requirement[] {
  const requirements: Requirement[] = []

  // 【关键修改】只从用户的直接消息中提取，不再从AI建议中提取
  // 用户必须明确说出需求，而不是简单地确认AI的建议
  const textToExtract = text

  // 题型 - Collect all question types
  const questionTypes: string[] = []
  if (/选择题/.test(textToExtract)) questionTypes.push('选择题')
  if (/填空题/.test(textToExtract)) questionTypes.push('填空题')
  if (/判断题/.test(textToExtract)) questionTypes.push('判断题')
  if (/简答题/.test(textToExtract)) questionTypes.push('简答题')
  if (/计算题/.test(textToExtract)) questionTypes.push('计算题')
  if (/案例分析题|案例题/.test(textToExtract)) questionTypes.push('案例分析题')
  if (/翻译题/.test(textToExtract)) questionTypes.push('翻译题')

  // Combine multiple question types with "+"
  if (questionTypes.length > 0) {
    requirements.push({ category: '题型', value: questionTypes.join('+') })
  }

  // 难度 - IMPORTANT: Check in specific order to avoid false matches
  if (/困难|挑战/.test(textToExtract)) requirements.push({ category: '难度', value: '困难' })
  else if (/中等|适中/.test(textToExtract)) requirements.push({ category: '难度', value: '中等' })
  else if (/简单|容易|基础/.test(textToExtract)) requirements.push({ category: '难度', value: '简单' })

  // 数量 - 匹配"5道"、"10题"等格式
  const countMatch = textToExtract.match(/(\d+)\s*[道题个]/);
  if (countMatch) requirements.push({ category: '数量', value: `${countMatch[1]}道` })

  // 【新增】考点/知识点 - 自动识别用户提到的任何学科内容
  // 匹配模式：包含学科关键词的短语
  const knowledgePointPatterns = [
    // 模式1: "针对X练习"、"关于X学习"、"关于X复习" (动词后缀)
    /(?:针对|关于)([<>《》\u4e00-\u9fa5a-zA-Z0-9]{2,15})(?:练习|学习|复习)/,
    // 模式2: "我要考查X"、"我想测试X"、"我要练习X" (带"我要"、"我想"、"想")
    /(?:我想|我要|想)(?:考查|测试|练习|学习|复习)([<>《》\u4e00-\u9fa5a-zA-Z0-9]{2,15})(?=$|，|。|？|！)/,
    // 模式3: "考查X"、"测试X"、"练习X" (简单的动词模式)
    /(?:考查|测试|练习)([<>《》\u4e00-\u9fa5a-zA-Z0-9]{2,15})(?=$|，|。|？|！)/,
    // 模式4: "关于X的" (只在"的"后面是特定词汇时匹配，避免匹配"X的Y"结构)
    /(?:关于|针对)([<>《》\u4e00-\u9fa5a-zA-Z0-9]{2,20})的(?:内容|部分|章节|特点|性质|应用)/,
    // 模式5: "X考点"、"X知识点" (后缀模式)
    /([<>《》\u4e00-\u9fa5a-zA-Z0-9]{2,15})(?:考点|知识点)/,
    // 模式6: "重点考点是X"、"主要知识点X" (带"重点"、"主要")
    /(?:重点|主要)(?:考点|知识点)?(?:是|：)?([<>《》\u4e00-\u9fa5a-zA-Z0-9]{2,15})/,
    // 模式7: "关于X" (兜底模式，匹配任何"关于"后的内容)
    /(?:关于|针对)([<>《》\u4e00-\u9fa5a-zA-Z0-9]{2,20})(?=$|，|。|？|！)/
  ]

  for (const pattern of knowledgePointPatterns) {
    const match = textToExtract.match(pattern)
    if (match && match[1]) {
      const knowledgePoint = match[1].trim()
      // 过滤掉非学科词汇（如"题目"、"内容"等）
      const nonSubjectWords = ['题目', '内容', '部分', '章节', '东西', '问题', '情况', '重点', '主要']
      if (!nonSubjectWords.includes(knowledgePoint) && knowledgePoint.length >= 2) {
        requirements.push({ category: '考点', value: knowledgePoint })
        break // 只提取第一个匹配的知识点
      }
    }
  }

  return requirements
}

export function mergeRequirements(
  existing: Requirement[],
  updates: Requirement[]
): Requirement[] {
  const merged = [...existing]

  updates.forEach(update => {
    const index = merged.findIndex(r => r.category === update.category)
    if (index >= 0) {
      merged[index] = update
    } else {
      merged.push(update)
    }
  })

  return merged
}

export function hasSubject(requirements: Requirement[]): boolean {
  // Check for explicit subject category
  if (requirements.some(r => r.category === '科目')) {
    return true
  }

  // Fallback: check if any requirement value contains common subjects
  const subjectKeywords = ['英语', '数学', '语文', '物理', '化学', '生物', '历史', '地理', '政治']
  return requirements.some(r =>
    subjectKeywords.some(keyword => r.value.includes(keyword))
  )
}

export function hasQuestionCount(requirements: Requirement[]): boolean {
  return requirements.some(r => r.category === '数量')
}
