"use client";

/**
 * 管理后台 - 版本发布管理页面
 *
 * 完整功能：
 * - 版本发布列表展示（支持分页）
 * - 创建版本发布
 * - 编辑版本发布
 * - 删除版本发布
 * - 发布版本（草稿 -> 已发布）
 * - 归档版本
 * - 查看版本详情
 */

import { useState, useEffect, useMemo } from "react";
import {
  listReleases,
  getReleaseStats,
  createRelease,
  updateRelease,
  deleteRelease,
  publishRelease,
  archiveRelease,
  type Release,
} from "@/actions/admin-releases";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Plus,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Send,
  Archive,
  FileText,
  Calendar,
  Tag,
  CheckCircle,
} from "lucide-react";

export default function ReleasesManagementPage() {
  // ==================== 状态管理 ====================
  const [releases, setReleases] = useState<Release[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 分页状态
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);

  // 筛选状态
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // 对话框状态
  const [viewingRelease, setViewingRelease] = useState<Release | null>(null);
  const [editingRelease, setEditingRelease] = useState<Release | null>(null);
  const [creatingRelease, setCreatingRelease] = useState(false);
  const [deletingRelease, setDeletingRelease] = useState<Release | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    version: "",
    title: "",
    description: "",
    status: "draft" as "draft" | "published" | "archived",
    releaseNotes: "",
    fileUrl: "",
  });

  // ==================== 筛选后的版本列表 ====================
  const filteredReleases = useMemo(() => {
    return releases.filter((release) => {
      if (filterStatus !== "all" && release.status !== filterStatus) {
        return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          release.title.toLowerCase().includes(query) ||
          release.version.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [releases, filterStatus, searchQuery]);

  // ==================== 数据加载 ====================
  async function loadReleases() {
    setLoading(true);
    setError(null);

    try {
      const offset = (page - 1) * pageSize;
      const result = await listReleases({
        limit: pageSize,
        offset,
      });

      if (result.success && result.data) {
        setReleases(result.data.items);
        setTotal(result.data.total);
      } else {
        setError(result.error || "加载失败");
      }
    } catch (err) {
      setError("加载版本发布失败");
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    setStatsLoading(true);
    try {
      const result = await getReleaseStats();
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
    loadReleases();
  }, [page]);

  useEffect(() => {
    loadStats();
  }, []);

  // ==================== CRUD 操作 ====================
  async function handleCreateRelease() {
    setSubmitting(true);
    setError(null);

    try {
      const result = await createRelease(formData);

      if (result.success) {
        setCreatingRelease(false);
        resetForm();
        loadReleases();
        loadStats();
      } else {
        setError(result.error || "创建失败");
      }
    } catch (err) {
      setError("创建失败");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateRelease() {
    if (!editingRelease) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await updateRelease(editingRelease.id, formData);

      if (result.success) {
        setEditingRelease(null);
        resetForm();
        loadReleases();
        loadStats();
      } else {
        setError(result.error || "更新失败");
      }
    } catch (err) {
      setError("更新失败");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(release: Release) {
    setSubmitting(true);

    try {
      const result = await deleteRelease(release.id);

      if (result.success) {
        setDeletingRelease(null);
        loadReleases();
        loadStats();
      } else {
        setError(result.error || "删除失败");
      }
    } catch (err) {
      setError("删除失败");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePublish(release: Release) {
    try {
      const result = await publishRelease(release.id);

      if (result.success) {
        loadReleases();
        loadStats();
      } else {
        setError(result.error || "发布失败");
      }
    } catch (err) {
      setError("发布失败");
    }
  }

  async function handleArchive(release: Release) {
    try {
      const result = await archiveRelease(release.id);

      if (result.success) {
        loadReleases();
        loadStats();
      } else {
        setError(result.error || "归档失败");
      }
    } catch (err) {
      setError("归档失败");
    }
  }

  // ==================== 表单处理 ====================
  function resetForm() {
    setFormData({
      version: "",
      title: "",
      description: "",
      status: "draft",
      releaseNotes: "",
      fileUrl: "",
    });
  }

  function openCreateDialog() {
    resetForm();
    setCreatingRelease(true);
  }

  function openEditDialog(release: Release) {
    setFormData({
      version: release.version,
      title: release.title,
      description: release.description || "",
      status: release.status,
      releaseNotes: release.releaseNotes || "",
      fileUrl: release.fileUrl || "",
    });
    setEditingRelease(release);
  }

  // ==================== 工具函数 ====================
  function getStatusBadge(status: string) {
    switch (status) {
      case "published":
        return (
          <Badge variant="default" className="bg-green-600 gap-1">
            <CheckCircle className="h-3 w-3" />
            已发布
          </Badge>
        );
      case "draft":
        return (
          <Badge variant="secondary" className="gap-1">
            <FileText className="h-3 w-3" />
            草稿
          </Badge>
        );
      case "archived":
        return (
          <Badge variant="outline" className="gap-1">
            <Archive className="h-3 w-3" />
            已归档
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  function formatDate(dateStr: string | undefined) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  function formatDateTime(dateStr: string | undefined) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
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
          <h1 className="text-2xl font-bold">版本发布管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理应用版本发布，共 {total} 个版本
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadReleases} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            新建版本
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statsLoading ? (
          // 骨架屏：加载时显示
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
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
                  总版本数
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  已发布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.published}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  草稿
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.draft}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  最新版本
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.latestVersion || "-"}
                </div>
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
                placeholder="搜索版本号或标题..."
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
                <SelectItem value="published">已发布</SelectItem>
                <SelectItem value="draft">草稿</SelectItem>
                <SelectItem value="archived">已归档</SelectItem>
              </SelectContent>
            </Select>

            {/* 清除筛选 */}
            {(searchQuery || filterStatus !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setFilterStatus("all");
                }}
              >
                清除筛选
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 版本发布列表 */}
      <Card>
        <CardHeader>
          <CardTitle>版本列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredReleases.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery || filterStatus !== "all"
                ? "没有符合筛选条件的版本"
                : "暂无版本发布"}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">版本号</TableHead>
                      <TableHead>标题</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>发布时间</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReleases.map((release) => (
                      <TableRow key={release.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            <span className="font-mono font-semibold">
                              {release.version}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{release.title}</div>
                            {release.description && (
                              <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                                {release.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(release.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(release.published_at)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(release.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setViewingRelease(release)}
                              title="查看详情"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {release.status === "draft" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-600 hover:text-green-700"
                                onClick={() => handlePublish(release)}
                                title="发布"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            )}
                            {release.status === "published" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleArchive(release)}
                                title="归档"
                              >
                                <Archive className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(release)}
                              title="编辑"
                            >
                              <Edit className="h-4 w-4" />
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
                                    确定要删除版本 "{release.version}" - {release.title} 吗？此操作不可恢复。
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>取消</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => {
                                      setDeletingRelease(release);
                                      handleDelete(release);
                                    }}
                                    className="bg-red-600 hover:bg-red-700"
                                    disabled={submitting}
                                  >
                                    {submitting ? (
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

      {/* 创建/编辑版本对话框 */}
      <Dialog open={creatingRelease || !!editingRelease} onOpenChange={(open) => {
        if (!open) {
          setCreatingRelease(false);
          setEditingRelease(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRelease ? "编辑版本" : "新建版本"}</DialogTitle>
            <DialogDescription>
              {editingRelease ? "修改版本发布信息" : "创建新的版本发布"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="version">版本号 *</Label>
                <Input
                  id="version"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  placeholder="例如：1.0.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">状态</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="published">已发布</SelectItem>
                    <SelectItem value="archived">已归档</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">标题 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="例如：重大更新 - 新功能上线"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="简要描述此版本的更新内容"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="releaseNotes">发布说明</Label>
              <Textarea
                id="releaseNotes"
                value={formData.releaseNotes}
                onChange={(e) => setFormData({ ...formData, releaseNotes: e.target.value })}
                placeholder="详细的版本更新说明"
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fileUrl">文件 URL</Label>
              <Input
                id="fileUrl"
                value={formData.fileUrl}
                onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                placeholder="https://example.com/release-v1.0.0.zip"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreatingRelease(false);
                setEditingRelease(null);
                resetForm();
              }}
              disabled={submitting}
            >
              取消
            </Button>
            <Button
              onClick={editingRelease ? handleUpdateRelease : handleCreateRelease}
              disabled={submitting || !formData.version || !formData.title}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {editingRelease ? "更新中..." : "创建中..."}
                </>
              ) : (
                editingRelease ? "更新" : "创建"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 查看版本详情对话框 */}
      <Dialog open={!!viewingRelease} onOpenChange={() => setViewingRelease(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>版本详情</DialogTitle>
          </DialogHeader>
          {viewingRelease && (
            <div className="space-y-6">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">版本号：</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono font-semibold">{viewingRelease.version}</span>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">状态：</span>
                  <div className="mt-1">{getStatusBadge(viewingRelease.status)}</div>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">标题：</span>
                  <div className="mt-1 font-medium">{viewingRelease.title}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">创建时间：</span>
                  <div className="mt-1">{formatDateTime(viewingRelease.created_at)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">发布时间：</span>
                  <div className="mt-1">{formatDateTime(viewingRelease.published_at)}</div>
                </div>
              </div>

              {/* 描述 */}
              {viewingRelease.description && (
                <div>
                  <h3 className="text-sm font-medium mb-2">描述</h3>
                  <p className="text-sm text-muted-foreground">{viewingRelease.description}</p>
                </div>
              )}

              {/* 发布说明 */}
              {viewingRelease.releaseNotes && (
                <div>
                  <h3 className="text-sm font-medium mb-2">发布说明</h3>
                  <ScrollArea className="h-48 w-full rounded-md border">
                    <div className="p-4">
                      <pre className="text-sm whitespace-pre-wrap font-sans">
                        {viewingRelease.releaseNotes}
                      </pre>
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* 文件链接 */}
              {viewingRelease.fileUrl && (
                <div>
                  <h3 className="text-sm font-medium mb-2">下载链接</h3>
                  <a
                    href={viewingRelease.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm"
                  >
                    {viewingRelease.fileUrl}
                  </a>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewingRelease(null)}
            >
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
