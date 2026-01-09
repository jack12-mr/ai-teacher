// 科目评测维度映射表

export interface SubjectDimension {
  id: string;
  name: string;
  description: string;
}

export interface SubjectConfig {
  id: string;
  name: string;
  keywords: string[];  // 用于模糊匹配
  dimensions: SubjectDimension[];
}

export const SUBJECT_DIMENSIONS: SubjectConfig[] = [
  {
    id: 'kaoyan_math',
    name: '考研数学',
    keywords: ['考研数学', '考研高数', '数学一', '数学二', '数学三', '高数'],
    dimensions: [
      { id: 'calculus', name: '高等数学', description: '极限、导数、积分、微分方程' },
      { id: 'linear_algebra', name: '线性代数', description: '矩阵、行列式、向量空间' },
      { id: 'probability', name: '概率论与数理统计', description: '随机变量、分布、假设检验' },
      { id: 'speed', name: '解题速度', description: '限时解题能力' },
    ],
  },
  {
    id: 'kaoyan_english',
    name: '考研英语',
    keywords: ['考研英语', '英语一', '英语二'],
    dimensions: [
      { id: 'reading', name: '阅读理解', description: '长篇阅读、信息筛选' },
      { id: 'translation', name: '翻译能力', description: '英译汉、长难句分析' },
      { id: 'writing', name: '写作水平', description: '大小作文、图表描述' },
      { id: 'vocabulary', name: '词汇量', description: '核心词汇掌握程度' },
    ],
  },
  {
    id: 'kaoyan_politics',
    name: '考研政治',
    keywords: ['考研政治', '政治', '马原', '毛中特'],
    dimensions: [
      { id: 'marxism', name: '马克思主义原理', description: '唯物辩证法、政治经济学' },
      { id: 'mzd', name: '毛中特', description: '毛泽东思想和中国特色社会主义' },
      { id: 'history', name: '近代史纲要', description: '中国近现代史' },
      { id: 'ethics', name: '思修法基', description: '思想道德修养与法律基础' },
    ],
  },
  {
    id: 'cet4',
    name: '大学英语四级',
    keywords: ['四级', 'CET4', 'CET-4', '英语四级', '大学英语四级'],
    dimensions: [
      { id: 'listening', name: '听力理解', description: '短对话、长对话、篇章听力' },
      { id: 'reading', name: '阅读理解', description: '选词填空、匹配、深度阅读' },
      { id: 'translation', name: '翻译能力', description: '汉译英段落翻译' },
      { id: 'writing', name: '写作表达', description: '议论文、说明文写作' },
    ],
  },
  {
    id: 'cet6',
    name: '大学英语六级',
    keywords: ['六级', 'CET6', 'CET-6', '英语六级', '大学英语六级'],
    dimensions: [
      { id: 'listening', name: '听力理解', description: '高级听力理解与推理' },
      { id: 'reading', name: '阅读理解', description: '学术文章、复杂篇章' },
      { id: 'translation', name: '翻译能力', description: '文化类段落翻译' },
      { id: 'writing', name: '写作表达', description: '高级议论文写作' },
    ],
  },
  {
    id: 'computer_exam',
    name: '计算机考试',
    keywords: ['计算机', '408', '软考', '计算机二级', 'NCRE', '计算机考试'],
    dimensions: [
      { id: 'data_structure', name: '数据结构', description: '链表、树、图、排序算法' },
      { id: 'os', name: '操作系统', description: '进程管理、内存管理、文件系统' },
      { id: 'network', name: '计算机网络', description: 'TCP/IP、HTTP、网络协议' },
      { id: 'database', name: '数据库', description: 'SQL、范式、事务' },
    ],
  },
  {
    id: 'civil_service',
    name: '公务员考试',
    keywords: ['公务员', '国考', '省考', '行测', '申论'],
    dimensions: [
      { id: 'verbal', name: '言语理解', description: '阅读理解、逻辑填空' },
      { id: 'logic', name: '判断推理', description: '图形推理、逻辑判断' },
      { id: 'math', name: '数量关系', description: '数学运算、数字推理' },
      { id: 'essay', name: '申论写作', description: '概括归纳、综合分析、对策建议' },
    ],
  },
  {
    id: 'toefl',
    name: '托福',
    keywords: ['托福', 'TOEFL', 'toefl'],
    dimensions: [
      { id: 'reading', name: '阅读', description: '学术文章阅读理解' },
      { id: 'listening', name: '听力', description: '讲座和对话理解' },
      { id: 'speaking', name: '口语', description: '独立和综合口语任务' },
      { id: 'writing', name: '写作', description: '综合写作和独立写作' },
    ],
  },
  {
    id: 'ielts',
    name: '雅思',
    keywords: ['雅思', 'IELTS', 'ielts'],
    dimensions: [
      { id: 'reading', name: '阅读', description: '学术类阅读理解' },
      { id: 'listening', name: '听力', description: '日常和学术场景听力' },
      { id: 'speaking', name: '口语', description: '面试口语表达' },
      { id: 'writing', name: '写作', description: '图表描述和议论文' },
    ],
  },
  {
    id: 'teacher_cert',
    name: '教师资格证',
    keywords: ['教师资格证', '教资', '教师证'],
    dimensions: [
      { id: 'knowledge', name: '综合素质', description: '职业理念、法律法规、文化素养' },
      { id: 'pedagogy', name: '教育知识', description: '教育学、心理学基础' },
      { id: 'subject', name: '学科知识', description: '专业学科知识与教学能力' },
      { id: 'interview', name: '面试技巧', description: '试讲、答辩、结构化面试' },
    ],
  },
  {
    id: 'cpa',
    name: '注册会计师',
    keywords: ['注册会计师', 'CPA', '注会'],
    dimensions: [
      { id: 'accounting', name: '会计', description: '财务会计、成本会计' },
      { id: 'audit', name: '审计', description: '审计理论与实务' },
      { id: 'tax', name: '税法', description: '税收法规与税务筹划' },
      { id: 'finance', name: '财务管理', description: '财务分析、投资决策' },
    ],
  },
];

// 默认维度（当无法匹配时使用）
export const DEFAULT_DIMENSIONS: SubjectDimension[] = [
  { id: 'basic', name: '基础知识', description: '核心概念掌握程度' },
  { id: 'application', name: '应用能力', description: '知识运用与解题能力' },
  { id: 'analysis', name: '分析能力', description: '问题分析与逻辑推理' },
  { id: 'speed', name: '答题速度', description: '限时解题效率' },
];

/**
 * 根据科目名称匹配评测维度
 */
export function getSubjectDimensions(subjectName: string): SubjectDimension[] {
  const lowerName = subjectName.toLowerCase().trim();

  for (const subject of SUBJECT_DIMENSIONS) {
    for (const keyword of subject.keywords) {
      if (lowerName.includes(keyword.toLowerCase()) ||
          keyword.toLowerCase().includes(lowerName)) {
        return subject.dimensions;
      }
    }
  }

  return DEFAULT_DIMENSIONS;
}

/**
 * 获取匹配的科目配置
 */
export function getSubjectConfig(subjectName: string): SubjectConfig | null {
  const lowerName = subjectName.toLowerCase().trim();

  for (const subject of SUBJECT_DIMENSIONS) {
    for (const keyword of subject.keywords) {
      if (lowerName.includes(keyword.toLowerCase()) ||
          keyword.toLowerCase().includes(lowerName)) {
        return subject;
      }
    }
  }

  return null;
}

/**
 * 获取所有可用的科目列表（用于快捷选择）
 */
export function getAllSubjects(): { id: string; name: string }[] {
  return SUBJECT_DIMENSIONS.map(s => ({ id: s.id, name: s.name }));
}
