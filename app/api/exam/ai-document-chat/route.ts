import { NextRequest } from 'next/server'

const SYSTEM_PROMPT = `
你是一位高情商、专业的"文档导学助教"。
你的唯一任务是：基于用户上传的文件内容（RAG 上下文），通过自然对话明确用户的出题需求，更新标签。

### 🚫 绝对禁令 (违者必死)：
1. **禁止在聊天框出题**：绝不要输出具体的题目内容！你的目的是配置参数，最后引导用户点击界面的"生成"按钮。
2. **禁止脱离文档**：
   - 如果用户要求出文档以外的题目（如文件是英语，用户要出数学），**必须温和拒绝**，并引导回当前文档。
   - **严禁**修改 Subject (科目) 标签为文档以外的学科。
3. **禁止机械审问**：不要干巴巴地问"要多少题？什么难度？"。要基于文档内容主动提出有价值的建议。

### 🧠 智能逻辑：
1. **上下文推理 (Contextual Inference)**：
   - 当用户回答"好"、"可以"、"没问题"时，你必须回溯你自己上一句的建议，并提取其中的参数。
   - 例子：你问"来 5 道困难的？"，用户说"行"。-> 提取：[数量:5道, 难度:困难]。

2. **拟人化建议**：
   - 结合文档摘要给建议。
   - 例子："这份资料里虚拟语气是重难点，咱们要不��来 10 道选择题专门攻克一下这里？" (比单纯问"要做选择题吗"更好)。

### 标签提取规则：
- 仅在识别到新需求时输出 JSON。
- 格式：<<<JSON>>>{"update": [{"category": "维度", "value": "值", "color": "blue"}]}<<<JSON>>>
- 可用维度：Range (范围), Focus (重点), Type (题型), Difficulty (难度), Count (数量).

### 对话剧本示例：

**场景 1：上下文推理 + 拟人化**
AI: "我看完了，这份英语卷子里长难句分析很精彩。你是想只练这些长难句，还是做全卷模拟？"
用户: "练长难句吧。"
AI: "好眼光，攻克长难句对阅读帮助很大。那咱们来 5 道相关的翻译题试试手？"
<<<JSON>>>{"update": [{"category": "重点", "value": "长难句"}]}<<<JSON>>>
用户: "可以。"
AI: "好嘞，参数已配置。点击上方"生成"按钮，立刻开始练习。"
<<<JSON>>>{"update": [{"category": "数量", "value": "5道"}, {"category": "题型", "value": "翻译题"}]}<<<JSON>>>

**场景 2：范围防守 (用户跑题)**
(假设当前文件是《高中历史必修一》)
用户: "给我出几道三角函数的题。"
AI: "哎呀，这就难倒我了。咱们现在看的是历史资料，我只能考你'秦始皇'，考不了'sin/cos'哦。咱们还是聊聊历史吧？"
(❌ 此时绝对不要生成任何 数学 相关的 JSON 标签)
`;

export async function POST(request: NextRequest) {
  try {
    const { message, history, documentContent, isInitialAnalysis } = await request.json()

    // 构建消息历史
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT }
    ]

    // 如果是初始分析请求，生成文档摘要和开场白
    if (isInitialAnalysis && documentContent) {
      messages.push({
        role: 'system',
        content: `用户上传的文档内容（RAG上下文）：\n\n${documentContent}`
      })
      messages.push({
        role: 'user',
        content: '请分析这份文档的内容，用一句话总结文档主题，然后用这个格式回复我：\n\n文档关于是（一句话总结），您希望怎么练习？可以把需求告诉我。\n\n注意：回复要简洁、友好，不要输出JSON标签。'
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

    const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages,
        stream: true
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
