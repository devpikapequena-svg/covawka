// src/hooks/useMe.ts
'use client'

import { useCallback, useEffect, useState } from 'react'

export type MeUser = {
  uid: string
  email?: string
  username?: string
  role?: string
}

type MeResponse =
  | { ok: true; user: MeUser }
  | { ok: false }

export function useMe() {
  const [user, setUser] = useState<MeUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      })
      const data = (await res.json().catch(() => null)) as MeResponse | null
      if (!res.ok || !data || (data as any).ok !== true) {
        setUser(null)
        return
      }
      setUser((data as any).user || null)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()

    const onAuthChanged = () => refresh()
    window.addEventListener('auth:changed', onAuthChanged as any)
    return () => window.removeEventListener('auth:changed', onAuthChanged as any)
  }, [refresh])

  return { user, loading, isLoggedIn: !!user, refresh }
}
