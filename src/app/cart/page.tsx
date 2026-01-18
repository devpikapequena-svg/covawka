// src/app/cart/page.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Minus, Plus, Trash2, ArrowLeft, CreditCard } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useCart } from '@/context/CartContext'

const BG = '#0a0a0aff'
const ACCENT = '#d32f2f'

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function CartPage() {
  const router = useRouter()
  const { items, subtotal, updateQty, removeItem, clear } = useCart()

  return (
    <div className="min-h-screen text-white" style={{ background: BG }}>
      <Header accent={ACCENT} />

      <div className="relative mx-auto max-w-[1500px] px-4 pb-20 pt-10">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[14px] font-semibold text-white/90">Your Cart</div>
            <Link
              href="/#popular"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-[12px] font-semibold text-white/70 transition hover:border-white/18 hover:bg-white/[0.04] hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Continue shopping
            </Link>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.25fr_.75fr]">
          {/* ITEMS */}
          <div className="space-y-4">
            {items.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
                <div className="text-[18px] font-semibold text-white">Cart is empty</div>
                <div className="mt-2 text-[13px] text-white/55">Add something from the store.</div>
              </div>
            ) : (
              items.map((it) => (
                <div key={it.key} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                  <div className="flex gap-4">
                    <div className="relative h-[72px] w-[72px] overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
                      {it.cover ? (
                        <Image src={it.cover} alt={it.title} fill className="object-cover" />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-[14px] font-semibold text-white">{it.title}</div>
                          <div className="mt-1 text-[12px] text-white/55">
                            {it.gameId.toUpperCase()} • {it.planLabel}
                          </div>
                        </div>

                        <button
                          onClick={() => removeItem(it.key)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-white/70 transition hover:border-white/18 hover:bg-white/[0.04] hover:text-white"
                          title="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-1">
                          <button
                            onClick={() => updateQty(it.key, it.quantity - 1)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/[0.04] hover:text-white"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <div className="w-8 text-center text-[12px] font-semibold text-white/85">{it.quantity}</div>
                          <button
                            onClick={() => updateQty(it.key, it.quantity + 1)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/[0.04] hover:text-white"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="text-[13px] font-semibold text-emerald-300">
                          {formatBRL(it.unitPrice * it.quantity)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* SUMMARY */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="text-[14px] font-semibold text-white">Summary</div>

              <div className="mt-4 space-y-2 text-[12px] text-white/60">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span className="text-white/85">{formatBRL(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Fees</span>
                  <span className="text-white/85">{formatBRL(0)}</span>
                </div>
                <div className="h-px w-full bg-white/10" />
                <div className="flex items-center justify-between">
                  <span>Total</span>
                  <span className="text-[16px] font-semibold" style={{ color: '#d32f2f' }}>
                    {formatBRL(subtotal)}
                  </span>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <button
                  disabled={items.length === 0}
                  onClick={() => router.push('/checkout')}
                  className={cn(
                    'inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4',
                    'text-[12px] font-extrabold text-white transition disabled:opacity-60 disabled:cursor-not-allowed',
                    'border border-white/10 hover:border-white/18'
                  )}
                  style={{
                    background: `linear-gradient(135deg, ${ACCENT}55, rgba(255,255,255,0.06))`,
                  }}
                >
                  <CreditCard className="h-4 w-4" />
                  Checkout
                </button>

                <button
                  disabled={items.length === 0}
                  onClick={clear}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-[12px] font-extrabold text-white/75 transition hover:border-white/18 hover:bg-white/[0.04] hover:text-white disabled:opacity-60"
                >
                  Clear cart
                </button>
              </div>

              <div className="mt-4 text-[12px] text-white/45">PIX only • Instant delivery</div>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  )
}
