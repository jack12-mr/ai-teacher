/**
 * AI 搜题功能实际测试
 * 运行方式: node tests/unit/ai-search-test.js
 */

const https = require('https');
require('dotenv').config({ path: '.env.local' });

console.log('========================================');
console.log('AI 搜题功能实际测试');
console.log('========================================\n');

// 读取环境变量
const API_KEY = process.env.OPENAI_API_KEY;
const BASE_URL = process.env.OPENAI_BASE_URL;
const SEARCH_MODEL = process.env.AI_SEARCH_MODEL_NAME || 'qwen-turbo';

console.log('配置信息:');
console.log(`  API Key: ${API_KEY ? API_KEY.substring(0, 10) + '...' : '未配置'}`);
console.log(`  Base URL: ${BASE_URL}`);
console.log(`  Search Model: ${SEARCH_MODEL}`);
console.log('');

// 测试题目
const testQuestion = '已知函数 f(x) = x² + 2x + 1，求 f(2) 的值';

console.log(`测试题目: ${testQuestion}`);
console.log('正在调用 AI 搜题...\n');

// 构建 API 请求
const prompt = `请联网搜索以下题目的原题、答案和来源：

题目内容：
${testQuestion}

请以 JSON 格式返回结果：
{
  "success": true,
  "result": {
    "originalQuestion": "搜索到的原题文本",
    "answer": "标准答案",
    "explanation": "详细的解析步骤",
    "source": {
      "name": "来源名称",
      "year": "年份",
      "url": "原文链接"
    },
    "confidence": 0.95
  }
}`;

const requestBody = JSON.stringify({
  model: SEARCH_MODEL,
  messages: [
    {
      role: 'system',
      content: '你是一个专业的题目搜索助手。请根据你的知识回答题目并返回结构化的 JSON 结果。'
    },
    {
      role: 'user',
      content: prompt
    }
  ],
  temperature: 0.3,
  max_tokens: 2000
});

// 解析 URL
const url = new URL(BASE_URL);
const fullPath = url.pathname !== '/' ? url.pathname + '/chat/completions' : '/chat/completions';
console.log('请求路径:', fullPath);
console.log('请求主机:', url.hostname);
console.log('');

const options = {
  hostname: url.hostname,
  port: 443,
  path: fullPath,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Length': Buffer.byteLength(requestBody)
  }
};

// 发送请求
const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('API 响应状态:', res.statusCode);
    console.log('');

    if (res.statusCode !== 200) {
      console.error('API 调用失败:');
      console.error(data);
      process.exit(1);
    }

    try {
      const response = JSON.parse(data);
      const content = response.choices?.[0]?.message?.content;

      if (!content) {
        console.error('AI 返回内容为空');
        process.exit(1);
      }

      console.log('AI 原始响应:');
      console.log(content);
      console.log('');

      // 尝试解析 JSON
      try {
        const result = JSON.parse(content);
        console.log('解析后的结果:');
        console.log(JSON.stringify(result, null, 2));

        if (result.success && result.result) {
          console.log('\n========================================');
          console.log('✅ AI 搜题测试成功！');
          console.log('========================================');
          console.log(`原题: ${result.result.originalQuestion}`);
          console.log(`答案: ${result.result.answer}`);
          console.log(`来源: ${result.result.source?.name || '未知'}`);
          console.log(`置信度: ${(result.result.confidence * 100).toFixed(0)}%`);
        } else {
          console.log('\n========================================');
          console.log('⚠️ AI 搜题未找到结果');
          console.log('========================================');
          console.log(result.error || '未知错误');
        }
      } catch (parseError) {
        console.error('JSON 解析失败:', parseError.message);
      }

    } catch (error) {
      console.error('解析响应失败:', error.message);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('请求失败:', error.message);
  process.exit(1);
});

req.write(requestBody);
req.end();
