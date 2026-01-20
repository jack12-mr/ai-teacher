"use client";

/**
 * 管理后台 - 系统设置页面
 *
 * 完整功能：
 * - 查看和编辑系统配置
 * - 按分类管理配置
 * - 批量保存配置
 */

import { useState, useEffect } from "react";
import {
  getConfigsByCategory,
  setConfigs,
  type SystemConfig,
} from "@/actions/admin-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  RefreshCw,
  Save,
  Settings as SettingsIcon,
  CreditCard,
  Bot,
  HardDrive,
  Shield,
  Bell,
  Globe,
} from "lucide-react";

// 配置项定义
type ConfigValue = string | number | boolean;

interface ConfigItem {
  key: string;
  value: ConfigValue;
  description: string;
  type: "text" | "number" | "boolean" | "textarea" | "select";
  options?: string[];
}

interface CategoryConfig {
  title: string;
  icon: React.ElementType;
  description: string;
  configs: ConfigItem[];
}

// 默认配置模板
const defaultConfigs: Record<string, CategoryConfig> = {
  general: {
    title: "通用设置",
    icon: Globe,
    description: "网站基本信息和通用配置",
    configs: [
      {
        key: "site_name",
        value: "AI Teacher",
        description: "网站名称",
        type: "text",
      },
      {
        key: "site_description",
        value: "智能教学助手平台",
        description: "网站描述",
        type: "text",
      },
      {
        key: "site_keywords",
        value: "AI,教学,学习",
        description: "网站关键词",
        type: "text",
      },
      {
        key: "contact_email",
        value: "support@example.com",
        description: "联系邮箱",
        type: "text",
      },
      {
        key: "enable_registration",
        value: true,
        description: "允许用户注册",
        type: "boolean",
      },
      {
        key: "maintenance_mode",
        value: false,
        description: "维护模式",
        type: "boolean",
      },
    ],
  },
  payment: {
    title: "支付设置",
    icon: CreditCard,
    description: "支付方式和价格配置",
    configs: [
      {
        key: "currency",
        value: "CNY",
        description: "默认货币",
        type: "select",
        options: ["CNY", "USD", "EUR"],
      },
      {
        key: "pro_monthly_price",
        value: 99,
        description: "专业版月付价格",
        type: "number",
      },
      {
        key: "pro_yearly_price",
        value: 990,
        description: "专业版年付价格",
        type: "number",
      },
      {
        key: "enable_wechat_pay",
        value: true,
        description: "启用微信支付",
        type: "boolean",
      },
      {
        key: "enable_alipay",
        value: true,
        description: "启用支付宝",
        type: "boolean",
      },
      {
        key: "enable_stripe",
        value: false,
        description: "启用 Stripe",
        type: "boolean",
      },
    ],
  },
  ai: {
    title: "AI 设置",
    icon: Bot,
    description: "AI 模型和功能配置",
    configs: [
      {
        key: "ai_provider",
        value: "openai",
        description: "AI 服务提供商",
        type: "select",
        options: ["openai", "anthropic", "custom"],
      },
      {
        key: "ai_model",
        value: "gpt-4",
        description: "AI 模型",
        type: "text",
      },
      {
        key: "max_tokens",
        value: 2000,
        description: "最大 Token 数",
        type: "number",
      },
      {
        key: "temperature",
        value: 0.7,
        description: "温度参数",
        type: "number",
      },
      {
        key: "enable_streaming",
        value: true,
        description: "启用流式输出",
        type: "boolean",
      },
    ],
  },
  storage: {
    title: "存储设置",
    icon: HardDrive,
    description: "文件存储和上传配置",
    configs: [
      {
        key: "storage_provider",
        value: "local",
        description: "存储提供商",
        type: "select",
        options: ["local", "s3", "cloudbase", "supabase"],
      },
      {
        key: "max_file_size",
        value: 10,
        description: "最大文件大小 (MB)",
        type: "number",
      },
      {
        key: "allowed_file_types",
        value: "jpg,jpeg,png,gif,pdf,doc,docx",
        description: "允许的文件类型",
        type: "text",
      },
      {
        key: "enable_image_compression",
        value: true,
        description: "启用图片压缩",
        type: "boolean",
      },
    ],
  },
  security: {
    title: "安全设置",
    icon: Shield,
    description: "安全和认证配置",
    configs: [
      {
        key: "session_timeout",
        value: 24,
        description: "会话超时时间 (小时)",
        type: "number",
      },
      {
        key: "max_login_attempts",
        value: 5,
        description: "最大登录尝试次数",
        type: "number",
      },
      {
        key: "lockout_duration",
        value: 30,
        description: "锁定时长 (分钟)",
        type: "number",
      },
      {
        key: "enable_2fa",
        value: false,
        description: "启用双因素认证",
        type: "boolean",
      },
      {
        key: "password_min_length",
        value: 8,
        description: "密码最小长度",
        type: "number",
      },
    ],
  },
  notification: {
    title: "通知设置",
    icon: Bell,
    description: "邮件和通知配置",
    configs: [
      {
        key: "email_provider",
        value: "smtp",
        description: "邮件服务提供商",
        type: "select",
        options: ["smtp", "sendgrid", "ses"],
      },
      {
        key: "smtp_host",
        value: "",
        description: "SMTP 主机",
        type: "text",
      },
      {
        key: "smtp_port",
        value: 587,
        description: "SMTP 端口",
        type: "number",
      },
      {
        key: "email_from_address",
        value: "noreply@example.com",
        description: "发件人地址",
        type: "text",
      },
      {
        key: "enable_email_notification",
        value: true,
        description: "启用邮件通知",
        type: "boolean",
      },
    ],
  },
};

export default function SettingsPage() {
  // ==================== 状态管理 ====================
  const [configs, setConfigs] = useState<Record<string, CategoryConfig>>(defaultConfigs);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // ==================== 数据加载 ====================
  async function loadConfigs() {
    setLoading(true);
    setError(null);

    try {
      const result = await getConfigsByCategory();

      if (result.success && result.data) {
        // 合并默认配置和数据库配置
        const mergedConfigs = { ...defaultConfigs };

        for (const [category, categoryConfigs] of Object.entries(result.data)) {
          if (mergedConfigs[category]) {
            // 更新现有配置的值
            mergedConfigs[category].configs = mergedConfigs[category].configs.map(
              (defaultConfig) => {
                const existingConfig = categoryConfigs.find(
                  (c) => c.key === defaultConfig.key
                );
                return {
                  ...defaultConfig,
                  value: existingConfig ? existingConfig.value : defaultConfig.value,
                };
              }
            );
          }
        }

        setConfigs(mergedConfigs);
      } else {
        setError(result.error || "加载失败");
      }
    } catch (err) {
      setError("加载系统配置失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConfigs();
  }, []);

  // ==================== 保存配置 ====================
  async function handleSave() {
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      // 收集所有配置
      const allConfigs: Array<{
        key: string;
        value: any;
        category: string;
        description: string;
      }> = [];

      for (const [category, categoryConfig] of Object.entries(configs)) {
        for (const config of categoryConfig.configs) {
          allConfigs.push({
            key: config.key,
            value: config.value,
            category,
            description: config.description,
          });
        }
      }

      const result = await setConfigs(allConfigs);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || "保存失败");
      }
    } catch (err) {
      setError("保存配置失败");
    } finally {
      setSubmitting(false);
    }
  }

  // ==================== 更新配置值 ====================
  function updateConfigValue(category: string, key: string, value: ConfigValue) {
    setConfigs((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        configs: prev[category].configs.map((config) =>
          config.key === key ? { ...config, value } : config
        ),
      },
    }));
  }

  // ==================== 渲染配置输入 ====================
  function renderConfigInput(
    category: string,
    config: ConfigItem
  ): React.ReactNode {
    switch (config.type) {
      case "boolean":
        return (
          <Switch
            checked={config.value as boolean}
            onCheckedChange={(checked) =>
              updateConfigValue(category, config.key, checked)
            }
          />
        );

      case "textarea":
        return (
          <Textarea
            value={config.value as string}
            onChange={(e) =>
              updateConfigValue(category, config.key, e.target.value)
            }
            rows={3}
          />
        );

      case "number":
        return (
          <Input
            type="number"
            value={config.value as number}
            onChange={(e) =>
              updateConfigValue(category, config.key, parseFloat(e.target.value))
            }
          />
        );

      case "select":
        return (
          <Select
            value={config.value as string}
            onValueChange={(value) =>
              updateConfigValue(category, config.key, value)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {config.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      default:
        return (
          <Input
            type="text"
            value={config.value as string}
            onChange={(e) =>
              updateConfigValue(category, config.key, e.target.value)
            }
          />
        );
    }
  }

  // ==================== 渲染 ====================
  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">系统设置</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理系统配置和参数
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadConfigs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
          <Button onClick={handleSave} disabled={submitting}>
            <Save className="h-4 w-4 mr-2" />
            {submitting ? "保存中..." : "保存设置"}
          </Button>
        </div>
      </div>

      {/* 状态提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-600 text-green-600">
          <AlertDescription>设置保存成功！</AlertDescription>
        </Alert>
      )}

      {/* 设置选项卡 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full">
            {Object.entries(configs).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{config.title}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {Object.entries(configs).map(([categoryKey, categoryConfig]) => {
            const Icon = categoryConfig.icon;
            return (
              <TabsContent key={categoryKey} value={categoryKey}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>{categoryConfig.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {categoryConfig.description}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {categoryConfig.configs.map((config) => (
                        <div
                          key={config.key}
                          className="flex items-start justify-between gap-4"
                        >
                          <div className="flex-1 space-y-1">
                            <Label htmlFor={`${categoryKey}-${config.key}`}>
                              {config.description}
                            </Label>
                            <p className="text-xs text-muted-foreground font-mono">
                              {config.key}
                            </p>
                          </div>
                          <div className="w-64">
                            {renderConfigInput(categoryKey, config)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </div>
  );
}
