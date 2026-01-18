// src/app/admin/keys/page.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Shield, Database, UploadCloud, RefreshCcw, Loader2 } from 'lucide-react'

const BG = '#0a0a0aff'
const ACCENT = '#d32f2f'

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

const CATALOG = {
  fivem: ['fivem-external', 'fivem-bypass'],
  valorant: ['valorant-aimcolor', 'valorant-external'],
  cs2: ['cs2-external'],
  freefire: ['freefire-mobile', 'freefire-ios', 'freefire-emulador'],
} as const

const PLANS = [
  { id: 'day', label: '1 Day' },
  { id: 'week', label: '1 Week' },
  { id: 'month', label: 'Monthly' },
] as const

type Counts = { available: number; assigned: number; sent: number }

type MeResponse =
  | { ok: true; user: { uid: string; email: string; username: string; role: 'user' | 'admin' } }
  | { ok: false }

export default function AdminKeysPage() {
  const router = useRouter()

  const [checkingAdmin, setCheckingAdmin] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  const games = useMemo(() => Object.keys(CATALOG) as Array<keyof typeof CATALOG>, [])
  const [gameId, setGameId] = useState<string>(games[0] || 'fivem')
  const products = useMemo(() => (CATALOG as any)[gameId] || [], [gameId])
  const [productId, setProductId] = useState<string>(products[0] || '')
  const [planId, setPlanId] = useState<string>('day')

  const [keysText, setKeysText] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const [counts, setCounts] = useState<Counts | null>(null)

  useEffect(() => {
    setProductId(products[0] || '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId])

  useEffect(() => {
    let alive = true

    async function check() {
      try {
        setCheckingAdmin(true)

        const res = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        })

        const data = (await res.json().catch(() => null)) as MeResponse | null
        if (!alive) return

        const role = (data as any)?.user?.role
        const ok = res.ok && data && (data as any).ok === true && role === 'admin'

        if (!ok) {
          setIsAdmin(false)
          router.replace('/')
          return
        }

        setIsAdmin(true)
      } catch {
        setIsAdmin(false)
        router.replace('/')
      } finally {
        if (alive) setCheckingAdmin(false)
      }
    }

    check()
    return () => {
      alive = false
    }
  }, [router])

  async function refreshStock() {
    setErr(null)
    if (!isAdmin) return

    try {
      const qs = new URLSearchParams({ gameId, productId, planId })
      const res = await fetch(`/api/admin/keys/stock?${qs.toString()}`, {
        cache: 'no-store',
        credentials: 'include',
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) throw new Error(data?.error || 'Erro ao buscar estoque.')
      setCounts(data?.counts || null)
    } catch (e: any) {
      setErr(e?.message || 'Erro.')
    }
  }

  useEffect(() => {
    if (!isAdmin) return
    refreshStock()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, gameId, productId, planId])

  async function importKeys() {
    setMsg(null)
    setErr(null)
    if (!isAdmin) return

    const lines = keysText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)

    if (!gameId || !productId || !planId) return setErr('Selecione game/produto/plano.')
    if (lines.length === 0) return setErr('Cole as keys (1 por linha).')

    try {
      setLoading(true)

      const res = await fetch('/api/admin/keys/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          gameId,
          productId,
          planId,
          keys: keysText,
        }),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || data?.message || 'Erro ao importar.')

      setMsg(
        `Tentadas: ${data?.attempted ?? lines.length} • Inseridas: ${data?.inserted ?? 0} • Available: ${data?.counts?.available ?? '-'}`
      )

      setKeysText('')
      await refreshStock()
    } catch (e: any) {
      setErr(e?.message || 'Erro ao importar.')
    } finally {
      setLoading(false)
    }
  }

  if (checkingAdmin) {
    return (
      <div className="min-h-screen text-white" style={{ background: BG }}>
        <Header accent={ACCENT} />
        <div className="mx-auto flex max-w-[1500px] items-center justify-center px-4 py-24">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-3 text-[13px] text-white/70">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking permissions…
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div className="min-h-screen text-white" style={{ background: BG }}>
      <Header accent={ACCENT} />

      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute left-1/2 top-[-140px] h-[420px] w-[820px] -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: `radial-gradient(closest-side, ${ACCENT}22, transparent 70%)` }}
        />
      </div>

      <main className="relative mx-auto max-w-[1500px] px-4 pb-20 pt-10">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[14px] font-semibold text-white/90">
              <Shield className="h-4 w-4" style={{ color: ACCENT }} />
              Admin • Key Stock
            </div>

            <button
              onClick={refreshStock}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-[12px] font-semibold text-white/70 transition hover:border-white/18 hover:bg-white/[0.04] hover:text-white"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_.8fr]">
          {/* LEFT: IMPORT */}
          <div className="rounded-[22px] border border-white/10 bg-white/[0.02] p-6">
            <div className="flex items-center gap-2 text-[14px] font-semibold text-white/90">
              <UploadCloud className="h-4 w-4 opacity-90" />
              Import keys
            </div>
            <div className="mt-1 text-[12px] text-white/45">Cole 1 key por linha e selecione game/produto/plano.</div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <label className="block">
                <div className="mb-2 text-[12px] font-medium text-white/60">Game</div>
                <select
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-3 text-[13px] text-white/85 outline-none"
                >
                  {games.map((g) => (
                    <option key={g} value={g} className="bg-black">
                      {g.toUpperCase()}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <div className="mb-2 text-[12px] font-medium text-white/60">Product</div>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-3 text-[13px] text-white/85 outline-none"
                >
                  {products.map((p: string) => (
                    <option key={p} value={p} className="bg-black">
                      {p}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <div className="mb-2 text-[12px] font-medium text-white/60">Plan</div>
                <select
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-3 text-[13px] text-white/85 outline-none"
                >
                  {PLANS.map((p) => (
                    <option key={p.id} value={p.id} className="bg-black">
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4">
              <div className="mb-2 text-[12px] font-medium text-white/60">Keys</div>
              <textarea
                value={keysText}
                onChange={(e) => setKeysText(e.target.value)}
                placeholder={`ABC-123\nDEF-456\nGHI-789`}
                className="h-[240px] w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-[12px] text-white/85 outline-none placeholder:text-white/25"
              />
              <div className="mt-2 text-[11px] text-white/40">
                Total linhas: {keysText.split('\n').map((s) => s.trim()).filter(Boolean).length}
              </div>
            </div>

            {msg ? (
              <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-[12px] text-emerald-100">
                {msg}
              </div>
            ) : null}
            {err ? (
              <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[12px] text-red-200">
                {err}
              </div>
            ) : null}

            <div className="mt-5 flex justify-end">
              <button
                onClick={importKeys}
                disabled={loading}
                className={cn(
                  'inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-5',
                  'text-[13px] font-semibold text-white transition disabled:opacity-60 disabled:cursor-not-allowed',
                  'border border-white/10 hover:border-white/18'
                )}
                style={{ background: `linear-gradient(135deg, ${ACCENT}66, rgba(255,255,255,0.06))` }}
              >
                <Database className="h-4 w-4" />
                {loading ? 'Importing…' : 'Import to stock'}
              </button>
            </div>
          </div>

          {/* RIGHT: STOCK */}
          <div className="rounded-[22px] border border-white/10 bg-white/[0.02] p-6">
            <div className="text-[14px] font-semibold text-white/90">Stock overview</div>
            <div className="mt-1 text-[12px] text-white/45">
              Esse estoque é usado quando o pedido vira <b>PAID</b> e o fulfill aloca keys com status <b>available</b>.
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-[12px] text-white/55">Selecionado</div>
              <div className="mt-2 text-[13px] font-semibold text-white/85">
                {gameId.toUpperCase()} • {productId} • {PLANS.find((p) => p.id === planId)?.label || planId}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="text-[11px] text-white/55">Available</div>
                  <div className="mt-2 text-[22px] font-semibold text-emerald-300">{counts?.available ?? '-'}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="text-[11px] text-white/55">Assigned</div>
                  <div className="mt-2 text-[22px] font-semibold text-white/85">{counts?.assigned ?? '-'}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="text-[11px] text-white/55">Sent</div>
                  <div className="mt-2 text-[22px] font-semibold text-white/85">{counts?.sent ?? '-'}</div>
                </div>
              </div>

              <div className="mt-4 text-[12px] text-white/45">
                Validade: <span className="text-white/70">é calculada na entrega</span> (day=+1, week=+7, month=+30).
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
