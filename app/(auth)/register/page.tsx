import { RegisterForm } from "@/components/auth/register-form";

// 禁用静态预渲染，因为此页面依赖客户端 AuthProvider
export const dynamic = 'force-dynamic';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <RegisterForm redirectTo="/" />
    </div>
  );
}
