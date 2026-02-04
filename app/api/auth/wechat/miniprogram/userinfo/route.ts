import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isChinaRegion } from "@/lib/config/region";
import { logSecurityEvent, logInfo } from "@/lib/utils/logger";
import { getCloudBaseApp } from "@/lib/cloudbase/init";
import { CLOUDBASE_COLLECTIONS } from "@/lib/database/cloudbase-schema";
import * as crypto from "crypto";

const userinfoSchema = z.object({
  encryptedData: z.string().min(1, "Encrypted data is required"),
  iv: z.string().min(1, "IV is required"),
  openid: z.string().min(1, "OpenID is required"),
});

function decryptWeChatData(
  encryptedData: string,
  sessionKey: string,
  iv: string
): any {
  const sessionKeyBuffer = Buffer.from(sessionKey, "base64");
  const encryptedDataBuffer = Buffer.from(encryptedData, "base64");
  const ivBuffer = Buffer.from(iv, "base64");

  const decipher = crypto.createDecipheriv(
    "aes-128-cbc",
    sessionKeyBuffer,
    ivBuffer
  );
  decipher.setAutoPadding(true);

  let decrypted = decipher.update(encryptedDataBuffer, undefined, "utf8");
  decrypted += decipher.final("utf8");

  return JSON.parse(decrypted);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const clientIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const validationResult = userinfoSchema.safeParse(body);
    if (!validationResult.success) {
      logSecurityEvent("miniprogram_userinfo_validation_failed", undefined, clientIP, {
        errors: validationResult.error.errors,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Invalid input",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const { encryptedData, iv, openid } = validationResult.data;

    if (!isChinaRegion()) {
      return NextResponse.json(
        {
          success: false,
          error: "Mini program authentication only available in China region",
          code: "REGION_NOT_SUPPORTED",
        },
        { status: 400 }
      );
    }

    const app = getCloudBaseApp();
    const db = app.database();
    const usersCollection = db.collection(CLOUDBASE_COLLECTIONS.WEB_USERS);

    let user: any = null;
    let userId: string | null = null;

    try {
      const queryResult = await usersCollection
        .where({
          wechat_miniprogram_openid: openid,
        })
        .limit(1)
        .get();

      if (queryResult.data && queryResult.data.length > 0) {
        user = queryResult.data[0];
        userId = user._id;
      }
    } catch (queryError) {
      logInfo("User not found for openid", { openid });
    }

    if (!userId || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found. Please login first.",
          code: "USER_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const sessionKey = user.wechat_session_key;
    if (!sessionKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Session key not found. Please login again.",
          code: "SESSION_KEY_NOT_FOUND",
        },
        { status: 400 }
      );
    }

    let decryptedData: any;
    try {
      decryptedData = decryptWeChatData(encryptedData, sessionKey, iv);
    } catch (decryptError) {
      logSecurityEvent("miniprogram_decrypt_failed", userId, clientIP, {
        error: decryptError instanceof Error ? decryptError.message : "Unknown error",
      });

      return NextResponse.json(
        {
          success: false,
          error: "Failed to decrypt user data",
          code: "DECRYPT_ERROR",
        },
        { status: 400 }
      );
    }

    if (decryptedData.openId !== openid) {
      logSecurityEvent("miniprogram_openid_mismatch", userId, clientIP, {
        expected: openid,
        actual: decryptedData.openId,
      });

      return NextResponse.json(
        {
          success: false,
          error: "OpenID mismatch",
          code: "OPENID_MISMATCH",
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    await usersCollection.doc(userId).update({
      name: decryptedData.nickName || user.name,
      avatar: decryptedData.avatarUrl || user.avatar,
      updated_at: now,
    });

    logInfo("Updated mini program user info", {
      userId,
      nickname: decryptedData.nickName,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        name: decryptedData.nickName,
        avatar: decryptedData.avatarUrl,
        openid: openid,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Mini program userinfo error:", errorMessage);
    logSecurityEvent(
      "miniprogram_userinfo_error",
      undefined,
      request.headers.get("x-forwarded-for") || "unknown",
      {
        error: errorMessage,
      }
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update user info",
        code: "USERINFO_UPDATE_FAILED",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
