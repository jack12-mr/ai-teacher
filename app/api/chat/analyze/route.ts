import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getCloudBaseDatabase } from '@/lib/cloudbase/init';

import { getAIConfig } from '@/lib/ai/config';
import { getAnalyzePerformancePrompts } from '@/lib/i18n/ai-prompts';

export async function POST(request: NextRequest) {
  try {
    // Initialize OpenAI client with region-based configuration
    const aiConfig = getAIConfig();
    const openai = new OpenAI({
      baseURL: aiConfig.baseURL,
      apiKey: aiConfig.apiKey,
    });

    const db = getCloudBaseDatabase();

    // 查询最新的评估记录
    const assessmentResult = await db
      .collection('assessments')
      .where({ userId: 'test_user_001' })
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (!assessmentResult.data || assessmentResult.data.length === 0) {
      return NextResponse.json(
        { error: '未找到用户评估数据，请先完成技能评估' },
        { status: 404 }
      );
    }

    const latestAssessment = assessmentResult.data[0];
    const skillsData = JSON.stringify(latestAssessment.skills);

    // Get region-aware prompts
    const prompts = getAnalyzePerformancePrompts();

    // 调用 AI 模型进行分析
    const completion = await openai.chat.completions.create({
      model: aiConfig.modelName,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: prompts.systemPrompt
        },
        {
          role: 'user',
          content: skillsData
        }
      ]
    });

    const aiResponse = completion.choices[0]?.message?.content;

    if (!aiResponse) {
      return NextResponse.json(
        { error: 'AI 响应为空' },
        { status: 500 }
      );
    }

    // 解析 AI 返回的 JSON
    const analysisResult = JSON.parse(aiResponse);

    return NextResponse.json({
      success: true,
      data: analysisResult,
      assessment: {
        role: latestAssessment.role,
        score: latestAssessment.score,
        createdAt: latestAssessment.createdAt
      }
    });
  } catch (error) {
    console.error('技能分析失败:', error);
    return NextResponse.json(
      { error: '技能分析失败，请稍后重试' },
      { status: 500 }
    );
  }
}
