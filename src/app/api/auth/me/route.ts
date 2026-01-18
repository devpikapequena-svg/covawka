// src/app/api/auth/me/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import { User } from '@/models/User'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ ok: false }, { status: 401 })
    }

    const payload = verifyToken(token)

    await dbConnect()

    const user = await User.findById(payload.uid).select('_id email username role').lean()

    if (!user) {
      return NextResponse.json({ ok: false }, { status: 401 })
    }

    return NextResponse.json({
      ok: true,
      user: {
        uid: String(user._id),
        email: String(user.email),
        username: String(user.username),
        role: String((user as any).role || 'user'),
      },
    })
  } catch (err) {
    console.error('[AUTH_ME]', err)
    return NextResponse.json({ ok: false }, { status: 401 })
  }
}
