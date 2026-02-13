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
