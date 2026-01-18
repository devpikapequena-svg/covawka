// src/app/login/page.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'

const BG = '#0a0a0aff'
const ACCENT = '#d32f2f'

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export default function LoginPage() {
  const router = useRouter()
  const sp = useSearchParams()
  const returnTo = useMemo(() => sp.get('returnTo') || '/cart', [sp])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // ✅ importante (cookie)
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok || !data?.ok) {
        setErr(data?.message || 'Login failed.')
        return
      }

      // ✅ avisa a UI (Header/useMe) que mudou auth
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:changed'))
      }

      router.push(returnTo)
    } catch {
      setErr('Network error.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      {/* glow */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-52 left-1/2 h-[620px] w-[980px] -translate-x-1/2 blur-3xl"
          style={{ background: `radial-gradient(closest-side, ${ACCENT}1b, transparent 72%)` }}
        />
      </div>

      <main className="relative mx-auto flex min-h-screen max-w-[1500px] items-center justify-center px-4 py-16">
        <div className="w-full max-w-[520px]">
          <Link
            href={returnTo}
            className="mb-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-[12px] font-semibold text-white/70 transition hover:border-white/18 hover:bg-white/[0.04] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <div className="flex items-center gap-3">
              <div className="relative h-[40px] w-[40px]">
                <Image src="/logo.png" alt="Logo" fill className="object-contain" />
              </div>
              <div>
                <div className="text-[18px] font-semibold text-white">Sign in</div>
                <div className="text-[12px] text-white/55">Access your account</div>
              </div>
            </div>

            <form onSubmit={onSubmit} className="mt-6 space-y-3">
              <div>
                <label className="text-[12px] font-semibold text-white/60">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 h-[44px] w-full rounded-xl border border-white/10 bg-black/30 px-4 text-[13px] text-white outline-none transition focus:border-white/18"
                  placeholder="you@email.com"
                  type="email"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="text-[12px] font-semibold text-white/60">Password</label>
                <div className="relative mt-2">
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-[44px] w-full rounded-xl border border-white/10 bg-black/30 px-4 pr-12 text-[13px] text-white outline-none transition focus:border-white/18"
                    placeholder="••••••••"
                    type={show ? 'text' : 'password'}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl border border-white/10 bg-white/[0.02] p-2 text-white/70 transition hover:border-white/18 hover:bg-white/[0.04] hover:text-white"
                    aria-label="toggle password"
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {err && (
                <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-[12px] text-rose-200/90">
                  {err}
                </div>
              )}

              <button
                disabled={loading}
                className={cn(
                  'mt-2 inline-flex h-[44px] w-full items-center justify-center gap-2 rounded-xl',
                  'text-[12px] font-extrabold text-white transition',
                  'border border-white/10 hover:border-white/18 disabled:cursor-not-allowed disabled:opacity-60'
                )}
                style={{
                  background: `linear-gradient(135deg, ${ACCENT}66, rgba(255,255,255,0.06))`,
                }}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Sign In
              </button>

              <div className="pt-2 text-center text-[12px] text-white/50">
                No account?{' '}
                <Link
                  href={`/signup?returnTo=${encodeURIComponent(returnTo)}`}
                  className="font-semibold text-white/80 hover:text-white"
                >
                  Create one
                </Link>
              </div>
            </form>
          </div>

          <div className="mt-4 text-center text-[11px] text-white/35">
            Login é por cookie httpOnly + /api/auth/me.
          </div>
        </div>
      </main>
    </div>
  )
}
