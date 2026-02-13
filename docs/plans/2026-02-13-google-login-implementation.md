# Google登录实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标:** 为国际版应用实现混合Google登录（Android原生SDK + Web OAuth）

**架构:** 在Android WebView中使用原生Google Sign-In SDK通过JavaScript Bridge与Web端通信，在浏览器中使用Supabase的Google OAuth流程。后端使用Supabase Admin API验证ID Token并创建用户。

**技术栈:**
- Android: Google Play Services Auth 21.2.0, JavaScript Bridge
- Web: Next.js, TypeScript, Supabase, google-auth-library
- 后端: Supabase Admin API, JWT

---

## Task 1: 添加Android依赖

**文件:**
- 修改: `D:\newcode\ai teacher\mvp_24-master\mvp_24-master\multigptandroid\app\build.gradle:169-199`

**步骤 1: 添加Google Play Services依赖**

在dependencies块中添加：

```gradle
implementation 'com.google.android.gms:play-services-auth:21.2.0'
```

**步骤 2: 验证修改**

检查build.gradle文件确认依赖已添加。

**步骤 3: 同步Gradle**

运行: `cd "D:\newcode\ai teacher\mvp_24-master\mvp_24-master\multigptandroid" && ./gradlew build --dry-run`
预期: 成功解析依赖

---

## Task 2: 创建GoogleSignInHelper

**文件:**
- 创建: `D:\newcode\ai teacher\mvp_24-master\mvp_24-master\multigptandroid\app\src\main\java\co\median\android\GoogleSignInHelper.java`

**步骤 1: 创建GoogleSignInHelper类**

```java
package co.median.android;

import android.app.Activity;
import android.content.Intent;
import android.util.Log;
import androidx.annotation.NonNull;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;
import org.json.JSONException;
import org.json.JSONObject;

public class GoogleSignInHelper {
    private static final String TAG = "GoogleSignInHelper";
    private static final int RC_SIGN_IN = 9001;

    private final Activity activity;
    private GoogleSignInClient googleSignInClient;
    private SignInCallback callback;

    public interface SignInCallback {
        void onSuccess(String idToken, String email, String displayName);
        void onError(String error);
    }

    public GoogleSignInHelper(Activity activity) {
        this.activity = activity;
    }

    public void initialize(String clientId) {
        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestIdToken(clientId)
                .requestEmail()
                .build();

        googleSignInClient = GoogleSignIn.getClient(activity, gso);
    }

    public void signIn(SignInCallback callback) {
        this.callback = callback;
        Intent signInIntent = googleSignInClient.getSignInIntent();
        activity.startActivityForResult(signInIntent, RC_SIGN_IN);
    }

    public void signOut(SignInCallback callback) {
        if (googleSignInClient != null) {
            googleSignInClient.signOut().addOnCompleteListener(activity, task -> {
                if (callback != null) {
                    callback.onSuccess(null, null, null);
                }
            });
        }
    }

    public void handleActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == RC_SIGN_IN) {
            Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
            handleSignInResult(task);
        }
    }

    private void handleSignInResult(@NonNull Task<GoogleSignInAccount> completedTask) {
        try {
            GoogleSignInAccount account = completedTask.getResult(ApiException.class);
            if (callback != null && account != null) {
                String idToken = account.getIdToken();
                String email = account.getEmail();
                String displayName = account.getDisplayName();
                callback.onSuccess(idToken, email, displayName);
            }
        } catch (ApiException e) {
            Log.e(TAG, "Google sign in failed", e);
            if (callback != null) {
                callback.onError("Sign in failed: " + e.getStatusCode());
            }
        }
    }

    public String getUserInfoJson() {
        GoogleSignInAccount account = GoogleSignIn.getLastSignedInAccount(activity);
        if (account != null) {
            try {
                JSONObject json = new JSONObject();
                json.put("idToken", account.getIdToken());
                json.put("email", account.getEmail());
                json.put("displayName", account.getDisplayName());
                json.put("photoUrl", account.getPhotoUrl() != null ? account.getPhotoUrl().toString() : "");
                return json.toString();
            } catch (JSONException e) {
                Log.e(TAG, "Error creating JSON", e);
            }
        }
        return null;
    }
}
```

**步骤 2: 验证文件创建**

确认文件已创建在正确路径。

---

## Task 3: 创建GoogleSignInBridge

**文件:**
- 创建: `D:\newcode\ai teacher\mvp_24-master\mvp_24-master\multigptandroid\app\src\main\java\co\median\android\GoogleSignInBridge.java`

**步骤 1: 创建GoogleSignInBridge类**

```java
package co.median.android;

import android.util.Log;
import android.webkit.JavascriptInterface;
import org.json.JSONException;
import org.json.JSONObject;

public class GoogleSignInBridge {
    private static final String TAG = "GoogleSignInBridge";
    private final MainActivity mainActivity;
    private String pendingCallback;

    public GoogleSignInBridge(MainActivity activity) {
        this.mainActivity = activity;
    }

    @JavascriptInterface
    public void signIn(String clientId, String callback) {
        Log.d(TAG, "signIn called with clientId: " + clientId);
        this.pendingCallback = callback;

        mainActivity.runOnUiThread(() -> {
            if (mainActivity.googleSignInHelper == null) {
                mainActivity.googleSignInHelper = new GoogleSignInHelper(mainActivity);
            }
            mainActivity.googleSignInHelper.initialize(clientId);
            mainActivity.googleSignInHelper.signIn(new GoogleSignInHelper.SignInCallback() {
                @Override
                public void onSuccess(String idToken, String email, String displayName) {
                    try {
                        JSONObject result = new JSONObject();
                        result.put("success", true);
                        result.put("idToken", idToken);
                        result.put("email", email);
                        result.put("displayName", displayName);
                        callJavaScript(pendingCallback, result.toString());
                    } catch (JSONException e) {
                        Log.e(TAG, "Error creating JSON", e);
                    }
                }

                @Override
                public void onError(String error) {
                    try {
                        JSONObject result = new JSONObject();
                        result.put("success", false);
                        result.put("error", error);
                        callJavaScript(pendingCallback, result.toString());
                    } catch (JSONException e) {
                        Log.e(TAG, "Error creating JSON", e);
                    }
                }
            });
        });
    }

    @JavascriptInterface
    public void signOut(String callback) {
        Log.d(TAG, "signOut called");
        this.pendingCallback = callback;

        mainActivity.runOnUiThread(() -> {
            if (mainActivity.googleSignInHelper != null) {
                mainActivity.googleSignInHelper.signOut(new GoogleSignInHelper.SignInCallback() {
                    @Override
                    public void onSuccess(String idToken, String email, String displayName) {
                        try {
                            JSONObject result = new JSONObject();
                            result.put("success", true);
                            callJavaScript(pendingCallback, result.toString());
                        } catch (JSONException e) {
                            Log.e(TAG, "Error creating JSON", e);
                        }
                    }

                    @Override
                    public void onError(String error) {
                        try {
                            JSONObject result = new JSONObject();
                            result.put("success", false);
                            result.put("error", error);
                            callJavaScript(pendingCallback, result.toString());
                        } catch (JSONException e) {
                            Log.e(TAG, "Error creating JSON", e);
                        }
                    }
                });
            }
        });
    }

    @JavascriptInterface
    public String getCurrentUser() {
        if (mainActivity.googleSignInHelper != null) {
            return mainActivity.googleSignInHelper.getUserInfoJson();
        }
        return null;
    }

    private void callJavaScript(String callback, String data) {
        if (callback != null && !callback.isEmpty()) {
            String js = String.format("if (typeof %s === 'function') { %s(%s); }", callback, callback, data);
            mainActivity.runOnUiThread(() -> mainActivity.runJavascript(js));
        }
    }
}
```

**步骤 2: 验证文件创建**

确认文件已创建在正确路径。

---

## Task 4: 修改MainActivity集成Bridge

**文件:**
- 修改: `D:\newcode\ai teacher\mvp_24-master\mvp_24-master\multigptandroid\app\src\main\java\co\median\android\MainActivity.java`

**步骤 1: 添加成员变量**

在MainActivity类中添加（在现有成员变量之后）：

```java
public GoogleSignInHelper googleSignInHelper;
private GoogleSignInBridge googleSignInBridge;
```

**步骤 2: 注册JavaScript Bridge**

找到WebView初始化的位置，添加Bridge注册代码。需要在WebView加载完成后注册。

**步骤 3: 处理Activity结果**

在`onActivityResult`方法中添加（如果方法不存在则创建）：

```java
@Override
protected void onActivityResult(int requestCode, int resultCode, Intent data) {
    super.onActivityResult(requestCode, resultCode, data);
    if (googleSignInHelper != null) {
        googleSignInHelper.handleActivityResult(requestCode, resultCode, data);
    }
}
```

**步骤 4: 添加runJavascript辅助方法**

```java
public void runJavascript(String js) {
    if (mWebview != null && mWebview.getWebView() != null) {
        mWebview.getWebView().evaluateJavascript(js, null);
    }
}
```

---

## Task 5: 添加Web端依赖

**文件:**
- 修改: `D:\newcode\ai teacher\fuben2-project\mvp_25-main\mvp_25-main\package.json:18-84`

**步骤 1: 添加google-auth-library依赖**

在dependencies中添加：

```json
"google-auth-library": "^9.0.0"
```

**步骤 2: 安装依赖**

运行: `cd "D:\newcode\ai teacher\fuben2-project\mvp_25-main\mvp_25-main" && npm install`
预期: 成功安装google-auth-library

---

## Task 6: 创建Google Sign-In Bridge封装

**文件:**
- 创建: `D:\newcode\ai teacher\fuben2-project\mvp_25-main\mvp_25-main\lib\google-signin-bridge.ts`

**步骤 1: 创建Bridge封装文件**

```typescript
/**
 * Google Sign-In Bridge for Android WebView
 */

interface GoogleSignInResult {
  success: boolean;
  idToken?: string;
  email?: string;
  displayName?: string;
  error?: string;
}

interface GoogleSignInBridge {
  signIn(clientId: string, callback: string): void;
  signOut(callback: string): void;
  getCurrentUser(): string | null;
}

declare global {
  interface Window {
    GoogleSignIn?: GoogleSignInBridge;
  }
}

/**
 * 检查是否在Android WebView环境中
 */
export function isAndroidWebView(): boolean {
  return typeof window !== 'undefined' && !!window.GoogleSignIn;
}

/**
 * Google登录
 */
export function signInWithGoogle(clientId: string): Promise<GoogleSignInResult> {
  return new Promise((resolve, reject) => {
    if (!isAndroidWebView()) {
      reject(new Error('Not running in Android WebView'));
      return;
    }

    const callbackName = `googleSignInCallback_${Date.now()}`;
    (window as any)[callbackName] = (result: GoogleSignInResult) => {
      delete (window as any)[callbackName];

      if (result.success) {
        resolve(result);
      } else {
        reject(new Error(result.error || 'Sign in failed'));
      }
    };

    try {
      window.GoogleSignIn!.signIn(clientId, callbackName);
    } catch (error) {
      delete (window as any)[callbackName];
      reject(error);
    }
  });
}

/**
 * Google登出
 */
export function signOutGoogle(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isAndroidWebView()) {
      reject(new Error('Not running in Android WebView'));
      return;
    }

    const callbackName = `googleSignOutCallback_${Date.now()}`;
    (window as any)[callbackName] = (result: GoogleSignInResult) => {
      delete (window as any)[callbackName];

      if (result.success) {
        resolve();
      } else {
        reject(new Error(result.error || 'Sign out failed'));
      }
    };

    try {
      window.GoogleSignIn!.signOut(callbackName);
    } catch (error) {
      delete (window as any)[callbackName];
      reject(error);
    }
  });
}

/**
 * 获取当前登录的用户信息
 */
export function getCurrentUser(): GoogleSignInResult | null {
  if (!isAndroidWebView()) {
    return null;
  }

  try {
    const userJson = window.GoogleSignIn!.getCurrentUser();
    if (userJson) {
      return JSON.parse(userJson);
    }
  } catch (error) {
    console.error('Failed to get current user:', error);
  }

  return null;
}
```

**步骤 2: 验证文件创建**

确认文件已创建在正确路径。

---

## Task 7: 创建Google Native认证API

**文件:**
- 创建: `D:\newcode\ai teacher\fuben2-project\mvp_25-main\mvp_25-main\app\api\auth\google-native\route.ts`

**步骤 1: 创建API路由文件**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { OAuth2Client } from 'google-auth-library';

/**
 * Google Native Sign-In API
 * 处理来自Android原生Google Sign-In SDK的认证请求
 */
export async function POST(request: NextRequest) {
  try {
    const { idToken, email, displayName } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'Missing idToken' },
        { status: 400 }
      );
    }

    // 验证Google ID Token
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json(
        { error: 'Google Client ID not configured' },
        { status: 500 }
      );
    }

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // 使用Supabase Service Role客户端
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // 检查用户是否已存在
    const { data: existingProfile } = await serviceClient
      .from('profiles')
      .select('*')
      .eq('email', payload.email)
      .maybeSingle();

    let user;

    if (existingProfile) {
      // 用户已存在，更新最后登录时间
      const { data: updatedUser } = await serviceClient
        .from('profiles')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', existingProfile.id)
        .select()
        .single();

      user = updatedUser;
    } else {
      // 创建新用户
      let authUserId: string;

      const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
        email: payload.email!,
        email_confirm: true,
        user_metadata: {
          full_name: displayName || payload.name,
          avatar_url: payload.picture,
          provider: 'google',
        },
      });

      if (authError) {
        if (authError.message.includes('already been registered')) {
          // 用户已存在，获取现有用户
          const { data: users } = await serviceClient.auth.admin.listUsers();
          const existingUser = users?.users.find(u => u.email === payload.email);
          if (!existingUser) {
            return NextResponse.json(
              { error: 'User exists but could not be found' },
              { status: 500 }
            );
          }
          authUserId = existingUser.id;
        } else {
          return NextResponse.json(
            { error: 'Failed to create user: ' + authError.message },
            { status: 500 }
          );
        }
      } else if (authData?.user) {
        authUserId = authData.user.id;
      } else {
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        );
      }

      // 等待触发器创建profile
      let profile = null;
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const { data: fetchedProfile } = await serviceClient
          .from('profiles')
          .select('*')
          .eq('id', authUserId)
          .maybeSingle();

        if (fetchedProfile) {
          profile = fetchedProfile;
          break;
        }
      }

      if (!profile) {
        return NextResponse.json(
          { error: 'Profile creation timeout' },
          { status: 500 }
        );
      }

      user = profile;
    }

    // 创建自定义JWT session
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';

    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: 'authenticated',
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const session = {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 3600,
      token_type: 'bearer',
    };

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
      session,
    });
  } catch (error) {
    console.error('Google native sign-in error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Authentication failed' },
      { status: 500 }
    );
  }
}
```

**步骤 2: 验证文件创建**

确认文件已创建在正确路径。

---

## Task 8: 修改登录组件集成Android原生登录

**文件:**
- 修改: `D:\newcode\ai teacher\fuben2-project\mvp_25-main\mvp_25-main\components\auth\unified-auth-form.tsx:205-219`

**步骤 1: 修改handleGoogleSignIn函数**

找到IntlAuthForm组件中的handleGoogleSignIn函数，修改为：

```typescript
// 处理Google登录
const handleGoogleSignIn = async () => {
  if (isLoading) return;

  setIsLoading(true);
  setError("");

  try {
    // 检查是否在Android WebView中
    const { isAndroidWebView, signInWithGoogle: signInWithGoogleBridge } = await import('@/lib/google-signin-bridge');

    if (isAndroidWebView()) {
      // Android WebView环境：使用原生Google Sign-In
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
      const result = await signInWithGoogleBridge(clientId);

      // 调用后端API验证Token
      const response = await fetch('/api/auth/google-native', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken: result.idToken,
          email: result.email,
          displayName: result.displayName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t.auth.loginFailed);
        setIsLoading(false);
        return;
      }

      // 保存认证信息
      if (data.session && data.user) {
        const tokens = getStoredTokens();
        saveTokens(data.session.access_token, data.session.refresh_token, data.session.expires_in);

        // 保存用户信息到localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_user', JSON.stringify(data.user));
        }

        setSuccess(t.auth.loginSuccess);
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            router.push("/dashboard");
          }
        }, 500);
      }
    } else {
      // 浏览器环境：使用Supabase OAuth
      await signInWithGoogle();
    }
  } catch (err: any) {
    setError(err.message || t.auth.loginFailed);
    setIsLoading(false);
  }
};
```

**步骤 2: 添加必要的导入**

在文件顶部确保有以下导入：

```typescript
import { useAuth as useAuthCN } from "@/components/auth/auth-provider"
```

**步骤 3: 获取token存储函数**

确保IntlAuthForm组件可以访问token存储函数（从useUserIntl hook或auth-provider）。

---

## Task 9: 创建配置和测试文档

**文件:**
- 创建: `D:\newcode\ai teacher\fuben2-project\mvp_25-main\mvp_25-main\docs\GOOGLE_LOGIN_SETUP.md`

**步骤 1: 创建配置文档**

```markdown
# Google登录配置和测试指南

## 配置清单

### ✅ 已完成的配置

- [x] Google Cloud Console已创建Android OAuth客户端
- [x] Google Cloud Console已创建Web OAuth客户端
- [x] SHA-1证书指纹已配置
- [x] 环境变量已配置
- [x] Supabase已启用Google OAuth
- [x] 数据库触发器已配置
- [x] Android WebView URL已改为 https://www.mornhub.biz

### 📋 配置信息

**Android包名:** `com.morncoach.android.global`
**国际版网址:** `https://www.mornhub.biz`
**Android客户端ID:** 在`.env.intl`中的`NEXT_PUBLIC_GOOGLE_CLIENT_ID`

## 测试步骤

### 1. 编译Android应用

```bash
cd "D:\newcode\ai teacher\mvp_24-master\mvp_24-master\multigptandroid"
./gradlew assembleDebug
```

APK位置: `app/build/outputs/apk/debug/app-debug.apk`

### 2. 安装到设备

```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

### 3. 启动Web开发服务器

```bash
cd "D:\newcode\ai teacher\fuben2-project\mvp_25-main\mvp_25-main"
npm run dev
```

### 4. 测试Android WebView登录

1. 在Android设备上打开应用
2. 导航到登录页面
3. 点击"使用Google登录"按钮
4. 应该看到Android原生账号选择器
5. 选择Google账号
6. 验证登录成功并跳转到首页

### 5. 测试浏览器登录

1. 在浏览器中打开 `https://www.mornhub.biz`
2. 导航到登录页面
3. 点击"使用Google登录"按钮
4. 应该跳转到Google登录页面
5. 完成登录后验证跳转回应用

## 调试方法

### Android端调试

**查看日志:**
```bash
adb logcat | grep -E "GoogleSignIn|MainActivity|GoogleSignInBridge"
```

**检查Bridge注册:**
```bash
adb logcat | grep "addJavascriptInterface"
```

### Web端调试

**启用远程调试:**
1. Chrome访问 `chrome://inspect`
2. 连接Android设备
3. 选择WebView进行调试

**测试Bridge:**
```javascript
// 在Console中测试
console.log('Is Android WebView:', !!window.GoogleSignIn);
```

## 常见问题

### 错误: Sign in failed: 10
**原因:** SHA-1证书指纹不匹配
**解决:** 重新获取SHA-1并更新Google Cloud Console

### 错误: Sign in failed: 12501
**原因:** 用户取消登录
**解决:** 正常行为，无需处理

### Bridge未定义
**原因:** WebView未完全加载或Bridge注册失败
**解决:** 确认MainActivity中的Bridge注册代码已添加

### ID Token验证失败
**原因:** Client ID配置错误
**解决:** 确认`.env.intl`中的`NEXT_PUBLIC_GOOGLE_CLIENT_ID`是Android客户端ID

## 验收标准

- ✅ Android WebView中点击Google登录显示原生账号选择器
- ✅ 选择账号后无需输入密码
- ✅ 登录成功后正确跳转到首页
- ✅ 用户信息正确显示
- ✅ 刷新页面后登录状态保持
- ✅ 浏览器中使用Supabase OAuth流程正常工作
```

**步骤 2: 验证文件创建**

确认文件已创建在正确路径。

---

## 实施完成

所有任务完成后：

1. 测试Android端Google登录
2. 测试Web端Google登录
3. 验证用户信息正确保存
4. 确认登录状态持久化

## 注意事项

- MainActivity的Bridge注册需要在WebView完全加载后进行
- 环境变量中的`NEXT_PUBLIC_GOOGLE_CLIENT_ID`必须是Android客户端ID
- Supabase中配置的Google OAuth使用Web客户端ID
- 确保数据库触发器正常工作
