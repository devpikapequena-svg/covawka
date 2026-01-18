// src/app/api/auth/signup/route.ts
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
    const username = String(body?.username || '').trim()
    const password = String(body?.password || '')

    if (!email || !username || !password) {
      return NextResponse.json({ ok: false, message: 'Missing fields.' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ ok: false, message: 'Password must be at least 6 chars.' }, { status: 400 })
    }

    await dbConnect()

    const exists = await User.findOne({ email }).select('_id').lean()
    if (exists) {
      return NextResponse.json({ ok: false, message: 'Email already in use.' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    // role default do schema = 'user'
    const created = await User.create({ email, username, passwordHash })
    const role: UserRole = (created.role || 'user') as UserRole

    const token = signToken({
      uid: String(created._id),
      email: created.email,
      username: created.username,
      role, // ✅
    })

    const res = NextResponse.json({
      ok: true,
      token,
      user: {
        id: String(created._id),
        email: created.email,
        username: created.username,
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
    console.error('[SIGNUP_ERROR]', err)

    if (err?.code === 11000) {
      return NextResponse.json({ ok: false, message: 'Email already in use.' }, { status: 409 })
    }

    return NextResponse.json(
      {
        ok: false,
        message: process.env.NODE_ENV === 'production' ? 'Server error.' : String(err?.message || err),
      },
      { status: 500 }
    )
  }
}
