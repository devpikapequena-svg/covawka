// src/app/dashboard/page.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { CheckCircle2, Loader2, Lock, Package, ShoppingBag, Copy } from 'lucide-react'

const BG = '#0a0a0aff'
const ACCENT = '#d32f2f'

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

type Me = { uid: string; email: string; username: string }

type OrderItem = {
  key: string
  gameId: string
  productId: string
  title: string
  cover?: string
  planId: 'day' | 'week' | 'month'
  planLabel: string
  unitPrice: number
  quantity: number

  // ✅ vem do Order no Mongo
  deliveredKeys?: string[]
  expiresAt?: string | null
}

type Order = {
  _id: string
  status: 'waiting_payment' | 'paid' | 'delivering' | 'delivered' | 'failed' | 'canceled'
  amount: number
  currency: 'USD' | 'BRL'
  transactionHash?: string | null
  externalId?: string | null
  items: OrderItem[]
  createdAt: string
}

function formatMoney(v: number, currency: 'USD' | 'BRL') {
  if (currency === 'BRL') return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  return `$${Number(v || 0).toFixed(2)}`
}

function StatusPill({ status }: { status: Order['status'] }) {
  const base = 'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12px] font-semibold'

  if (status === 'delivered')
    return (
      <div className={base} style={{ borderColor: 'rgba(16,185,129,0.35)', background: 'rgba(16,185,129,0.10)' }}>
        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
        <span className="text-emerald-200/90">Delivered</span>
      </div>
    )

  if (status === 'paid' || status === 'delivering')
    return (
      <div className={base} style={{ borderColor: 'rgba(59,130,246,0.30)', background: 'rgba(59,130,246,0.10)' }}>
        <span className="h-2 w-2 rounded-full bg-sky-300/80" />
        <span className="text-sky-200/90">{status === 'delivering' ? 'Delivering' : 'Paid'}</span>
      </div>
    )

  if (status === 'waiting_payment')
    return (
      <div className={base} style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.03)' }}>
        <Loader2 className="h-4 w-4 animate-spin text-white/60" />
        <span className="text-white/70">Waiting payment</span>
      </div>
    )

  if (status === 'canceled')
    return (
      <div className={base} style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.03)' }}>
        <span className="h-2 w-2 rounded-full bg-white/40" />
        <span className="text-white/70">Canceled</span>
      </div>
    )

  return (
    <div className={base} style={{ borderColor: 'rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.10)' }}>
      <span className="h-2 w-2 rounded-full bg-red-300/80" />
      <span className="text-red-200">Failed</span>
    </div>
  )
}

function SoftLine() {
  return <div className="h-px w-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
}

export default function DashboardPage() {
  const [me, setMe] = useState<Me | null>(null)
  const [loadingMe, setLoadingMe] = useState(true)

  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch('/api/auth/me', { method: 'GET', credentials: 'include', cache: 'no-store' })
        if (!r.ok) {
          const returnTo = encodeURIComponent('/dashboard')
          window.location.href = `/login?returnTo=${returnTo}`
          return
        }
        const d = await r.json()
        const user = d?.user || d
        setMe(user)
      } catch {
        const returnTo = encodeURIComponent('/dashboard')
        window.location.href = `/login?returnTo=${returnTo}`
      } finally {
        setLoadingMe(false)
      }
    })()
  }, [])

  useEffect(() => {
    if (loadingMe) return
    if (!me) return

    ;(async () => {
      try {
        setLoadingOrders(true)
        setErr(null)
        const r = await fetch('/api/orders/my', { method: 'GET', credentials: 'include', cache: 'no-store' })
        const d = await r.json().catch(() => null)
        if (!r.ok) throw new Error(d?.error || 'Failed to load orders.')
        setOrders(d?.orders || [])
      } catch (e: any) {
        setErr(e?.message || 'Error loading orders.')
      } finally {
        setLoadingOrders(false)
      }
    })()
  }, [loadingMe, me])

  const deliveredItems = useMemo(() => {
    const list: Array<{ orderId: string; status: Order['status']; createdAt: string; item: OrderItem; currency: Order['currency'] }> = []
    for (const o of orders) {
      for (const it of o.items || []) list.push({ orderId: o._id, status: o.status, createdAt: o.createdAt, item: it, currency: o.currency })
    }
    return list
  }, [orders])

  const displayName = me?.username || me?.email?.split('@')[0] || 'Account'

  if (loadingMe) {
    return (
      <main className="min-h-screen" style={{ background: BG }}>
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 rounded-full border border-white/10 border-t-white/50 animate-spin" />
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      <Header accent={ACCENT} />

      <main className="relative mx-auto max-w-[1500px] px-4 pb-20 pt-10 text-white">
        {/* top */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-[12px] text-white/50">Dashboard</div>
              <div className="mt-1 text-[22px] font-semibold tracking-[-0.02em]">{displayName}</div>
              <div className="mt-1 text-[13px] text-white/55">Your purchases and delivered items.</div>
            </div>

            <Link
              href="/#popular"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-[12px] font-extrabold text-white/80 transition hover:border-white/18 hover:bg-white/[0.04] hover:text-white"
            >
              <ShoppingBag className="h-4 w-4 opacity-80" />
              Continue shopping
            </Link>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1.05fr_.95fr]">
          {/* Purchases */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.02]">
            <div className="p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-white/75" />
                  <div className="text-[15px] font-semibold">Purchases</div>
                </div>
                <div className="text-[12px] text-white/45">{orders.length} orders</div>
              </div>

              <div className="mt-5">
                <SoftLine />
              </div>

              {err && (
                <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                  <div className="text-[12px] text-red-200">{err}</div>
                </div>
              )}

              {loadingOrders ? (
                <div className="mt-6 flex items-center gap-2 text-white/60">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading orders...
                </div>
              ) : orders.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                  <div className="text-[13px] font-semibold text-white/85">No purchases yet</div>
                  <div className="mt-1 text-[12px] text-white/55">Buy a product and it will show up here.</div>
                  <Link
                    href="/#popular"
                    className="mt-4 inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-[12px] font-extrabold text-black transition hover:opacity-95"
                  >
                    Open Store
                  </Link>
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {orders.map((o) => {
                    const isUnlocked = o.status === 'paid' || o.status === 'delivering' || o.status === 'delivered'
                    const isDelivered = o.status === 'delivered'

                    return (
                      <div key={o._id} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[12px] text-white/45">{new Date(o.createdAt).toLocaleString('pt-BR')}</div>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <StatusPill status={o.status} />
                              <div className="text-[12px] text-white/60">
                                Total: <span className="text-white/85 font-semibold">{formatMoney(o.amount, o.currency)}</span>
                              </div>
                            </div>

                            {o.transactionHash ? (
                              <div className="mt-2 text-[12px] text-white/45">
                                TX: <span className="text-white/70">{o.transactionHash}</span>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          {(o.items || []).map((it) => (
                            <div key={it.key} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                              <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-white/10 bg-white/[0.02]">
                                {it.cover ? <Image src={it.cover} alt={it.title} fill className="object-cover" /> : null}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="truncate text-[13px] font-semibold text-white/90">{it.title}</div>
                                <div className="mt-0.5 text-[11px] text-white/50">
                                  {it.planLabel} • x{it.quantity} • {formatMoney(it.unitPrice, o.currency)}
                                </div>
                              </div>

                              {isDelivered ? (
                                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-200/90">
                                  <CheckCircle2 className="h-4 w-4 text-emerald-300/90" />
                                  Delivered
                                </div>
                              ) : isUnlocked ? (
                                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold text-sky-200/90">
                                  <span className="h-2 w-2 rounded-full bg-sky-300/80" />
                                  Processing
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-[11px] font-semibold text-white/70">
                                  <Lock className="h-4 w-4 text-white/50" />
                                  Locked
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Delivery */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.02]">
            <div className="p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-white/75" />
                  <div className="text-[15px] font-semibold">Delivered</div>
                </div>
                <div className="text-[12px] text-white/45">{deliveredItems.length} items</div>
              </div>

              <div className="mt-5">
                <SoftLine />
              </div>

              <div className="mt-6 space-y-3">
                {deliveredItems.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-[12px] text-white/55">
                    When you purchase a product, delivery will show here.
                  </div>
                ) : (
                  deliveredItems.map(({ orderId, status, item }) => {
                    const unlocked = status === 'delivered' || status === 'paid' || status === 'delivering'
                    const keys = item.deliveredKeys || []

                    return (
                      <div key={`${orderId}:${item.key}`} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                        <div className="flex items-start gap-3">
                          <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
                            {item.cover ? <Image src={item.cover} alt={item.title} fill className="object-cover" /> : null}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[14px] font-semibold text-white/90">{item.title}</div>
                            <div className="mt-1 text-[12px] text-white/55">
                              {item.planLabel} • x{item.quantity}
                            </div>
                          </div>

                          <StatusPill status={status} />
                        </div>

                        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                          {unlocked ? (
                            <>
                              {keys.length ? (
                                <div className="space-y-2">
                                  <div className="text-[11px] text-white/50">License / Keys</div>

                                  {keys.map((k) => (
                                    <div key={k} className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/30 p-3">
                                      <div className="min-w-0 truncate text-[12px] font-semibold text-white/85">{k}</div>
                                      <button
                                        className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-[11px] font-extrabold text-white/80 transition hover:border-white/18 hover:bg-white/[0.04] hover:text-white"
                                        onClick={async () => {
                                          try {
                                            await navigator.clipboard.writeText(k)
                                          } catch {}
                                        }}
                                      >
                                        <Copy className="h-4 w-4" />
                                        Copy
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-[12px] text-white/60">Entregue, mas sem key salva no pedido.</div>
                              )}

                              {item.expiresAt ? (
                                <div className="mt-3 text-[12px] text-white/55">
                                  <div className="text-[11px] text-white/50">Expires</div>
                                  <div className="mt-1">{new Date(item.expiresAt).toLocaleString('pt-BR')}</div>
                                </div>
                              ) : null}
                            </>
                          ) : (
                            <div className="flex items-center gap-2 text-[12px] text-white/60">
                              <Lock className="h-4 w-4 text-white/50" />
                              Delivery is locked until payment is confirmed.
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
