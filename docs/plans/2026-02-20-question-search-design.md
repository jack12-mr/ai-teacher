# 搜题功能设计文档

## 概述

| 项目 | 决策 |
|------|------|
| AI 模型 | qwen-vl 多模态模型（一体化处理图片识别 + 搜题） |
| 搜题来源 | 联网搜索（通义千问 `enable_search: true`） |
| UI 入口 | 考试页面右上角悬浮按钮 |
| 结果展示 | 原题 + 答案 + 解析 + 来源 |

---

## 一、API 设计

### 端点

```
POST /api/exam/search-question
```

### 请求体

```typescript
interface SearchQuestionRequest {
  // 文字输入（二选一）
  questionText?: string;

  // 图片输入（二选一）- base64 编码
  questionImage?: string;

  // 可选：科目筛选
  subject?: string;
}
```

### 响应体

```typescript
interface SearchQuestionResponse {
  success: boolean;
  result?: {
    originalQuestion: string;   // 原题文本
    answer: string;             // 答案
    explanation: string;        // 解析步骤
    source: {
      name: string;             // 来源名称
      year?: string;            // 年份
      url?: string;             // 原文链接
    };
    confidence: number;         // 匹配置信度 0-1
  };
  error?: string;
}
```

### 核心流程

```
1. 输入验证 → 检查是否提供了文字或图片
2. 图片处理 → 如果是图片，调用 qwen-vl 识别题目文字
3. 联网搜索 → 使用 enable_search: true 搜索原题
4. 结果格式化 → 提取答案、解析、来源信息
```

---

## 二、前端组件

### 组件结构

```
components/exam/
├── QuestionSearch.tsx       # 搜题主组件（弹窗 + 逻辑）
├── SearchCameraCapture.tsx  # 拍照组件
└── SearchResultCard.tsx     # 搜索结果展示卡片
```

### QuestionSearch 组件

主要功能：
- 模式切换：文字输入 / 拍照搜题
- 输入验证：确保至少有一种输入
- 加载状态：显示搜索进度
- 结果展示：调用 SearchResultCard

### SearchCameraCapture 组件

主要功能：
- 调用摄像头拍照
- 从相册选择图片
- 图片裁剪聚焦题目区域
- 转换为 base64 格式

### SearchResultCard 组件

展示结构：
- 原题区域（带图标）
- 答案区域（高亮背景）
- 解析区域（详细说明）
- 来源区域（名称 + 年份 + 链接 + 置信度）

---

## 三、AI 配置扩展

### lib/ai/config.ts 修改

```typescript
// 新增多模态模型配置
export interface AIConfig {
  // ...现有配置
  vlModelName?: string;  // 多模态模型名称
}

// CN 区域配置
{
  provider: 'qwen',
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  modelName: 'qwen-max',
  searchModelName: 'qwen-turbo',
  vlModelName: 'qwen-vl-max'  // 新增
}
```

### 提示词设计

```typescript
// lib/i18n/ai-prompts/zh-CN.ts
export function getSearchQuestionPrompts() {
  return {
    systemPrompt: `你是一个专业的题目搜索助手。你的任务是：
1. 识别用户提供的题目内容（可能是文字或图片）
2. 联网搜索原题、答案和来源
3. 返回结构化的搜索结果

返回 JSON 格式：
{
  "originalQuestion": "原题文本",
  "answer": "答案",
  "explanation": "详细解析",
  "source": {
    "name": "来源名称",
    "year": "年份",
    "url": "原文链接"
  },
  "confidence": 0.95
}`,

    userPromptTemplate: (questionText: string) =>
      `请搜索以下题目的原题、答案和来源：\n\n${questionText}`
  }
}
```

---

## 四、UI 视觉设计

### 设计原则

- **风格**: Flat Design + Minimal
- **主色**: Indigo（继承项目主题）
- **圆角**: rounded-xl (12px)
- **支持深色模式**

### 搜题入口按钮

```tsx
<button className="
  fixed top-4 right-4 z-50
  flex items-center gap-2 px-4 py-2.5
  bg-indigo-600 hover:bg-indigo-700
  text-white rounded-full
  shadow-lg shadow-indigo-500/30
  transition-all duration-200
  cursor-pointer
">
  <Search className="w-5 h-5" />
  <span className="font-medium">搜题</span>
</button>
```

### 弹窗布局

- 固定居中弹窗
- 背景模糊遮罩
- 头部带关闭按钮
- 模式切换标签页
- 输入区域自适应

### 结果卡片配色

| 区域 | 颜色 | 用途 |
|------|------|------|
| 原题 | neutral | 默认背景 |
| 答案 | emerald | 绿色高亮 |
| 解析 | amber | 橙色图标 |
| 来源 | indigo | 品牌色标签 |

---

## 五、修改文件清单

| 文件 | 修改内容 |
|------|----------|
| `lib/ai/config.ts` | 添加 `vlModelName` 配置 |
| `lib/i18n/ai-prompts/zh-CN.ts` | 添加 `getSearchQuestionPrompts()` |
| `lib/i18n/ai-prompts/en-US.ts` | 添加英文版搜题提示词 |
| `app/api/exam/search-question/route.ts` | **新建**：搜题 API |
| `components/exam/QuestionSearch.tsx` | **新建**：搜题主组件 |
| `components/exam/SearchCameraCapture.tsx` | **新建**：拍照组件 |
| `components/exam/SearchResultCard.tsx` | **新建**：结果卡片 |
| `app/exam/page.tsx` | 添加搜题按钮入口 |

---

## 六、实现顺序

1. **API 层** - 先实现后端搜题 API
2. **配置层** - 扩展 AI 配置和提示词
3. **组件层** - 实现前端 UI 组件
4. **集成层** - 将搜题功能集成到考试页面
5. **测试** - 编写 E2E 测试验证功能

---

## 七、风险与对策

| 风险 | 对策 |
|------|------|
| qwen-vl API 响应慢 | 添加加载状态，设置超时 |
| 图片识别不准确 | 提供手动编辑识别结果的功能 |
| 联网搜索无结果 | 显示建议，引导用户优化输入 |
| 深色模式样式问题 | 严格测试两种模式 |
