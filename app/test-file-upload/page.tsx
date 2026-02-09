"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload } from "lucide-react"
import { parseFileEnhanced, validateFileEnhanced } from "@/lib/file-parser-enhanced"

export default function TestFileUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResult(null)
    }
  }

  const handleTest = async () => {
    if (!file) return

    setLoading(true)
    setResult(null)

    try {
      console.log('=== 开始测试文件上传 ===')

      // 先验证
      const validation = await validateFileEnhanced(file)
      console.log('验证结果:', validation)

      // 再解析
      const parseResult = await parseFileEnhanced(file)
      console.log('解析结果:', parseResult)

      setResult({
        validation,
        parseResult
      })
    } catch (error) {
      console.error('测试失败:', error)
      setResult({
        error: error instanceof Error ? error.message : String(error)
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">文件上传诊断工具</h1>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">上传测试文件</h2>

          <div className="space-y-4">
            <div>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </div>

            {file && (
              <div className="bg-gray-100 p-4 rounded-md">
                <p className="text-sm"><strong>文件名:</strong> {file.name}</p>
                <p className="text-sm"><strong>大小:</strong> {(file.size / 1024).toFixed(2)} KB</p>
                <p className="text-sm"><strong>MIME类型:</strong> {file.type || '(未知)'}</p>
              </div>
            )}

            <Button
              onClick={handleTest}
              disabled={!file || loading}
              className="w-full"
            >
              {loading ? '测试中...' : '开始测试'}
            </Button>
          </div>
        </Card>

        {result && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">诊断结果</h2>

            {result.error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <p className="text-red-800 font-semibold">错误:</p>
                <p className="text-red-700">{result.error}</p>
              </div>
            )}

            {result.validation && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">1. 文件验证</h3>
                <div className={`p-4 rounded-md ${result.validation.valid ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className="font-semibold mb-2">
                    {result.validation.valid ? '✅ 验证通过' : '❌ 验证失败'}
                  </p>
                  {result.validation.error && (
                    <p className="text-red-700 mb-2">{result.validation.error}</p>
                  )}

                  {result.validation.diagnostics && (
                    <div className="mt-4 space-y-2 text-sm">
                      <p><strong>文件名:</strong> {result.validation.diagnostics.fileName}</p>
                      <p><strong>大小:</strong> {result.validation.diagnostics.fileSize} bytes</p>
                      <p><strong>MIME类型:</strong> {result.validation.diagnostics.mimeType}</p>
                      <p><strong>扩展名:</strong> {result.validation.diagnostics.extension}</p>

                      {result.validation.diagnostics.magicNumber && (
                        <div className="mt-2">
                          <p><strong>文件签名检测:</strong></p>
                          <p className="ml-4">检测到: {result.validation.diagnostics.magicNumber.detected || '未知格式'}</p>
                          <p className="ml-4">匹配: {result.validation.diagnostics.magicNumber.match ? '是' : '否'}</p>
                          <p className="ml-4 font-mono text-xs">
                            字节: {result.validation.diagnostics.magicNumber.bytes.map((b: number) => '0x' + b.toString(16).toUpperCase()).join(' ')}
                          </p>
                        </div>
                      )}

                      {result.validation.diagnostics.issues && result.validation.diagnostics.issues.length > 0 && (
                        <div className="mt-2">
                          <p className="text-orange-700"><strong>发现的问题:</strong></p>
                          <ul className="ml-4 list-disc">
                            {result.validation.diagnostics.issues.map((issue: string, i: number) => (
                              <li key={i} className="text-orange-600">{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {result.parseResult && (
              <div>
                <h3 className="font-semibold mb-2">2. 文件解析</h3>
                <div className={`p-4 rounded-md ${result.parseResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className="font-semibold mb-2">
                    {result.parseResult.success ? '✅ 解析成功' : '❌ 解析失败'}
                  </p>
                  {result.parseResult.error && (
                    <p className="text-red-700 mb-2">{result.parseResult.error}</p>
                  )}
                  {result.parseResult.success && result.parseResult.text && (
                    <div className="mt-4">
                      <p className="text-sm"><strong>提取的文本长度:</strong> {result.parseResult.text.length} 字符</p>
                      <div className="mt-2 p-2 bg-white rounded border max-h-40 overflow-y-auto">
                        <p className="text-xs font-mono whitespace-pre-wrap">
                          {result.parseResult.text.substring(0, 500)}
                          {result.parseResult.text.length > 500 && '...'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                💡 <strong>提示:</strong> 请打开浏览器控制台 (F12) 查看详细的调试日志
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
