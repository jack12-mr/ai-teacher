'use client';

import { FileQuestion, CheckCircle, Lightbulb, BookOpen } from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

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

interface SearchResultCardProps {
  result: SearchResult;
}

// 渲染包含 LaTeX 公式的文本
function renderMathText(text: string): React.ReactNode {
  if (!text) return null;

  // 匹配 LaTeX 公式的正则表达式
  // 支持 $$...$$ (块级), \[...\] (块级), $...$ (行内), \(...\) (行内)
  const parts: React.ReactNode[] = [];
  let keyIndex = 0;

  // 先处理块级公式 $$...$$ 和 \[...\]
  let processedText = text;

  // 匹配模式：$$...$$, \[...\], $...$, \(...\)
  const mathRegex = /(\$\$[\s\S]*?\$\$|\\[[\s\S]*?\\]|\$[^$\n]+?\$|\\\([^)]*?\\\))/g;

  let lastIndex = 0;
  let match;

  while ((match = mathRegex.exec(processedText)) !== null) {
    // 添加公式前的普通文本
    if (match.index > lastIndex) {
      const plainText = processedText.slice(lastIndex, match.index);
      parts.push(<span key={`text-${keyIndex++}`}>{plainText}</span>);
    }

    const matchedStr = match[0];
    let latex = '';
    let isBlock = false;

    // 提取 LaTeX 代码
    if (matchedStr.startsWith('$$') && matchedStr.endsWith('$$')) {
      latex = matchedStr.slice(2, -2).trim();
      isBlock = true;
    } else if (matchedStr.startsWith('\\[') && matchedStr.endsWith('\\]')) {
      latex = matchedStr.slice(2, -2).trim();
      isBlock = true;
    } else if (matchedStr.startsWith('$') && matchedStr.endsWith('$')) {
      latex = matchedStr.slice(1, -1).trim();
      isBlock = false;
    } else if (matchedStr.startsWith('\\(') && matchedStr.endsWith('\\)')) {
      latex = matchedStr.slice(2, -2).trim();
      isBlock = false;
    }

    // 尝试渲染 LaTeX
    try {
      const html = katex.renderToString(latex, {
        throwOnError: false,
        displayMode: isBlock,
        trust: true,
        strict: false,
      });

      if (isBlock) {
        parts.push(
          <div
            key={`math-${keyIndex++}`}
            className="my-2 overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      } else {
        parts.push(
          <span
            key={`math-${keyIndex++}`}
            className="inline-block align-middle"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      }
    } catch {
      // 渲染失败时显示原始文本
      parts.push(
        <span key={`math-error-${keyIndex++}`} className="text-red-500">
          {matchedStr}
        </span>
      );
    }

    lastIndex = match.index + matchedStr.length;
  }

  // 添加剩余的普通文本
  if (lastIndex < processedText.length) {
    const plainText = processedText.slice(lastIndex);
    parts.push(<span key={`text-${keyIndex++}`}>{plainText}</span>);
  }

  return parts.length > 0 ? parts : text;
}

// 包装组件：处理文本渲染
function MathText({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className}>
      {renderMathText(text)}
    </span>
  );
}

export default function SearchResultCard({ result }: SearchResultCardProps) {
  return (
    <div className="mt-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
      {/* 原题 */}
      <div className="p-4 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 mb-2">
          <FileQuestion className="w-4 h-4" />
          <span className="font-medium">原题</span>
        </div>
        <div className="text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap">
          <MathText text={result.originalQuestion} />
        </div>
      </div>

      {/* 答案 */}
      <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 bg-emerald-50/50 dark:bg-emerald-950/20">
        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 mb-2">
          <CheckCircle className="w-4 h-4" />
          <span className="font-medium">答案</span>
        </div>
        <div className="text-emerald-700 dark:text-emerald-400 font-medium text-lg">
          <MathText text={result.answer} />
        </div>
      </div>

      {/* 解析 */}
      <div className="p-4 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 mb-2">
          <Lightbulb className="w-4 h-4" />
          <span className="font-medium">解析</span>
        </div>
        <div className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed whitespace-pre-wrap">
          <MathText text={result.explanation} />
        </div>
      </div>

      {/* 来源 */}
      <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
            <BookOpen className="w-4 h-4" />
            <span>
              来源: {result.source.name}
              {result.source.year && ` · ${result.source.year}`}
            </span>
          </div>
          <div className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-medium rounded-full">
            置信度 {(result.confidence * 100).toFixed(0)}%
          </div>
        </div>
      </div>
    </div>
  );
}
