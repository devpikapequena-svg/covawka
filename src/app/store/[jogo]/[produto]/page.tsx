// src/app/store/[jogo]/[produto]/page.tsx
'use client'
import { useMe } from '@/hooks/useMe'
import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronRight,
  ShieldCheck,
  ShoppingBag,
  CheckCircle2,
  Info,
  Monitor,
  Lock,
  Sparkles,
  ArrowLeft,
  Calendar,
  X,
} from 'lucide-react'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { useCart } from '@/context/CartContext'

const BG = '#0a0a0aff'
const ACCENT = '#d32f2f'

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

type PricingPlan = {
  id: 'day' | 'week' | 'month'
  label: string
  price: number
}

type Product = {
  id: string
  title: string
  cover: string
  tag?: string
  pricing?: PricingPlan[]
}

type GameCatalog = {
  id: string
  name: string
  heroTitle: string
  heroDesc?: string
  heroCtaLabel?: string
  heroCtaHref?: string
  heroImage?: string
  products: Product[]
}

const CATALOG: Record<string, GameCatalog> = {
  fivem: {
    id: 'fivem',
    name: 'FiveM',
    heroTitle: 'FiveM Tools',
    heroDesc:
      'Browse a curated selection of high-quality products for FiveM, with fast access and reliable support.',
    heroCtaLabel: 'Browse products',
    heroCtaHref: '#products',
    heroImage: '/hero.png',
    products: [
      {
        id: 'fivem-external',
        title: 'FiveM External',
        cover: '/mockup/fivem.png',
        tag: 'UNDETECTED',
        pricing: [
          { id: 'day', label: '1 Day', price: 10.49 },
          { id: 'week', label: '1 Week', price: 30.49 },
          { id: 'month', label: 'Monthly', price: 69.99 },
        ],
      },
      {
        id: 'fivem-bypass',
        title: 'FiveM Bypass',
        cover: '/mockup/bypass.png',
        tag: 'UNDETECTED',
        pricing: [
          { id: 'day', label: '1 Day', price: 15.99 },
          { id: 'week', label: '1 Week', price: 44.99 },
          { id: 'month', label: 'Monthly', price: 99.99 },
        ],
      },
    ],
  },
  valorant: {
    id: 'valorant',
    name: 'Valorant',
    heroTitle: 'Valorant',
    heroDesc:
      'Browse a curated selection of high-quality products for Valorant, with fast access and reliable support.',
    heroCtaLabel: 'Browse products',
    heroCtaHref: '#products',
    heroImage: '/hero.png',
    products: [
      {
        id: 'valorant-aimcolor',
        title: 'Valorant Aim Color',
        cover: '/mockup/valorantaim.png',
        tag: 'AVAILABLE',
        pricing: [
          { id: 'day', label: '1 Day',  price: 12.99 },
          { id: 'week', label: '1 Week', price: 34.99 },
          { id: 'month', label: 'Monthly', price: 79.99 },
        ],
      },
      {
        id: 'valorant-external',
        title: 'Valorant External',
        cover: '/mockup/valorantexternal.png',
        tag: 'AVAILABLE',
        pricing: [
          { id: 'day', label: '1 Day', price: 9.99 },
          { id: 'week', label: '1 Week', price: 27.99 },
          { id: 'month', label: 'Monthly', price: 64.99 },
        ],
      },
    ],
  },
  cs2: {
    id: 'cs2',
    name: 'Counter Strike 2',
    heroTitle: 'CS2 Tools',
    heroDesc:
      'Browse a curated selection of high-quality products for CS2, with fast access and reliable support.',
    heroCtaLabel: 'Browse products',
    heroCtaHref: '#products',
    heroImage: '/hero.png',
    products: [
      {
        id: 'cs2-external',
        title: 'Cs2 External',
        cover: '/mockup/cs2.png',
        tag: 'AVAILABLE',
        pricing: [
          { id: 'day', label: '1 Day', price: 7.49 },
          { id: 'week', label: '1 Week', price: 19.99 },
          { id: 'month', label: 'Monthly', price: 49.99 },
        ],
      },
    ],
  },
  freefire: {
    id: 'freefire',
    name: 'Free Fire',
    heroTitle: 'Free Fire Tools',
    heroDesc:
      'Browse a curated selection of high-quality products for Free Fire, with fast access and reliable support.',
    heroCtaLabel: 'Browse products',
    heroCtaHref: '#products',
    heroImage: '/hero.png',
    products: [
      {
        id: 'freefire-mobile',
        title: 'Free-fire Mobile',
        cover: '/mockup/freefire-mobile.png',
        tag: 'UNDETECTED',
        pricing: [
          { id: 'day', label: '1 Day', price: 5.99 },
          { id: 'week', label: '1 Week', price: 16.99 },
          { id: 'month', label: 'Monthly', price: 39.99 },
        ],
      },
      {
        id: 'freefire-ios',
        title: 'Free-fire IOS',
        cover: '/mockup/freefire-ios.png',
        tag: 'UNDETECTED',
        pricing: [
          { id: 'day', label: '1 Day', price: 15.99 },
          { id: 'week', label: '1 Week', price: 39.99 },
          { id: 'month', label: 'Monthly', price: 89.99 },
        ],
      },
      {
        id: 'freefire-emulador',
        title: 'Free-fire Emulador',
        cover: '/mockup/freefire.png',
        tag: 'UNDETECTED',
        pricing: [
          { id: 'day', label: '1 Day', price: 10.99 },
          { id: 'week', label: '1 Week', price: 29.99 },
          { id: 'month', label: 'Monthly', price: 74.99 },
        ],
      },
    ],
  },
}

type TabKey = 'overview' | 'preview' | 'requirements' | 'faq'

function Badge({ text }: { text: string }) {
  const isGood = /undetected|available/i.test(text)
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold',
        isGood ? 'bg-emerald-500/15 text-emerald-200/90' : 'bg-white/10 text-white/75'
      )}
    >
      <span className={cn('h-2 w-2 rounded-full', isGood ? 'bg-emerald-400' : 'bg-white/40')} />
      {text}
    </div>
  )
}

function formatUSD(v: number) {
  return `$${v.toFixed(2)}`
}

function AuthModal({
  open,
  onClose,
  accent,
  returnTo,
}: {
  open: boolean
  onClose: () => void
  accent: string
  returnTo: string
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[120]">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-[520px] -translate-x-1/2 -translate-y-1/2">
        <div className="rounded-2xl border border-white/10 bg-[#0b0b0b] shadow-[0_30px_90px_rgba(0,0,0,0.7)]">
          <div className="flex items-start justify-between gap-4 p-5">
            <div>
              <div className="text-[16px] font-semibold text-white">Sign in required</div>
              <div className="mt-1 text-[13px] text-white/55">
                You need an account to add items and continue to checkout.
              </div>
            </div>

            <button
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] p-2 text-white/70 transition hover:border-white/18 hover:bg-white/[0.04] hover:text-white"
              aria-label="close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-5 pb-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link
                href={`/login?returnTo=${encodeURIComponent(returnTo)}`}
                className="inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-[12px] font-extrabold text-white/85 transition hover:border-white/18 hover:bg-white/[0.04] hover:text-white"
              >
                Sign In
              </Link>

              <Link
                href={`/signup?returnTo=${encodeURIComponent(returnTo)}`}
                className="inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-[12px] font-extrabold text-white transition"
                style={{
                  background: `linear-gradient(135deg, ${accent}66, rgba(255,255,255,0.06))`,
                  border: '1px solid rgba(255,255,255,0.10)',
                }}
              >
                Create account
              </Link>
            </div>

            <div className="mt-3 text-center text-[12px] text-white/40">
              After signing in, come back and click buy again.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function StoreProductPage({
  params,
}: {
  params: { jogo: string; produto: string }
}) {
  const router = useRouter()
  const { addItem } = useCart()

  const jogo = (params?.jogo || '').toLowerCase()
  const produto = (params?.produto || '').toLowerCase()
const { isLoggedIn, loading: meLoading } = useMe()

  const game = CATALOG[jogo]
  const product = useMemo(() => game?.products?.find((p) => p.id === produto), [game, produto])

  const [tab, setTab] = useState<TabKey>('overview')

  const plans = product?.pricing?.length
    ? product.pricing
    : ([
        { id: 'day', label: '1 Day', price: 9.99 },
        { id: 'week', label: '1 Week', price: 24.99 },
        { id: 'month', label: 'Monthly', price: 59.99 },
      ] as PricingPlan[])

  const [selectedPlanId, setSelectedPlanId] = useState<PricingPlan['id']>(plans[0].id)
  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId) || plans[0],
    [plans, selectedPlanId]
  )

  const [authOpen, setAuthOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 1600)
  }

  if (!game || !product) {
    return (
      <div className="min-h-screen" style={{ background: BG }}>
        <Header accent={ACCENT} />
        <div className="mx-auto max-w-[1500px] px-4 py-14">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
            <div className="text-[20px] font-semibold text-white">Product not found</div>
            <div className="mt-2 text-[13px] text-white/55">
              This product doesn’t exist. Go back to the store category.
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/store/${jogo}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-5 py-3 text-[13px] font-extrabold text-white/80 transition hover:border-white/18 hover:bg-white/[0.04] hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>

              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-[13px] font-extrabold text-black transition hover:opacity-95"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const tagText = product.tag || 'AVAILABLE'
  const priceLabel = formatUSD(selectedPlan.price)

  const backHref = `/store/${game.id}`
  const returnTo = `/store/${game.id}/${product.id}`

 const addToCart = (opts?: { goToCart?: boolean }) => {
  if (meLoading) return

  if (!isLoggedIn) {
    setAuthOpen(true)
    return
  }

  addItem({
    gameId: game.id,
    productId: product.id,
    title: product.title,
    cover: product.cover,
    tag: product.tag,
    planId: selectedPlan.id,
    planLabel: selectedPlan.label,
    unitPrice: selectedPlan.price,
    quantity: 1,
  })

  if (opts?.goToCart) {
    router.push('/cart')
  } else {
    showToast('Added to cart')
  }
}


  return (
    <div className="min-h-screen" style={{ background: BG }}>
      <Header accent={ACCENT} />

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} accent={ACCENT} returnTo={returnTo} />

      {/* mini toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[130] -translate-x-1/2">
          <div className="rounded-full border border-white/10 bg-black/70 px-4 py-2 text-[12px] font-semibold text-white/85 backdrop-blur">
            {toast}
          </div>
        </div>
      )}

      <main className="relative mx-auto max-w-[1500px] px-4 pb-20 pt-10">
        {/* breadcrumb */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-[12px] text-white/55">
              <Link href="/" className="transition hover:text-white">
                Home
              </Link>
              <ChevronRight className="h-4 w-4 text-white/25" />
              <Link href="/#popular" className="transition hover:text-white">
                Store
              </Link>
              <ChevronRight className="h-4 w-4 text-white/25" />
              <Link href={backHref} className="transition hover:text-white">
                {game.name}
              </Link>
              <ChevronRight className="h-4 w-4 text-white/25" />
              <span className="text-white/85">{product.title}</span>
            </div>

            <Link
              href={backHref}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-[12px] font-semibold text-white/70 transition hover:border-white/18 hover:bg-white/[0.04] hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 opacity-80" />
              Back
            </Link>
          </div>
        </div>

        {/* layout (fix: items-start) */}
        <div className="mt-8 grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.25fr_.9fr]">
          {/* LEFT */}
          <div className="self-start overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
            <div className="relative aspect-[20/10] w-full overflow-hidden">
              <Image src={product.cover} alt={product.title} fill priority className="object-cover" />
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to top, rgba(0,0,0,0.78), rgba(0,0,0,0.25) 55%, rgba(0,0,0,0.10))',
                }}
              />
              <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-end justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-[20px] font-semibold text-white">{product.title}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge text={tagText} />
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-semibold text-white/75">
                      <ShieldCheck className="h-4 w-4 opacity-80" />
                      Secure delivery
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 bg-white/[0.02] px-4 py-4">
              <div className="flex flex-wrap gap-2">
                {([
                  ['overview', 'Overview', Info],
                  ['preview', 'Preview', Monitor],
                  ['requirements', 'Requirements', Lock],
                  ['faq', 'FAQ', Sparkles],
                ] as Array<[TabKey, string, any]>).map(([key, label, Icon]) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-[12px] font-semibold transition',
                      tab === key
                        ? 'border-white/18 bg-white/[0.05] text-white'
                        : 'border-white/10 bg-white/[0.02] text-white/70 hover:border-white/18 hover:bg-white/[0.04] hover:text-white'
                    )}
                  >
                    <Icon className="h-4 w-4 opacity-80" />
                    {label}
                  </button>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5">
                {tab === 'overview' && (
                  <div>
                    <div className="text-[14px] font-semibold text-white">What you get</div>
                    <ul className="mt-3 space-y-2 text-[13px] text-white/60">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300/90" />
                        Instant access after purchase (automatic).
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300/90" />
                        Private download + basic usage guide.
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300/90" />
                        Support included (depends on plan/product).
                      </li>
                    </ul>
                  </div>
                )}

                {tab === 'preview' && (
                  <div>
                    <div className="text-[14px] font-semibold text-white">Preview</div>
                    <div className="mt-2 text-[13px] text-white/60">
                      Add screenshots, short demo clips, or feature highlights.
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]"
                        >
                          <Image
                            src={product.cover}
                            alt={`${product.title} preview ${i}`}
                            fill
                            className="object-cover opacity-[0.92]"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {tab === 'requirements' && (
                  <div>
                    <div className="text-[14px] font-semibold text-white">Requirements</div>
                    <ul className="mt-3 space-y-2 text-[13px] text-white/60">
                      <li className="flex items-start gap-2">
                        <Lock className="mt-0.5 h-4 w-4 text-white/50" />
                        OS: Windows 10/11 (recommended).
                      </li>
                      <li className="flex items-start gap-2">
                        <Lock className="mt-0.5 h-4 w-4 text-white/50" />
                        Game version: latest stable build.
                      </li>
                      <li className="flex items-start gap-2">
                        <Lock className="mt-0.5 h-4 w-4 text-white/50" />
                        Disable conflicting overlays/tools if needed.
                      </li>
                    </ul>
                  </div>
                )}

                {tab === 'faq' && (
                  <div>
                    <div className="text-[14px] font-semibold text-white">FAQ</div>
                    <div className="mt-3 space-y-3">
                      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                        <div className="text-[13px] font-semibold text-white">How do I receive it?</div>
                        <div className="mt-1 text-[12px] text-white/60">
                          After payment confirmation, you’ll see the download/keys in your dashboard (or receive by email).
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                        <div className="text-[13px] font-semibold text-white">Refunds?</div>
                        <div className="mt-1 text-[12px] text-white/60">
                          Digital goods usually have limited refund policies. Add your exact policy here.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <aside className="self-start space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-[18px] font-semibold text-white">{product.title}</div>
                  <div className="mt-2">
                    <Badge text={tagText} />
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[11px] font-semibold text-white/55">Total</div>
                  <div className="text-[20px] font-semibold text-emerald-300">{priceLabel}</div>
                </div>
              </div>

              {/* PLAN SELECT */}
              <div className="mt-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 text-[12px] font-semibold text-white/70">
                    <Calendar className="h-4 w-4 opacity-80" />
                    Choose duration
                  </div>
                  <div className="text-[11px] font-semibold text-white/45">{selectedPlan.label}</div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  {plans.map((pl) => {
                    const active = pl.id === selectedPlanId
                    return (
                      <button
                        key={pl.id}
                        type="button"
                        onClick={() => setSelectedPlanId(pl.id)}
                        className={cn(
                          'rounded-xl border px-3 py-3 text-left transition',
                          active
                            ? 'border-white/18 bg-white/[0.06]'
                            : 'border-white/10 bg-white/[0.02] hover:border-white/18 hover:bg-white/[0.04]'
                        )}
                      >
                        <div className={cn('text-[12px] font-extrabold', active ? 'text-white' : 'text-white/80')}>
                          {pl.label}
                        </div>
                        <div className="mt-2 text-[12px] font-semibold text-emerald-300">
                          {formatUSD(pl.price)}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* BUTTONS */}
              <div className="mt-5 grid grid-cols-1 gap-3">
                {/* BUY (add + go cart) */}
                <button
                  type="button"
                  onClick={() => addToCart({ goToCart: true })}
                  className={cn(
                    'inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3',
                    'text-[12px] font-extrabold text-white transition',
                    'border border-white/10 hover:border-white/18'
                  )}
                  style={{
                    background: `linear-gradient(135deg, ${ACCENT}66, rgba(255,255,255,0.06))`,
                  }}
                >
                  <ShoppingBag className="h-4 w-4 opacity-90" />
                  Buy
                </button>

                {/* ADD TO CART */}
                <button
                  type="button"
                  className={cn(
                    'inline-flex w-full items-center justify-center gap-2 rounded-xl',
                    'border border-white/10 bg-white/[0.03] px-4 py-3',
                    'text-[12px] font-extrabold text-white/80 transition',
                    'hover:border-white/18 hover:bg-white/[0.05] hover:text-white'
                  )}
                  onClick={() => addToCart()}
                >
                  <ShoppingBag className="h-4 w-4 opacity-90" />
                  Add to cart
                </button>
              </div>

              <div className="mt-4 text-[12px] text-white/45">
                Safe checkout • Instant delivery • Support included
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="text-[14px] font-semibold text-white">What happens next?</div>
              <div className="mt-2 space-y-2 text-[13px] text-white/60">
                <div className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300/90" />
                  You complete payment.
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300/90" />
                  We unlock access in your account.
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300/90" />
                  You download / get keys instantly.
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  )
}
