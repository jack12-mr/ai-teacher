"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/components/auth/auth-provider";
import { UserProviderIntl } from "@/components/user-context-intl";
import { Toaster } from "@/components/ui/sonner";
import { isChinaRegion } from "@/lib/config/region";

interface ProvidersProps {
  children: ReactNode;
}

/**
 * 客户端 Providers 包装组件
 * 根据部署区域选择正确的认证 Provider
 * 解决服务端预渲染时 Context Provider 不可用的问题
 */
export function Providers({ children }: ProvidersProps) {
  const isChina = isChinaRegion();

  if (isChina) {
    return (
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
    );
  }

  return (
    <UserProviderIntl>
      {children}
      <Toaster />
    </UserProviderIntl>
  );
}
