import { NextRequest, NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const jwtSecret = process.env.JWT_SECRET || 'your-secret-key'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json()

    console.log('=== Google Native Auth API 调试 ===')
    console.log('收到 ID Token:', idToken ? `${idToken.substring(0, 50)}...` : 'null')
    console.log('客户端 ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)

    if (!idToken) {
      console.error('错误: ID Token 为空')
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      )
    }

    console.log('开始验证 ID Token...')
    const client = new OAuth2Client()
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    console.log('ID Token 验证成功')
    console.log('用户邮箱:', payload?.email)
    console.log('用户名称:', payload?.name)

    if (!payload || !payload.email) {
      console.error('错误: Token payload 无效')
      return NextResponse.json(
        { error: 'Invalid token payload' },
        { status: 400 }
      )
    }

    console.log('查询现有用户...')
    const { data: existingUser, error: fetchError } = await supabaseAdmin.auth.admin.listUsers()

    if (fetchError) {
      console.error('Error fetching users:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    let user = existingUser.users.find(u => u.email === payload.email)

    if (!user) {
      console.log('用户不存在,创建新用户...')
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: payload.email!,
        email_confirm: true,
        user_metadata: {
          full_name: payload.name,
          avatar_url: payload.picture,
          provider: 'google'
        }
      })

      if (createError || !newUser.user) {
        console.error('Error creating user:', createError)
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        )
      }

      user = newUser.user
      console.log('新用户创建成功:', user.id)
    } else {
      console.log('找到现有用户:', user.id)
    }

    await new Promise(resolve => setTimeout(resolve, 1000))

    console.log('等待 profile 创建...')
    let profile = null
    for (let i = 0; i < 5; i++) {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        profile = data
        console.log('Profile 找到:', profile.id)
        break
      }

      if (i < 4) {
        console.log(`Profile 未找到,重试 ${i + 1}/4...`)
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    console.log('生成 JWT session...')
    const session = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7)
      },
      jwtSecret
    )

    console.log('=== 登录成功 ===')
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata
      },
      profile,
      session
    })

  } catch (error: any) {
    console.error('=== Google Native Auth 错误 ===')
    console.error('错误类型:', error.constructor.name)
    console.error('错误消息:', error.message)
    console.error('错误堆栈:', error.stack)
    return NextResponse.json(
      { error: error.message || 'Authentication failed' },
      { status: 500 }
    )
  }
}
