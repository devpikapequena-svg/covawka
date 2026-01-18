// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import dbConnect from '@/lib/mongodb'
import { User, type UserRole } from '@/models/User'
import { signToken } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const email = String(body?.email || '').toLowerCase().trim()
    const password = String(body?.password || '')

    if (!email || !password) {
      return NextResponse.json({ ok: false, message: 'Missing fields.' }, { status: 400 })
    }

    await dbConnect()

    // ✅ puxa só o necessário (inclui role)
    const user = await User.findOne({ email }).select('_id email username passwordHash role')
    if (!user) return NextResponse.json({ ok: false, message: 'Invalid credentials.' }, { status: 401 })

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) return NextResponse.json({ ok: false, message: 'Invalid credentials.' }, { status: 401 })

    const role: UserRole = (user.role || 'user') as UserRole

    const token = signToken({
      uid: String(user._id),
      email: user.email,
      username: user.username,
      role, // ✅ agora existe no JwtPayload
    })

    const res = NextResponse.json({
      ok: true,
      token,
      user: {
        id: String(user._id),
        email: user.email,
        username: user.username,
        role,
      },
    })

    res.cookies.set('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return res
  } catch (err: any) {
    console.error('[LOGIN_ERROR]', err)
    return NextResponse.json(
      {
        ok: false,
        message: process.env.NODE_ENV === 'production' ? 'Server error.' : String(err?.message || err),
      },
      { status: 500 }
    )
  }
}
