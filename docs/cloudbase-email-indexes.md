# CloudBase 邮箱验证码集合索引配置说明

## 集合状态
✅ `email_verification_codes` 集合已创建
✅ `password_reset_tokens` 集合已创建

## 需要手动创建的索引

由于 CloudBase Manager SDK 不支持通过 API 创建索引，需要在 CloudBase 控制台手动创建以下索引以提高查询性能。

### 访问控制台
1. 访问 CloudBase 控制台: https://console.cloud.tencent.com/tcb
2. 选择环境: `cloudbase-5g1enabl3864f1c1`
3. 进入「数据库」->「集合管理」

### 为 email_verification_codes 集合创建索引

#### 索引 1: 查询未验证的验证码
```json
{
  "email": 1,
  "type": 1,
  "verified": 1
}
```
**用途**: 快速查找特定邮箱和类型的未验证验证码

#### 索引 2: 过期时间索引（TTL）
```json
{
  "expires_at": 1
}
```
**用途**: 自动清理过期的验证码记录
**重要**: 建议设置为 TTL 索引，过期时间字段为 `expires_at`

#### 索引 3: IP 限流索引
```json
{
  "ip_address": 1,
  "created_at": 1
}
```
**用途**: 防止同一 IP 频繁发送验证码

### 为 password_reset_tokens 集合创建索引

#### 索引 1: 查询未使用的令牌
```json
{
  "email": 1,
  "used": 1
}
```
**用途**: 快速查找特定邮箱的未使用令牌

#### 索引 2: 过期时间索引（TTL）
```json
{
  "expires_at": 1
}
```
**用途**: 自动清理过期的重置令牌
**重要**: 建议设置为 TTL 索引，过期时间字段为 `expires_at`

## 创建索引步骤

1. 在 CloudBase 控制台中，进入对应的集合
2. 点击「索引管理」标签
3. 点击「新建索引」
4. 按照上述配置添加索引字段
5. 对于 TTL 索引，需要勾选「TTL 索引」选项，并设置过期时间字段

## 验证

索引创建完成后，可以通过以下方式验证：
1. 在控制台的「索引管理」中查看已创建的索引
2. 测试邮箱验证码功能，观察查询性能

## 注意事项

- TTL 索引会自动删除过期的文档，无需手动清理
- 索引创建可能需要几分钟时间，特别是在集合中已有数据的情况下
- 建议在低峰期创建索引，以减少对生产环境的影响
