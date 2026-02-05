import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getAIConfig } from '@/lib/ai/config';
import { getExplainAnswerPrompts } from '@/lib/i18n/ai-prompts';

interface ExplainRequest {
  question: string;
  options: string[];
  userAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const aiConfig = getAIConfig();
    const openai = new OpenAI({
      baseURL: aiConfig.baseURL,
      apiKey: aiConfig.apiKey,
    });

    const body: ExplainRequest = await request.json();
    const { question, options, userAnswer, correctAnswer, isCorrect } = body;

    const userChoice = options[userAnswer];
    const correctChoice = options[correctAnswer];

    // Get region-aware prompts
    const prompts = getExplainAnswerPrompts();

    const prompt = isCorrect
      ? prompts.correctPrompt(question, userChoice)
      : prompts.incorrectPrompt(question, userChoice, correctChoice);

    const completion = await openai.chat.completions.create({
      model: aiConfig.modelName,
      messages: [
        {
          role: 'system',
          content: prompts.systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 200
    });

    const explanation = completion.choices[0]?.message?.content || '暂无解析';

    return NextResponse.json({
      success: true,
      explanation
    });
  } catch (error) {
    console.error('AI 解析失败:', error);
    return NextResponse.json(
      { error: 'AI 解析失败，请稍后重试' },
      { status: 500 }
    );
  }
}
