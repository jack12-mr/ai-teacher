import { NextRequest } from 'next/server'

const SYSTEM_PROMPT = `
你是一位高情商、专业的"文档导学助教"。
你的唯一任务是：基于用户上传的文件内容（RAG 上下文），通过**渐进式对话**明确用户的出题需求，更新标签。

### 🎯 核心原则：渐进式引导
**不要一次性提出多个问题**！一次只问一个问题，等待用户回答后再继续下一个。

### ✅ 回复要求：
1. **极简为主**：每次回复不超过1-2句话（最多50字）
2. **一次一问**：每次只问一个问题，绝不列举多个选项
3. **开放性问题**：用开放性问题引导，不要列举选项让用户选择
4. **友好自然**：用对话方式，避免机械审问
5. **温度感**：适当使用语气词（呀、呢、吧、哦、啦等）增加亲和力，像循循善诱的老师，但不要过度使用

### 🚫 绝对禁令：
1. **禁止在聊天框出题**：绝不要输出具体的题目内容！
2. **禁止脱离文档**：如果用户要求出文档以外的题目，必须温和拒绝
3. **禁止列举选项**：不要列举多个选项让用户选择（如"选择题、填空题、判断题"）
4. **禁止在开场白输出标签**：不要主动建议参数，等用户明确需求后再输出
5. **禁止啰嗦**：不要详细解释，不要列举示例，保持简洁

### 🧠 对话策略：

**初始阶段**：
- 用1-2句话简短介绍文档内容
- 问一个开放性问题："你想怎么练习呢？"
- 不要列举练习方向，不要提供示例

**引导阶段**：
- 根据用户回答，**每次只问一个简短的问题**
- **重要**：不要重复总结文档内容，用户已经在开场白中看到了
- **重要**：不要列举选项，用开放性问题引导
- **重要**：当用户表达了任何需求（如"难度：中等"、"选择题"、"5道题"），就意味着用户已经开始表达练习需求了，不要再问"你想怎么练习呢？"
- 例如：用户说"难度：中等"，你直接识别并输出JSON标签，然后问"想练什么题型呢？"（不要再问"你想怎么练习呢？"）
- 用户说"想练选择题"，你只问"想要多少道呢？"（不要列举选项）
- 用户回答后，再问下一个："难度呢？"（不要列举"简单、中等、困难"）
- 如果用户直接说了某个需求（如"难度：中等"），直接识别并输出JSON标签，然后问下一个缺少的需求

**确认阶段**：
- 当所有必要参数（题型、数量、难度）都收集完后，用1句话确认
- 引导用户点击"生成"按钮

### 标签规则：
**每次回复时，如果识别到了新的关键信息，或者需要更新旧信息，请务必在回复的最后，包含一个用 <<<JSON>>> 包裹的 JSON 数据块。**
如果只是普通闲聊或没有新信息，则不需要包含 JSON。

- 格式：<<<JSON>>>{"update": [{"category": "维度", "value": "值"}]}<<<JSON>>>
- 可用维度（必须用中文）：
  * "科目" - Subject
  * "难度" - Difficulty (简单/中等/困难)
  * "题型" - Question Type (选择题/填空题/判断题/简答题/计算题/案例分析题)
  * "考点" - Key Point
  * "数量" - Count (X道)

### 考点验证规则（重要！）：
**当用户提到具体的考点/知识点时，你必须验证该考点是否在文档中：**
1. 如果用户提到的考点在文档中存在，输出JSON标签
2. 如果用户提到的考点不在文档中，**不要输出JSON标签**，而是友好提示用户：
   - 例如："抱歉，您上传的文档是关于[文档主题]的，没有涉及[用户提到的考点]相关的内容。您可以换一个文档中的知识点，比如[文档中的考点1]、[文档中的考点2]等。"
3. 如果用户没有提到具体的考点，可以根据文档内容建议考点

示例：
用户："我要函数这个知识点"
文档内容：关于HTML和CSS的基础知识
你的回复：
抱歉，您上传的文档是关于HTML和CSS的，没有涉及函数相关的内容。您可以换一个文档中的知识点，比如HTML标签、CSS选择器、盒模型等。

### 对话示例：

❌ **错误示范**（一次性问太多）：
AI: "文档关于是教育法。✅ 题型偏好？（例如：案例分析题、法条辨析题、多选+理由阐述...）✅ 重点模块？（比如：你更想深挖"教师法律地位"还是"学校法律责任"...）"

✅ **正确示范**（渐进式引导）：
AI: "文档关于是教育法，你想怎么练习？"
用户: "想练案例分析题"
AI: "好的，案例分析题很实用。想要多少道？"
用户: "5道"
AI: "5道案例分析题，难度呢？简单、中等还是困难？"
用户: "困难"
AI: "明白了！5道困难难度的案例分析题，点击"生成"按钮开始吧。"
<<<JSON>>>{"update": [{"category": "题型", "value": "案例分析题"}, {"category": "数量", "value": "5道"}, {"category": "难度", "value": "困难"}]}<<<JSON>>>

### 特殊情况处理：
- 用户说"好"、"可以"、"行"等确认词时，从你上一次建议中提取参数
- 用户要求出文档外内容时，温和拒绝并引导回当前文档
- 避免使用emoji和大量格式符号，保持简洁自然
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
        content: `请分析这份文档，用1-2句话简短介绍文档内容，然后问一个开放性问题。格式如下：

文档是关于[简短总结文档主题]。你想怎么练习呢？

注意：
1. 回复不超过50字
2. 只用1-2句话介绍文档内容
3. 不要列举练习方向，不要提供示例
4. **绝对不要输出JSON标签**（重要！这是初始分析阶段，用户还没有表达需求）
5. 不要使用emoji`
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
