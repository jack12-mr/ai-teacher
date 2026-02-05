import { NextRequest } from 'next/server'
import { getAIConfig } from '@/lib/ai/config'
import { getDocumentChatPrompts } from '@/lib/i18n/ai-prompts'

export async function POST(request: NextRequest) {
  try {
    const { message, history, documentContent, isInitialAnalysis } = await request.json()

    // Get region-aware prompts
    const prompts = getDocumentChatPrompts()

    // 构建消息历史
    const messages = [
      { role: 'system', content: prompts.systemPrompt }
    ]

    // 如果是初始分析请求，生成文档摘要和开场白
    if (isInitialAnalysis && documentContent) {
      messages.push({
        role: 'system',
        content: `用户上传的文档内容（RAG上下文）：\n\n${documentContent}`
      })
      messages.push({
        role: 'user',
        content: prompts.initialAnalysisPrompt
      })
    } else {
      // 如果是第一次对话，将文档内容作为系统上下文
      if (history.length === 0 && documentContent) {
        messages.push({
          role: 'system',
          content: `用户上传的文档内容（RAG上下文）：\n\n${documentContent}`
        })
      }

      // 添加历史消息
      messages.push(...history)

      // 添加当前用户消息
      messages.push({ role: 'user', content: message })
    }

    const aiConfig = getAIConfig();
    const response = await fetch(`${aiConfig.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiConfig.apiKey}`
      },
      body: JSON.stringify({
        model: aiConfig.modelName,
        messages,
        stream: true,
        temperature: 0
      })
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) return

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const text = new TextDecoder().decode(value)
            const lines = text.split('\n').filter(line => line.trim() !== '')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') continue

                try {
                  const json = JSON.parse(data)
                  const content = json.choices?.[0]?.delta?.content
                  if (content) {
                    controller.enqueue(encoder.encode(content))
                  }
                } catch (e) {
                  console.error('Error parsing SSE data:', e)
                }
              }
            }
          }
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })
  } catch (error) {
    console.error('Error in AI document chat:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
