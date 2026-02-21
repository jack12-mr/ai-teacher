import { NextRequest, NextResponse } from 'next/server';
import { getSearchQuestionPrompts } from '@/lib/i18n/ai-prompts';
import { getAIConfig } from '@/lib/ai/config';

/**
 * 搜题 API
 *
 * 支持文字输入和图片识别，联网搜索原题、答案和来源
 * 支持流式响应，实时返回搜索进度
 */

// 搜索结果类型定义
interface SearchResult {
  originalQuestion: string;
  answer: string;
  explanation: string;
  source: {
    name: string;
    year?: string;
    url?: string;
  };
  confidence: number;
}

interface SearchResponse {
  success: boolean;
  result?: SearchResult;
  error?: string;
}

// 进度消息类型
interface ProgressMessage {
  type: 'progress';
  step: string;
  message: string;
}

interface ResultMessage {
  type: 'result';
  success: boolean;
  result?: SearchResult;
  error?: string;
}

type StreamMessage = ProgressMessage | ResultMessage;

/**
 * 创建流式响应的编码器
 */
function createStreamEncoder() {
  const encoder = new TextEncoder();
  return {
    encode: (message: StreamMessage) => {
      return encoder.encode(`data: ${JSON.stringify(message)}\n\n`);
    }
  };
}

/**
 * POST 请求 - 搜索原题（流式响应）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionText, questionImage, subject } = body;

    // 验证输入
    if (!questionText && !questionImage) {
      return NextResponse.json<SearchResponse>(
        { success: false, error: '请输入题目内容或上传图片' },
        { status: 400 }
      );
    }

    // 创建流式响应
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = createStreamEncoder();

        const sendProgress = (step: string, message: string) => {
          controller.enqueue(encoder.encode({ type: 'progress', step, message }));
        };

        const sendResult = (response: SearchResponse) => {
          controller.enqueue(encoder.encode({
            type: 'result',
            ...response
          }));
          controller.close();
        };

        try {
          const aiConfig = getAIConfig();
          const prompts = getSearchQuestionPrompts();

          let textToSearch = questionText;

          // 如果是图片，使用多模态模型识别
          if (questionImage && !questionText) {
            sendProgress('ocr', '正在识别图片中的题目...');
            textToSearch = await recognizeImageContent(questionImage, aiConfig);
            if (!textToSearch) {
              sendResult({ success: false, error: '图片识别失败，请重试或使用文字输入' });
              return;
            }
            sendProgress('ocr_done', `识别完成：${textToSearch.slice(0, 50)}${textToSearch.length > 50 ? '...' : ''}`);
          }

          // 调用 AI 联网搜索
          sendProgress('searching', '正在联网搜索原题...');
          const searchResult = await searchQuestion(
            textToSearch,
            subject,
            aiConfig,
            prompts
          );

          if (searchResult.success) {
            sendProgress('found', '找到匹配题目，正在获取答案...');
          }

          sendResult(searchResult);

        } catch (error) {
          console.error('搜题失败:', error);
          sendResult({ success: false, error: '服务器错误，请稍后重试' });
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('搜题失败:', error);
    return NextResponse.json<SearchResponse>(
      { success: false, error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}

/**
 * 使用多模态模型识别图片中的题目
 */
async function recognizeImageContent(
  imageBase64: string,
  aiConfig: ReturnType<typeof getAIConfig>
): Promise<string | null> {
  try {
    // 如果没有配置多模态模型，返回错误
    if (!aiConfig.vlModelName) {
      console.error('未配置多模态模型');
      return null;
    }

    const response = await fetch(`${aiConfig.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: aiConfig.vlModelName,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: '请识别这张图片中的题目内容，只输出题目文字，不要添加任何解释或说明。如果是数学题，请保留所有数学符号和公式。'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64.startsWith('data:')
                    ? imageBase64
                    : `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('图片识别 API 错误:', errorText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    return content || null;

  } catch (error) {
    console.error('图片识别失败:', error);
    return null;
  }
}

/**
 * 调用 AI 联网搜索题目
 */
async function searchQuestion(
  questionText: string,
  subject: string | undefined,
  aiConfig: ReturnType<typeof getAIConfig>,
  prompts: ReturnType<typeof getSearchQuestionPrompts>
): Promise<SearchResponse> {
  const userPrompt = prompts.userPromptTemplate(questionText, subject);

  const response = await fetch(`${aiConfig.baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${aiConfig.apiKey}`,
    },
    body: JSON.stringify({
      model: aiConfig.searchModelName || aiConfig.modelName,
      messages: [
        { role: 'system', content: prompts.systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 4000,
      // 启用联网搜索
      enable_search: true
    } as any)  // enable_search 是通义千问特有参数
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI 搜索 API 错误:', errorText);
    return {
      success: false,
      error: '搜索服务暂时不可用，请稍后重试'
    };
  }

  const data = await response.json();
  const aiContent = data.choices?.[0]?.message?.content;

  if (!aiContent) {
    return {
      success: false,
      error: 'AI 返回内容为空'
    };
  }

  try {
    // 清理 AI 返回的内容（可能被 markdown 代码块包裹）
    let cleanedContent = aiContent.trim();

    // 移除 markdown 代码块标记
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.slice(7);
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.slice(3);
    }
    if (cleanedContent.endsWith('```')) {
      cleanedContent = cleanedContent.slice(0, -3);
    }
    cleanedContent = cleanedContent.trim();

    // 解析 AI 返回的 JSON
    const parsed = JSON.parse(cleanedContent);

    // 验证返回结构
    if (parsed.success === false) {
      return {
        success: false,
        error: parsed.error || '未找到匹配的题目'
      };
    }

    if (!parsed.result) {
      return {
        success: false,
        error: '搜索结果格式错误'
      };
    }

    // 验证必要字段
    const result = parsed.result as SearchResult;
    if (!result.originalQuestion || !result.answer) {
      return {
        success: false,
        error: '搜索结果不完整'
      };
    }

    return {
      success: true,
      result: {
        originalQuestion: result.originalQuestion,
        answer: result.answer,
        explanation: result.explanation || '暂无解析',
        source: result.source || { name: '未知来源' },
        confidence: result.confidence || 0.8
      }
    };

  } catch (parseError) {
    console.error('解析 AI 返回失败:', parseError);
    console.error('AI 原始返回内容:', aiContent);
    return {
      success: false,
      error: '解析搜索结果失败，请重试'
    };
  }
}

/**
 * GET 请求 - 返回 API 信息
 */
export async function GET() {
  return NextResponse.json({
    name: '搜题 API',
    description: '支持文字输入和图片识别，联网搜索原题、答案和来源',
    parameters: {
      questionText: '题目文字内容（可选，与 questionImage 二选一）',
      questionImage: '题目图片 base64 编码（可选，与 questionText 二选一）',
      subject: '科目筛选（可选）'
    },
    features: [
      '文字搜题',
      '图片识别搜题（qwen-vl 多模态模型）',
      '联网搜索原题来源',
      '返回答案和解析'
    ]
  });
}
