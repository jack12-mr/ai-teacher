'use client';

import { useState, useRef } from 'react';
import { Search, X, PenLine, Camera, Loader2, CheckCircle2 } from 'lucide-react';
import SearchResultCard from './SearchResultCard';

// 搜索结果类型
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

// 进度步骤类型
interface ProgressStep {
  step: string;
  message: string;
  status: 'pending' | 'current' | 'done';
}

interface QuestionSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

type SearchMode = 'text' | 'camera';

export default function QuestionSearch({ isOpen, onClose }: QuestionSearchProps) {
  const [mode, setMode] = useState<SearchMode>('text');
  const [questionText, setQuestionText] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }

    // 检查文件大小（最大 10MB）
    if (file.size > 10 * 1024 * 1024) {
      setError('图片大小不能超过 10MB');
      return;
    }

    // 转换为 base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setCapturedImage(base64);
      setError(null);
    };
    reader.onerror = () => {
      setError('图片读取失败');
    };
    reader.readAsDataURL(file);
  };

  const handleSearch = async () => {
    if (mode === 'text' && !questionText.trim()) {
      setError('请输入题目内容');
      return;
    }

    if (mode === 'camera' && !capturedImage) {
      setError('请上传题目图片');
      return;
    }

    setIsSearching(true);
    setError(null);
    setSearchResult(null);

    // 初始化进度步骤
    const initialSteps: ProgressStep[] = mode === 'camera'
      ? [
          { step: 'ocr', message: '识别图片中的题目', status: 'pending' },
          { step: 'searching', message: '联网搜索原题', status: 'pending' },
          { step: 'found', message: '获取答案和解析', status: 'pending' },
        ]
      : [
          { step: 'searching', message: '联网搜索原题', status: 'pending' },
          { step: 'found', message: '获取答案和解析', status: 'pending' },
        ];
    setProgressSteps(initialSteps);

    try {
      const response = await fetch('/api/exam/search-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionText: mode === 'text' ? questionText.trim() : undefined,
          questionImage: mode === 'camera' ? capturedImage : undefined,
        }),
      });

      // 处理流式响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('无法读取响应流');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // 解析 SSE 消息
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'progress') {
                // 更新进度步骤状态
                setProgressSteps(prev => prev.map(step => {
                  if (step.step === data.step) {
                    return { ...step, status: 'current', message: data.message };
                  }
                  // 将之前的步骤标记为完成
                  const stepIndex = prev.findIndex(s => s.step === data.step);
                  const currentIndex = prev.findIndex(s => s.step === step.step);
                  if (currentIndex < stepIndex && step.status === 'pending') {
                    return { ...step, status: 'done' };
                  }
                  return step;
                }));

                // 短暂延迟后将当前步骤标记为完成
                setTimeout(() => {
                  setProgressSteps(prev => prev.map(step =>
                    step.step === data.step && step.status === 'current'
                      ? { ...step, status: 'done' }
                      : step
                  ));
                }, 300);
              } else if (data.type === 'result') {
                if (!data.success) {
                  setError(data.error || '搜索失败，请重试');
                } else {
                  setSearchResult(data.result);
                  // 将所有步骤标记为完成
                  setProgressSteps(prev => prev.map(step => ({ ...step, status: 'done' })));
                }
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }

    } catch (err) {
      console.error('搜题失败:', err);
      setError('网络错误，请检查网络连接后重试');
    } finally {
      setIsSearching(false);
    }
  };

  const handleReset = () => {
    setQuestionText('');
    setCapturedImage(null);
    setSearchResult(null);
    setError(null);
    setProgressSteps([]);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            搜索原题
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* 模式切换 */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 shrink-0">
          <button
            onClick={() => { setMode('text'); handleReset(); }}
            className={`
              flex-1 py-3 text-sm font-medium
              transition-colors duration-200 cursor-pointer
              ${mode === 'text'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}
            `}
          >
            <PenLine className="w-4 h-4 inline mr-2" />
            文字输入
          </button>
          <button
            onClick={() => { setMode('camera'); handleReset(); }}
            className={`
              flex-1 py-3 text-sm font-medium
              transition-colors duration-200 cursor-pointer
              ${mode === 'camera'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}
            `}
          >
            <Camera className="w-4 h-4 inline mr-2" />
            拍照搜题
          </button>
        </div>

        {/* 内容区域 */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* 文字输入模式 */}
          {mode === 'text' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                输入题目内容
              </label>
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="请输入要搜索的题目内容，越详细越准确..."
                className="
                  w-full h-32 px-4 py-3
                  bg-neutral-50 dark:bg-neutral-800
                  border border-neutral-200 dark:border-neutral-700
                  rounded-xl
                  text-neutral-900 dark:text-white
                  placeholder-neutral-400
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                  resize-none
                "
              />
            </div>
          )}

          {/* 拍照模式 */}
          {mode === 'camera' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {!capturedImage ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="
                    flex flex-col items-center justify-center
                    h-48
                    bg-neutral-50 dark:bg-neutral-800
                    border-2 border-dashed border-neutral-300 dark:border-neutral-600
                    rounded-xl
                    cursor-pointer
                    hover:border-indigo-400 dark:hover:border-indigo-500
                    transition-colors
                  "
                >
                  <Camera className="w-12 h-12 text-neutral-400 mb-3" />
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">点击上传题目图片</p>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">支持 JPG、PNG 格式，最大 10MB</p>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={capturedImage}
                    alt="已上传的题目"
                    className="w-full h-48 object-contain rounded-xl border border-neutral-200 dark:border-neutral-700"
                  />
                  <button
                    onClick={() => setCapturedImage(null)}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* 搜索按钮 */}
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="
              w-full mt-6 py-3
              bg-indigo-600 hover:bg-indigo-700
              text-white font-medium
              rounded-xl
              transition-colors duration-200
              cursor-pointer
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2
            "
          >
            {isSearching ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                搜索中...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                搜索原题
              </>
            )}
          </button>

          {/* 搜索进度显示 */}
          {progressSteps.length > 0 && (
            <div className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700">
              <div className="space-y-3">
                {progressSteps.map((step, index) => (
                  <div key={step.step} className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {step.status === 'done' && (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                      {step.status === 'current' && (
                        <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                      )}
                      {step.status === 'pending' && (
                        <div className="w-5 h-5 rounded-full border-2 border-neutral-300 dark:border-neutral-600" />
                      )}
                    </div>
                    <span className={`text-sm ${
                      step.status === 'done' ? 'text-green-600 dark:text-green-400' :
                      step.status === 'current' ? 'text-indigo-600 dark:text-indigo-400 font-medium' :
                      'text-neutral-400 dark:text-neutral-500'
                    }`}>
                      {step.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 搜索结果 */}
          {searchResult && (
            <SearchResultCard result={searchResult} />
          )}
        </div>
      </div>
    </div>
  );
}
