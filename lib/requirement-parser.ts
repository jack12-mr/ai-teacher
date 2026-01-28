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

  // 检查用户是否在确认（如果是确认，则从 AI 的上一条消息中提取）
  const isConfirmation = /^(需要|好的?|是的?|可以|行|对|嗯|确认|同意)$/i.test(text.trim())
  const textToExtract = isConfirmation && previousAiMessage ? previousAiMessage : text

  // 题型 - Collect all question types
  const questionTypes: string[] = []
  if (/选择题/.test(textToExtract)) questionTypes.push('选择题')
  if (/填空题/.test(textToExtract)) questionTypes.push('填空题')
  if (/判断题/.test(textToExtract)) questionTypes.push('判断题')
  if (/简答题/.test(textToExtract)) questionTypes.push('简答题')
  if (/计算题/.test(textToExtract)) questionTypes.push('计算题')

  // Combine multiple question types with "+"
  if (questionTypes.length > 0) {
    requirements.push({ category: '题型', value: questionTypes.join('+') })
  }

  // 难度 - IMPORTANT: Check in specific order to avoid false matches
  if (/困难|挑战/.test(textToExtract)) requirements.push({ category: '难度', value: '困难' })
  else if (/中等|适中/.test(textToExtract)) requirements.push({ category: '难度', value: '中等' })
  else if (/简单|容易|基础/.test(textToExtract)) requirements.push({ category: '难度', value: '简单' })

  // 数量
  const countMatch = textToExtract.match(/(\d+)\s*[道题个]/);
  if (countMatch) requirements.push({ category: '数量', value: `${countMatch[1]}道` })

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
