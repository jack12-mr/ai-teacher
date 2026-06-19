/**
 * 错题本服务层 - 封装 API 调用
 */

export interface WrongQuestionData {
  questionId: string;
  question: any;
  userAnswer: number | number[] | string[];
}

export class WrongQuestionsError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'WrongQuestionsError';
  }
}

/**
 * 获取用户的错题列表
 * @throws {WrongQuestionsError} When the API call fails
 */
export async function fetchWrongQuestions(): Promise<any[]> {
  const response = await fetch("/api/exam/wrong-questions", {
    headers: {
      "x-user-id": getUserId(),
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new WrongQuestionsError(`获取错题失败 (HTTP ${response.status}): ${errorText}`);
  }

  const result = await response.json();
  return result.data || [];
}

/**
 * 添加错题
 * @throws {WrongQuestionsError} When the API call fails
 */
export async function saveWrongQuestion(data: WrongQuestionData): Promise<boolean> {
  const response = await fetch("/api/exam/wrong-questions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": getUserId(),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new WrongQuestionsError(`保存错题失败 (HTTP ${response.status}): ${errorText}`);
  }

  return true;
}

/**
 * 更新错题（标记为已掌握）
 * @throws {WrongQuestionsError} When the API call fails
 */
export async function updateWrongQuestion(id: string, mastered: boolean): Promise<boolean> {
  const response = await fetch("/api/exam/wrong-questions", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": getUserId(),
    },
    body: JSON.stringify({ id, mastered }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new WrongQuestionsError(`更新错题失败 (HTTP ${response.status}): ${errorText}`);
  }

  return true;
}

/**
 * 删除错题
 * @throws {WrongQuestionsError} When the API call fails
 */
export async function deleteWrongQuestion(id: string): Promise<boolean> {
  const response = await fetch(`/api/exam/wrong-questions?id=${id}`, {
    method: "DELETE",
    headers: {
      "x-user-id": getUserId(),
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new WrongQuestionsError(`删除错题失败 (HTTP ${response.status}): ${errorText}`);
  }

  return true;
}

/**
 * 获取用户 ID（根据区域自动选择认证方式）
 */
function getUserId(): string {
  const region = process.env.NEXT_PUBLIC_DEPLOYMENT_REGION || "CN";

  if (region === "CN") {
    // CloudBase Auth - 从 localStorage 获取
    const userStr = localStorage.getItem("auth_user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.id || "guest";
      } catch (e) {
        console.error("Failed to parse user from localStorage:", e instanceof Error ? e.message : e);
      }
    }
  } else {
    // Supabase Auth - 从 Supabase 客户端获取
    const userStr = localStorage.getItem("sb-hrcwybaukdyibnwayneq-auth-token");
    if (userStr) {
      try {
        const authData = JSON.parse(userStr);
        return authData?.user?.id || "guest";
      } catch (e) {
        console.error("Failed to parse Supabase auth token:", e instanceof Error ? e.message : e);
      }
    }
  }

  return "guest";
}
