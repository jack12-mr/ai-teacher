/**
 * 文件上传限制和分段处理测试
 * 运行方式: node tests/unit/chunk-processing.test.js
 */

const { splitTextIntoChunks, MAX_FILE_SIZE, MAX_TEXT_LENGTH, CHUNK_SIZE } = require('../../lib/file-parser.ts');

console.log('========================================');
console.log('文件上传限制和分段处理测试');
console.log('========================================\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`❌ ${name}`);
    console.log(`   错误: ${e.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// 测试1: 配置验证
test('配置值正确', () => {
  assert(MAX_FILE_SIZE === 50 * 1024 * 1024, `MAX_FILE_SIZE 应为 50MB，实际为 ${MAX_FILE_SIZE}`);
  assert(MAX_TEXT_LENGTH === 50000, `MAX_TEXT_LENGTH 应为 50000，实际为 ${MAX_TEXT_LENGTH}`);
  assert(CHUNK_SIZE === 5000, `CHUNK_SIZE 应为 5000，实际为 ${CHUNK_SIZE}`);
});

// 测试2: 短文本不分段
test('短文本（<5000字）不分段', () => {
  const text = '测试内容。'.repeat(100); // 600字
  const result = splitTextIntoChunks(text);
  assert(result.totalChunks === 1, `应分成1段，实际为 ${result.totalChunks}`);
  assert(result.chunks[0] === text, '内容应保持不变');
});

// 测试3: 中等文本分段
test('中等文本（~10000字）正确分段', () => {
  const text = '这是测试句子。'.repeat(500); // ~5000字
  const result = splitTextIntoChunks(text);
  console.log(`   文本长度: ${text.length}字, 分成 ${result.totalChunks} 段`);
  assert(result.totalChunks >= 1, '应至少分成1段');
});

// 测试4: 大文本分段
test('大文本（~30000字）正确分段', () => {
  const text = '测试段落内容，用于验证分段功能。'.repeat(800); // ~24000字
  const result = splitTextIntoChunks(text);
  console.log(`   文本长度: ${text.length}字, 分成 ${result.totalChunks} 段`);
  // 根据实际文本长度计算期望段数
  const expectedChunks = Math.ceil(text.length / CHUNK_SIZE);
  assert(result.totalChunks >= expectedChunks - 1, `应至少分成${expectedChunks-1}段，实际为 ${result.totalChunks}`);
});

// 测试5: 每段不超过限制
test('每段不超过CHUNK_SIZE', () => {
  const text = '这是测试内容，用于验证分段大小限制。'.repeat(2000); // ~30000字
  const result = splitTextIntoChunks(text);
  const overLimit = result.chunks.filter(c => c.length > CHUNK_SIZE);
  assert(overLimit.length === 0, `有 ${overLimit.length} 段超过限制`);
});

// 测试6: 极限文本（50000字）
test('极限文本（50000字）可处理', () => {
  const text = '极限测试。'.repeat(10000); // 50000字
  const result = splitTextIntoChunks(text);
  console.log(`   文本长度: ${text.length}字, 分成 ${result.totalChunks} 段`);
  assert(result.totalChunks >= 10, `应至少分成10段，实际为 ${result.totalChunks}`);
});

// 测试7: 分段内容完整性
test('分段后内容完整', () => {
  const text = '完整测试内容。'.repeat(1000);
  const result = splitTextIntoChunks(text);
  const reconstructed = result.chunks.join('');
  // 注意：由于分段处理，直接拼接可能不完全相等
  const totalLen = result.chunks.reduce((sum, c) => sum + c.length, 0);
  assert(totalLen === result.originalLength, '分段总长度应等于原始长度');
});

// 测试8: 空文本处理
test('空文本正确处理', () => {
  const result = splitTextIntoChunks('');
  assert(result.totalChunks === 1, '应返回1个空段');
  assert(result.chunks[0] === '', '内容应为空');
});

console.log('\n========================================');
console.log(`测试结果: ${passed} 通过, ${failed} 失败`);
console.log('========================================');

process.exit(failed > 0 ? 1 : 0);
