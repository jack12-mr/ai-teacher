/**
 * CloudBase 数据库连接器
 * 提供文件管理功能所需的数据库和存储访问
 */

export interface CloudBaseConnectorConfig {
  envId?: string;
  secretId?: string;
  secretKey?: string;
}

let cachedClient: any = null;
let cachedDb: any = null;
let initialized = false;

export class CloudBaseConnector {
  private client: any = null;
  private initialized = false;

  constructor(private config: CloudBaseConnectorConfig = {}) {}

  async initialize(): Promise<void> {
    if (initialized && cachedClient && cachedDb) {
      this.client = cachedClient;
      this.initialized = true;
      return;
    }

    // 使用当前项目的初始化方式
    const { getCloudBaseApp } = await import("@/lib/cloudbase/init");
    this.client = getCloudBaseApp();
    cachedClient = this.client;
    cachedDb = this.client.database();
    initialized = true;
    this.initialized = true;
  }

  getClient(): any {
    if (!this.client || !this.initialized) {
      throw new Error("CloudBase client not initialized");
    }
    return cachedDb || this.client.database();
  }

  // Raw SDK instance, used for storage (uploadFile/getTempFileURL/deleteFile)
  getApp(): any {
    if (!this.client || !this.initialized) {
      throw new Error("CloudBase client not initialized");
    }
    return cachedClient || this.client;
  }
}
