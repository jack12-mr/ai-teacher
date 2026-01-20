"use server";

/**
 * 管理后台 - 评估记录管理 Server Actions
 *
 * 提供评估记录列表、查看、删除等功能
 * 支持双数据库（CloudBase + Supabase）
 */

import { requireAdminSession } from "@/lib/admin/session";
import { getDatabaseAdapter } from "@/lib/admin/database";
import type {
  Assessment,
  AssessmentFilters,
  ApiResponse,
  PaginatedResult,
} from "@/lib/admin/types";
import { revalidatePath } from "next/cache";

/**
 * 获取评估记录列表
 */
export async function listAssessments(
  filters?: AssessmentFilters
): Promise<ApiResponse<PaginatedResult<Assessment>>> {
  try {
    const session = await requireAdminSession();

    const db = await getDatabaseAdapter();
    const assessments = await db.listAssessments(filters || {});
    const total = await db.countAssessments(filters || {});

    const pageSize = filters?.limit || 20;
    const page = filters?.offset ? Math.floor(filters.offset / pageSize) + 1 : 1;

    return {
      success: true,
      data: {
        items: assessments,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (error: any) {
    console.error("获取评估记录失败:", error);
    return {
      success: false,
      error: error.message || "获取评估记录失败",
    };
  }
}

/**
 * 获取单个评估记录详情
 */
export async function getAssessmentById(
  assessmentId: string
): Promise<ApiResponse<Assessment>> {
  try {
    const session = await requireAdminSession();

    const db = await getDatabaseAdapter();
    const assessment = await db.getAssessmentById(assessmentId);

    if (!assessment) {
      return {
        success: false,
        error: "评估记录不存在",
      };
    }

    return {
      success: true,
      data: assessment,
    };
  } catch (error: any) {
    console.error("获取评估详情失败:", error);
    return {
      success: false,
      error: error.message || "获取评估详情失败",
    };
  }
}

/**
 * 删除评估记录
 */
export async function deleteAssessment(
  assessmentId: string
): Promise<ApiResponse<void>> {
  try {
    const session = await requireAdminSession();

    const db = await getDatabaseAdapter();
    await db.deleteAssessment(assessmentId);

    // 记录操作日志
    await db.createLog({
      admin_id: session.adminId,
      admin_username: session.username,
      action: "assessment.delete",
      resource_type: "assessment",
      resource_id: assessmentId,
      details: {},
      status: "success",
    });

    revalidatePath("/admin/assessments");

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("删除评估记录失败:", error);
    return {
      success: false,
      error: error.message || "删除评估记录失败",
    };
  }
}

/**
 * 获取评估统计信息
 */
export async function getAssessmentStats(): Promise<ApiResponse<{
  total: number;
  thisMonth: number;
  today: number;
  completed: number;
  inProgress: number;
  averageScore: number;
}>> {
  try {
    const session = await requireAdminSession();
    const db = await getDatabaseAdapter();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const [total, thisMonth, today, completed, inProgress] = await Promise.all([
      db.countAssessments(),
      db.countAssessments({ start_date: startOfMonth }),
      db.countAssessments({ start_date: startOfDay }),
      db.countAssessments({ status: "completed" }),
      db.countAssessments({ status: "in_progress" }),
    ]);

    return {
      success: true,
      data: {
        total,
        thisMonth,
        today,
        completed,
        inProgress,
        averageScore: 0, // TODO: 计算平均分
      },
    };
  } catch (error: any) {
    console.error("获取评估统计失败:", error);
    return {
      success: false,
      error: error.message || "获取评估统计失败",
    };
  }
}
