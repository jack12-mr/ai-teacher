# 使用官方 Node.js 轻量级镜像
FROM node:20-alpine AS base

# 1. 依赖安装阶段
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 复制依赖文件
COPY package.json package-lock.json* ./
# 安装依赖
RUN npm ci --legacy-peer-deps

# 2. 构建阶段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 这里的环境变量对于构建可能是必须的，如果有报错再调整
ENV NEXT_TELEMETRY_DISABLED 1

# 👇 新增这些行：设置假的 Key 来骗过构建检查
ENV OPENAI_API_KEY="sk-1234567890_dummy_key_for_build"
ENV NEXT_PUBLIC_SUPABASE_URL="https://dummy.supabase.co"
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY="dummy_anon_key_for_build"
ENV SUPABASE_SERVICE_ROLE_KEY="dummy_service_role_key_for_build"

# 👇 重要：设置部署区域为国内版（CN=微信/支付宝，INTL=Stripe/PayPal）
ENV NEXT_PUBLIC_DEPLOYMENT_REGION="CN"

# 开始构建
RUN npm run build

# 3. 运行阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# 声明运行时需要的环境变量（云托管控制台会注入真实值）
# 部署区域 (CN=国内版, INTL=国际版)
ENV NEXT_PUBLIC_DEPLOYMENT_REGION="CN"

# CloudBase 配置
ENV NEXT_PUBLIC_CLOUDBASE_ENV_ID=""
ENV NEXT_PUBLIC_WECHAT_CLOUDBASE_ID=""
ENV CLOUDBASE_SECRET_ID=""
ENV CLOUDBASE_SECRET_KEY=""

# AI 模型配置 - 国内版 (阿里通义千问)
ENV OPENAI_API_KEY=""
ENV OPENAI_BASE_URL=""
ENV AI_MODEL_NAME=""
ENV AI_SEARCH_MODEL_NAME=""
ENV AI_VL_MODEL_NAME=""
# AI 模型配置 - 国际版 (Mistral)
ENV MISTRAL_API_KEY=""
ENV MISTRAL_BASE_URL=""
ENV MISTRAL_MODEL_NAME=""

# 微信开放平台（网页端登录）
ENV WECHAT_OPEN_APPID=""
ENV WECHAT_OPEN_SECRET=""
# 微信移动应用
ENV WECHAT_APP_APPID=""
ENV WECHAT_APP_SECRET=""
# 微信小程序
ENV WECHAT_MINIPROGRAM_APPID=""
ENV WECHAT_MINIPROGRAM_SECRET=""

# 微信支付配置
ENV WECHAT_PAY_MCH_ID=""
ENV WECHAT_PAY_APPID=""
ENV WECHAT_PAY_API_KEY_V3=""
ENV WECHAT_PAY_SERIAL_NO=""
ENV WECHAT_PAY_PRIVATE_KEY=""
ENV WECHAT_PAY_NOTIFY_URL=""

# 支付宝配置
ENV ALIPAY_APP_ID=""
ENV ALIPAY_PRIVATE_KEY=""
ENV ALIPAY_ALIPAY_PUBLIC_KEY=""
ENV ALIPAY_NOTIFY_URL=""
ENV ALIPAY_RETURN_URL=""
ENV ALIPAY_SANDBOX=""

# Supabase 配置（国际版）
ENV NEXT_PUBLIC_SUPABASE_URL=""
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=""
ENV SUPABASE_SERVICE_ROLE_KEY=""

# JWT 和管理后台
ENV JWT_SECRET=""
ENV ADMIN_SESSION_SECRET=""

# 基础配置
ENV NEXT_PUBLIC_APP_URL=""

# 创建系统用户（安全起见）
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物
# standalone 模式下，public 目录需要单独复制
COPY --from=builder /app/public ./public

# standalone 输出会在 .next/standalone 目录下生成完整的应用
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# 静态文件需要单独复制到正确位置
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# 暴露端口，云托管通常默认 3000
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
