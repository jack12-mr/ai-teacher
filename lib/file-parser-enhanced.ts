/**
 * 增强版文件解析工具 - 带详细诊断
 * 用于调试文件上传问题
 */

import { parseFile as originalParseFile, ParseResult } from './file-parser'

/**
 * 文件魔数(文件签名)检测
 */
const FILE_SIGNATURES = {
  pdf: [0x25, 0x50, 0x44, 0x46], // %PDF
  docx: [0x50, 0x4B, 0x03, 0x04], // ZIP (DOCX是ZIP格式)
  doc: [0xD0, 0xCF, 0x11, 0xE0], // OLE2 (旧版DOC)
}

/**
 * 检查文件魔数
 */
async function checkFileMagicNumber(file: File): Promise<{
  detected: string | null
  bytes: number[]
  match: boolean
}> {
  const buffer = await file.slice(0, 8).arrayBuffer()
  const bytes = Array.from(new Uint8Array(buffer))

  // 检查 PDF
  if (bytes.slice(0, 4).every((b, i) => b === FILE_SIGNATURES.pdf[i])) {
    return { detected: 'pdf', bytes, match: true }
  }

  // 检查 DOCX (ZIP格式)
  if (bytes.slice(0, 4).every((b, i) => b === FILE_SIGNATURES.docx[i])) {
    return { detected: 'docx', bytes, match: true }
  }

  // 检查旧版 DOC
  if (bytes.slice(0, 4).every((b, i) => b === FILE_SIGNATURES.doc[i])) {
    return { detected: 'doc (旧版)', bytes, match: true }
  }

  return { detected: null, bytes, match: false }
}

/**
 * 增强的文件验证
 */
export async function validateFileEnhanced(file: File): Promise<{
  valid: boolean
  error?: string
  diagnostics: {
    fileName: string
    fileSize: number
    mimeType: string
    extension: string
    magicNumber: {
      detected: string | null
      bytes: number[]
      match: boolean
    }
    issues: string[]
  }
}> {
  const extension = '.' + file.name.split('.').pop()?.toLowerCase()
  const issues: string[] = []

  // 检查文件魔数
  const magicNumber = await checkFileMagicNumber(file)

  // 诊断信息
  const diagnostics = {
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type || '(未知)',
    extension,
    magicNumber,
    issues
  }

  // 检查文件大小
  if (file.size === 0) {
    issues.push('文件大小为 0')
    return {
      valid: false,
      error: '文件为空',
      diagnostics
    }
  }

  if (file.size > 10 * 1024 * 1024) {
    issues.push(`文件过大: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
    return {
      valid: false,
      error: '文件大小超过 10MB 限制',
      diagnostics
    }
  }

  // 检查扩展名
  if (!['.pdf', '.docx', '.doc'].includes(extension)) {
    issues.push(`不支持的扩展名: ${extension}`)
    return {
      valid: false,
      error: `不支持的文件格式: ${extension}`,
      diagnostics
    }
  }

  // 检查旧版 .doc
  if (extension === '.doc') {
    issues.push('检测到旧版 .doc 格式 (不支持)')
    if (magicNumber.detected === 'doc (旧版)') {
      return {
        valid: false,
        error: '不支持旧版 .doc 格式，请转换为 .docx 格式后重试',
        diagnostics
      }
    }
  }

  // 检查文件魔数与扩展名是否匹配
  if (!magicNumber.match) {
    issues.push(`文件签名不匹配: 扩展名是 ${extension}, 但文件头是 ${magicNumber.bytes.map(b => '0x' + b.toString(16).toUpperCase()).join(' ')}`)

    if (magicNumber.detected) {
      return {
        valid: false,
        error: `文件格式不匹配: 文件扩展名是 ${extension}, 但实际是 ${magicNumber.detected} 格式`,
        diagnostics
      }
    } else {
      return {
        valid: false,
        error: `无法识别的文件格式 (文件可能已损坏或不是有效的 PDF/Word 文档)`,
        diagnostics
      }
    }
  }

  // 检查 MIME 类型
  const expectedMimeTypes: Record<string, string[]> = {
    '.pdf': ['application/pdf'],
    '.docx': [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip' // 某些系统可能识别为 ZIP
    ],
    '.doc': ['application/msword']
  }

  const expected = expectedMimeTypes[extension] || []
  if (file.type && !expected.includes(file.type)) {
    issues.push(`MIME 类型不匹配: 期望 ${expected.join(' 或 ')}, 实际是 ${file.type}`)
    // 注意: 这只是警告,不阻止上传,因为某些系统的 MIME 类型可能不准确
  }

  return {
    valid: true,
    diagnostics
  }
}

/**
 * 增强的文件解析 - 带详细错误信息
 */
export async function parseFileEnhanced(file: File): Promise<ParseResult & {
  diagnostics?: any
}> {
  console.log('=== 文件解析诊断开始 ===')
  console.log('文件名:', file.name)
  console.log('文件大小:', file.size, 'bytes')
  console.log('MIME 类型:', file.type)

  // 先进行增强验证
  const validation = await validateFileEnhanced(file)

  console.log('验证结果:', validation)

  if (!validation.valid) {
    console.error('验证失败:', validation.error)
    console.error('诊断信息:', validation.diagnostics)
    return {
      success: false,
      text: '',
      error: validation.error,
      diagnostics: validation.diagnostics
    }
  }

  if (validation.diagnostics.issues.length > 0) {
    console.warn('发现问题:', validation.diagnostics.issues)
  }

  // 调用原始解析函数
  try {
    console.log('开始解析文件...')
    const result = await originalParseFile(file)
    console.log('解析结果:', result.success ? '成功' : '失败')

    if (!result.success) {
      console.error('解析错误:', result.error)
    }

    console.log('=== 文件解析诊断结束 ===')

    return {
      ...result,
      diagnostics: validation.diagnostics
    }
  } catch (error) {
    console.error('解析异常:', error)
    console.log('=== 文件解析诊断结束 ===')

    return {
      success: false,
      text: '',
      error: error instanceof Error ? error.message : '未知错误',
      diagnostics: validation.diagnostics
    }
  }
}
