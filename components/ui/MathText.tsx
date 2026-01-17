"use client"

import { useMemo } from "react"
import katex from "katex"
import "katex/dist/katex.min.css"

interface MathTextProps {
  children: string
  className?: string
}

/**
 * MathText 组件 - 渲染包含 LaTeX 数学公式的文本
 *
 * 支持的格式：
 * - 行内公式：$...$
 * - 块级公式：$$...$$
 *
 * 示例：
 * <MathText>设随机变量 $X \sim N(0, 1)$，则 $P(-1 < X < 1)$ 的值为</MathText>
 */
export function MathText({ children, className = "" }: MathTextProps) {
  const renderedContent = useMemo(() => {
    if (!children) return ""

    try {
      // 首先处理块级公式 $$...$$
      let result = children.replace(/\$\$([\s\S]*?)\$\$/g, (_, latex) => {
        try {
          const html = katex.renderToString(latex.trim(), {
            displayMode: true,
            throwOnError: false,
            errorColor: "#cc0000",
            trust: true,
            strict: false,
          })
          return `<div class="katex-display-wrapper my-2">${html}</div>`
        } catch {
          return `<span class="text-red-500">[公式错误: ${latex}]</span>`
        }
      })

      // 然后处理行内公式 $...$（但不匹配 $$）
      result = result.replace(/\$([^\$]+?)\$/g, (_, latex) => {
        try {
          const html = katex.renderToString(latex.trim(), {
            displayMode: false,
            throwOnError: false,
            errorColor: "#cc0000",
            trust: true,
            strict: false,
          })
          return `<span class="katex-inline-wrapper">${html}</span>`
        } catch {
          return `<span class="text-red-500">[公式错误: ${latex}]</span>`
        }
      })

      return result
    } catch {
      return children
    }
  }, [children])

  return (
    <span
      className={`math-text ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  )
}

/**
 * MathBlock 组件 - 用于渲染整段包含数学公式的内容
 * 保留换行和段落格式
 */
export function MathBlock({ children, className = "" }: MathTextProps) {
  const renderedContent = useMemo(() => {
    if (!children) return ""

    try {
      // 首先处理块级公式 $$...$$
      let result = children.replace(/\$\$([\s\S]*?)\$\$/g, (_, latex) => {
        try {
          const html = katex.renderToString(latex.trim(), {
            displayMode: true,
            throwOnError: false,
            errorColor: "#cc0000",
            trust: true,
            strict: false,
          })
          return `<div class="katex-display-wrapper my-3">${html}</div>`
        } catch {
          return `<div class="text-red-500">[公式错误: ${latex}]</div>`
        }
      })

      // 然后处理行内公式 $...$
      result = result.replace(/\$([^\$]+?)\$/g, (_, latex) => {
        try {
          const html = katex.renderToString(latex.trim(), {
            displayMode: false,
            throwOnError: false,
            errorColor: "#cc0000",
            trust: true,
            strict: false,
          })
          return `<span class="katex-inline-wrapper">${html}</span>`
        } catch {
          return `<span class="text-red-500">[公式错误: ${latex}]</span>`
        }
      })

      // 处理换行
      result = result.replace(/\n/g, "<br />")

      return result
    } catch {
      return children
    }
  }, [children])

  return (
    <div
      className={`math-block ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  )
}
