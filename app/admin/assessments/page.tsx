"use client";

/**
 * 管理后台 - 评估记录管理页面
 *
 * 完整功能：
 * - 评估记录列表展示（支持分页）
 * - 搜索和筛选
 * - 查看评估详情
 * - 删除评估记录
 * - 评估统计展示
 */

import { useState, useEffect, useMemo } from "react";
import {
  listAssessments,
  getAssessmentStats,
  deleteAssessment,
  type Assessment,
} from "@/actions/admin-assessments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  Search,
  RefreshCw,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Timer,
  Star,
} from "lucide-react";

export default function AssessmentsManagementPage() {
  // ==================== 状态管理 ====================
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // 分页状态
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);

  // 筛选状态
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  // 对话框状态
  const [viewingAssessment, setViewingAssessment] = useState<Assessment | null>(null);
  const [deletingAssessment, setDeletingAssessment] = useState<Assessment | null>(null);

  // ==================== 筛选后的评估列表 ====================
  const filteredAssessments = useMemo(() => {
    return assessments.filter((assessment) => {
      if (filterStatus !== "all" && assessment.status !== filterStatus) {
        return false;
      }
      if (filterType !== "all" && assessment.type !== filterType) {
        return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          assessment.user_email?.toLowerCase().includes(query) ||
          assessment.type?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [assessments, filterStatus, filterType, searchQuery]);

  // ==================== 数据加载 ====================
  async function loadAssessments() {
    setLoading(true);
    setError(null);

    try {
      const offset = (page - 1) * pageSize;
      const result = await listAssessments({
        limit: pageSize,
        offset,
      });

      if (result.success && result.data) {
        setAssessments(result.data.items);
        setTotal(result.data.total);
      } else {
        setError(result.error || "加载失败");
      }
    } catch (err) {
      setError("加载评估记录失败");
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    setStatsLoading(true);
    try {
      const result = await getAssessmentStats();
      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (err) {
      console.error("加载统计失败:", err);
    } finally {
      setStatsLoading(false);
    }
  }

  useEffect(() => {
    loadAssessments();
  }, [page]);

  useEffect(() => {
    loadStats();
  }, []);

  // ==================== 删除操作 ====================
  async function handleDelete(assessment: Assessment) {
    setDeleting(assessment.id);

    try {
      const result = await deleteAssessment(assessment.id);

      if (result.success) {
        setAssessments((prev) => prev.filter((a) => a.id !== assessment.id));
        loadStats();
        setDeletingAssessment(null);
      } else {
        setError(result.error || "删除失败");
      }
    } catch (err) {
      setError("删除失败");
    } finally {
      setDeleting(null);
    }
  }

  // ==================== 工具函数 ====================
  function getStatusBadge(status: string) {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-600 gap-1">
            <CheckCircle className="h-3 w-3" />
            已完成
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="secondary" className="gap-1">
            <Timer className="h-3 w-3" />
            进行中
          </Badge>
        );
      case "abandoned":
        return (
          <Badge variant="outline" className="gap-1">
            <XCircle className="h-3 w-3" />
            已放弃
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  function getScoreBadge(score: number | undefined) {
    if (score === undefined || score === null) {
      return <Badge variant="outline">未评分</Badge>;
    }
    if (score >= 90) {
      return <Badge variant="default" className="bg-green-600">优秀 {score}</Badge>;
    }
    if (score >= 80) {
      return <Badge variant="secondary" className="bg-blue-600">良好 {score}</Badge>;
    }
    if (score >= 60) {
      return <Badge variant="secondary" className="bg-yellow-600">及格 {score}</Badge>;
    }
    return <Badge variant="destructive">不及格 {score}</Badge>;
  }

  function formatDate(dateStr: string | undefined) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatDateOnly(dateStr: string | undefined) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  // ==================== 分页 ====================
  const totalPages = Math.ceil(total / pageSize);

  // ==================== 渲染 ====================
  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">评估记录管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            查看和管理所有评估记录，共 {total} 条记录
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadAssessments} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {statsLoading ? (
          // 骨架屏：加载时显示
          <>
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : stats ? (
          // 数据加载完成：显示实际数据
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  总评估数
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  总评估次数
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  本月评估
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.thisMonth}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  今日评估
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.today}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  已完成
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  进行中
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {/* 搜索和筛选栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索用户邮箱或评估类型..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
                <SelectItem value="in_progress">进行中</SelectItem>
                <SelectItem value="abandoned">已放弃</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="评估类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="assessment">技能评估</SelectItem>
                <SelectItem value="practice">练习测试</SelectItem>
                <SelectItem value="review">复习测试</SelectItem>
              </SelectContent>
            </Select>

            {/* 清除筛选 */}
            {(searchQuery || filterStatus !== "all" || filterType !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setFilterStatus("all");
                  setFilterType("all");
                }}
              >
                清除筛选
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 评估记录列表 */}
      <Card>
        <CardHeader>
          <CardTitle>评估记录列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredAssessments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery || filterStatus !== "all" || filterType !== "all"
                ? "没有符合筛选条件的评估记录"
                : "暂无评估记录"}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">用户</TableHead>
                      <TableHead>评估类型</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>分数</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead>完成时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssessments.map((assessment) => (
                      <TableRow key={assessment.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">
                                {assessment.user_email || "未知用户"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                ID: {assessment.id.slice(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{assessment.type}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(assessment.status)}</TableCell>
                        <TableCell>
                          {getScoreBadge(assessment.score)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateOnly(assessment.created_at)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateOnly(assessment.completed_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setViewingAssessment(assessment)}
                              title="查看详情"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="删除"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>确认删除</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    确定要删除这条评估记录吗？此操作不可恢复。
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>取消</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => {
                                      setDeletingAssessment(assessment);
                                      handleDelete(assessment);
                                    }}
                                    className="bg-red-600 hover:bg-red-700"
                                    disabled={deleting !== null}
                                  >
                                    {deleting === assessment.id ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        删除中...
                                      </>
                                    ) : (
                                      "删除"
                                    )}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* 分页 */}
              {total > pageSize && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    显示第 {(page - 1) * pageSize + 1} -{" "}
                    {Math.min(page * pageSize, total)} 条，共 {total} 条
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      上一页
                    </Button>
                    <div className="text-sm">
                      第 <span className="font-medium">{page}</span> /{" "}
                      <span>{totalPages}</span> 页
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      下一页
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 查看评估详情对话框 */}
      <Dialog open={!!viewingAssessment} onOpenChange={() => setViewingAssessment(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>评估详情</DialogTitle>
          </DialogHeader>
          {viewingAssessment && (
            <div className="space-y-6">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">评估ID：</span>
                  <div className="font-mono text-xs mt-1">{viewingAssessment.id}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">评估类型：</span>
                  <div className="mt-1">
                    <Badge variant="outline">{viewingAssessment.type}</Badge>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">用户邮箱：</span>
                  <div className="mt-1">{viewingAssessment.user_email || "未知"}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">评估状态：</span>
                  <div className="mt-1">{getStatusBadge(viewingAssessment.status)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">创建时间：</span>
                  <div className="mt-1">{formatDate(viewingAssessment.created_at)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">完成时间：</span>
                  <div className="mt-1">{formatDate(viewingAssessment.completed_at)}</div>
                </div>
              </div>

              {/* 分数 */}
              {viewingAssessment.score !== undefined && (
                <div>
                  <h3 className="text-sm font-medium mb-2">评估分数</h3>
                  <div className="text-3xl font-bold">
                    {getScoreBadge(viewingAssessment.score)}
                  </div>
                </div>
              )}

              {/* AI 反馈 */}
              {viewingAssessment.feedback && (
                <div>
                  <h3 className="text-sm font-medium mb-2">AI 反馈</h3>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{viewingAssessment.feedback}</p>
                  </div>
                </div>
              )}

              {/* 评估答案 */}
              {viewingAssessment.answers && Object.keys(viewingAssessment.answers).length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">评估答案</h3>
                  <ScrollArea className="h-48 w-full rounded-md border">
                    <div className="p-4">
                      <pre className="text-sm">
                        {JSON.stringify(viewingAssessment.answers, null, 2)}
                      </pre>
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewingAssessment(null)}
            >
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
