'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ShoppingCart, ChevronDown, LayoutDashboard, LogOut } from 'lucide-react'
import { useCart } from '@/context/CartContext'

type Props = { accent?: string }

type MeUser = {
  uid: string
  email: string
  username: string
  role?: string
}

type MeResponse = { ok: true; user: MeUser } | { ok: false }

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export default function Header({ accent }: Props) {
  const { count } = useCart()

  const [loadingMe, setLoadingMe] = useState(true)
  const [logged, setLogged] = useState(false)
  const [accountName, setAccountName] = useState<string>('Account')

  const [menuOpen, setMenuOpen] = useState(false)
  const menuWrapRef = useRef<HTMLDivElement | null>(null)

  // evita race condition (fetch antigo sobrescrevendo estado)
  const reqIdRef = useRef(0)

  async function fetchMe() {
    const myReqId = ++reqIdRef.current

    try {
      setLoadingMe(true)

      const res = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      })

      const data = (await res.json().catch(() => null)) as MeResponse | null

      // se chegou um fetch mais novo, ignora esse
      if (myReqId !== reqIdRef.current) return

      if (!res.ok || !data || (data as any)?.ok !== true) {
        setLogged(false)
        setAccountName('Account')
        setMenuOpen(false)
        return
      }

      const user = (data as any).user as MeUser
      setLogged(true)
      setAccountName(user?.username || user?.email || 'Account')
    } catch {
      if (myReqId !== reqIdRef.current) return
      setLogged(false)
      setAccountName('Account')
      setMenuOpen(false)
    } finally {
      if (myReqId !== reqIdRef.current) return
      setLoadingMe(false)
    }
  }

  useEffect(() => {
    fetchMe()

    const onAuthChanged = () => fetchMe()
    window.addEventListener('auth:changed', onAuthChanged as any)

    return () => {
      window.removeEventListener('auth:changed', onAuthChanged as any)
    }
  }, [])

  // fecha dropdown clicando fora + ESC
  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (!menuOpen) return
      const el = menuWrapRef.current
      if (!el) return
      if (!el.contains(e.target as any)) setMenuOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (!menuOpen) return
      if (e.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('mousedown', onDocDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  async function doLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch {
      // ignore
    } finally {
      setMenuOpen(false)
      window.dispatchEvent(new Event('auth:changed'))
      window.location.href = '/'
    }
  }

  const cartLabel = useMemo(() => {
    if (count <= 0) return 'Cart'
    if (count > 99) return 'Cart (99+)'
    return `Cart (${count})`
  }, [count])

  return (
    <header className="sticky top-0 z-[60]">
      <div className="relative bg-black/80 backdrop-blur-[2px]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 shadow-[0_18px_60px_rgba(0,0,0,0.45)]" />
        </div>

        <div className="relative mx-auto flex h-[78px] max-w-[1500px] items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative h-[40px] w-[40px]">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  fill
                  priority
                  className="object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,0.55)]"
                />
              </div>
            </Link>

            <nav className="hidden items-center gap-7 md:flex">
              {[
                { t: 'Store', href: '/#popular' },
                { t: 'Forums', href: '#' },
                { t: 'Status', href: '#' },
                { t: 'Reviews', href: '#' },
              ].map((it) => (
                <Link
                  key={it.t}
                  href={it.href}
                  className="group relative text-[14px] tracking-[0.01em] text-white/70 transition hover:text-white"
                >
                  {it.t}
                  <span
                    className="absolute -bottom-2 left-0 h-[2px] w-0 rounded-full bg-white/70 transition-all duration-300 group-hover:w-full"
                    aria-hidden
                  />
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-5">
            {/* CART */}
            <Link href="/cart" className={cn('inline-flex items-center gap-1', 'text-[13px] transition')}>
              <ShoppingCart className="h-4 w-4 opacity-80" />
              {cartLabel}
              {count > 0 && <span className="ml-1 inline-flex h-5 items-center justify-center text-[11px] font-extrabold text-white" />}
            </Link>

            {/* AUTH */}
            {logged ? (
              <div ref={menuWrapRef} className="relative hidden md:flex items-center gap-2">
                <span className="text-[13px] text-white/55">Account</span>

                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className={cn('inline-flex items-center gap-1', 'text-[13px] text-white/80 transition')}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  title={accountName}
                >
                  <span className="max-w-[170px] truncate">{loadingMe ? '...' : accountName}</span>
                  <ChevronDown className={cn('h-4 w-4 opacity-70 transition', menuOpen && 'rotate-180')} />
                </button>

                {menuOpen ? (
                  <div
                    className="absolute right-0 top-[44px] w-[220px] overflow-hidden rounded-2xl border border-white/10 bg-black/80 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl"
                    role="menu"
                  >
                    <div className="px-3 py-3">
                      <div className="text-[11px] text-white/45">Signed as</div>
                      <div className="mt-1 truncate text-[12px] font-semibold text-white/85">{accountName}</div>
                    </div>

                    <div className="h-px w-full" style={{ background: 'rgba(255,255,255,0.08)' }} />

                    <div className="p-2">
                      <Link
                        href="/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-semibold text-white/80 transition hover:bg-white/[0.06] hover:text-white"
                        role="menuitem"
                      >
                        <LayoutDashboard className="h-4 w-4 opacity-80" />
                        Dashboard
                      </Link>

                      <button
                        onClick={doLogout}
                        className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[12px] font-semibold text-white/80 transition hover:bg-white/[0.06] hover:text-white"
                        role="menuitem"
                      >
                        <LogOut className="h-4 w-4 opacity-80" />
                        Logout
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="hidden items-center gap-2 md:flex">
                <span className="text-[13px] text-white/55">Existing user?</span>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[13px] text-white/80 transition hover:text-white"
                >
                  Sign In <ChevronDown className="h-4 w-4 opacity-70" />
                </Link>
              </div>
            )}

            {/* ✅ CTA: só quando NÃO estiver logado */}
            {!logged ? (
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-[13px] text-black shadow-[0_12px_30px_rgba(0,0,0,0.35)] transition hover:opacity-95"
                style={accent ? { boxShadow: '0_12px_30px_rgba(0,0,0,0.35)' } : undefined}
              >
                Sign Up
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}
