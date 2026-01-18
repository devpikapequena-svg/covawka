// src/lib/requireUser.ts
import { cookies } from 'next/headers'
import { verifyToken, JwtPayload } from '@/lib/auth'

export async function requireUser(): Promise<JwtPayload | null> {
  try {
    const store = await cookies()
    const token = store.get('token')?.value
    if (!token) return null
    const payload = verifyToken(token)
    return payload
  } catch {
    return null
  }
}
