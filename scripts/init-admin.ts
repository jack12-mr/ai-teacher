import { config } from 'dotenv'
import { getDatabaseAdapter } from '../lib/admin/database'
import { hashPassword } from '../lib/admin/auth'

// Load environment variables from .env.local
config({ path: '.env.local' })

async function initAdmin() {
  const adapter = getDatabaseAdapter()
  const username = 'morncoach'
  const password = 'Zyx!213416'

  const hashedPassword = await hashPassword(password)

  try {
    await adapter.updateAdminPassword(username, hashedPassword)
    console.log(`✓ 管理员密码已更新: ${username}`)
  } catch (error) {
    console.error('更新管理员密码失败:', error)
    process.exit(1)
  }
}

initAdmin()
