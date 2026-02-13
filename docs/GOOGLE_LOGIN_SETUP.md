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
- [x] Android端代码已实现
- [x] Web端代码已实现

### 📋 配置信息

**Android包名:** `com.morncoach.android.global`
**国际版网址:** `https://www.mornhub.biz`
**Android客户端ID:** 在`.env.intl`中的`NEXT_PUBLIC_GOOGLE_CLIENT_ID`

## 已实现的功能

### Android端
- ✅ GoogleSignInHelper.java - 处理Google Sign-In SDK逻辑
- ✅ GoogleSignInBridge.java - JavaScript Bridge接口
- ✅ MainActivity.java - 集成Bridge和处理Activity结果
- ✅ build.gradle - 添加play-services-auth依赖

### Web端
- ✅ lib/google-signin-bridge.ts - 封装Android Bridge调用
- ✅ app/api/auth/google-native/route.ts - 后端API验证Token
- ✅ components/auth/unified-auth-form.tsx - 登录组件集成
- ✅ package.json - 添加google-auth-library依赖

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

## 实施完成总结

所有代码已成功实现：

**Android端 (3个文件):**
1. GoogleSignInHelper.java - 原生登录逻辑
2. GoogleSignInBridge.java - JavaScript Bridge
3. MainActivity.java - Bridge集成

**Web端 (3个文件):**
1. lib/google-signin-bridge.ts - Bridge封装
2. app/api/auth/google-native/route.ts - 后端API
3. components/auth/unified-auth-form.tsx - 前端集成

**配置文件 (2个文件):**
1. build.gradle - Android依赖
2. package.json - Web依赖

现在可以开始测试Google登录功能了！
